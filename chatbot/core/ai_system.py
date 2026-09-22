import re
import json
import asyncio
import logging
import unicodedata
from typing import Dict, Any, List
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from chatbot.services.astrology_agent import AstrologyChatAgent
from chatbot.services.career_agent import CareerAgent
from chatbot.services.love_agent import LoveAgent
from chatbot.services.daily_agent import DailyAgent
from chatbot.services.health_agent import HealthAgent
from chatbot.services.personality_agent import PersonalityAgent
from chatbot.services.guard_agent import GuardAgent
from chatbot.services.validator_agent import ValidatorAgent
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.rag.knowledge_graph import get_astrology_kg, extract_astrology_entities, extract_astrology_entities_llm

AGENT_TITLES = {
    "career": "Định hướng Sự nghiệp",
    "love": "Nhịp đập Tình duyên",
    "health": "Năng lượng Sức khỏe",
    "personality": "Bản sắc Cá nhân",
    "daily": "Tử vi Hàng ngày",
    "astrology": "Luận giải Bản đồ sao"
}

AGENT_TITLES_EN = {
    "career": "Career Orientation",
    "love": "Love & Relationships",
    "health": "Health & Well-being",
    "personality": "Personality & Traits",
    "daily": "Daily Horoscope",
    "astrology": "Natal Chart Interpretation"
}

class AISystem:
    def __init__(
        self,
        llm,
        db,
        astrology_agent,
        career_agent,
        love_agent,
        daily_agent,
        personality_agent,
        health_agent
    ):
        self.llm = llm
        self.db = db
        self.guard = GuardAgent(llm)
        self.validator = ValidatorAgent(llm)

        # Tăng số lượng thread để tránh bị treo khi chạy nhiều agent song song
        self.executor = ThreadPoolExecutor(max_workers=50)

        # 🔮 astrology
        self.astrology = astrology_agent

        # 🤖 registry
        self.registry = {
            "career": career_agent,
            "love": love_agent,
            "daily": daily_agent,
            "personality": personality_agent,
            "health": health_agent
        }



    # =====================================================
    # 🧠 SEMANTIC ROUTER FOR CASUAL/SOCIAL QUERIES
    # =====================================================
    async def route_query(self, question: str, lang: str = "vi") -> Dict[str, Any] | None:
        """
        Phân loại câu hỏi bằng Semantic Router để xử lý nhanh các câu hỏi xã giao/đơn giản.
        Bypass toàn bộ RAG, GraphRAG và Multi-Agent pipeline nặng nếu câu hỏi là xã giao.
        """
        # 1. Luật heuristic nhanh trước
        import unicodedata
        def strip_accents(text):
            text = unicodedata.normalize("NFD", text)
            return "".join(ch for ch in text if unicodedata.category(ch) != "Mn").lower().replace("đ", "d").strip()
            
        q_clean = re.sub(r'[^\w\s]', '', question).strip()
        q_strip = strip_accents(q_clean)
        
        greetings = ["xin chao", "chao ban", "chao bot", "chao ai", "hello", "hi", "helo", "alo", "chao ad", "chao"]
        thanks = ["cam on", "thank", "thanks", "cam on ban", "cam on bot", "thank you", "tks", "ty"]
        farewells = ["tam biet", "bye", "goodbye", "hen gap lai", "off day", "di ngu day"]
        
        if q_strip in greetings:
            ans = "Hello! I am your Astrology Assistant. How can I help you explore your natal chart today?" if lang == "en" else "Xin chào! Tôi là trợ lý chiêm tinh của bạn. Hôm nay bạn muốn khám phá điều gì về bản đồ sao của mình?"
            return {"route": "greeting", "answer": ans}
        if q_strip in thanks:
            ans = "You're very welcome! If you have any other questions, feel free to ask." if lang == "en" else "Rất sẵn lòng giúp đỡ bạn! Nếu bạn có bất kỳ câu hỏi nào khác về bản đồ sao, hãy cứ hỏi tôi nhé."
        if q_strip in farewells:
            ans = "Goodbye! Have a wonderful day and see you next time!" if lang == "en" else "Tạm biệt bạn! Chúc bạn một ngày tốt lành và hẹn gặp lại lần sau!"
            return {"route": "farewell", "answer": ans}
            
        # 2. Phân loại bằng LLM gọn nhẹ
        prompt = f"""
        Bạn là Bộ định tuyến Ngữ nghĩa (Semantic Router) cho hệ thống Chatbot Chiêm tinh.
        Hãy phân loại câu hỏi sau của người dùng vào 1 trong các nhóm:
        - "casual": Chào hỏi, cảm ơn, tạm biệt hoặc trò chuyện xã giao chung chung (không chứa nội dung cần phân tích bản đồ sao/chiêm tinh).
        - "astrology": Câu hỏi thực sự cần tư vấn/luận giải chiêm tinh, bản đồ sao, tính cách, tình duyên, sự nghiệp, sức khỏe.
        
        CÂU HỎI: "{question}"
        
        Mẫu output JSON:
        {{
          "category": "casual" hoặc "astrology",
          "direct_response": "Câu trả lời thân thiện ngắn gọn tương ứng nếu là 'casual', ngược lại để trống"
        }}
        """
        try:
            res = await asyncio.to_thread(self.llm.invoke, prompt)
            content = res.content if hasattr(res, "content") else str(res)
            
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                category = data.get("category", "astrology")
                if category == "casual":
                    direct_response = data.get("direct_response")
                    if not direct_response:
                        direct_response = "Tôi có thể giúp gì cho bạn về chiêm tinh học hôm nay?"
                    return {"route": "casual", "answer": direct_response}
            return None
        except Exception as e:
            print(f"[SemanticRouter] Error: {e}")
            return None

    # =====================================================
    # 🧠 ALL-IN-ONE ANALYZER 
    # =====================================================
    def _normalize(self, text: str) -> str:
        text = (text or "").lower()
        text = unicodedata.normalize("NFD", text)
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        return text.replace("đ", "d")

    def _fast_analyze(self, question, memory, birth_info):
        q = self._normalize(question)
        intents = []

        keyword_map = {
            "career": [
                "su nghiep", "cong viec", "viec lam", "nghe", "tai chinh",
                "tien bac", "kinh doanh", "hoc nganh", "phong van"
            ],
            "love": [
                "tinh yeu", "tinh cam", "hon nhan", "nguoi yeu", "doi tac",
                "crush", "chia tay", "yeu", "hop voi"
            ],
            "health": [
                "suc khoe", "nang luong", "met moi", "ngu", "stress",
                "the luc", "thoi quen"
            ],
            "daily": [
                "hom nay", "ngay nay", "daily", "hien tai", "dao nay"
            ],
            "personality": [
                "tinh cach", "ban than", "diem manh", "diem yeu", "tam ly",
                "con nguoi", "phong cach", "noi tam"
            ],
        }

        for intent, keywords in keyword_map.items():
            if any(k in q for k in keywords):
                intents.append(intent)

        field = (birth_info or {}).get("field")
        if field in self.registry and not intents:
            intents.append(field)

        personal_markers = ["toi", "minh", "em", "anh", "chi", "tui", "ban than"]
        if not intents and any(k in q for k in personal_markers):
            intents.append("personality")

        if not intents:
            return None

        emotion = "trung tính"
        if any(k in q for k in ["lo", "lo lang", "stress", "cang thang", "so", "bat an"]):
            emotion = "lo âu"
        elif any(k in q for k in ["buon", "chan", "that vong", "co don"]):
            emotion = "buồn"
        elif any(k in q for k in ["vui", "hao hung", "hy vong"]):
            emotion = "vui"
        elif any(k in q for k in ["tai sao", "vi sao", "muon biet", "thac mac"]):
            emotion = "tò mò"

        entities = extract_astrology_entities(question)
        return list(dict.fromkeys(intents)), memory or {}, emotion, entities

    def analyze(self, question, memory, birth_info):
        fast_result = self._fast_analyze(question, memory, birth_info)
        if fast_result is not None:
            return fast_result

        prompt = f"""
Bạn là AI Điều phối viên Chiêm tinh. Hãy phân tích yêu cầu của người dùng.

DỮ LIỆU NGƯỜI DÙNG:
{json.dumps(birth_info, ensure_ascii=False)}

BỘ NHỚ (MEMORY):
{json.dumps(memory, ensure_ascii=False)}

CÂU HỎI: "{question}"

NHIỆM VỤ:
1. Xác định 'intents': Danh sách các lĩnh vực cần trả lời (chọn từ: career, love, daily, personality, health).
2. Trích xuất 'profile': Cập nhật thông tin mới về người dùng nếu có (tính cách, sở thích...).
3. Đánh giá 'emotion': Phân tích trạng thái cảm xúc của người dùng qua câu hỏi (ví dụ: vui vẻ, buồn bã, lo âu, tò mò, trung tính, bức xúc, v.v.).
4. Trích xuất 'entities': Tìm các từ khóa chiêm tinh liên quan (Cung hoàng đạo, Hành tinh, Nhà 1-12, Sự nghiệp, Tình duyên, Sức khỏe).

⚠️ OUTPUT: CHỈ TRẢ JSON, KHÔNG GIẢI THÍCH
========================
Format:
{{
  "intents": ["intent1", "intent2"],
  "profile": {{ "traits": [], "focus": [] }},
  "emotion": "tò mò",
  "entities": ["Xử Nữ", "Sự nghiệp"]
}}
"""

        try:
            res = self.llm.invoke(prompt)
            content = res.content if hasattr(res, "content") else str(res)
            
            # Robust JSON extraction
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
            else:
                # Fallback nếu không thấy JSON
                data = {"intents": [], "profile": {}}

            intents = data.get("intents", [])
            profile = data.get("profile", {})
            emotion = data.get("emotion", "trung tính")
            entities = data.get("entities", [])
            
            # Lọc sạch intents ngay lập tức
            valid_intents = [i for i in intents if i in self.registry]
            
            # Trả về mặc định nếu rỗng
            final_intents = valid_intents if valid_intents else ["personality"]
            return final_intents, profile or memory, emotion, entities

        except Exception as e:
            print(f"[Orchestrator] ⚠️ Lỗi phân tích Intent: {e}")
            return ["personality"], memory, "trung tính", []

    # =====================================================
    # 🚀 SPAWN
    # =====================================================
    def spawn(self, intents):
        print(f"\n[Orchestrator] 🔮 Khởi tạo các Agent chuyên biệt cho: {intents}")
        return [self.registry[i] for i in intents if i in self.registry]

    # =====================================================
    # ⚡ RUN PARALLEL
    # =====================================================
    async def run_agents(self, agents, input_data):
        print(f"[Orchestrator] ⚡ Đang chạy song song {len(agents)} Agent...")
        
        # --- GRAPH RAG INTEGRATION (OPTIMIZED) ---
        question = input_data.get("question", "")
        entities = input_data.get("entities", [])
        
        # Kết hợp thêm keyword entities để chắc chắn
        keyword_entities = extract_astrology_entities(question)
        final_entities = list(set(entities + keyword_entities))
        
        kg = get_astrology_kg()
        graph_facts = kg.extract_subgraph(final_entities, max_depth=2)
        
        if graph_facts:
            facts_str = "\n".join(graph_facts)
            print(f"[GraphRAG] Da tim thay {len(graph_facts)} su kien logic tu Knowledge Graph.")
            input_data["question"] = question + f"\n\n[KIẾN THỨC CHIÊM TINH HỆ THỐNG CUNG CẤP TỪ KNOWLEDGE GRAPH]:\n{facts_str}\n\nHãy ĐỌC KỸ và ÁP DỤNG MỘT CÁCH KHÉO LÉO các chuỗi logic từ Knowledge Graph này vào phần phân tích của bạn để đưa ra những lời khuyên chính xác, học thuật nhất."
        else:
            print(f"[GraphRAG] Khong tim thay thuc the chiem tinh trong cau hoi.")
        # -----------------------------
        # -----------------------------

        loop = asyncio.get_event_loop()
        tasks = [loop.run_in_executor(self.executor, lambda a=agent: a.run(input_data)) for agent in agents]
        results = await asyncio.gather(*tasks)
        print(f"[Orchestrator] ✅ Tất cả các Agent đã hoàn thành.\n")
        return results

    # =====================================================
    # 🧠 FUSION (LLM)
    # =====================================================
    def fuse(self, results, question, lang="vi"):
        # Thu thập câu trả lời từ các agent kèm theo loại agent
        context_data = []
        for r in results:
            if isinstance(r, dict) and r.get("answer"):
                context_data.append({
                    "type": r.get("type", "chung"),
                    "content": r.get("answer")
                })
        
        if not context_data: 
            return "I couldn't find any relevant information." if lang == "en" else "Tôi chưa tìm thấy thông tin phù hợp cho câu hỏi này."

        if lang == "en":
            prompt = f"""
You are a Senior Astrology Editor AI. Please synthesize the following analyses into a professionally structured, elegant, and easy-to-read report.

USER QUESTION: "{question}"

DATA FROM EXPERTS:
{json.dumps(context_data, ensure_ascii=False, indent=2)}

FORMATTING REQUIREMENTS (MANDATORY FOR RAG CHUNKING ACCURACY):
1. **Section Headings**: MANDATORY to use Markdown Heading 2 (##) for main sections and Heading 3 (###) for subsections (e.g. ## Career Vision, ### 1. Motivation and Opportunities).
   - Absolutely DO NOT use standard bold (**text**) or free list numbers (1. text) as section headings. Use `##` or `###` at the beginning of the line.
   - Absolutely do not use icons in headings.
2. **Presentation**: Use flexible Markdown (bullet lists, bold, blockquotes) below headings to highlight main points. Do not just write long paragraphs.
3. **Smoothness**: Write transition and connection sentences between sections so the report is a unified whole, not disjointed pieces.
4. **Tone**: Professional, inspiring, and deep.

ANSWER (MARKDOWN IN ENGLISH):
"""
        else:
            prompt = f"""
Bạn là AI Biên tập viên Chiêm tinh Cao cấp. Hãy tổng hợp các phân tích sau đây thành một bản luận giải có cấu trúc chuyên nghiệp, sang trọng và dễ đọc.

CÂU HỎI CỦA NGƯỜI DÙNG: "{question}"

DỮ LIỆU TỪ CÁC CHUYÊN GIA:
{json.dumps(context_data, ensure_ascii=False, indent=2)}

YÊU CẦU ĐỊNH DẠNG (BẮT BUỘC ĐỂ HỆ THỐNG RAG CHIA CHUNK CHÍNH XÁC):
1. **Tiêu đề Phân đoạn**: BẮT BUỘC phải sử dụng thẻ Markdown Heading 2 (##) cho các phần chính và Heading 3 (###) cho các mục con (Ví dụ: ## Tầm nhìn Sự nghiệp, ### 1. Động lực và Cơ hội). 
   - Tuyệt đối KHÔNG sử dụng chữ in đậm thông thường (**text**) hay danh sách số tự do (1. text) để làm tiêu đề phân đoạn. Phải dùng `##` hoặc `###` ở đầu dòng.
   - Tuyệt đối không sử dụng icon trong tiêu đề.
2. **Trình bày**: Sử dụng Markdown linh hoạt (danh sách bullet, in đậm, trích dẫn) bên dưới các tiêu đề để làm nổi bật các ý chính. Đừng chỉ viết các đoạn văn dài.
3. **Mượt mà**: Viết các câu dẫn dắt và kết nối giữa các phần để bài viết là một chỉnh thể thống nhất, không phải là các mảnh ghép rời rạc.
4. **Văn phong**: Chuyên nghiệp, truyền cảm hứng và sâu sắc.

TRẢ LỜI (MARKDOWN):
"""
        print(f"[Orchestrator] 🧠 Đang tổng hợp và biên tập nội dung...")
        res = self.llm.invoke(prompt)
        content = res.content if hasattr(res, "content") else str(res)
        return normalize_markdown(content)

    # =====================================================
    # 🚀 MAIN RUN
    # =====================================================
    async def run(self, question, birth_info):
        from datetime import datetime
        current_date = datetime.now().strftime("%d/%m/%Y")
        user_id = birth_info.get("user_id", 1)
        
        local_db = None
        try:
            # 🔥 SỬ DỤNG DB RIÊNG CHO MỖI REQUEST ĐỂ TRÁNH TRANH CHẤP THREAD
            from app.models.base_db import UserDB
            local_db = await asyncio.to_thread(UserDB)
            
            await asyncio.to_thread(local_db.reconnect)
            memory = await asyncio.to_thread(local_db.get_user_memory, user_id) or {}

            # 1. Detect Mode
            print(f"[Orchestrator] 🚀 Đang xử lý câu hỏi: {(question or '')[:50]}...")
            is_init = not question or not question.strip()

            # 2. XỬ LÝ NHANH NẾU LÀ INIT
            if is_init:
                astro_res = await asyncio.to_thread(self.astrology.run, {
                    "birth_info": birth_info, 
                    "question": "",
                    "field": birth_info.get("field", "general")
                })
                return {
                    "mode": "init", 
                    "chart": astro_res.get("chart"), 
                    "chart_svg": astro_res.get("chart_svg"),
                    "chart_summary": astro_res.get("chart_summary"),
                    "answer": ""
                }

            # 3. CHẾ ĐỘ CHAT: CHẠY SONG SONG CÁC TÁC VỤ KIỂM TRA VÀ PHÂN TÍCH
            print("[Orchestrator] ⚡ Đang chạy song song Guard, Analyze và AstrologyTask...")
            guard_task = asyncio.to_thread(self.guard.run, question)
            analyze_task = asyncio.to_thread(self.analyze, question, memory, birth_info)
            astro_task = asyncio.to_thread(self.astrology.run, {
                "birth_info": birth_info, 
                "question": question,
                "field": birth_info.get("field", "general")
            })

            # Chờ cả 3 tác vụ hoàn thành song song
            guard, (intents, profile, emotion, entities), astro_res = await asyncio.gather(
                guard_task, analyze_task, astro_task
            )

            lang = birth_info.get("language", "vi")

            # Kiểm tra Guard sau khi đã có kết quả
            if not guard.get("is_astrology") or guard.get("confidence", 0) < 0.6:
                print("[Orchestrator] 🛑 Câu hỏi bị từ chối bởi Guard.")
                guard_msg = "SORRY, I AM JUST AN ASTROLOGY CHATBOT" if lang == "en" else "XIN LỖI TÔI CHỈ LÀ CHATBOT CHIÊM TINH"
                return {"mode": "chat", "answer": guard_msg}

            print(f"[Orchestrator] ✅ Intents: {intents}, Emotion: {emotion}")

            # Cập nhật bộ nhớ
            await asyncio.to_thread(local_db.reconnect)
            await asyncio.to_thread(local_db.update_user_memory, user_id, profile)

            # 5. CHẾ ĐỘ CHAT: CHẠY AGENTS CHUYÊN GIA
            agents = self.spawn(intents)
            agent_results = await self.run_agents(agents, {
                "question": question, 
                "birth_info": birth_info, 
                "current_date": current_date, 
                "memory": memory, 
                "emotion": emotion,
                "entities": entities,
                "raw_chart_data": astro_res.get("raw_chart_data") if isinstance(astro_res, dict) else None
            })
            
            # 🔥 QUAN TRỌNG: Gộp kết quả từ AstrologyAgent vào danh sách kết quả
            # Nếu AstrologyAgent có câu trả lời (ở chế độ Chat), ta phải đưa nó vào để hiển thị
            if astro_res and isinstance(astro_res, dict) and astro_res.get("answer"):
                agent_results.append(astro_res)
            
            # 🔥 TỐI ƯU TỐC ĐỘ:
            # Nếu chỉ có 1 agent, không cần gọi thêm LLM Fusion để tiết kiệm thời gian.
            # Chúng ta sẽ tự thêm tiêu đề theo đúng format yêu cầu.
            if len(agent_results) == 1 and isinstance(agent_results[0], dict):
                res = agent_results[0]
                ans = res.get("answer", "")
                
                # Chỉ thêm tiêu đề nếu nó chưa có tiêu đề H1/H2/H3
                if ans and not ans.strip().startswith("#"):
                    title_map = AGENT_TITLES_EN if lang == "en" else AGENT_TITLES
                    title = title_map.get(res.get("type", "general"), "Astrology Interpretation" if lang == "en" else "Luận giải Chiêm tinh")
                    final_answer = f"### {title}\n\n{ans}"
                else:
                    final_answer = ans
            else:
                # Chỉ dùng Fusion khi có từ 2 agent trở lên để đảm bảo sự kết nối mượt mà
                final_answer = await asyncio.to_thread(self.fuse, agent_results, question, lang=lang)

            return {
                "mode": "chat",
                "chart": astro_res.get("chart") or astro_res.get("interpretation", ""), 
                "chart_svg": astro_res.get("chart_svg"),
                "chart_summary": astro_res.get("chart_summary"),
                "answer": final_answer
            }
        finally:
            if local_db is not None:
                local_db.close()
