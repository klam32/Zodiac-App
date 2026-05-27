import asyncio
import sys
from app.models.base_db import UserDB
from chatbot.rag.rag_pipeline import answer_followup_with_hybrid_context

async def main():
    print("Initializing DB...")
    db = UserDB()
    
    user_id = 6
    chart_id = 10020
    question = "sức khỏe của tôi ?"
    
    print(f"Testing answer_followup_with_hybrid_context for user_id={user_id}, chart_id={chart_id}, question='{question}'")
    
    res = await answer_followup_with_hybrid_context(
        user_id=user_id,
        chart_id=chart_id,
        question=question,
        user_db=db
    )
    
    print("\n--- TEST RESULTS ---")
    print(f"Source Used: {res.get('source_used')}")
    print(f"Domain: {res.get('domain')}")
    print(f"Has RAG: {res.get('has_rag')}")
    print(f"RAG Chunks Count: {res.get('rag_chunks_count')}")
    print(f"Graph Entities: {res.get('graph_entities_count')}")
    print(f"Graph Relationships: {res.get('graph_relationships_count')}")
    print(f"Hybrid Context Length: {len(res.get('hybrid_context', ''))}")
    print("\n--- LLM ANSWER ---")
    print(res.get("answer"))
    
if __name__ == "__main__":
    asyncio.run(main())
