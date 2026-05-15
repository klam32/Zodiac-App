import numpy as np
from chatbot.rag.chunking_service import get_embeddings_model

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_a = np.linalg.norm(v1)
    norm_b = np.linalg.norm(v2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

from typing import List, Dict, Any

def retrieve_top_chunks(query: str, chunks_data: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Tìm kiếm semantic theo Cosine Similarity.
    Lấy rộng (top_k=5) để đưa qua Reranker.
    """
    if not chunks_data:
        return []

    embeddings_model = get_embeddings_model()
    q_emb = embeddings_model.embed_query(query)
    
    scored_chunks = []
    for chunk in chunks_data:
        emb = chunk.get("embedding")
        if not emb:
            continue
        
        score = cosine_similarity(q_emb, emb)
        scored_chunks.append({
            "chunk_index": chunk["chunk_index"],
            "section_name": chunk.get("section_name", "General"),
            "content": chunk["content"],
            "semantic_score": score
        })
        
    scored_chunks.sort(key=lambda x: x["semantic_score"], reverse=True)
    return scored_chunks[:top_k]
