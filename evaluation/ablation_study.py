"""
Ablation Study: So sánh RAG vs No-RAG vs RAG+GraphRAG
=======================================================
Chạy 3 cấu hình và so sánh kết quả:
  Config A: No-RAG     → LLM trả lời trực tiếp, không có context
  Config B: RAG Only   → Có Semantic Retrieval (cosine + rerank), không GraphRAG
  Config C: Full       → Semantic RAG + GraphRAG (hệ thống đầy đủ)

Cách chạy:
  python evaluation/ablation_study.py
"""

import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Fix "Event loop is closed" on Windows (gRPC + asyncio conflict)
import asyncio
import nest_asyncio
if hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
nest_asyncio.apply()

import logging
logging.basicConfig(level=logging.WARNING)
logging.getLogger("kerykeion").setLevel(logging.CRITICAL)

from datasets import Dataset
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.metrics import Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_google_vertexai import ChatVertexAI, VertexAIEmbeddings
import vertexai

from chatbot.rag.chunking_service import chunk_text
from chatbot.rag.retriever import retrieve_top_chunks
from chatbot.rag.reranker import rerank_chunks
from chatbot.rag.knowledge_graph import get_astrology_kg, extract_astrology_entities
from chatbot.services.astrology_agent import AstrologyChatAgent
from chatbot.utils.llm import LLM


def build_chart_data(sample, llm):
    """Tạo bản đồ sao cho một sample và trả về chart_text + chunks."""
    birth_info = sample["birth_info"]
    try:
        agent  = AstrologyChatAgent(llm)
        result = agent.run({"birth_info": birth_info, "field": "general", "question": ""})
        chart_text = result.get("chart", "")
    except Exception as e:
        print(f"    [chart] ERROR: {e}")
        return None, []

    if not chart_text or len(chart_text) < 50:
        return None, []

    try:
        chunks = chunk_text(str(chart_text), "Tổng quan", int(birth_info.get("year", 2000)))
    except Exception as e:
        print(f"    [chunk] ERROR: {e}")
        return chart_text, []

    return chart_text, chunks


def generate_answer(llm, question, context_text):
    """Gọi LLM với context đã có để sinh câu trả lời."""
    if context_text:
        prompt = f"""Bạn là chuyên gia chiêm tinh học. Trả lời dựa vào context bên dưới.

CÂU HỎI: {question}

CONTEXT:
{context_text}

Trả lời súc tích, chính xác bằng tiếng Việt:"""
    else:
        prompt = f"""Bạn là chuyên gia chiêm tinh học. Hãy trả lời câu hỏi sau:

CÂU HỎI: {question}

Trả lời súc tích, chính xác bằng tiếng Việt:"""
    try:
        res = llm.invoke(prompt)
        return res.content if hasattr(res, "content") else str(res)
    except Exception as e:
        return f"[ERROR] {e}"


def run_config(config_name, samples, llm):
    """
    Chạy một cấu hình và trả về list records cho RAGAS.
    config_name: "no_rag" | "rag_only" | "full"
    """
    print(f"\n{'-'*50}")
    print(f"  Config: {config_name.upper()}")
    print(f"{'-'*50}")

    records = []
    for i, sample in enumerate(samples):
        q  = sample["question"]
        gt = sample["ground_truth"]
        print(f"  [{i+1}/{len(samples)}] {q[:50]}...")

        chart_text, chunks = build_chart_data(sample, llm)
        if chart_text is None:
            print("    ⚠ Bỏ qua (chart lỗi)")
            continue

        contexts = []
        context_text = ""

        if config_name == "no_rag":
            # Không có context, LLM tự trả lời
            contexts     = [""]
            context_text = ""

        elif config_name == "rag_only":
            # Chỉ dùng Semantic RAG
            try:
                retrieved = retrieve_top_chunks(q, chunks, top_k=5)
                reranked  = rerank_chunks(q, retrieved, top_k=3)
                contexts  = [c["content"] for c in reranked]  # type: ignore
                context_text = "\n\n".join(contexts)
            except Exception as e:
                print(f"    [rag] ERROR: {e}")
                contexts = [""]
                context_text = ""

        elif config_name == "full":
            # Semantic RAG + GraphRAG
            try:
                retrieved = retrieve_top_chunks(q, chunks, top_k=5)
                reranked  = rerank_chunks(q, retrieved, top_k=3)
                contexts  = [c["content"] for c in reranked]  # type: ignore
                context_text = "\n\n".join(contexts)
            except Exception as e:
                print(f"    [rag] ERROR: {e}")
                contexts = [""]
                context_text = ""

            try:
                entities    = extract_astrology_entities(q)
                kg          = get_astrology_kg()
                graph_facts = kg.extract_subgraph(entities, max_depth=2)
                if graph_facts:
                    graph_str    = "\n".join(graph_facts[:10])
                    context_text += f"\n\n[KNOWLEDGE GRAPH]:\n{graph_str}"
                    contexts.append(f"[KNOWLEDGE GRAPH]:\n{graph_str}")
            except Exception as e:
                print(f"    [graph] ERROR: {e}")

        answer = generate_answer(llm, q, context_text)
        records.append({
            "question":     q,
            "answer":       answer,
            "contexts":     contexts if contexts else [""],
            "ground_truth": gt,
        })

    return records


def ragas_score(records, ragas_llm_wrapper, ragas_emb_wrapper):
    """Chạy RAGAS evaluate trên list records (RAGAS 0.4.x)."""
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
    ragas_dataset = EvaluationDataset(samples=eval_samples)  # type: ignore[arg-type]

    metrics = [
        Faithfulness(llm=ragas_llm_wrapper),
        AnswerRelevancy(llm=ragas_llm_wrapper, embeddings=ragas_emb_wrapper),
        ContextPrecision(llm=ragas_llm_wrapper),
        ContextRecall(llm=ragas_llm_wrapper),
    ]
    result = evaluate(dataset=ragas_dataset, metrics=metrics, batch_size=1)  # type: ignore[call-overload, arg-type]
    df     = result.to_pandas()  # type: ignore[union-attr]
    return {
        col: float(df[col].mean())
        for col in ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
        if col in df.columns
    }


def main():
    print("=" * 60)
    print("  ABLATION STUDY — MARA-AI RAG Evaluation")
    print("  Config A: No-RAG | Config B: RAG Only | Config C: Full")
    print("=" * 60)

    from dotenv import load_dotenv
    load_dotenv()

    project_id = os.getenv("PROJECT_ID")
    location   = os.getenv("LOCATION", "us-central1")
    model_name = os.getenv("VERTEX_MODEL_NAME", "gemini-1.5-flash")
    vertexai.init(project=project_id, location=location)
    print(f"[INIT] project={project_id}, model={model_name}")

    llm = LLM().get_llm("vertex")
    # Dùng LangchainLLMWrapper + LangchainEmbeddingsWrapper (tương thích tốt nhất với ragas.metrics)
    ragas_llm_lc = ChatVertexAI(model=model_name, temperature=0.0, max_output_tokens=2048)
    ragas_emb_lc = VertexAIEmbeddings(model="text-embedding-004")
    ragas_llm_w  = LangchainLLMWrapper(ragas_llm_lc)
    ragas_emb_w  = LangchainEmbeddingsWrapper(ragas_emb_lc)

    # Load dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "test_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)
    print(f"[DATASET] {len(samples)} samples")

    # Chạy 3 configs
    configs = ["no_rag", "rag_only", "full"]
    all_scores = {}

    for cfg in configs:
        records = run_config(cfg, samples, llm)
        print(f"  → {len(records)} records OK, đang tính RAGAS...")
        scores  = ragas_score(records, ragas_llm_w, ragas_emb_w)
        all_scores[cfg] = scores
        print(f"  Scores: {scores}")

    # Bảng so sánh
    print("\n" + "=" * 60)
    print("  BẢNG SO SÁNH KẾT QUẢ ABLATION STUDY")
    print("=" * 60)
    headers = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
    label_map = {
        "no_rag":   "A. No-RAG     ",
        "rag_only": "B. RAG Only   ",
        "full":     "C. Full System",
    }
    print(f"  {'Config':<20} {'Faith':>8} {'Ans.Rel':>8} {'Ctx.Pre':>8} {'Ctx.Rec':>8}")
    print(f"  {'-'*20} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
    for cfg in configs:
        s   = all_scores.get(cfg, {})
        row = f"  {label_map[cfg]:<20}"
        for h in headers:
            val  = s.get(h, 0.0)
            row += f" {val:>8.4f}"
        print(row)

    # Lưu kết quả
    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(os.path.dirname(__file__), f"ablation_results_{timestamp}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"timestamp": timestamp, "model": model_name,
                   "n_samples": len(samples), "scores": all_scores}, f, ensure_ascii=False, indent=2)
    print(f"\n[SAVED] {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
