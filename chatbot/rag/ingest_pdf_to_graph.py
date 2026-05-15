import os
import re
import json
import asyncio
import sys
from typing import List, Tuple

# Thêm đường dẫn gốc của dự án vào sys.path để có thể import module 'chatbot'
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.append(project_root)

sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_google_vertexai import (
    ChatVertexAI,
    VertexAIEmbeddings
)

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from chatbot.rag.neo4j_knowledge_graph import Neo4jAstrologyGraph

# =========================================================
# LOAD ENV
# =========================================================

load_dotenv()

# =========================================================
# LLM
# =========================================================

llm = ChatVertexAI(
    model="gemini-2.5-flash",
    temperature=0.1
)

# =========================================================
# EMBEDDING MODEL
# =========================================================

embedding_model = VertexAIEmbeddings(
    model="text-embedding-004"
)

# =========================================================
# ENTITY NORMALIZATION
# =========================================================

ENTITY_MAP = {
    "Sao Kim": "Venus",
    "Kim Tinh": "Venus",
    "Sao Hỏa": "Mars",
    "Hỏa Tinh": "Mars",
    "Sao Thủy": "Mercury",
    "Thủy Tinh": "Mercury",
    "Mặt Trời": "Sun",
    "Mặt Trăng": "Moon",
    "Kim Ngưu": "Taurus",
    "Bạch Dương": "Aries",
    "Song Tử": "Gemini",
    "Cự Giải": "Cancer",
    "Sư Tử": "Leo",
    "Xử Nữ": "Virgo",
    "Thiên Bình": "Libra",
    "Bọ Cạp": "Scorpio",
    "Nhân Mã": "Sagittarius",
    "Ma Kết": "Capricorn",
    "Bảo Bình": "Aquarius",
    "Song Ngư": "Pisces"
}

# =========================================================
# RELATION NORMALIZATION
# =========================================================

RELATION_MAP = {
    "ĐƯỢC_CAI_QUẢN_BỞI": "RULED_BY",
    "CAI_QUẢN": "RULES",
    "TƯƠNG_ỨNG_VỚI_CUNG": "CORRESPONDS_TO",
    "ĐẠI_DIỆN_CHO": "REPRESENTS",
    "THUỘC_NGUYÊN_TỐ": "HAS_ELEMENT",
    "LIÊN_KẾT_VỚI": "CONNECTED_TO",
    "ẢNH_HƯỞNG_ĐẾN": "INFLUENCES",
}

# =========================================================
# CLEAN JSON RESPONSE
# =========================================================

def clean_json_response(content: str) -> str:
    content = re.sub(r"```json|```", "", content).strip()

    start = content.find("[")
    end = content.rfind("]") + 1

    if start != -1 and end != -1:
        content = content[start:end]

    return content


# =========================================================
# NORMALIZE ENTITY
# =========================================================

def normalize_entity(entity: str) -> str:
    entity = entity.strip()
    return ENTITY_MAP.get(entity, entity)


# =========================================================
# NORMALIZE RELATION
# =========================================================

def normalize_relation(relation: str) -> str:
    relation = relation.strip().upper()
    return RELATION_MAP.get(relation, relation)


# =========================================================
# DETECT ENTITY TYPE
# =========================================================

def detect_entity_type(entity: str) -> str:

    zodiac_signs = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn",
        "Aquarius", "Pisces"
    ]

    planets = [
        "Sun", "Moon", "Mercury", "Venus",
        "Mars", "Jupiter", "Saturn",
        "Uranus", "Neptune", "Pluto"
    ]

    if entity in zodiac_signs:
        return "Zodiac"

    if entity in planets:
        return "Planet"

    if "House" in entity or "Nhà" in entity:
        return "House"

    return "Concept"


# =========================================================
# EXTRACT TRIPLETS
# =========================================================

async def extract_triplets_async(text: str) -> list:

    prompt = f"""
Bạn là chuyên gia Chiêm tinh học.

Nhiệm vụ:
Trích xuất kiến thức dưới dạng triplets:

[Subject, Predicate, Object]

QUY TẮC:
- Chỉ lấy thông tin xuất hiện trực tiếp trong văn bản
- Không suy diễn
- Predicate viết HOA và dùng dấu _
- Output ONLY JSON ARRAY
- Không markdown
- Không giải thích

VĂN BẢN:
{text}

Ví dụ:
[
  ["Venus", "RULES", "Libra"],
  ["House 7", "REPRESENTS", "Relationship"]
]
"""

    try:
        response = await llm.ainvoke(prompt)

        content = clean_json_response(response.content)

        triplets = json.loads(content)

        valid_triplets = []

        for t in triplets:
            if isinstance(t, list) and len(t) == 3:

                subject = normalize_entity(str(t[0]))
                predicate = normalize_relation(str(t[1]))
                obj = normalize_entity(str(t[2]))

                valid_triplets.append(
                    (subject, predicate, obj)
                )

        return valid_triplets

    except Exception as e:
        print(f"❌ LLM ERROR: {e}")
        return []


# =========================================================
# PROCESS CHUNK
# =========================================================

async def process_chunk(
    kg,
    chunk,
    chunk_id,
    source_file,
    vector_docs
):

    print(f"🔍 Processing Chunk {chunk_id}")

    text = chunk.page_content

    triplets = await extract_triplets_async(text)

    if not triplets:
        return

    print(f"   ✅ Extracted {len(triplets)} triplets")

    # =============================================
    # SAVE VECTOR DOC
    # =============================================

    vector_docs.append(
        Document(
            page_content=text,
            metadata={
                "source": source_file,
                "chunk_id": chunk_id,
                "page": chunk.metadata.get("page", 0)
            }
        )
    )

    # =============================================
    # SAVE TO NEO4J
    # =============================================

    for subject, predicate, obj in triplets:

        subject_type = detect_entity_type(subject)
        object_type = detect_entity_type(obj)

        try:
            # Đã thêm asyncio.to_thread và đổi tham số obj thành object_
            await asyncio.to_thread(
                kg.add_triplet,
                subject=subject,
                predicate=predicate,
                object_=obj,
                subject_type=subject_type,
                object_type=object_type,
                source=source_file,
                chunk_id=chunk_id
            )

            print(
                f"      + ({subject}) "
                f"-[{predicate}]-> "
                f"({obj})"
            )

        except Exception as e:
            print(f"❌ Neo4j Error: {e}")

# =========================================================
# ASYNC SEMAPHORE WRAPPER
# =========================================================

async def process_chunk_with_sem(sem, kg, chunk, chunk_id, source_file, vector_docs):
    """Wrapper function to limit concurrency"""
    async with sem:
        await process_chunk(kg, chunk, chunk_id, source_file, vector_docs)

# =========================================================
# INGEST PDFs
# =========================================================

async def ingest_pdfs_to_graphrag(pdf_paths: List[str]):

    # Giới hạn 3 tác vụ gọi LLM đồng thời để tránh Rate Limit (429 Too Many Requests)
    sem = asyncio.Semaphore(3)
    
    kg = Neo4jAstrologyGraph()

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

        try:

            loader = PyPDFLoader(pdf_path)

            docs = loader.load()

        except Exception as e:
            print(f"❌ PDF ERROR: {e}")
            continue

        chunks = splitter.split_documents(docs)

        print(f"📄 Total Chunks: {len(chunks)}")

        tasks = []

        for idx, chunk in enumerate(chunks):

            tasks.append(
                process_chunk_with_sem(
                    sem=sem,
                    kg=kg,
                    chunk=chunk,
                    chunk_id=idx,
                    source_file=pdf_path,
                    vector_docs=vector_docs
                )
            )

        # Chạy toàn bộ các chunk của file hiện tại
        await asyncio.gather(*tasks)

    # =====================================================
    # BUILD VECTOR DB
    # =====================================================

    print("\n🧠 Creating Vector Database...")

    if vector_docs:
        print(f"Bắt đầu tạo Vector DB cho {len(vector_docs)} chunks...")
        batch_size = 20 # Giảm xuống 20 để tránh vượt giới hạn 20,000 tokens/request
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
            print("✅ Vector DB saved successfully.")

    # =====================================================
    # CLOSE GRAPH
    # =====================================================

    kg.close()

    print("\n🎉 GRAPH RAG INGESTION COMPLETED!")


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    my_pdfs = [
        r"e:\HOC_TAP\THUC_TAP\LuanVanTotNghiep\chatbot\rag\pdf\6.1-Chiem-tinh-noi-mon-Tong-quan.pdf",
        r"e:\HOC_TAP\THUC_TAP\LuanVanTotNghiep\chatbot\rag\pdf\5323-chiem-tinh-hoc-pdf-khoahoctamlinh.vn.pdf"
    ]

    asyncio.run(
        ingest_pdfs_to_graphrag(my_pdfs)
    )
