"""
RAGAS Evaluation Script for External Chatbot (AstroAI from GitHub)
==================================================================
Mô phỏng chatbot AstroAI từ GitHub (fatimaazfar/Astrology-Chatbot) và đánh giá bằng RAGAS framework.
Hệ thống so sánh kết quả thực nghiệm của AstroAI đối chiếu với các cấu hình của MARA-AI.

Cách chạy:
  python evaluation/evaluate_external_chatbot.py [--mode vertex|openai]
"""

import os
import sys
import json
import asyncio
import argparse
import glob
from datetime import datetime

# Thêm root vào path để import được modules của hệ thống
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Fix "Event loop is closed" on Windows (gRPC + asyncio conflict)
import nest_asyncio
if hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
nest_asyncio.apply()

import logging
logging.basicConfig(level=logging.WARNING)
logging.getLogger("kerykeion").setLevel(logging.CRITICAL)
logging.getLogger("httpx").setLevel(logging.WARNING)

# ============================================================
# UTILS FOR SAFE LOGGING
# ============================================================
def to_ascii_safe(text):
    """Mã hóa chuỗi unicode thành ASCII an toàn để tránh lỗi ghi console trên Windows."""
    if not isinstance(text, str):
        text = str(text)
    return text.encode('ascii', 'backslashreplace').decode('ascii')

# ============================================================
# IMPORTS
# ============================================================
from datasets import Dataset
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.metrics import Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_vertexai import ChatVertexAI, VertexAIEmbeddings
import vertexai


# ============================================================
# SIMULATE EXTERNAL CHATBOT
# ============================================================
def simulate_external_chatbot(sample, llm_mode="vertex"):
    """
    Giả lập chatbot AstroAI (GitHub - fatimaazfar/Astrology-Chatbot) cho 1 sample:
    1. Định dạng thông tin ngày sinh
    2. Xây dựng System Prompt của AstroAI
    3. Gửi câu hỏi và lấy phản hồi từ LLM
    """
    question = sample["question"]
    ground_truth = sample["ground_truth"]
    birth_info = sample["birth_info"]

    # Định dạng chi tiết theo đúng logic của AstroAI
    day = birth_info.get("day", 1)
    month = birth_info.get("month", 1)
    year = birth_info.get("year", 2000)
    hour = birth_info.get("hour", 12)
    minute = birth_info.get("minute", 0)
    city = birth_info.get("city", "Unknown")

    dob = f"{day:02d}/{month:02d}/{year}"
    tob = f"{hour:02d}:{minute:02d}"
    cob = city
    tod = datetime.now().strftime("%d/%m/%Y")

    # System prompt nguyên bản của AstroAI
    system_prompt = (
        f"You are an expert astrologist. You are chatting with a user who was born on {dob} "
        f"at {tob} in {cob}. Today's date is {tod}. "
        "Provide horoscopes and answer the user's questions in a friendly and informative manner."
    )

    print(f"\n[AstroAI SIM] Q: {to_ascii_safe(question[:50])}...")
    print(f"  [Birth details] DOB: {dob}, TOB: {tob}, COB: {to_ascii_safe(cob)}")

    # Gọi LLM tùy theo chế độ
    try:
        if llm_mode == "openai":
            # Sử dụng ChatOpenAI từ langchain_openai
            from langchain_openai import ChatOpenAI
            openai_key = os.getenv("KEY_API_OPENAI") or os.getenv("OPENAI_API_KEY")
            openai_model = os.getenv("OPENAI_LLM_MODEL_NAME", "gpt-3.5-turbo")
            if not openai_key:
                raise ValueError("Thiếu KEY_API_OPENAI hoặc OPENAI_API_KEY trong file .env")
            chat_llm = ChatOpenAI(
                openai_api_key=openai_key,
                model=openai_model,
                temperature=0.7  # AstroAI sử dụng temperature=0.7
            )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{question}\n\nTrả lời súc tích, chính xác bằng tiếng Việt:")
            ]
            response = chat_llm.invoke(messages)
            answer = response.content if hasattr(response, "content") else str(response)
        else:
            # Mặc định sử dụng Vertex AI (Gemini) của hệ thống sẵn có
            from chatbot.utils.llm import LLM as InternalLLM
            internal_llm = InternalLLM(temperature=0.7).get_llm("vertex")
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{question}\n\nTrả lời súc tích, chính xác bằng tiếng Việt:")
            ]
            response = internal_llm.invoke(messages)
            answer = response.content if hasattr(response, "content") else str(response)

        print(f"  [AstroAI Response] {len(answer)} chars")
    except Exception as e:
        print(f"  [ERROR] Answer generation failed: {e}")
        answer = f"[ERROR] Lỗi hệ thống: {e}"

    return {
        "question": question,
        "answer": answer,
        "contexts": [""],  # Hệ thống No-RAG không có dữ liệu ngữ cảnh tra cứu
        "ground_truth": ground_truth
    }


def ragas_score(records, ragas_llm_wrapper, ragas_emb_wrapper):
    """Chạy RAGAS evaluate trên danh sách records."""
    if not records:
        return {}

    eval_samples = [
        SingleTurnSample(
            user_input=r["question"],
            response=r["answer"],
            retrieved_contexts=r["contexts"],
            reference=r["ground_truth"],
        )
        for r in records
    ]
    ragas_dataset = EvaluationDataset(samples=eval_samples)  # type: ignore

    metrics = [
        Faithfulness(llm=ragas_llm_wrapper),
        AnswerRelevancy(llm=ragas_llm_wrapper, embeddings=ragas_emb_wrapper),
        ContextPrecision(llm=ragas_llm_wrapper),
        ContextRecall(llm=ragas_llm_wrapper),
    ]
    
    result = evaluate(dataset=ragas_dataset, metrics=metrics, batch_size=1)
    df = result.to_pandas()  # type: ignore
    
    return {
        col: float(df[col].mean())
        for col in ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
        if col in df.columns
    }


def load_latest_ablation_scores():
    """Tự động tìm kiếm file kết quả ablation mới nhất để đối chiếu."""
    dir_path = os.path.dirname(__file__)
    pattern = os.path.join(dir_path, "ablation_results_*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        # Fallback tới file mẫu được ghi nhận
        fallback_path = os.path.join(dir_path, "ablation_results_20260514_190224.json")
        if os.path.exists(fallback_path):
            files = [fallback_path]
        else:
            return None

    latest_file = files[-1]
    print(f"[DATA] Found previous ablation results at: {os.path.basename(latest_file)}")
    try:
        with open(latest_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("scores", None)
    except Exception as e:
        print(f"[WARNING] Error reading previous ablation file: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Run RAGAS evaluation on external chatbot.")
    parser.add_argument("--mode", type=str, default="vertex", choices=["vertex", "openai"],
                        help="LLM for simulating the external chatbot: 'vertex' (default) or 'openai'")
    args = parser.parse_args()

    print("=" * 70)
    print("  RAGAS EVALUATION — EXTERNAL CHATBOT SIMULATION (AstroAI)")
    print(f"  LLM Simulation Mode: {args.mode.upper()}")
    print("=" * 70)

    from dotenv import load_dotenv
    load_dotenv()

    # Khởi tạo Vertex AI cho RAGAS
    project_id = os.getenv("PROJECT_ID")
    location = os.getenv("LOCATION", "us-central1")
    model_name = os.getenv("VERTEX_MODEL_NAME", "gemini-1.5-flash")
    vertexai.init(project=project_id, location=location)
    print(f"[INIT] RAGAS Evaluator: project={project_id}, location={location}, model={model_name}")

    # Cấu hình RAGAS wrappers
    ragas_llm_lc = ChatVertexAI(model=model_name, temperature=0.0, max_output_tokens=2048)
    ragas_emb_lc = VertexAIEmbeddings(model="text-embedding-004")
    ragas_llm_w = LangchainLLMWrapper(ragas_llm_lc)
    ragas_emb_w = LangchainEmbeddingsWrapper(ragas_emb_lc)

    # Đọc tập dữ liệu thử nghiệm chung
    dataset_path = os.path.join(os.path.dirname(__file__), "test_dataset.json")
    if not os.path.exists(dataset_path):
        print(f"[ERROR] test_dataset.json not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)
    print(f"[DATASET] Loaded {len(samples)} sample questions")

    # Giả lập phản hồi từ AstroAI
    records = []
    for i, sample in enumerate(samples):
        print(f"  [{i+1}/{len(samples)}] Processing question...")
        record = simulate_external_chatbot(sample, llm_mode=args.mode)
        records.append(record)

    # Chạy RAGAS Scoring
    print(f"\n[RAGAS] Starting RAGAS evaluation on AstroAI answers...")
    astroai_scores = ragas_score(records, ragas_llm_w, ragas_emb_w)
    print(f"[SCORES] AstroAI: {astroai_scores}")

    # Đọc kết quả Ablation Study trước đó
    ablation_scores = load_latest_ablation_scores()

    # Hiển thị bảng so sánh đối chứng
    print("\n" + "=" * 80)
    print("        SYSTEM QUALITY COMPARISON TABLE FOR GRADUATION THESIS")
    print("=" * 80)
    headers = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
    print(f"  {'System / Configuration':<35} {'Faith':>8} {'Ans.Rel':>8} {'Ctx.Pre':>8} {'Ctx.Rec':>8}")
    print(f"  {'-'*35} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
    
    # 1. AstroAI
    row_astro = f"  {'Mo hinh doi chieu (AstroAI)':<35}"
    for h in headers:
        row_astro += f" {astroai_scores.get(h, 0.0):>8.4f}"
    print(row_astro)

    if ablation_scores:
        label_map = {
            "no_rag":   "A. LLM thuan tuy (Khong RAG)",
            "rag_only": "B. RAG ngu nghia (Semantic RAG)",
            "full":     "C. He thong GraphRAG de xuat",
        }
        for cfg in ["no_rag", "rag_only", "full"]:
            scores = ablation_scores.get(cfg, {})
            row = f"  {label_map[cfg]:<35}"
            for h in headers:
                row += f" {scores.get(h, 0.0):>8.4f}"
            print(row)
    else:
        print("  [INFO] Previous ablation data not found for cross-comparison.")

    # Lưu kết quả thực nghiệm chi tiết
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(os.path.dirname(__file__), f"astroai_results_{timestamp}.json")
    output_data = {
        "timestamp": timestamp,
        "chatbot_name": "AstroAI (fatimaazfar)",
        "llm_mode": args.mode,
        "n_samples": len(samples),
        "scores": astroai_scores,
        "per_sample": records
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print("=" * 75)
    print(f"[SAVED] Detailed report saved at: {output_path}")
    print("=" * 75)


if __name__ == "__main__":
    main()
