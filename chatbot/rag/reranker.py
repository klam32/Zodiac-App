def rerank_chunks(query: str, retrieved_chunks: list[dict], top_k: int = 3) -> list[dict]:
    """
    Re-rank thuật toán Heuristic đơn giản:
    - Nếu query chứa các keyword trùng với section_name -> Tăng điểm.
    - Kết hợp semantic_score.
    """
    if not retrieved_chunks:
        return []
        
    query_lower = query.lower()
    
    for chunk in retrieved_chunks:
        section = chunk.get("section_name", "").lower()
        content_lower = chunk.get("content", "").lower()
        semantic_score = chunk.get("semantic_score", 0.0)
        boost = 0.0
        import re
        
        # Section mapping boost
        if section in query_lower:
            boost += 0.05
            
        # Keyword heuristic boost
        if "tình yêu" in query_lower and section in ["tình cảm", "tình duyên", "love"]:
            boost += 0.05
        if "sự nghiệp" in query_lower and section in ["sự nghiệp", "công danh", "career"]:
            boost += 0.05
            
        # 🔥 Đánh giá độ phủ từ khóa (Keyword Overlap)
        # Giúp những câu hỏi tự nhiên như "Mặt Trời Ma Kết là gì" vẫn match được nếu trong nội dung có từ "Mặt Trời" và "Ma Kết"
        stopwords = {"là", "gì", "thế", "nào", "có", "trong", "của", "cho", "và", "với", "như", "một", "sự", "những", "các", "để", "ở"}
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        query_keywords = {w for w in query_words if len(w) > 1 and w not in stopwords}
        
        if query_keywords:
            content_words = set(re.findall(r'\b\w+\b', content_lower))
            intersection = query_keywords.intersection(content_words)
            overlap_ratio = len(intersection) / len(query_keywords)
            # Tăng tối đa 0.15 điểm nếu trùng khớp tất cả từ khóa
            boost += overlap_ratio * 0.15
            
        # 🔥 Đánh giá Exact Match cho cụm từ dài
        if len(query_lower) > 5 and query_lower in content_lower:
            boost += 0.10 # Thưởng thêm nếu trùng khớp y hệt cả câu
            
        chunk["rerank_score"] = round(boost, 4)
        chunk["final_score"] = round(semantic_score + boost, 4)
        
    # Sắp xếp lại theo final_score
    retrieved_chunks.sort(key=lambda x: x["final_score"], reverse=True)
    
    # Cắt top_k và gán rank_position
    final_chunks = retrieved_chunks[:top_k]
    for i, chunk in enumerate(final_chunks):
        chunk["rank_position"] = i + 1
        
    return final_chunks
