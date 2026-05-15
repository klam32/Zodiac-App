"""
RAGAS Evaluation Script for MARA-AI (Astrology RAG System)
=============================================================
Đánh giá pipeline RAG bằng RAGAS framework (version 0.4.x).

Metrics được đánh giá:
  - Faithfulness        : Câu trả lời có căn cứ vào context không?
  - Answer Relevancy    : Câu trả lời có liên quan đến câu hỏi không?
  - Context Precision   : Context được retrieve có chính xác không?
  - Context Recall      : Context có bao phủ đủ ground truth không?

Cách chạy:
  cd e:/HOC_TAP/THUC_TAP/LuanVanTotNghiep
  pip install ragas datasets langchain-google-vertexai
  python evaluation/ragas_evaluate.py
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime

# Thêm root vào path để import được modules của hệ thống
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.WARNING)
logging.getLogger("kerykeion").setLevel(logging.CRITICAL)
logging.getLogger("httpx").setLevel(logging.WARNING)

# ============================================================
# IMPORTS
# ============================================================
# RAGAS 0.4.x API
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.metrics import (
    Faithfulness,
    AnswerRelevancy,
    ContextPrecision,
    ContextRecall,
)
from google.genai import Client
import instructor
from ragas.llms import InstructorLLM
from ragas.embeddings import GoogleEmbeddings
from langchain_google_vertexai import ChatVertexAI, VertexAIEmbeddings
import vertexai

# Hệ thống nội bộ
from chatbot.rag.chunking_service import chunk_text
from chatbot.rag.retriever import retrieve_top_chunks
from chatbot.rag.reranker import rerank_chunks
from chatbot.rag.knowledge_graph import get_astrology_kg, extract_astrology_entities
from chatbot.services.astrology_agent import AstrologyChatAgent
from chatbot.utils.llm import LLM

# ============================================================
# INIT VERTEX AI
# ============================================================
def init_vertex():
    project_id = os.getenv("PROJECT_ID")
    location    = os.getenv("LOCATION", "us-central1")
    if not project_id:
        raise ValueError("Thiếu PROJECT_ID trong .env")
    vertexai.init(project=project_id, location=location)
    print(f"[INIT] Vertex AI: project={project_id}, location={location}")

# ============================================================
# SIMULATE PIPELINE CHO 1 SAMPLE
# ============================================================
def simulate_pipeline(sample: dict, llm, embeddings_model) -> "dict | None":
    """
    Giả lập đầy đủ pipeline RAG cho 1 câu hỏi:
    1. Tạo bản đồ sao (AstrologyAgent) → chart_text
    2. Chunk + Embed chart_text (Ingestion)
    3. Retrieve + Rerank theo question (Retrieval)
    4. GraphRAG: extract entities + subgraph
    5. Gộp context + gọi LLM sinh answer
    Trả về: {question, answer, contexts, ground_truth}
    """
    question    = sample["question"]
    ground_truth = sample["ground_truth"]
    birth_info  = sample["birth_info"]

    print(f"\n[PIPELINE] Q: {question[:60]}...")

    # ─── BƯỚC 1: Tính bản đồ sao ───────────────────────────
    try:
        astro_agent = AstrologyChatAgent(llm)
        astro_result = astro_agent.run({
            "birth_info": birth_info,
            "field": "general",
            "question": ""           # init mode
        })
        chart_text = astro_result.get("chart", "")
        print(f"  [1] AstrologyAgent → {len(chart_text)} chars")
    except Exception as e:
        print(f"  [1] AstrologyAgent ERROR: {e}")
        chart_text = ""

    if not chart_text or len(chart_text) < 50:
        print("  ⚠ chart_text quá ngắn → bỏ qua sample này")
        return None

    # ─── BƯỚC 2: Chunking + Embedding (giả lập Ingestion) ──
    try:
        chunks_data = chunk_text(str(chart_text), "Tổng quan", int(birth_info.get("year", 2000)))
        print(f"  [2] Chunking → {len(chunks_data)} chunks")
    except Exception as e:
        print(f"  [2] Chunking ERROR: {e}")
        return None

    if not chunks_data:
        return None

    # ─── BƯỚC 3: Retrieval + Reranking ──────────────────────
    try:
        retrieved = retrieve_top_chunks(question, chunks_data, top_k=5)
        reranked  = rerank_chunks(question, retrieved, top_k=3)
        contexts  = [c["content"] for c in reranked]  # type: ignore
        print(f"  [3] Retrieval → {len(reranked)} chunks reranked")
    except Exception as e:
        print(f"  [3] Retrieval ERROR: {e}")
        contexts = [c["content"][:500] for c in chunks_data[:3]]  # type: ignore

    # ─── BƯỚC 4: GraphRAG ───────────────────────────────────
    try:
        entities   = extract_astrology_entities(question)
        kg         = get_astrology_kg()
        graph_facts = kg.extract_subgraph(entities, max_depth=2)
        if graph_facts:
            graph_context = "\n".join(graph_facts[:10])  # tối đa 10 facts
            print(f"  [4] GraphRAG → {len(graph_facts)} facts, entities: {entities[:3]}")
        else:
            graph_context = ""
            print(f"  [4] GraphRAG → Không tìm thấy entities")
    except Exception as e:
        print(f"  [4] GraphRAG ERROR: {e}")
        graph_context = ""

    # ─── BƯỚC 5: Sinh câu trả lời bằng LLM ─────────────────
    rag_context = "\n\n".join([str(c) for c in contexts])
    final_question = question
    if graph_context:
        final_question += f"\n\n[KIẾN THỨC TỪ KNOWLEDGE GRAPH]:\n{graph_context}"

    prompt = f"""Bạn là chuyên gia chiêm tinh học. Hãy trả lời câu hỏi dựa trên thông tin bản đồ sao bên dưới.

CÂU HỎI: {final_question}

THÔNG TIN BẢN ĐỒ SAO (CONTEXT):
{rag_context}

YÊU CẦU:
- Trả lời chính xác, súc tích, dựa hoàn toàn vào context được cung cấp.
- Không bịa đặt thông tin ngoài context.
- Viết bằng tiếng Việt, Markdown sạch sẽ.

TRẢ LỜI:"""

    try:
        response = llm.invoke(prompt)
        answer   = response.content if hasattr(response, "content") else str(response)
        print(f"  [5] LLM → {len(answer)} chars")
    except Exception as e:
        print(f"  [5] LLM ERROR: {e}")
        answer = ""

    return {
        "question":     question,
        "answer":       answer,
        "contexts":     contexts,   # List[str] — top 3 chunks
        "ground_truth": ground_truth
    }


# ============================================================
# MAIN EVALUATION
# ============================================================
def run_ragas_evaluation():
    print("=" * 60)
    print("  RAGAS EVALUATION — MARA-AI Astrology RAG System")
    print("=" * 60)

    # Load .env
    from dotenv import load_dotenv
    load_dotenv()

    # Init Vertex AI
    init_vertex()

    # Init LLM + Embeddings cho RAGAS
    model_name = os.getenv("VERTEX_MODEL_NAME", "gemini-1.5-flash")
    llm = LLM().get_llm("vertex")

    # RAGAS 0.4.x requires InstructorLLM and modern Embeddings for Google Gemini
    project_id = os.getenv("PROJECT_ID")
    location = os.getenv("LOCATION", "us-central1")
    genai_client = Client(vertexai=True, project=project_id, location=location)
    instructor_client = instructor.from_genai(genai_client)
    ragas_llm_wrapper = InstructorLLM(client=instructor_client, model=model_name, provider="google_genai")
    
    ragas_emb_wrapper = GoogleEmbeddings(model="text-embedding-004", client=genai_client)

    print(f"[INIT] LLM model: {model_name}")

    # Load test dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "test_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        test_samples = json.load(f)
    print(f"[DATASET] Loaded {len(test_samples)} samples")

    # Chạy pipeline cho từng sample
    results = []
    failed  = 0
    for i, sample in enumerate(test_samples):
        print(f"\n[{i+1}/{len(test_samples)}] Đang xử lý...")
        result = simulate_pipeline(sample, llm, ragas_emb_wrapper)
        if result:
            results.append(result)
        else:
            failed += 1
            print(f"  ⚠ Sample {i+1} thất bại, bỏ qua")

    print(f"\n[RESULT] {len(results)}/{len(test_samples)} samples thành công ({failed} thất bại)")

    if not results:
        print("❌ Không có sample nào thành công. Dừng đánh giá.")
        return

    # (Dataset sẽ được tạo sau khi có ragas_llm_wrapper)

    print("\n[RAGAS] Bắt đầu đánh giá...")
    print("  Metrics: Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall")

    # Cấu hình RAGAS 0.4.x (ragas_llm_w, ragas_emb_wrapper đã được init ở trên)

    metrics = [
        Faithfulness(llm=ragas_llm_wrapper),
        AnswerRelevancy(llm=ragas_llm_wrapper, embeddings=ragas_emb_wrapper),
        ContextPrecision(llm=ragas_llm_wrapper),
        ContextRecall(llm=ragas_llm_wrapper),
    ]

    # Tạo EvaluationDataset theo RAGAS 0.4.x
    eval_samples = [
        SingleTurnSample(
            user_input=r["question"],
            response=r["answer"],
            retrieved_contexts=r["contexts"],
            reference=r["ground_truth"],
        )
        for r in results
    ]
    ragas_dataset = EvaluationDataset(samples=eval_samples)  # type: ignore[arg-type]

    # Chạy RAGAS evaluate
    ragas_result = evaluate(  # type: ignore[call-overload]
        dataset=ragas_dataset,
        metrics=metrics,  # type: ignore[arg-type]
    )

    # In kết quả
    print("\n" + "=" * 60)
    print("  KẾT QUẢ RAGAS EVALUATION")
    print("=" * 60)
    scores = ragas_result.to_pandas()  # type: ignore[union-attr]

    metric_cols = {
        "faithfulness":      "Faithfulness       (Độ trung thực với context)",
        "answer_relevancy":  "Answer Relevancy   (Độ liên quan câu trả lời)",
        "context_precision": "Context Precision  (Độ chính xác context)",
        "context_recall":    "Context Recall     (Độ bao phủ context)",
    }
    summary = {}
    for col, label in metric_cols.items():
        if col in scores.columns:
            val = float(scores[col].mean())
            summary[col] = val
            bar = "█" * int(val * 20) + "░" * (20 - int(val * 20))
            print(f"  {label}: {val:.4f}  [{bar}]")

    # Lưu kết quả chi tiết ra file
    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(os.path.dirname(__file__), f"ragas_results_{timestamp}.json")
    output_data = {
        "timestamp":  timestamp,
        "model":      model_name,
        "n_samples":  len(results),
        "scores":     summary,
        "per_sample": scores.to_dict(orient="records")
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n[SAVED] Kết quả chi tiết lưu tại: {output_path}")
    print("=" * 60)
    return ragas_result


if __name__ == "__main__":
    run_ragas_evaluation()
