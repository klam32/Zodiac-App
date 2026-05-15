import os
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings

def get_embeddings_model():
    return VertexAIEmbeddings(model="text-embedding-004")

def chunk_text(text: str, section_name: str, user_id: int) -> list[dict]:
    """
    Chia nhỏ văn bản thành các chunk, gán metadata.
    Sử dụng MarkdownHeaderTextSplitter để chia theo logic tiêu đề, 
    giúp giữ nguyên vẹn context của từng phần tử chiêm tinh.
    """
    if not text or len(text.strip()) < 50:
        return []

    # 1. Phân chia theo Header của Markdown
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    md_header_splits = markdown_splitter.split_text(text)
    
    # 2. Phân chia tiếp theo character nếu chunk vẫn quá lớn (giới hạn 4000 chars để không bị nát nội dung)
    chunk_size = 4000
    chunk_overlap = 500
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    final_splits = text_splitter.split_documents(md_header_splits)

    if not final_splits:
        return []

    # 3. Gắn Header Context vào nội dung Chunk để Embedding chính xác hơn
    chunks_content = []
    for doc in final_splits:
        # Tái tạo lại context từ metadata (Ví dụ: "Header 2: Mật Ngữ Các Hành Tinh, Header 3: Mặt Trời Cự Giải")
        header_context = " | ".join([f"{k}: {v}" for k, v in doc.metadata.items()])
        content_with_context = f"[{header_context}]\n\n{doc.page_content}" if header_context else doc.page_content
        chunks_content.append(content_with_context)

    # 4. Nhúng vector (Embedding)
    embeddings_model = get_embeddings_model()
    embeddings = embeddings_model.embed_documents(chunks_content)
    
    chunks_data = []
    for i, (content, emb) in enumerate(zip(chunks_content, embeddings)):
        # Ước lượng token_count đơn giản (1 token ~ 4 chars)
        token_count = len(content) // 4
        
        chunks_data.append({
            "user_id": user_id,
            "section_name": section_name,
            "chunk_index": i,
            "content": content,
            "token_count": token_count,
            "embedding": emb
        })
        
    return chunks_data
