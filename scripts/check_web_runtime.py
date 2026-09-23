"""Offline packaging smoke check; never uses production credentials or database.

Run after installing requirements.runtime.txt and building frontend/dist.
External AI calls are mocked; live Google, payment, email and Neo4j integrations
must still be tested with their deployed environment configuration.
"""
from pathlib import Path
import os
import re
import sys
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main():
    import dotenv

    with tempfile.TemporaryDirectory(prefix="zodiac-smoke-") as workdir:
        with patch.dict(os.environ, {
            "DB_PATH": str(Path(workdir) / "test.db"),
            "SECRET_KEY": "offline-build-check-only",
            "VERSION_APP": "v1",
            "GOOGLE_CLIENT_ID": "offline-client",
            "GOOGLE_CLIENT_SECRET": "offline-secret",
            "GOOGLE_REDIRECT_URI": "https://testserver/api/v1/auth/google/callback",
        }), patch.object(dotenv, "load_dotenv", return_value=False), patch(
            "neo4j.GraphDatabase.driver", side_effect=RuntimeError("offline build check")
        ):
            # Import both real provider SDKs to catch missing runtime dependencies.
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_google_vertexai import ChatVertexAI, VertexAIEmbeddings
            from chatbot.rag.chunking_service import chunk_text
            from chatbot.rag.retriever import cosine_similarity
            from chatbot.rag.knowledge_graph import AstrologyGraph
            from langchain_core.language_models.fake_chat_models import FakeListChatModel
            from chatbot.utils.llm import LLM

            fake_llm = FakeListChatModel(responses=["Offline smoke check"])
            with patch.object(LLM, "get_llm", return_value=fake_llm):
                from app_deploy import app
                from app.routers import auth, chatbot
                from app.models.base_db import UserDB
                from fastapi.testclient import TestClient

                db = UserDB()
                try:
                    user = db.update_or_create_google_user(
                        "smoke@example.invalid", "Smoke Check", ""
                    )
                finally:
                    db.close()

                token = auth.create_access_token({"email": user["email"], "id": user["id"]})
                headers = {"Authorization": f"Bearer {token}"}
                try:
                    with TestClient(app, base_url="https://testserver") as client:
                        assert client.get("/api/v1/").status_code == 200
                        page = client.get("/")
                        assert page.status_code == 200, "Frontend dist is missing"
                        assets = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', page.text)
                        assert assets, "Built frontend assets are missing"
                        for asset in assets:
                            assert client.get(asset).status_code == 200, asset
                        assert client.get("/api/v1/auth/check").status_code == 401
                        response = client.get("/api/v1/auth/check", headers=headers)
                        assert response.status_code == 200
                        assert response.json()["user"]["email"] == user["email"]
                        assert client.get("/api/v1/auth/google/login").status_code == 200
                        for path in (
                            "/api/v1/conversations", "/api/v1/payment/packages",
                            "/api/v1/rewards/status", "/api/v1/support/conversation",
                        ):
                            response = client.get(path, headers=headers)
                            assert response.status_code == 200, (path, response.status_code)
                        with client.websocket_connect(f"/api/v1/ws/support?token={token}") as ws:
                            assert ws.receive_json()["type"] == "presence_update"
                            ws.send_json({"type": "ping"})
                        # Confirm feature routers survived the packaging changes.
                        paths = client.get("/api/v1/openapi.json").json()["paths"]
                        for prefix in ("/api/v1/admin/", "/api/v1/calendar/", "/api/v1/prediction/"):
                            assert any(path.startswith(prefix) for path in paths), prefix

                    from chatbot.utils.astro_cache import get_astrological_subject
                    from kerykeion import ChartDataFactory, ChartDrawer
                    subject = get_astrological_subject("Smoke", 2000, 1, 1, 12, 0, "Hanoi", "VN")
                    chart = ChartDataFactory.create_natal_chart_data(subject.model())
                    assert "<svg" in ChartDrawer(chart).generate_svg_string()
                    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
                    assert AstrologyGraph().graph.number_of_nodes() > 0
                    assert chunk_text("", "smoke", user["id"]) == []
                finally:
                    chatbot.db.close()
                    chatbot.ai_system.executor.shutdown(wait=True)

    print("PASS: frontend assets, backend imports, JWT session, conversations, packages,")
    print("rewards, support WebSocket, feature routes, astrology SVG and local GraphRAG.")
    print("External AI/OAuth/payment/email/Neo4j services were not contacted.")


if __name__ == "__main__":
    main()
