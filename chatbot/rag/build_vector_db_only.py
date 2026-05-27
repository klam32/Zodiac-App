import os
import sys
from typing import List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

load_dotenv()

# =========================================================
# EMBEDDING MODEL
# =========================================================
embedding_model = VertexAIEmbeddings(
    model="text-embedding-004"
)

# =========================================================
# XÂY DỰNG LẠI VECTOR DB (BỎ QUA BƯỚC GRAPH LLM ĐỂ TIẾT KIỆM THỜI GIAN)
# =========================================================
def build_vector_db_only(pdf_paths: List[str]):
    vector_docs = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200
    )

    for pdf_path in pdf_paths:
        if not os.path.exists(pdf_path):
            print(f"❌ File not found: {pdf_path}")
            continue

        print(f"\n🚀 Loading PDF: {pdf_path}")
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()

        chunks = splitter.split_documents(docs)
        print(f"📄 Total Chunks cho {os.path.basename(pdf_path)}: {len(chunks)}")

        for idx, chunk in enumerate(chunks):
            vector_docs.append(
                Document(
                    page_content=chunk.page_content,
                    metadata={
                        "source": pdf_path,
                        "chunk_id": idx,
                        "page": chunk.metadata.get("page", 0)
                    }
                )
            )

    print(f"\n🧠 Bắt đầu tạo Vector DB cho tổng cộng {len(vector_docs)} chunks...")
    batch_size = 20 
    vector_db = None
    
    for i in range(0, len(vector_docs), batch_size):
        batch = vector_docs[i:i + batch_size]
        print(f" -> Đang nhúng (embed) batch {i//batch_size + 1}/{(len(vector_docs) + batch_size - 1)//batch_size} (size: {len(batch)})...")
        
        if vector_db is None:
            vector_db = FAISS.from_documents(batch, embedding_model)
        else:
            vector_db.add_documents(batch)

    if vector_db is not None:
        vector_db.save_local("vector_store")
        print("✅ Vector DB đã được lưu thành công tại thư mục 'vector_store'.")

if __name__ == "__main__":
    my_pdfs = [
        r"e:\HOC_TAP\THUC_TAP\LuanVanTotNghiep\chatbot\rag\pdf\6.1-Chiem-tinh-noi-mon-Tong-quan.pdf",
        r"e:\HOC_TAP\THUC_TAP\LuanVanTotNghiep\chatbot\rag\pdf\5323-chiem-tinh-hoc-pdf-khoahoctamlinh.vn.pdf"
    ]
    build_vector_db_only(my_pdfs)
