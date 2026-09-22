import re
import asyncio
from app.models.base_db import UserDB
from chatbot.rag.chunking_service import get_embeddings_model

# ========================================================
# 1. CLEAN ASTROLOGY INTERPRETATION
# ========================================================
def clean_astrology_interpretation(raw_text: str, user_name: str | None = None) -> str:
    """
    Loại bỏ tiêu đề, lời chào, và đoạn mở đầu chung chung của LLM.
    Chỉ giữ lại các nội dung chuyên môn thật sự.
    """
    if not raw_text:
        return ""

    raw_text = raw_text.strip()
    if raw_text.startswith("# Dữ liệu bản đồ sao cốt lõi"):
        idx = raw_text.find("## Luận giải ban đầu")
        if idx != -1:
            header_part = raw_text[:idx + len("## Luận giải ban đầu\n")]
            interpretation_part = raw_text[idx + len("## Luận giải ban đầu\n"):]
            cleaned_interpretation = clean_astrology_interpretation(interpretation_part, user_name)
            return (header_part + "\n" + cleaned_interpretation).strip()

    lines = raw_text.splitlines()

    # Danh sách các heading chuyên môn bắt buộc giữ lại
    professional_headings = [
        "TỔNG QUAN", "PHÂN TÍCH CHI TIẾT", "TÍNH CÁCH", "TÌNH DUYÊN", 
        "SỰ NGHIỆP", "SỰ NGHIỆP & TÀI CHÍNH", "SỨC KHỎE", "GIA ĐÌNH", 
        "TÀI CHÍNH", "ĐIỂM MẠNH", "THÁCH THỨC", "LỜI KHUYÊN", 
        "CUNG MỌC", "MẶT TRỜI", "MẶT TRĂNG", "SAO KIM", "SAO HỎA",
        "NHÀ 1", "NHÀ 2", "NHÀ 3", "NHÀ 4", "NHÀ 5", "NHÀ 6", 
        "NHÀ 7", "NHÀ 8", "NHÀ 9", "NHÀ 10", "NHÀ 11", "NHÀ 12",
        "GÓC HỢP", "KẾT LUẬN", "OVERVIEW", "PERSONALITY", "LOVE", "CAREER", "HEALTH"
    ]

    # Kiểm tra xem có xuất hiện heading chuyên môn nào đầu tiên không
    first_heading_idx = -1
    for i, line in enumerate(lines):
        # Chuẩn hóa line để so sánh
        line_stripped = line.strip().strip('#').strip('*').strip().upper()
        
        # Tìm heading phù hợp
        for h in professional_headings:
            if line_stripped == h or line_stripped.startswith(h + " ") or line_stripped.startswith(h + ":"):
                first_heading_idx = i
                break
        if first_heading_idx != -1:
            break

    if first_heading_idx != -1:
        # Cắt bỏ toàn bộ nội dung nằm trước heading đầu tiên đó
        return "\n".join(lines[first_heading_idx:]).strip()

    # Nếu không tìm thấy heading rõ ràng, loại bỏ đoạn mở đầu có chứa blacklist cụm từ
    blacklisted_phrases = [
        "luận giải bản đồ sao", "tương hợp tình duyên", "phân tích chi tiết",
        "kính chào", "kính gửi", "chào bạn", "chào mừng", "với tư cách là",
        "tôi rất vinh dự", "tôi hân hạnh", "bản đồ sao cá nhân của bạn",
        "bản đồ sao là", "hành trình khám phá", "hành trình nội tâm",
        "hãy cùng khám phá", "tôi hiểu rằng bạn đang tìm kiếm", "dựa trên ngày sinh"
    ]

    paragraphs = raw_text.split("\n\n")
    start_idx = 0
    for i, para in enumerate(paragraphs):
        para_lower = para.lower()
        has_blacklist = any(phrase in para_lower for phrase in blacklisted_phrases)
        if user_name and user_name.lower() in para_lower:
            # Nếu chứa tên user và ngắn (dưới 250 kí tự) thì lọc bỏ
            if len(para) < 250:
                has_blacklist = True
        
        if not has_blacklist:
            start_idx = i
            break
    else:
        # Nếu tất cả paragraph đều dính blacklist, giữ lại hết để tránh mất mát thông tin
        start_idx = 0

    return "\n\n".join(paragraphs[start_idx:]).strip()

# ========================================================
# 2. DETECT DOMAIN FROM TEXT
# ========================================================
def detect_domain_from_text(text: str) -> str:
    """
    Tự động nhận diện lĩnh vực của nội dung dựa vào các từ khóa.
    """
    if not text:
        return "general"

    text_lower = text.lower()
    if any(k in text_lower for k in ["tương hợp", "đối tác", "partner", "compatibility"]):
        return "compatibility"
    if any(k in text_lower for k in ["tình duyên", "tình yêu", "mối quan hệ", "love", "hen hò"]):
        return "love"
    if any(k in text_lower for k in ["tính cách", "cá tính", "bản chất", "personality", "mọc", "mặt trời", "mặt trăng"]):
        return "personality"
    if any(k in text_lower for k in ["sự nghiệp", "công danh", "công việc", "career", "nghề nghiệp", "tài năng"]):
        return "career"
    if any(k in text_lower for k in ["sức khỏe", "bình an", "thể chất", "tinh thần", "health", "yếu tố cơ thể"]):
        return "health"
    if any(k in text_lower for k in ["tài chính", "tiền bạc", "finance", "giàu có"]):
        return "finance"
    if any(k in text_lower for k in ["gia đình", "cha mẹ", "con cái", "family"]):
        return "family"
    if any(k in text_lower for k in ["lời khuyên", "advice"]):
        return "advice"
    if any(k in text_lower for k in ["tổng quan", "overview"]):
        return "overview"
    return "general"

# ========================================================
# 3. SPLIT INTERPRETATION INTO CHUNKS
# ========================================================
def split_interpretation_into_chunks(clean_text: str, chunk_size: int = 800, overlap: int = 120) -> list[dict]:
    """
    Chia nhỏ clean_text thành các chunk theo ngữ nghĩa và heading/section.
    """
    if not clean_text:
        return []

    # Chia đoạn văn bản thành các section dựa trên Markdown Header hoặc dòng in đậm
    sections = []
    current_header = "TỔNG QUAN"
    current_lines = []

    lines = clean_text.splitlines()
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        is_header = False
        header_title = ""

        # Phát hiện Header Markdown hoặc dòng in đậm ngắn làm tiêu đề
        if stripped.startswith("#"):
            is_header = True
            header_title = stripped.lstrip("#").strip()
        elif stripped.startswith("**") and stripped.endswith("**") and len(stripped) < 80:
            is_header = True
            header_title = stripped.strip("*").strip()

        if is_header:
            if current_lines:
                sections.append({
                    "header": current_header,
                    "text": "\n".join(current_lines).strip()
                })
                current_lines = []
            current_header = header_title
        else:
            current_lines.append(line)

    if current_lines:
        sections.append({
            "header": current_header,
            "text": "\n".join(current_lines).strip()
        })

    def split_section_into_subchunks(header: str, text: str, c_size: int, ov: int) -> list[str]:
        paragraphs = text.split("\n\n")
        subchunks = []
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Nếu paragraph đơn lẻ vượt kích thước chunk_size
            if len(para) > c_size:
                if current_chunk:
                    subchunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_len = 0

                # Chia nhỏ paragraph dài bằng câu
                sentences = re.split(r'(?<=[.!?])\s+', para)
                temp_chunk = []
                temp_len = 0
                for sent in sentences:
                    if temp_len + len(sent) > c_size:
                        if temp_chunk:
                            subchunks.append(" ".join(temp_chunk))
                        temp_chunk = [sent]
                        temp_len = len(sent)
                    else:
                        temp_chunk.append(sent)
                        temp_len += len(sent)
                if temp_chunk:
                    subchunks.append(" ".join(temp_chunk))
            else:
                if current_len + len(para) > c_size:
                    subchunks.append("\n\n".join(current_chunk))
                    # Lấy overlap từ cuối chunk cũ
                    overlap_chunk = []
                    overlap_len = 0
                    for p in reversed(current_chunk):
                        if overlap_len + len(p) < ov:
                            overlap_chunk.insert(0, p)
                            overlap_len += len(p)
                        else:
                            break
                    current_chunk = overlap_chunk + [para]
                    current_len = sum(len(p) for p in current_chunk)
                else:
                    current_chunk.append(para)
                    current_len += len(para)

        if current_chunk:
            subchunks.append("\n\n".join(current_chunk))
        return subchunks

    final_chunks = []
    chunk_idx = 0
    for sec in sections:
        header = sec["header"]
        text = sec["text"]
        if not text:
            continue

        subchunks = split_section_into_subchunks(header, text, chunk_size, overlap)
        for sub in subchunks:
            if not sub.strip():
                continue
            domain = detect_domain_from_text(header + "\n" + sub)
            final_chunks.append({
                "content": sub,
                "section_title": header,
                "domain": domain,
                "chunk_index": chunk_idx
            })
            chunk_idx += 1

    return final_chunks

# ========================================================
# 4. INGEST INTERPRETATION TO RAG
# ========================================================
async def ingest_interpretation_to_rag(user_id: int, chart_id: int, raw_text: str, user_db: UserDB | None = None):
    """
    Quy trình lưu trữ RAG an toàn:
    Lọc text -> Chia chunk -> Embedding -> Lưu Database.
    """
    if user_db is None:
        user_db = UserDB()

    # Tìm tên người dùng để dọn dẹp văn bản chính xác hơn
    user_name = None
    try:
        user_db.cursor.execute("SELECT full_name FROM users WHERE id=%s", (user_id,))
        row = user_db.cursor.fetchone()
        if row:
            user_name = row.get("full_name") or row.get("name") or row.get("fullname") or row.get("username")
    except Exception as e:
        print(f"[RAG INGEST] Warning getting user name: {e}")

    # 1. Dọn dẹp nội dung giải mã
    clean_text = clean_astrology_interpretation(raw_text, user_name)

    # 2. Chia chunk
    chunks = split_interpretation_into_chunks(clean_text)
    if not chunks:
        print(f"[RAG INGEST] Warning: Không tạo được chunk nào cho user_id={user_id}, chart_id={chart_id}")
        return

    # 3. Tạo Embeddings
    chunks_content = []
    for c in chunks:
        header_context = f"Section: {c['section_title']} | Domain: {c['domain']}"
        content_with_context = f"[{header_context}]\n\n{c['content']}"
        chunks_content.append(content_with_context)

    embeddings_model = get_embeddings_model()
    embeddings = await asyncio.to_thread(embeddings_model.embed_documents, chunks_content)

    # 4. Cấu trúc dữ liệu ghi nhận
    db_chunks = []
    for chunk, emb in zip(chunks, embeddings):
        token_count = len(chunk["content"]) // 4
        db_chunks.append({
            "user_id": user_id,
            "section_name": chunk["section_title"],
            "domain": chunk["domain"],
            "source_type": "natal_chart_interpretation",
            "chunk_index": chunk["chunk_index"],
            "token_count": token_count,
            "content": chunk["content"],
            "embedding": emb
        })

    # 5. Thay thế và lưu document chunks trong DB
    await asyncio.to_thread(user_db.replace_document_chunks, chart_id, db_chunks)

    # In Báo Cáo Log theo Yêu Cầu
    print(f"\n================ [RAG INGESTION REPORT] ================")
    print(f"Conversation/Chart ID: {chart_id}")
    print(f"User ID: {user_id}")
    print(f"Length of Raw Text: {len(raw_text)} chars")
    print(f"Length of Clean Text: {len(clean_text)} chars")
    print(f"Number of Chunks Created: {len(db_chunks)}")
    print("--------------------------------------------------------")
    for c in db_chunks:
        print(f"Chunk {c['chunk_index']} | Section: {c['section_name']} | Domain: {c['domain']} | Chars: {len(str(c['content']))}")
    print("========================================================\n")

# ========================================================
# 5. RETRIEVE CONTEXT FOR FOLLOW-UP
# ========================================================
async def retrieve_context_for_followup(user_id: int, chart_id: int, question: str, user_db: UserDB | None = None, top_k: int = 4) -> list[dict]:
    """
    Truy xuất các chunk của user_id và chart_id, ưu tiên domain phù hợp câu hỏi.
    """
    if user_db is None:
        user_db = UserDB()

    # Truy vấn toàn bộ chunk thuộc cuộc hội thoại & tài khoản này
    await asyncio.sleep(0)
    user_db.cursor.execute(
        "SELECT * FROM conversation_chunks WHERE conversation_id=%s AND user_id=%s ORDER BY chunk_index ASC",
        (chart_id, user_id)
    )
    rows = user_db.cursor.fetchall()

    all_chunks = []
    import json
    for row in rows:
        d = dict(row)
        if d.get("embedding"):
            try:
                d["embedding"] = json.loads(d["embedding"])
            except:
                pass
        all_chunks.append(d)

    if not all_chunks:
        return []

    # Lấy top semantic matches
    from chatbot.rag.retriever import retrieve_top_chunks
    retrieved = retrieve_top_chunks(question, all_chunks, top_k=10)

    # Reranking và Domain Boost
    question_domain = detect_domain_from_text(question)
    chunk_by_idx = {c["chunk_index"]: c for c in all_chunks}

    from chatbot.rag.reranker import rerank_chunks
    final_chunks = rerank_chunks(question, retrieved, top_k=top_k)

    for c in final_chunks:
        db_chunk = chunk_by_idx.get(c["chunk_index"])
        c_domain = db_chunk.get("domain") if db_chunk else "general"
        
        # Áp dụng boost nếu khớp domain câu hỏi
        domain_boost = 0.0
        if question_domain != "general" and c_domain == question_domain:
            domain_boost = 0.15

        c["domain"] = c_domain
        c["final_score"] = round(c.get("final_score", 0.0) + domain_boost, 4)
        c["domain_boost"] = domain_boost

    # Sắp xếp lại theo điểm cuối cùng
    final_chunks.sort(key=lambda x: x["final_score"], reverse=True)
    for i, c in enumerate(final_chunks):
        c["rank_position"] = i + 1

    return final_chunks

# ========================================================
# 6. ANSWER FOLLOW-UP WITH RAG
# ========================================================
async def answer_followup_with_rag(question: str, retrieved_context: list[dict], llm_model = None) -> str:
    """
    Sinh câu trả lời bám sát context RAG, loại bỏ thông tin tự bịa.
    """
    if llm_model is None:
        from chatbot.utils.llm import LLM
        llm_model = LLM().get_llm()

    if not retrieved_context:
        return "Hiện tại mình chưa tìm thấy đủ thông tin trong bản đồ sao đã lưu để kết luận chính xác về câu hỏi này."

    # Kiểm tra tính liên quan đến Chiêm tinh / Bản đồ sao
    astrology_terms = [
        "sao", "cung", "mọc", "nhà", "chiêm tinh", "bản đồ", "tử vi", "mặt trời", 
        "mặt trăng", "vận mệnh", "tương hợp", "sự nghiệp", "tình duyên", "sức khỏe", 
        "tài chính", "gia đình", "tính cách", "dự đoán", "thời gian", "ngày sinh", 
        "sinh năm", "hành tinh", "góc hợp", "đối tác", "yêu", "vợ", "chồng", "kết hôn",
        "tiền bạc", "học hành", "sức khoẻ", "bệnh", "năng lượng"
    ]
    question_lower = question.lower()
    is_astrology_related = any(term in question_lower for term in astrology_terms)

    if not is_astrology_related:
        return "Xin lỗi, mình chỉ có thể trả lời các câu hỏi liên quan đến chiêm tinh học và bản đồ sao cá nhân của bạn. Bạn vui lòng đặt câu hỏi trong phạm vi này nhé!"

    # Cấu trúc Context chu đáo
    context_str = ""
    for i, c in enumerate(retrieved_context):
        context_str += f"[Tài liệu {i+1} - {c.get('section_name', 'Chuyên môn')} (Domain: {c.get('domain', 'general')})]:\n{c['content']}\n\n"

    system_prompt = (
        "Bạn là trợ lý chiêm tinh của hệ thống MARA-AI. Bạn chỉ được trả lời dựa trên CONTEXT được cung cấp từ RAG. "
        "Không được tự bịa thêm thông tin ngoài context. Nếu context không chứa thông tin liên quan đến câu hỏi, "
        "hãy nói rằng hiện chưa có đủ thông tin trong bản đồ sao đã lưu để kết luận. "
        "Trả lời bằng tiếng Việt, dễ hiểu, thân thiện, tập trung đúng câu hỏi người dùng."
    )

    prompt = f"""{system_prompt}

CONTEXT ĐƯỢC CUNG CẤP:
{context_str}

CÂU HỎI CỦA NGƯỜI DÙNG:
"{question}"

YÊU CẦU:
1. Chỉ dùng thông tin trong CONTEXT được cung cấp để trả lời.
2. Không sử dụng kiến thức bên ngoài CONTEXT.
3. Không tự bịa thêm vị trí các hành tinh, cung, nhà hay góc hợp nếu CONTEXT không đề cập.
4. Nếu CONTEXT không chứa thông tin giúp trả lời, hãy phản hồi đúng cụm từ: "Hiện tại mình chưa tìm thấy đủ thông tin trong bản đồ sao đã lưu để kết luận chính xác về câu hỏi này."
5. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn và đi thẳng vào trọng tâm.
"""
    try:
        response = await asyncio.to_thread(llm_model.invoke, prompt)
        answer = str(response.content) if hasattr(response, "content") else str(response)
        
        # Loại bỏ thinking tags (DeepSeek/Reasoning models)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        return answer
    except Exception as e:
        print(f"[RAG FOLLOW-UP ERROR] invoke failed: {e}")
        return "Hiện tại hệ thống gặp lỗi khi truy vấn câu trả lời. Vui lòng thử lại sau."

# ========================================================
# PIPELINE BACKWARD COMPATIBILITY
# ========================================================
async def pipeline_process_and_store(conversation_id: int, user_id: int, section_name: str, chart_text: str, user_db: UserDB):
    """
    Tương thích ngược: Định tuyến việc lưu trữ qua ingest_interpretation_to_rag để bảo đảm dọn dẹp và phân loại chính xác.
    """
    await ingest_interpretation_to_rag(user_id=user_id, chart_id=conversation_id, raw_text=chart_text, user_db=user_db)

async def pipeline_retrieve_and_rerank(conversation_id: int, question: str, user_db: UserDB, top_k: int = 3):
    """
    Tương thích ngược: Định tuyến việc truy xuất qua retrieve_context_for_followup.
    """
    user_id = 0
    try:
        user_db.cursor.execute("SELECT user_id FROM conversations WHERE id=%s", (conversation_id,))
        row = user_db.cursor.fetchone()
        if row:
            user_id = row.get("user_id", 0)
    except Exception as e:
        print(f"[pipeline_retrieve_and_rerank] Error getting user_id: {e}")

    return await retrieve_context_for_followup(user_id=user_id, chart_id=conversation_id, question=question, user_db=user_db, top_k=top_k)


# ========================================================
# 7. HYBRID RAG (RAG + GRAPHRAG COMBINED) FOR FOLLOW-UP
# ========================================================

HYBRID_FOLLOWUP_CACHE = {}

class GraphData(dict):
    entities: list
    relationships: list
    summary_text: str

    def __init__(self, entities: list, relationships: list, summary_text: str = ""):
        super().__init__(entities=entities, relationships=relationships, summary_text=summary_text)
        self.entities = entities
        self.relationships = relationships
        self.summary_text = summary_text

def detect_question_domain(question: str) -> str:
    if not question:
        return "general"
    q_lower = question.lower()
    
    if any(w in q_lower for w in ["sức khỏe", "bình an", "thể chất", "tinh thần", "stress", "bệnh", "sau 30 tuổi", "sau này", "tương lai", "lớn tuổi", "sức khoẻ"]):
        return "health"
    if any(w in q_lower for w in ["tình yêu", "tình duyên", "người yêu", "mối quan hệ", "hôn nhân", "crush", "hợp nhau", "tương hợp"]):
        return "love"
    if any(w in q_lower for w in ["sự nghiệp", "công việc", "nghề nghiệp", "công danh", "học tập", "định hướng", "kiếm tiền"]):
        return "career"
    if any(w in q_lower for w in ["tính cách", "con người", "bản thân", "cá tính", "điểm mạnh", "điểm yếu"]):
        return "personality"
    if any(w in q_lower for w in ["tài chính", "tiền bạc", "thu nhập", "giàu", "tiền"]):
        return "finance"
        
    return "general"

async def retrieve_rag_context(user_id: int, chart_id: int, question: str, domain: str, top_k: int = 5, user_db = None) -> list[dict]:
    if user_db is None:
        user_db = UserDB()
        
    # Query database chunks
    user_db.cursor.execute(
        "SELECT * FROM conversation_chunks WHERE conversation_id=%s AND user_id=%s ORDER BY chunk_index ASC",
        (chart_id, user_id)
    )
    rows = user_db.cursor.fetchall()
    
    all_chunks = []
    import json
    for row in rows:
        d = dict(row)
        if d.get("embedding"):
            try:
                d["embedding"] = json.loads(d["embedding"])
            except:
                pass
        all_chunks.append(d)
        
    if not all_chunks:
        return []
        
    # Get top semantic matches
    from chatbot.rag.retriever import retrieve_top_chunks
    retrieved = retrieve_top_chunks(question, all_chunks, top_k=10)
    
    # Reranking and Domain Boost
    from chatbot.rag.reranker import rerank_chunks
    final_chunks = rerank_chunks(question, retrieved, top_k=top_k)
    
    chunk_by_idx = {c["chunk_index"]: c for c in all_chunks}
    results = []
    for i, c in enumerate(final_chunks):
        db_chunk = chunk_by_idx.get(c["chunk_index"])
        c_domain = db_chunk.get("domain") if db_chunk else "general"
        
        # Apply boost if matching domain of question
        domain_boost = 0.0
        if domain != "general" and c_domain == domain:
            domain_boost = 0.15
            
        final_score = round(c.get("final_score", 0.0) + domain_boost, 4)
        
        results.append({
            "content": c["content"],
            "section_title": db_chunk.get("section_name", "Chuyên môn") if db_chunk else "Chuyên môn",
            "domain": c_domain,
            "similarity_score": final_score,
            "chunk_index": c["chunk_index"]
        })
        
    # Sort after boost
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:top_k]

async def retrieve_graphrag_context(user_id: int, chart_id: int, question: str, domain: str, user_db = None) -> GraphData:
    if user_db is None:
        user_db = UserDB()
        
    # 1. Fetch chunks to identify user entities
    user_db.cursor.execute(
        "SELECT content FROM conversation_chunks WHERE conversation_id=%s AND user_id=%s ORDER BY chunk_index ASC",
        (chart_id, user_id)
    )
    rows = user_db.cursor.fetchall()
    full_text = " ".join([row["content"] for row in rows]) if rows else ""
    
    # Extract user entities from their natal chart RAG chunks
    from chatbot.rag.knowledge_graph import extract_astrology_entities, get_astrology_kg
    user_entities = extract_astrology_entities(full_text)
    
    # Also extract entities from the follow-up question
    question_entities = extract_astrology_entities(question)
    
    # Combine all entities to search in Graph
    all_search_entities = list(set(user_entities + question_entities))
    
    # 2. Query Knowledge Graph
    kg = get_astrology_kg()
    graph_facts = []
    if all_search_entities:
        try:
            # extract subgraph in asyncio to thread
            graph_facts = await asyncio.to_thread(kg.extract_subgraph, all_search_entities, max_depth=2)
        except Exception as e:
            print(f"[GraphRAG Query Error] extract_subgraph failed: {e}")
            graph_facts = []
            
    # Rules filtering
    domain_rules = {
        "health": {
            "keywords": ["sức khỏe", "bình an", "tinh thần", "thể chất", "nhà 6", "sao thổ", "sao mộc", "căng thẳng", "stress", "bệnh", "yếu tố cơ thể", "sức khoẻ"],
            "relations": ["AFFECTS_LIFE_AREA", "INDICATES_TRAIT", "SUGGESTS_ADVICE"]
        },
        "love": {
            "keywords": ["sao kim", "sao hỏa", "mặt trăng", "nhà 5", "nhà 7", "tình yêu", "tình cảm", "hôn nhân", "mối quan hệ", "crush", "hợp nhau", "tương hợp", "tình duyên"],
            "relations": ["AFFECTS_LIFE_AREA", "INDICATES_TRAIT", "SUGGESTS_ADVICE", "COMPATIBLE_WITH"]
        },
        "career": {
            "keywords": ["sự nghiệp", "công việc", "công danh", "nghề nghiệp", "nhà 10", "mc", "sao thổ", "sao mộc", "học tập", "định hướng", "kiếm tiền"],
            "relations": ["AFFECTS_LIFE_AREA", "SUGGESTS_ADVICE", "INDICATES_TRAIT"]
        },
        "personality": {
            "keywords": ["cung mọc", "mọc", "mặt trời", "mặt trăng", "tính cách", "con người", "bản thân", "cá tính", "điểm mạnh", "điểm yếu", "personalitytrait", "strength", "challenge"],
            "relations": ["USER_HAS_ASCENDANT", "USER_HAS_SUN_SIGN", "USER_HAS_MOON_SIGN", "INDICATES_TRAIT"]
        },
        "finance": {
            "keywords": ["tài chính", "tiền bạc", "thu nhập", "giàu", "nhà 2", "nhà 8", "sao mộc", "sao kim", "tiền"],
            "relations": ["AFFECTS_LIFE_AREA", "SUGGESTS_ADVICE"]
        },
        "general": {
            "keywords": ["cung mọc", "mọc", "mặt trời", "mặt trăng", "strength", "challenge", "advice"],
            "relations": []
        }
    }
    
    rules = domain_rules.get(domain, domain_rules["general"])
    keywords = rules["keywords"]
    allowed_relations = rules["relations"]
    
    import re
    rel_pattern = re.compile(r"^\s*-?\s*([^[\]]+)\[([^[\]]+)\]([^[\]]+)$")
    
    filtered_relations = []
    filtered_entities = set()
    
    # Parse graph_facts
    for fact in graph_facts:
        fact_clean = fact.strip().lstrip("-").strip()
        match = rel_pattern.match(fact_clean)
        if match:
            ent1 = match.group(1).strip()
            rel = match.group(2).strip()
            ent2 = match.group(3).strip()
            
            is_relevant = False
            if allowed_relations and any(ar.lower() in rel.lower() for ar in allowed_relations):
                is_relevant = True
            if not is_relevant:
                ent1_lower = ent1.lower()
                ent2_lower = ent2.lower()
                if any(kw in ent1_lower or kw in ent2_lower for kw in keywords):
                    is_relevant = True
            if not is_relevant and domain == "general":
                is_relevant = True
                
            if is_relevant:
                rel_dict = {
                    "source": ent1,
                    "type": rel,
                    "target": ent2,
                    "raw_text": f"{ent1} {rel} {ent2}"
                }
                filtered_relations.append(rel_dict)
                filtered_entities.add(ent1)
                filtered_entities.add(ent2)
        else:
            fact_lower = fact_clean.lower()
            if any(kw in fact_lower for kw in keywords) or domain == "general":
                filtered_relations.append({
                    "source": "Fact",
                    "type": "INFO",
                    "target": fact_clean,
                    "raw_text": fact_clean
                })
                for kw in keywords:
                    if kw in fact_lower:
                        filtered_entities.add(kw.title())
                        
    # Reconstruct placements
    zodiac_signs = [
        "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ", 
        "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
    ]
    planets = [
        "Mặt Trời", "Mặt Trăng", "Sao Kim", "Sao Hỏa", "Sao Thủy", "Sao Mộc", "Sao Thổ", "Sao Thiên Vương", "Sao Hải Vương", "Sao Diêm Vương"
    ]
    placements_found = []
    for planet in planets:
        for sign in zodiac_signs:
            pattern = f"{planet} (ở|tại|trong|thuộc) {sign}"
            if re.search(pattern, full_text, re.IGNORECASE) or f"{planet} {sign}" in full_text:
                placements_found.append((planet, "IN_SIGN", sign))
                
    for sign in zodiac_signs:
        if f"Cung Mọc {sign}" in full_text or f"Mọc {sign}" in full_text:
            placements_found.append(("Cung Mọc", "IN_SIGN", sign))
            
    for p_ent1, p_rel, p_ent2 in placements_found:
        is_p_relevant = False
        p_ent1_lower = p_ent1.lower()
        p_ent2_lower = p_ent2.lower()
        if domain == "general" or any(kw in p_ent1_lower or kw in p_ent2_lower for kw in keywords):
            is_p_relevant = True
            
        if is_p_relevant:
            filtered_relations.append({
                "source": p_ent1,
                "type": p_rel,
                "target": p_ent2,
                "raw_text": f"{p_ent1} {p_rel} {p_ent2}"
            })
            filtered_entities.add(p_ent1)
            filtered_entities.add(p_ent2)
            
    entities_list = sorted(list(filtered_entities))
    
    # Sort relations to be stable and distinct
    seen_rels = set()
    unique_relations = []
    for r in filtered_relations:
        key = (r["source"], r["type"], r["target"])
        if key not in seen_rels:
            seen_rels.add(key)
            unique_relations.append(r)
            
    return GraphData(
        entities=entities_list,
        relationships=unique_relations,
        summary_text=f"Entities found: {len(entities_list)}, Relationships: {len(unique_relations)}"
    )

def format_rag_context(rag_chunks: list) -> str:
    if not rag_chunks:
        return ""
    lines = []
    for i, chunk in enumerate(rag_chunks):
        lines.append(f"[RAG #{i+1}]")
        lines.append(f"Section: {chunk.get('section_title', 'Chuyên môn')}")
        lines.append(f"Domain: {chunk.get('domain', 'general')}")
        lines.append(f"Score: {chunk.get('similarity_score', 0.0)}")
        lines.append(f"Content: {chunk.get('content', '')}")
        lines.append("")
    return "\n".join(lines).strip()

def classify_entity_type(ent_name: str) -> str:
    planets = ["Mặt Trời", "Mặt Trăng", "Sao Kim", "Sao Hỏa", "Sao Thủy", "Sao Mộc", "Sao Thổ", "Sao Thiên Vương", "Sao Hải Vương", "Sao Diêm Vương"]
    zodiacs = ["Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp", "Thiên Yết", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"]
    life_areas = ["Sức khỏe", "Tình yêu", "Sự nghiệp", "Tài chính", "Bình an", "Tinh thần", "Thể chất", "Công việc", "Hôn nhân", "Mối quan hệ", "Tiền bạc", "Thu nhập"]
    
    ent_lower = ent_name.lower()
    if any(p.lower() == ent_lower for p in planets):
        return "Planet"
    if any(z.lower() == ent_lower for z in zodiacs):
        return "ZodiacSign"
    if "nhà" in ent_lower:
        return "House"
    if any(la.lower() == ent_lower for la in life_areas):
        return "LifeArea"
    if "khuyên" in ent_lower or "advice" in ent_lower:
        return "Advice"
    if "thử thách" in ent_lower or "challenge" in ent_lower:
        return "Challenge"
    if "điểm mạnh" in ent_lower or "strength" in ent_lower:
        return "Strength"
    return "Entity"

def format_graphrag_context(graph_data) -> str:
    entities = graph_data.get("entities", [])
    relationships = graph_data.get("relationships", [])
    
    if not entities and not relationships:
        return ""
        
    lines = []
    if entities:
        lines.append("[GraphRAG Entities]")
        for ent in entities:
            ent_type = classify_entity_type(ent)
            lines.append(f"- {ent_type}: {ent}")
        lines.append("")
        
    if relationships:
        lines.append("[GraphRAG Relationships]")
        for rel in relationships:
            if isinstance(rel, dict):
                lines.append(f"- {rel.get('source')} {rel.get('type')} {rel.get('target')}")
            else:
                lines.append(f"- {rel}")
                
    return "\n".join(lines).strip()

def combine_hybrid_context(rag_context: str, graph_context: str, language: str = "vi") -> str:
    r_ctx = rag_context if rag_context.strip() else ("No relevant RAG chunks found." if language == "en" else "Không tìm thấy chunk phù hợp.")
    g_ctx = graph_context if graph_context.strip() else ("No relevant entities/relationships found." if language == "en" else "Không tìm thấy entity/relationship phù hợp.")
    
    combined = f"""HYBRID_CONTEXT

RAG_CONTEXT:
{r_ctx}

GRAPH_CONTEXT:
{g_ctx}"""
    
    if len(combined) > 14000:
        combined = combined[:14000] + "\n... [Context truncated due to length limits] ..."
    return combined

async def generate_answer_from_hybrid_context(question: str, hybrid_context: str, domain: str, llm_model = None, language: str = "vi") -> str:
    if llm_model is None:
        from chatbot.utils.llm import LLM
        llm_model = LLM().get_llm()
        
    if language == "en":
        prompt = f"""You are a fun astrology assistant of the MARA-AI system.

You must answer based on the HYBRID_CONTEXT consisting of 2 sources:
1. RAG_CONTEXT: text chunks divided from the natal chart interpretation.
2. GRAPH_CONTEXT: entities and relationships extracted from the natal chart.

Mandatory rules:
- Prioritize specific information in RAG_CONTEXT.
- Use GRAPH_CONTEXT to supplement relations between planets, signs, houses, traits, life areas, and advice.
- Prioritize information in HYBRID_CONTEXT. However, if HYBRID_CONTEXT does not contain specific information to answer the question, or if both sources are empty/missing data, you MUST USE your deep astrological knowledge and logic to deduce and provide the most accurate, deep, and complete astrological answer to the user's question (absolutely do not answer 'information not found' or 'no data yet').
- If RAG_CONTEXT and GRAPH_CONTEXT conflict, prioritize RAG_CONTEXT and express it cautiously.
- If you only have indirect data or deduce from your own knowledge, start or blend subtly: 'Based on astrological indicators...' or 'According to an in-depth astrological perspective...' to analyze in the most convincing way.
- If the question contains time elements like 'after 30 years old', 'future', 'later' but context has no direct time markers, use your astrological knowledge (e.g., planet cycles like Saturn return at age 30, or house meanings) to provide predictions and deep advice.
- Answer in English.
- Answer clearly, friendly, to the point.
- Do not mention RAG or GraphRAG in detail unless debugging is needed.

QUESTION:
{question}

DOMAIN:
{domain}

HYBRID_CONTEXT:
{hybrid_context}

ANSWER:"""
    else:
        prompt = f"""Bạn là trợ lý chiêm tinh của hệ thống MARA-AI.

Bạn phải trả lời dựa trên HYBRID_CONTEXT gồm 2 nguồn:
1. RAG_CONTEXT: các đoạn văn bản đã được chia chunk từ luận giải bản đồ sao.
2. GRAPH_CONTEXT: các entity và relationship đã được trích xuất từ bản đồ sao.

Quy tắc bắt buộc:
- Ưu tiên thông tin cụ thể trong RAG_CONTEXT.
- Dùng GRAPH_CONTEXT để bổ sung quan hệ giữa hành tinh, cung, nhà, đặc điểm, lĩnh vực đời sống và lời khuyên.
- Hãy ưu tiên thông tin trong HYBRID_CONTEXT. Tuy nhiên, nếu HYBRID_CONTEXT không chứa thông tin cụ thể để trả lời câu hỏi, hoặc nếu cả hai nguồn này trống/thiếu dữ liệu, bạn HÃY SỬ DỤNG kiến thức chiêm tinh học chuyên sâu và logic của riêng bạn để tự suy luận và đưa ra câu trả lời chiêm tinh học chính xác, sâu sắc và đầy đủ nhất cho câu hỏi của người dùng (tuyệt đối không trả lời là 'không tìm thấy thông tin' hay 'chưa có dữ liệu').
- Nếu RAG_CONTEXT và GRAPH_CONTEXT mâu thuẫn, hãy ưu tiên RAG_CONTEXT và diễn đạt thận trọng.
- Nếu chỉ có dữ liệu gián tiếp hoặc tự suy luận từ kiến thức của bạn, hãy bắt đầu hoặc lồng ghép tinh tế: 'Dựa trên các chỉ báo chiêm tinh...' hoặc 'Theo góc nhìn chiêm tinh chuyên sâu...' để phân tích một cách thuyết phục nhất.
- Nếu câu hỏi có yếu tố thời gian như 'sau 30 tuổi', 'tương lai', 'sau này' nhưng context không có mốc thời gian trực tiếp, hãy tự vận dụng kiến thức chiêm tinh (ví dụ về chu kỳ của các hành tinh như Sao Thổ ở tuổi 30, hoặc ý nghĩa các nhà) để đưa ra dự báo và lời khuyên sâu sắc.
- Trả lời bằng tiếng Việt.
- Trả lời rõ ràng, thân thiện, đúng trọng tâm.
- Không nhắc quá kỹ thuật rằng đang dùng RAG hay GraphRAG, trừ khi cần debug.

QUESTION:
{question}

DOMAIN:
{domain}

HYBRID_CONTEXT:
{hybrid_context}

ANSWER:"""

    try:
        response = await asyncio.to_thread(llm_model.invoke, prompt)
        answer = str(response.content) if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        return answer
    except Exception as e:
        print(f"[Hybrid Context LLM Error] {e}")
        return "System error when retrieving response. Please try again later." if language == "en" else "Hiện tại hệ thống gặp lỗi khi truy vấn câu trả lời. Vui lòng thử lại sau."

async def answer_followup_with_hybrid_context(user_id: int, chart_id: int, question: str, user_db = None, language: str = "vi"):
    import time
    start_time = time.time()
    
    if user_db is None:
        user_db = UserDB()
        
    domain = detect_question_domain(question)
    
    # 1. Check if query is astrology-related
    astrology_terms = [
        "cung", "sao", "mọc", "nhà", "chiêm tinh", "bản đồ", "tử vi", "mặt trời", 
        "mặt trăng", "vận mệnh", "tương hợp", "sự nghiệp", "tình duyên", "sức khỏe", 
        "tài chính", "gia đình", "tính cách", "dự đoán", "thời gian", "ngày sinh", 
        "sinh năm", "hành tinh", "góc hợp", "đối tác", "yêu", "vợ", "chồng", "kết hôn",
        "tiền bạc", "học hành", "sức khoẻ", "bệnh", "năng lượng", "hôm nay", "ngày mai",
        "vận ngày", "ngày mới", "cung mọc", "mặt trời", "mặt trăng", "sao kim", "sao hỏa", 
        "sao thủy", "sao mộc", "sao thổ", "sau 30 tuổi", "vận hạn", "tương lai", "khó khăn", 
        "thử thách", "bình an", "stress", "career", "love", "health"
    ]
    question_lower = question.lower()
    is_astrology_related = any(term in question_lower for term in astrology_terms)
    
    if not is_astrology_related:
        print(f"\n[Hybrid FollowUp] Non-astrology query rejected: {question}")
        return {
            "answer": "Sorry, I can only answer questions related to astrology and your personal natal chart. Please ask questions within this scope!" if language == "en" else "Xin lỗi, mình chỉ có thể trả lời các câu hỏi liên quan đến chiêm tinh học và bản đồ sao cá nhân của bạn. Bạn vui lòng đặt câu hỏi trong phạm vi này nhé!",
            "source_used": "NONE",
            "rag_chunks_count": 0,
            "graph_entities_count": 0,
            "graph_relationships_count": 0,
            "rag_sources": [],
            "graph_sources": {"entities": [], "relationships": []}
        }
        
    # Check Cache
    normalized_q = question.strip().lower()
    cache_key = (user_id, chart_id, normalized_q, domain, language)
    if cache_key in HYBRID_FOLLOWUP_CACHE:
        print(f"[Hybrid FollowUp] Cache hit for key={cache_key}")
        return HYBRID_FOLLOWUP_CACHE[cache_key]
        
    rag_time_ms = 0
    graph_time_ms = 0
    
    async def run_rag():
        nonlocal rag_time_ms
        t0 = time.time()
        res = await retrieve_rag_context(user_id, chart_id, question, domain, top_k=5, user_db=user_db)
        rag_time_ms = int((time.time() - t0) * 1000)
        return res
        
    async def run_graph():
        nonlocal graph_time_ms
        t0 = time.time()
        res = await retrieve_graphrag_context(user_id, chart_id, question, domain, user_db=user_db)
        graph_time_ms = int((time.time() - t0) * 1000)
        return res
        
    # Parallel execution
    rag_chunks, graph_data = await asyncio.gather(run_rag(), run_graph())
    
    rag_context = format_rag_context(rag_chunks)
    graph_context = format_graphrag_context(graph_data)
    
    rag_best_score = max([c.get("similarity_score", 0.0) for c in rag_chunks]) if rag_chunks else 0.0
    print(f"[Hybrid FollowUp] rag_best_score={rag_best_score}")
    if not rag_chunks or not rag_context.strip() or rag_best_score < 0.58:
        print(f"[Hybrid FollowUp] No RAG chunks retrieved or best score {rag_best_score} < 0.58. Returning has_rag=False.")
        return {
            "answer": "",
            "source_used": "NONE",
            "has_rag": False,
            "rag_chunks_count": 0,
            "graph_entities_count": 0,
            "graph_relationships_count": 0,
            "rag_sources": [],
            "graph_sources": {"entities": [], "relationships": []}
        }

    hybrid_context = combine_hybrid_context(rag_context, graph_context, language=language)
    
    # Measure LLM time
    t_start_llm = time.time()
    answer = await generate_answer_from_hybrid_context(question, hybrid_context, domain, language=language)
    llm_time_ms = int((time.time() - t_start_llm) * 1000)
    
    total_time_ms = int((time.time() - start_time) * 1000)
    rag_best_score = max([c["similarity_score"] for c in rag_chunks]) if rag_chunks else 0.0
    
    source_used = "HYBRID_RAG_GRAPHRAG"
    
    # Detailed log
    print(f"\n[Hybrid FollowUp] question={question}")
    print(f"[Hybrid FollowUp] user_id={user_id}")
    print(f"[Hybrid FollowUp] chart_id={chart_id}")
    print(f"[Hybrid FollowUp] domain={domain}")
    print(f"[Hybrid FollowUp] rag_chunks={len(rag_chunks)}")
    print(f"[Hybrid FollowUp] rag_best_score={rag_best_score}")
    print(f"[Hybrid FollowUp] graph_entities={len(graph_data.entities)}")
    print(f"[Hybrid FollowUp] graph_relationships={len(graph_data.relationships)}")
    print(f"[Hybrid FollowUp] source_used={source_used}")
    print(f"[Hybrid FollowUp] rag_time={rag_time_ms}ms")
    print(f"[Hybrid FollowUp] graph_time={graph_time_ms}ms")
    print(f"[Hybrid FollowUp] llm_time={llm_time_ms}ms")
    print(f"[Hybrid FollowUp] total_time={total_time_ms}ms\n")
    
    result = {
        "answer": answer,
        "source_used": source_used,
        "domain": domain,
        "has_rag": True,
        "hybrid_context": hybrid_context,
        "rag_chunks_count": len(rag_chunks),
        "graph_entities_count": len(graph_data.entities),
        "graph_relationships_count": len(graph_data.relationships),
        "rag_sources": rag_chunks,
        "graph_sources": graph_data
    }
    
    HYBRID_FOLLOWUP_CACHE[cache_key] = result
    return result

async def answer_followup_with_hybrid_rag(user_id: int, chart_id: int, question: str, user_db = None, language: str = "vi"):
    # Backward compatibility wrapper pointing to new hybrid context flow
    return await answer_followup_with_hybrid_context(user_id, chart_id, question, user_db, language=language)

