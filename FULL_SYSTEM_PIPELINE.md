# TOÀN BỘ PIPELINE HỆ THỐNG CHATBOT CHIÊM TINH (Zodiac Klam)

> Tài liệu này mô tả đầy đủ kiến trúc và luồng xử lý của toàn bộ hệ thống.
> Được thiết kế để dùng làm prompt cho ChatGPT/AI vẽ sơ đồ.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│                     Deployed trên Vercel                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP REST API (JWT Auth)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI - Python)                        │
│              app/main.py  →  Routers: auth, chatbot,                │
│              payment, admin, calendar, prediction                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        SQLite DB       Vertex AI      Neo4j / NetworkX
        (UserDB)       (LLM + Embed)   (Knowledge Graph)
```

---

## 2. PIPELINE CHÍNH: `/api/v1/chat` (Lần đầu - INIT MODE)

```
USER gửi form: {name, ngày sinh, city, field}
        │
        ▼
[FastAPI] POST /chat
        │
        ├─── Tạo conversation_id mới (nếu chưa có)
        │
        ▼
[Phát hiện chế độ] is_init = TRUE (context rỗng)
        │
        ├── is_love = TRUE?
        │       └─► [LoveAgent.run()] → Phân tích cặp đôi
        │
        └── is_love = FALSE?
                └─► [AISystem.run(question=None, birth_info)]
                            │
                            ▼
                  [AstrologyAgent.run()]
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
        get_coordinates()      AstrologicalSubject()
        (geo.py → lat/lng)     (Kerykeion library)
                  │                    │
                  └─────────┬──────────┘
                            ▼
                  ChartDataFactory → ChartDrawer
                  → SVG string (Bản đồ sao)
                            │
                            ▼
                  LLM.invoke(prompt_init)
                  → Luận giải tổng quan (Markdown)
                            │
                            ▼
              Trả về: {chart, chart_svg, chart_summary}
                            │
                            ▼
              [Background Task] RAG Chunking Pipeline
              pipeline_process_and_store(chart_text)
                  ├── chunk_text() → MarkdownHeaderSplitter
                  ├── RecursiveCharacterTextSplitter
                  ├── VertexAIEmbeddings.embed_documents()
                  └── UserDB.save_document_chunks()
                            │
                            ▼
              [Auto Update Title] "field - name"
                            │
                            ▼
              [Response] ChatResponse → Frontend
```

---

## 3. PIPELINE CHÍNH: `/api/v1/chat-followup` (Hỏi tiếp - CHAT MODE)

```
USER gửi: {conversation_id, question}
        │
        ▼
[FastAPI] POST /chat-followup
        │
        ├── Kiểm tra conversation thuộc đúng user
        ├── Lấy lịch sử chat từ DB (get_user_chat_logs)
        ├── Parse birth_info từ lịch sử
        ├── Xác định log INIT đầu tiên chứa chart/chart_summary/chart_svg
        ├── Lấy user memory từ DB
        │
        ▼
[Chạy Song Song - asyncio.gather()]
        ├── [GuardAgent.run(question)]
        └── [AISystem.analyze(question, memory, birth_info)]
        │
        ▼
[GuardAgent] Kiểm duyệt câu hỏi
        ├── LLM.invoke(guard_prompt) → {is_astrology, confidence}
        ├── _fallback_rule() → Blacklist keywords
        └── confidence < 0.8? → Từ chối "XIN LỖI..."
        │
        ▼
[AISystem.analyze()] Phân tích Intent
        ├── LLM.invoke(analyze_prompt)
        └── Trả về: {intents[], profile, emotion, entities[]}
        │
        ▼
[RAG Retrieval Pipeline]
pipeline_retrieve_and_rerank(conversation_id, question)
        ├── ensure_initial_rag_chunks()
        │       ├── Nếu đã có chunks → dùng ngay
        │       └── Nếu chưa có chunks → tạo lại từ log INIT đầu tiên
        ├── UserDB.get_document_chunks() → Lấy chunks bản đồ sao gốc từ DB
        ├── [Retriever] retrieve_top_chunks(query, chunks, top_k=5)
        │       ├── VertexAIEmbeddings.embed_query(question)
        │       └── cosine_similarity() → Top 5 chunks
        │
        └── [Reranker] rerank_chunks(query, chunks, top_k=3)
                ├── Section name boost (+0.05)
                ├── Keyword heuristic boost (+0.05)
                ├── Keyword overlap ratio boost (max +0.15)
                ├── Exact match boost (+0.10)
                └── final_score = semantic_score + boost
        │
        ▼
rag_context = Top 3 chunks nối vào câu hỏi
final_question = question + "[TRÍCH XUẤT TỪ BẢN ĐỒ SAO GỐC]:" + rag_context
        ├── Nếu retrieval chưa có kết quả → fallback bằng excerpt chart gốc từ log INIT
        │
        ▼
[GraphRAG] extract_astrology_entities(question)
        ├── Keyword matching (cung, hành tinh, nhà...)
        └── get_astrology_kg().extract_subgraph(entities, max_depth=2)
                ├── Neo4j graph (nếu kết nối được)
                └── NetworkX in-memory (fallback)
                → BFS k-hop → graph_facts[]
        │
        ▼
final_question += "[KIẾN THỨC TỪ KNOWLEDGE GRAPH]:" + graph_facts
        │
        ▼
[AISystem.spawn(intents)] → Danh sách Agent chuyên biệt
        │
        ▼
[AISystem.run_agents()] - Chạy song song (ThreadPoolExecutor 50 workers)
        ├── [CareerAgent]    → Sự nghiệp, Tài chính (Nhà 2,6,10)
        ├── [LoveAgent]      → Tình duyên (Nhà 5,7 + Sao Kim)
        ├── [HealthAgent]    → Sức khỏe (Nhà 6)
        ├── [PersonalityAgent] → Tính cách (Mặt Trời, Mặt Trăng, Cung Mọc)
        └── [DailyAgent]     → Tử vi hàng ngày
        │
        ▼
[Fusion / Single Agent]
        ├── 1 Agent → Thêm tiêu đề "### Title\n\nanswer"
        └── 2+ Agents → LLM.invoke(fusion_prompt) → Tổng hợp Markdown
        │
        ▼
[Save DB] UserDB.save_chat_log(answer, sources)
        │
        ▼
[Response] {answer, analysis, chart_svg, sources[], tokens_charged}
```

---

## 4. PIPELINE RAG CHI TIẾT

### 4.1 Ingestion Pipeline (Lần đầu chat - Background)

```
chart_text (Markdown từ AstrologyAgent)
        │
        ▼
[chunk_text(text, section_name, user_id)]
        │
        ├── MarkdownHeaderTextSplitter
        │   headers: (#, ##, ###)
        │   → md_header_splits[]
        │
        ├── RecursiveCharacterTextSplitter
        │   chunk_size=4000, overlap=500
        │   → final_splits[]
        │
        ├── Gắn header context vào content
        │   "[Header 2: Tính cách | Header 3: Mặt Trời]"
        │   + "\n\n" + page_content
        │
        └── VertexAIEmbeddings("text-embedding-004")
            .embed_documents(chunks_content)
            → embeddings[]
        │
        ▼
UserDB.save_document_chunks(conversation_id, chunks_data[])
→ Lưu vào SQLite: (user_id, section_name, chunk_index, content, embedding)
```

### 4.2 Retrieval + Reranking Pipeline

```
User Question
        │
        ▼
[retrieve_top_chunks(query, all_chunks, top_k=5)]
        ├── embed_query(query) → query_vector
        └── cosine_similarity(query_vector, chunk_embedding)
            → Top 5 chunks theo semantic score
        │
        ▼
[rerank_chunks(query, retrieved_chunks, top_k=3)]
        ├── boost += 0.05 nếu section_name match query
        ├── boost += 0.05 keyword heuristic (tình yêu, sự nghiệp...)
        ├── boost += overlap_ratio * 0.15 (keyword overlap)
        ├── boost += 0.10 exact match
        └── final_score = semantic_score + boost
        │
        ▼
Top 3 chunks có final_score cao nhất
→ Inject vào prompt của Specialist Agents
```

---

## 5. KNOWLEDGE GRAPH (GraphRAG)

```
[AstrologyGraph / Neo4jAstrologyGraph]
        │
        ├── Khởi động: Thử kết nối Neo4j
        │       └── Thất bại → Dùng NetworkX in-memory
        │
        ├── Knowledge Base (Triplets):
        │   ┌─────────────────────────────────────────┐
        │   │ Subject → [Relation] → Object           │
        │   ├─────────────────────────────────────────┤
        │   │ Cung hoàng đạo ←→ Hành tinh chủ quản   │
        │   │ Cung hoàng đạo ←→ Nguyên tố (Lửa/Đất)  │
        │   │ Nhà 1-12 ←→ Ý nghĩa đại diện           │
        │   │ Nhà ←→ Cung hoàng đạo tương ứng         │
        │   │ Hành tinh ←→ Ý nghĩa                    │
        │   │ Sự nghiệp/Tình duyên/Sức khỏe ←→ Nhà   │
        │   └─────────────────────────────────────────┘
        │
        └── extract_subgraph(entities, max_depth=2)
                └── BFS k-hop → Graph Facts[]
                    → Inject vào question
```

---

## 6. CÁC SPECIALIST AGENTS

```
┌──────────────────────────────────────────────────────────────────┐
│                    SPECIALIST AGENTS                             │
├────────────────────┬─────────────────────────────────────────────┤
│ AstrologyAgent     │ Luận giải bản đồ sao (Kerykeion)            │
│                    │ Init: Full chart analysis + SVG              │
│                    │ Chat: Q&A dựa trên chart data               │
├────────────────────┼─────────────────────────────────────────────┤
│ CareerAgent        │ Sự nghiệp, Tài chính                        │
│                    │ Focus: House 2,6,10 + Jupiter/Saturn/Mars   │
├────────────────────┼─────────────────────────────────────────────┤
│ LoveAgent          │ Tình duyên, Hôn nhân                        │
│                    │ Focus: House 5,7 + Venus + Partner chart    │
├────────────────────┼─────────────────────────────────────────────┤
│ HealthAgent        │ Sức khỏe, Năng lượng                        │
│                    │ Focus: House 6 + Saturn/Mars                │
├────────────────────┼─────────────────────────────────────────────┤
│ PersonalityAgent   │ Tính cách, Bản ngã                          │
│                    │ Focus: Sun/Moon/Ascendant                   │
├────────────────────┼─────────────────────────────────────────────┤
│ DailyAgent         │ Tử vi hàng ngày                             │
│                    │ Focus: Ngày hiện tại + Transit              │
├────────────────────┼─────────────────────────────────────────────┤
│ GuardAgent         │ Kiểm duyệt câu hỏi (On/Off topic)          │
│                    │ LLM classify + Blacklist fallback           │
├────────────────────┼─────────────────────────────────────────────┤
│ ValidatorAgent     │ Làm sạch & chuẩn hoá output Markdown        │
│                    │ Loại bỏ JSON rác, chuẩn heading            │
└────────────────────┴─────────────────────────────────────────────┘
```

---

## 7. TECHNOLOGY STACK

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER              │  TECHNOLOGY                               │
├─────────────────────┼───────────────────────────────────────────┤
│ Frontend            │ React + TypeScript + Vite → Vercel        │
├─────────────────────┼───────────────────────────────────────────┤
│ Backend API         │ FastAPI (Python) + Uvicorn                │
├─────────────────────┼───────────────────────────────────────────┤
│ LLM                 │ Google Vertex AI (gemini-1.5-flash)       │
├─────────────────────┼───────────────────────────────────────────┤
│ Embedding           │ Vertex AI text-embedding-004              │
├─────────────────────┼───────────────────────────────────────────┤
│ Astrology Calc      │ Kerykeion (natal chart + SVG)             │
├─────────────────────┼───────────────────────────────────────────┤
│ Database            │ SQLite (UserDB, chat logs, chunks)        │
├─────────────────────┼───────────────────────────────────────────┤
│ Knowledge Graph     │ Neo4j (primary) / NetworkX (fallback)     │
├─────────────────────┼───────────────────────────────────────────┤
│ Vector Search       │ Cosine Similarity (custom, in SQLite)     │
├─────────────────────┼───────────────────────────────────────────┤
│ Text Splitting      │ LangChain MarkdownHeaderTextSplitter      │
├─────────────────────┼───────────────────────────────────────────┤
│ Auth                │ JWT (FastAPI Security)                    │
├─────────────────────┼───────────────────────────────────────────┤
│ Deployment          │ Cloudflare Tunnel + Vercel                │
└─────────────────────┴───────────────────────────────────────────┘
```

---

## 8. LUỒNG DỮ LIỆU ĐẦY ĐỦ (Data Flow)

```
[1] USER INPUT
    name, year, month, day, hour, minute, city, country, field
                    │
                    ▼
[2] AUTHENTICATION
    JWT Token → get_current_user()
                    │
                    ▼
[3] GEO RESOLUTION
    geo.py: city + country → lat, lng
                    │
                    ▼
[4] ASTROLOGY CALCULATION (Kerykeion)
    AstrologicalSubject → planets[], houses[], ascendant
    ChartDrawer → SVG string
                    │
                    ▼
[5] LLM GENERATION (Vertex AI Gemini)
    Init prompt → chart_text (Markdown luận giải)
                    │
           ┌────────┴────────┐
           ▼                 ▼
[6a] SAVE TO DB         [6b] RAG INGESTION (Background)
    chat_logs               chunk_text()
    chart_svg               embed_documents()
    chart_summary           save_document_chunks()
                    │
                    ▼
[7] USER ASKS FOLLOW-UP
    question (free text)
                    │
              ┌─────┴──────┐
              ▼            ▼
[8a] GUARD          [8b] ANALYZE INTENT
    is_astrology?        intents[], emotion, entities[]
              │
              ▼
[9] RAG RETRIEVAL
    embed_query() → cosine_sim → top 5
    rerank → final_score → top 3 chunks
                    │
                    ▼
[10] GRAPHRAG ENRICHMENT
    extract_entities() → BFS subgraph → graph_facts[]
                    │
                    ▼
[11] MULTI-AGENT (Parallel)
    spawn(intents) → [Career|Love|Health|Personality|Daily]
    run_agents() → ThreadPoolExecutor
                    │
                    ▼
[12] FUSION
    1 Agent → Direct answer
    2+ Agents → LLM Fusion → Unified Markdown
                    │
                    ▼
[13] RESPONSE
    {answer, chart, chart_svg, sources[], tokens_charged}
```

---

## 9. PROMPT ĐỀ NGHỊ CHO CHATGPT VẼ SƠ ĐỒ

### Prompt 1: Vẽ sơ đồ tổng quan (Architecture Diagram)

> Vẽ một sơ đồ kiến trúc hệ thống web app chiêm tinh gồm các thành phần:
> - Frontend (React/Vite/Vercel) kết nối qua REST API với Backend (FastAPI/Python)
> - Backend chứa: Router Layer → AISystem Orchestrator → Multi-Agent System (7 agents)
> - AISystem kết nối tới: Vertex AI LLM, SQLite Database, Neo4j Knowledge Graph
> - RAG Pipeline: Chunking → Embedding (Vertex AI) → SQLite → Retriever → Reranker
> - Kerykeion Library tính toán natal chart và sinh SVG
> - Dùng màu sắc để phân biệt: xanh = AI/LLM, tím = Database, cam = Frontend, xanh lá = External Services

### Prompt 2: Vẽ sequence diagram cho INIT flow

> Vẽ sequence diagram (UML) với các actor: User, Frontend, FastAPI, AISystem, AstrologyAgent, Kerykeion, VertexAI, SQLite, RAG Pipeline.
> Luồng:
> 1. User gửi form sinh → Frontend POST /chat
> 2. FastAPI tạo conversation_id → gọi AISystem.run(question=None)
> 3. AISystem gọi AstrologyAgent.run()
> 4. AstrologyAgent gọi Kerykeion → tính chart + SVG
> 5. AstrologyAgent gọi VertexAI LLM → sinh luận giải Markdown
> 6. FastAPI lưu vào SQLite
> 7. Background: RAG Pipeline chunk + embed + lưu SQLite
> 8. FastAPI trả response về Frontend

### Prompt 3: Vẽ sequence diagram cho FOLLOWUP (Chat) flow

> Vẽ sequence diagram với các actor: User, Frontend, FastAPI, GuardAgent, AnalyzeIntent, RAGPipeline, GraphRAG, MultiAgent(parallel), FusionLLM, SQLite.
> Luồng:
> 1. User gửi câu hỏi → POST /chat-followup
> 2. FastAPI chạy song song: GuardAgent + AnalyzeIntent
> 3. GuardAgent kiểm tra: is_astrology, confidence ≥ 0.8?
> 4. Nếu pass → RAGPipeline: embed query → cosine sim → rerank → top 3 chunks
> 5. GraphRAG: extract entities → BFS subgraph → graph_facts
> 6. Ghép rag_context + graph_facts vào final_question
> 7. spawn(intents) → Multi-Agent chạy song song
> 8. Nếu 1 agent → direct answer; nếu 2+ agents → FusionLLM
> 9. Lưu DB + trả response

### Prompt 4: Vẽ flowchart RAG Pipeline

> Vẽ flowchart chi tiết cho RAG Pipeline gồm 2 nhánh:
> **Nhánh 1 - Ingestion (khi INIT):**
> chart_text → MarkdownHeaderTextSplitter → RecursiveCharacterTextSplitter → Gán header context → VertexAI embed_documents() → SQLite save chunks
>
> **Nhánh 2 - Retrieval (khi FOLLOWUP):**
> user_question → embed_query() → cosine_similarity với tất cả chunks → Top 5 → Reranker (section boost + keyword boost + overlap ratio + exact match) → Top 3 → Inject vào Agent prompt

### Prompt 5: Vẽ sơ đồ Multi-Agent System

> Vẽ sơ đồ hệ thống multi-agent gồm:
> - Orchestrator (AISystem) ở giữa
> - Các agent xung quanh: GuardAgent, ValidatorAgent, AstrologyAgent, CareerAgent, LoveAgent, HealthAgent, PersonalityAgent, DailyAgent
> - Luồng: Input → GuardAgent → Orchestrator.analyze() → spawn() → [Agents chạy song song] → Fusion → Output
> - Mỗi agent có label: tên, domain, focus (ví dụ CareerAgent: House 2,6,10 + Jupiter/Saturn/Mars)

---

## 10. CẤU TRÚC THƯ MỤC

```
LuanVanTotNghiep/
├── app/                        # FastAPI Application
│   ├── main.py                 # Entry point, CORS, Router mount
│   ├── config.py               # Settings (env vars)
│   ├── models/                 # Database models (SQLite)
│   ├── routers/                # API endpoints
│   │   ├── chatbot.py          # /chat, /chat-followup
│   │   ├── auth.py             # /login, /register
│   │   ├── payment.py          # Token payment
│   │   ├── admin.py            # Admin panel
│   │   ├── calendar.py         # Astrology calendar
│   │   └── prediction.py       # Prediction features
│   ├── security/               # JWT authentication
│   └── utils/                  # App utilities
│
├── chatbot/                    # AI/ML Core
│   ├── core/
│   │   └── ai_system.py        # Orchestrator (AISystem class)
│   ├── services/               # Specialist Agents
│   │   ├── astrology_agent.py  # Main chart agent (Kerykeion)
│   │   ├── career_agent.py
│   │   ├── love_agent.py
│   │   ├── health_agent.py
│   │   ├── personality_agent.py
│   │   ├── daily_agent.py
│   │   ├── guard_agent.py      # Content filter
│   │   └── validator_agent.py  # Output formatter
│   ├── rag/                    # RAG Pipeline
│   │   ├── rag_pipeline.py     # Main pipeline functions
│   │   ├── chunking_service.py # Text splitting + Embedding
│   │   ├── retriever.py        # Cosine similarity search
│   │   ├── reranker.py         # Heuristic reranking
│   │   ├── knowledge_graph.py  # GraphRAG (NetworkX)
│   │   └── neo4j_knowledge_graph.py  # Neo4j implementation
│   └── utils/
│       ├── llm.py              # Vertex AI LLM wrapper
│       ├── geo.py              # Geocoding utility
│       └── text_cleaner.py     # Markdown normalizer
│
├── frontend/                   # React TypeScript App
│   ├── App.tsx                 # Main app + routing
│   ├── api.ts                  # API client (all endpoints)
│   ├── types.ts                # TypeScript types
│   └── components/             # UI Components
│
├── database.db                 # SQLite database
├── vector_store/               # Vector storage files
├── .env                        # Environment variables
└── requirements.txt            # Python dependencies
```

---

*Generated: 2026-05-14 | System: Zodiac Klam - Astrology AI Chatbot*
