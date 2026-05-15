import asyncio
from app.models.base_db import UserDB
from chatbot.rag.chunking_service import chunk_text
from chatbot.rag.retriever import retrieve_top_chunks
from chatbot.rag.reranker import rerank_chunks

async def pipeline_process_and_store(conversation_id: int, user_id: int, section_name: str, chart_text: str, user_db: UserDB):
    """
    Pipeline 1: Chunking -> Vectorizing -> Saving
    """
    try:
        chunks_data = await asyncio.to_thread(chunk_text, chart_text, section_name, user_id)
        if chunks_data:
            await asyncio.to_thread(user_db.save_document_chunks, conversation_id, chunks_data)
            print(f"[RAG PIPELINE] Đã lưu {len(chunks_data)} chunks cho conversation {conversation_id} (Section: {section_name}).")
            
            # Vô hiệu hóa ghi file debug vì tệp đã quá lớn gây treo hệ thống
            # import json
            # import os
            # debug_file = "debug_chunks.json"
            # existing_data = []
            # if os.path.exists(debug_file):
            #     try:
            #         with open(debug_file, "r", encoding="utf-8") as f:
            #             existing_data = json.load(f)
            #     except: pass
            # clean_chunks = []
            # for c in chunks_data:
            #     clean_chunk = {k: v for k, v in c.items() if k != "embedding_vector"}
            #     clean_chunk["conversation_id"] = conversation_id
            #     clean_chunks.append(clean_chunk)
            # existing_data.extend(clean_chunks)
            # with open(debug_file, "w", encoding="utf-8") as f:
            #     json.dump(existing_data, f, ensure_ascii=False, indent=2)
                
    except Exception as e:
        print(f"[RAG PIPELINE ERROR] {e}")

async def pipeline_retrieve_and_rerank(conversation_id: int, question: str, user_db: UserDB, top_k: int = 3):
    """
    Pipeline 2: Retrieving -> Reranking -> Logging
    """
    try:
        # 1. Fetch chunks from DB
        all_chunks = await asyncio.to_thread(user_db.get_document_chunks, conversation_id)
        if not all_chunks:
            return []

        # 2. Retrieve (Top 5)
        retrieved_chunks = await asyncio.to_thread(retrieve_top_chunks, question, all_chunks, top_k=5)

        # 3. Rerank (Top K)
        final_chunks = await asyncio.to_thread(rerank_chunks, question, retrieved_chunks, top_k=top_k)

        # 4. Log to DB & Terminal
        log_data = [{"chunk_index": c["chunk_index"], "final_score": c["final_score"]} for c in final_chunks]
        await asyncio.to_thread(user_db.log_retrieval, conversation_id, question, log_data)
        
        print("\n==================================================")
        print("RETRIEVER DEBUG")
        print("--------------------------------")
        print(f"Query:\n\"{question}\"\n")
        print("Top Results (Reranked):")
        for c in final_chunks:
            print(f"{c['rank_position']}. chunk_{c['chunk_index']} | {c['section_name']} | final={c['final_score']:.4f} (semantic={c['semantic_score']:.4f}, rerank={c['rerank_score']:.4f})")
        print(f"\nContext injected: {len(final_chunks)} chunks")
        print("==================================================\n")

        return final_chunks
    except Exception as e:
        print(f"[RAG PIPELINE ERROR] retrieve: {e}")
        return []
