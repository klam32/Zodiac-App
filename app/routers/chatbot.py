from chatbot.utils.response_cleaner import clean_text
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.security.security import get_current_user
from chatbot.utils.llm import LLM
from chatbot.utils.token_counter import TokenCounter
from app.models.base_db import UserDB
from app.models.base_db import BaseDB
from chatbot.core.ai_system import AISystem
from chatbot.services.astrology_agent import AstrologyChatAgent
from chatbot.services.career_agent import CareerAgent
from chatbot.services.love_agent import LoveAgent
from chatbot.services.daily_agent import DailyAgent
from chatbot.services.health_agent import HealthAgent
from chatbot.services.personality_agent import PersonalityAgent
import os
import re
import json
import asyncio

router = APIRouter(tags=["Chatbot"])


def generate_conversation_title(name, field):

    try:

        if field:
            return f"{field} - {name}"

        return f"Luận giải {name}"

    except:
        return "Luận giải mới"


# =========================
# GLOBAL LLM
# =========================

llm_name = os.environ.get("LLM_NAME", "vertex")
llm = LLM().get_llm(llm_name)
db= BaseDB()
# 🔥 MULTI AGENT
ai_system = AISystem(
    llm=llm,
    db=db,
    astrology_agent=AstrologyChatAgent(llm),
    career_agent=CareerAgent(llm),
    love_agent=LoveAgent(llm),
    daily_agent=DailyAgent(llm),
    personality_agent=PersonalityAgent(llm),
    health_agent=HealthAgent(llm)
)

FIELD_LABELS = {
    "general": "Tổng quan",
    "astrology": "Tổng quan",
    "personality": "Tính cách",
    "love": "Tình duyên",
    "career": "Sự nghiệp",
    "health": "Sức khỏe"
}

RAG_BUILDING_CONVERSATIONS: set[int] = set()


def assert_conversation_owner(user_db: UserDB, conversation_id: int, user_id: int):
    conv = user_db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại")
    if conv["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return conv


def compact_chart_summary(chart_summary) -> str:
    if not chart_summary:
        return ""

    if isinstance(chart_summary, str):
        try:
            chart_summary = json.loads(chart_summary)
        except Exception:
            return chart_summary

    if not isinstance(chart_summary, dict):
        return str(chart_summary)

    lines = ["# Dữ liệu bản đồ sao cốt lõi"]

    if chart_summary.get("user") or chart_summary.get("partner"):
        for label_name, key in (("User", "user"), ("Partner", "partner")):
            person_chart = chart_summary.get(key)
            if isinstance(person_chart, dict):
                lines.append(f"## {label_name}")
                for planet, sign in person_chart.items():
                    lines.append(f"- {planet}: {sign}")
        if chart_summary.get("compatibility") is not None:
            lines.append(f"- Compatibility: {chart_summary.get('compatibility')}%")
        if chart_summary.get("label"):
            lines.append(f"- Label: {chart_summary.get('label')}")
        return "\n".join(lines)
    if chart_summary.get("sun"):
        lines.append(f"- Mặt Trời: {chart_summary.get('sun')}")
    if chart_summary.get("moon"):
        lines.append(f"- Mặt Trăng: {chart_summary.get('moon')}")
    if chart_summary.get("ascendant"):
        lines.append(f"- Cung Mọc: {chart_summary.get('ascendant')}")

    planets = chart_summary.get("planets") or []
    if planets:
        lines.append("## Vị trí hành tinh")
        for planet in planets:
            if isinstance(planet, dict):
                name = planet.get("name")
                sign = planet.get("sign")
                house = planet.get("house")
                lines.append(f"- {name}: {sign} (Nhà {house})")

    return "\n".join(lines)


def build_rag_seed_text(
    chart_text: str | None,
    chart_summary=None,
    partner_json=None,
    compatibility=None,
    label=None
) -> str:
    parts = []

    summary_text = compact_chart_summary(chart_summary)
    if summary_text:
        parts.append(summary_text)

    if partner_json:
        parts.append(
            "## Dữ liệu đối tác\n"
            + json.dumps(partner_json, ensure_ascii=False, indent=2)
        )

    if label or (compatibility not in (None, 0)):
        parts.append(
            "## Điểm tương hợp\n"
            f"- Phần trăm: {compatibility if compatibility is not None else 'N/A'}\n"
            f"- Nhãn: {label or 'N/A'}"
        )

    if chart_text:
        parts.append("## Luận giải ban đầu\n" + clean_text(chart_text))

    return "\n\n".join(part for part in parts if part and part.strip()).strip()


def find_initial_chart_log(logs: list[dict]):
    for log in logs:
        if log.get("chart") or log.get("chart_summary") or log.get("chart_svg"):
            return log
    return logs[0] if logs else None


async def ensure_initial_rag_chunks(
    conversation_id: int,
    user_id: int,
    section_name: str,
    logs: list[dict],
    user_db: UserDB
) -> None:
    existing_chunks = await asyncio.to_thread(user_db.get_document_chunks, conversation_id)
    if existing_chunks:
        return

    init_log = find_initial_chart_log(logs)
    if not init_log:
        return

    partner_json = None
    if init_log.get("partner_json"):
        try:
            partner_json = json.loads(init_log["partner_json"])
        except Exception:
            partner_json = None

    seed_text = build_rag_seed_text(
        init_log.get("chart"),
        init_log.get("chart_summary"),
        partner_json,
        init_log.get("compatibility"),
        init_log.get("label")
    )

    if len(seed_text.strip()) < 50:
        return

    from chatbot.rag.rag_pipeline import pipeline_process_and_store
    await pipeline_process_and_store(
        conversation_id,
        user_id,
        section_name,
        seed_text,
        user_db
    )

# =========================
# AI AUTO TITLE
# =========================

def generate_ai_title(text):

    try:
        if not text:
            return "Luận giải mới"

        text = text.strip()

        # bỏ thông tin rác
        text = re.sub(r"Họ tên:.*?\|", "", text)
        text = re.sub(r"Ngày sinh:.*?\|", "", text)
        text = re.sub(r"Nơi sinh:.*?\|", "", text)

        text = text.replace("|", "").strip()

        # lấy câu đầu
        text = text.split(".")[0]

        words = text.split()

        if len(words) > 8:
            text = " ".join(words[:8]) + "..."

        return text

    except:
        return "Luận giải mới"

# =========================
# REQUEST MODELS
# =========================

class AstrologyRequest(BaseModel):
    conversation_id: int | None = None
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    city: str
    country: str = "VN"
    field: str
    context: str
    partner: dict | None = None 
    language: str | None = "vi"


class FollowupRequest(BaseModel):
    conversation_id: int
    field: str
    question: str | None = None
    language: str | None = "vi"


class TitleUpdateRequest(BaseModel):
    title: str


class PinUpdateRequest(BaseModel):
    is_pinned: bool


class ChatResponse(BaseModel):
    answer: str
    tokens_charged: float
    user_token_balance: float
    chart_summary: dict | None = None
    chart_svg: str | None = None
    conversation_id: int
    compatibility: int | None = None
    label: str | None = None
    partner_chart_svg: str | None = None
    chart: str | None = None
    sources: list | None = None


# ============================================
# CREATE NEW CHAT
# ============================================

@router.post("/conversations")
async def create_conversation(current_user: dict = Depends(get_current_user)):

    db = UserDB()

    conv_id = db.create_conversation(current_user["id"])

    db.close()

    return {"conversation_id": conv_id}


# ============================================
# GET USER CONVERSATIONS
# ============================================

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):

    db = UserDB()

    rows = db.get_user_conversations(current_user["id"])

    db.close()

    for r in rows:
        if not r.get("title") or r["title"].lower() == "mới":
            r["title"] = "Đoạn chat mới"

    return {"conversations": rows}


# ============================================
# DELETE CONVERSATION
# ============================================

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):

    db = UserDB()

    try:

        db.delete_conversation(
            current_user["id"],
            conversation_id
        )

        return {"message": "Conversation deleted"}

    finally:

        db.close()


# ============================================
# UPDATE CONVERSATION TITLE
# ============================================

@router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: int,
    request: TitleUpdateRequest,
    current_user: dict = Depends(get_current_user)
):

    db = UserDB()

    try:
        # Kiểm tra xem conversation có thuộc về user không
        conv = db.get_conversation(conversation_id)
        if not conv or conv["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")

        db.update_conversation_title(conversation_id, request.title)

        return {"message": "Title updated"}

    finally:
        db.close()


# ============================================
# TOGGLE PIN CONVERSATION
# ============================================

@router.put("/conversations/{conversation_id}/pin")
async def toggle_pin_conversation(
    conversation_id: int,
    request: PinUpdateRequest,
    current_user: dict = Depends(get_current_user)
):

    db = UserDB()

    try:
        # Kiểm tra xem conversation có thuộc về user không
        conv = db.get_conversation(conversation_id)
        if not conv or conv["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")

        db.update_conversation_pin(conversation_id, request.is_pinned)

        return {"message": "Pin status updated"}

    finally:
        db.close()

# ============================================
# CHAT
# ============================================

@router.post("/chat", response_model=ChatResponse)
async def chat_with_astrology(
    request: AstrologyRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):

    token_counter = TokenCounter()
    user_db = UserDB()

    try:

        conversation_id = request.conversation_id

        if not conversation_id:
            conversation_id = await asyncio.to_thread(
                user_db.create_conversation,
                current_user["id"],
                "Đoạn chat mới"
            )
        else:
            assert_conversation_owner(user_db, conversation_id, current_user["id"])

        # 🔥 CHỈ DÙNG ASTROLOGY AGENT
        is_init = (
            not request.context or
            request.context.strip() == "" or
            request.context == "Tổng quan vận mệnh" or
            "So sánh tình cảm giữa" in request.context
        )
        is_love = request.partner is not None
    
        if is_init and is_love:
            # 💘 FORCE LOVE AGENT
            result = await asyncio.to_thread(ai_system.registry["love"].run, {
                "birth_info": {
                    "name": request.name,
                    "year": request.year,
                    "month": request.month,
                    "day": request.day,
                    "hour": request.hour,
                    "minute": request.minute,
                    "city": request.city,
                    "country": request.country,
                    "partner": request.partner,
                    "language": request.language or "vi"
                },
                "question": None   # 🔥 QUAN TRỌNG
            })

            # LOVE INIT = dùng interpretation làm CHART
            chart_raw = result.get("interpretation", "")
            result["chart"] = chart_raw
            result["answer"] = ""   # không cần right panel

        else:
            # 🔮 NORMAL FLOW
            result = await ai_system.run(
                question=None if is_init else request.context,
                birth_info={
                    "user_id": current_user["id"],
                    "name": request.name,
                    "year": request.year,
                    "month": request.month,
                    "day": request.day,
                    "hour": request.hour,
                    "minute": request.minute,
                    "city": request.city,
                    "country": request.country,
                    "partner": request.partner,
                    "field": request.field,
                    "language": request.language or "vi"
                }
            )
        chart_summary = None
        chart_svg = None
        partner_chart_svg = None
        compatibility = None
        label = None
        raw_data = None
        chart_summary_dict: dict | None = None

        if isinstance(result, dict):
            answer = result.get("answer", "")
            raw_data = result.get("raw_chart_data")

            # PHẢI LẤY TRƯỚC
            chart_svg = result.get("chart_svg")
            chart_summary = result.get("chart_summary")
            if chart_summary:
                if isinstance(chart_summary, str):
                    try:
                        chart_summary_dict = json.loads(chart_summary)
                    except:
                        chart_summary_dict = {}
                elif isinstance(chart_summary, dict):
                    chart_summary_dict = chart_summary
            partner_chart_svg = result.get("partner_chart_svg")
            compatibility = result.get("compatibility") or 0
            label = result.get("label")

            chart = result.get("chart") or ""

            # FIX INIT KHÔNG CÓ TEXT
            if not chart and chart_summary_dict:
                chart = f"""
        🔮 Tổng quan bản đồ sao:

        - ☀️ Mặt trời: {chart_summary_dict.get('sun', '')}
        - 🌙 Mặt trăng: {chart_summary_dict.get('moon', '')}
        - ⬆️ Cung mọc: {chart_summary_dict.get('ascendant', '')}

        👉 Hãy đặt câu hỏi để AI phân tích sâu hơn.
        """
            # print("CHART:", chart)
            # print("SUMMARY:", chart_summary)

            chart = clean_text(chart)

            # FIX: không xoá answer nếu không có context
            if not request.context:
                answer = answer or ""

            chart_svg = result.get("chart_svg")
            chart_summary = result.get("chart_summary")
            partner_chart_svg = result.get("partner_chart_svg")
            compatibility = result.get("compatibility") or 0
            label = result.get("label")

        else:
            answer = str(result)
            chart = ""

        # =========================
        # FIX CHART (QUAN TRỌNG)
        # =========================
        if not chart:
            if chart_summary:
                chart = json.dumps(chart_summary, ensure_ascii=False)
            else:
                chart = "Bản đồ sao đã được tạo. Hãy đặt câu hỏi để phân tích sâu hơn."

        # =========================
        # TOKEN
        # =========================
        input_text = f"{request.name} {request.field} {request.context}"
        tokens_in = token_counter.count_tokens(input_text)

        # FIX: ưu tiên chart
        generation = answer or chart or ""

        tokens_out = token_counter.count_tokens(generation)
        total_tokens = tokens_in + tokens_out
        cost = token_counter.calculate_cost(total_tokens)

        # 🛑 KHÔNG TRỪ ĐIỂM NẾU CÂU HỎI BỊ TỪ CHỐI
        rejection_msg = "XIN LỖI TÔI CHỈ LÀ CHATBOT CHIÊM TINH"
        if rejection_msg in (answer or ""):
            cost = 0

        # Lấy thông tin user trực tiếp từ current_user (đã được xác thực qua JWT + DB)
        user_id = current_user["id"]
        email = current_user["email"]
        current_balance = float(current_user.get("token_balance", 0.0))

        if current_user.get("is_admin") or cost == 0:
            new_balance = current_balance
        else:
            # Chỉ gọi trừ điểm khi thực sự cần thiết
            new_balance = await asyncio.to_thread(
                token_counter.deduct_tokens,
                email=email,
                tokens=cost,
                description=f"AI: {request.field}"
            )
            if new_balance is None:
                new_balance = current_balance
        
        # 🔥 ĐẢM BẢO CUỐI CÙNG
        if new_balance == 0 and current_balance > 0 and cost == 0:
            new_balance = current_balance

        print(f"DEBUG TOKEN: cost={cost} | current={current_balance} | new={new_balance} | user_id={user_id}")

        full_question = f"""
        Họ tên: {request.name} |
        Ngày sinh: {request.day}/{request.month}/{request.year} {request.hour}:{request.minute} |
        Nơi sinh: {request.city} |
        Partner: {json.dumps(request.partner, ensure_ascii=False) if request.partner else "None"}
        """

        # =========================
        # FIX SAVE DB
        # =========================
        chart = clean_text(chart)
        chart_to_save = chart if isinstance(chart, str) else (
            json.dumps(chart_summary, ensure_ascii=False) if chart_summary else "No chart"
        )
        if isinstance(chart_to_save, str):
            chart_to_save = chart_to_save.strip('"')

        answer_to_save = answer or ""

        await asyncio.to_thread(
            user_db.save_chat_log,
            user_id,
            conversation_id,
            full_question,
            answer_to_save,
            cost,
            chart_to_save,
            chart_summary,
            chart_svg,
            partner_chart_svg,
            compatibility,
            label,
            request.partner,
            raw_data=raw_data
        )
        
        # =========================
        # 🧠 RAG CHUNKING
        # =========================
        if is_init:
            try:
                from chatbot.rag.rag_pipeline import pipeline_process_and_store
                field_label = FIELD_LABELS.get(request.field, "Tổng quan")
                rag_seed_text = build_rag_seed_text(
                    chart_to_save,
                    chart_summary,
                    request.partner,
                    compatibility,
                    label
                )
                async def run_rag_background(conv_id, u_id, label, text):
                    db_bg = UserDB()
                    try:
                        await pipeline_process_and_store(conv_id, u_id, label, text, db_bg)
                    finally:
                        db_bg.close()

                # 🔥 TỐI ƯU: Chạy ngầm việc lưu trữ chunk để phản hồi nhanh hơn
                background_tasks.add_task(run_rag_background, conversation_id, user_id, field_label, rag_seed_text)
            except Exception as e:
                print(f"[RAG Error] {e}")

        # =========================
        # AUTO UPDATE TITLE (FIX CHUẨN)
        # =========================
        try:
            conv = user_db.get_conversation(conversation_id)

            if conv:
                field_label = FIELD_LABELS.get(request.field, "Luận giải")
                
                # 🔥 CHỈ ĐỔI TÊN KHI LÀ LẦN ĐẦU (INIT)
                if is_init:
                    new_title = f"{field_label} - {request.name}"

                    await asyncio.to_thread(
                        user_db.update_conversation_title,
                        conversation_id,
                        new_title
                    )

        except Exception as e:
            print("Auto title error:", e)
        # =========================
        # RESPONSE (FINAL BALANCE FETCH)
        # =========================
        # 🔥 ĐẢM BẢO LẤY SỐ DƯ MỚI NHẤT TRỰC TIẾP TỪ DB TRƯỚC KHI TRẢ VỀ
        final_user = await asyncio.to_thread(user_db.get_by_email, email)
        final_balance = float(final_user.get("token_balance", 0.0) if final_user else new_balance)

        print(f"DEBUG FINAL: user_id={user_id} | email={email} | cost={cost} | final_balance={final_balance}")

        return ChatResponse(
            answer=answer_to_save,
            chart=chart_to_save,
            chart_summary=chart_summary_dict,
            chart_svg=chart_svg,
            partner_chart_svg=partner_chart_svg,
            compatibility=compatibility,
            label=label,
            conversation_id=conversation_id,
            tokens_charged=float(cost),
            user_token_balance=final_balance,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if token_counter is not None: token_counter.close()
        if user_db is not None: user_db.close()
    

# ============================================
# CHAT FOLLOWUP
# ============================================

@router.post("/chat-followup")
async def chat_followup(
    request: FollowupRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):

    token_counter = TokenCounter()
    user_db = UserDB()

    try:

        question = (request.question or "").strip() or "Phân tích thêm"
        assert_conversation_owner(user_db, request.conversation_id, current_user["id"])
        logs = user_db.get_user_chat_logs(request.conversation_id)

        if not logs:
            raise HTTPException(
                status_code=400,
                detail="Conversation không tồn tại"
            )

        first_question = logs[0]["question"]
        init_log = find_initial_chart_log(logs)

        # ================= PARSE USER =================
        name_match = re.search(r"Họ tên:\s*(.*?)\s*\|", first_question)
        date_match = re.search(
            r"Ngày sinh:\s*(\d+)/(\d+)/(\d+)\s*(\d+):(\d+)",
            first_question
        )
        city_match = re.search(r"Nơi sinh:\s*(.*?)\s*\|", first_question)
        partner_match = re.search(r"Partner:\s*(\{.*\}|None)", first_question)

        partner_data = None
        if partner_match and partner_match.group(1) != "None":
            try:
                partner_data = json.loads(partner_match.group(1))
            except:
                partner_data = None

        birth_info = {
            "user_id": current_user["id"],
            "name": name_match.group(1) if name_match else "Người dùng",
            "day": int(date_match.group(1)) if date_match else 1,
            "month": int(date_match.group(2)) if date_match else 1,
            "year": int(date_match.group(3)) if date_match else 2000,
            "hour": int(date_match.group(4)) if date_match else 0,
            "minute": int(date_match.group(5)) if date_match else 0,
            "city": city_match.group(1) if city_match else "Hanoi",
            "country": "VN",
            "partner": partner_data,
            "language": request.language or "vi"
        }
        # Fetch memory here
        memory = user_db.get_user_memory(current_user["id"]) or {}

        # ================= 🔥 LOAD CONTEXT FROM LOGS =================
        last_analysis = clean_text(init_log.get("chart")) if init_log and init_log.get("chart") else ""
        last_chart_svg = init_log.get("chart_svg") if init_log else None
        last_partner_chart_svg = init_log.get("partner_chart_svg") if init_log else None
        last_raw_data = None
        partner_json_data = None

        for log in reversed(logs):
            if not last_chart_svg and log.get("chart_svg"):
                last_analysis = clean_text(log.get("chart"))
                last_chart_svg = log.get("chart_svg")
                last_partner_chart_svg = log.get("partner_chart_svg")
            
            if not last_raw_data and log.get("raw_data"):
                try:
                    last_raw_data = json.loads(log["raw_data"])
                except:
                    last_raw_data = log.get("raw_data")
            
            if not partner_json_data and log.get("partner_json"):
                try:
                    partner_json_data = json.loads(log["partner_json"])
                except: pass

        birth_info["partner"] = partner_json_data or partner_data
        raw_chart_data = last_raw_data or (compact_chart_summary(init_log.get("chart_summary")) if init_log else "")
        if isinstance(raw_chart_data, (dict, list)):
            raw_chart_data = json.dumps(raw_chart_data, ensure_ascii=False)

        # =========================================
        # 🔮 1. GUARD & ANALYZE (RUN PARALLEL)
        # =========================================
        print(f"[API] 🚀 Đang xử lý Followup cho conversation {request.conversation_id}...")
        guard_task = asyncio.to_thread(ai_system.guard.run, question)
        analyze_task = asyncio.to_thread(ai_system.analyze, question, memory, birth_info)

        guard, (intents, _, emotion, entities) = await asyncio.gather(guard_task, analyze_task)
        print(f"[API] ✅ Analyze xong: {intents}, Emotion: {emotion}")

        # 🛑 GUARD CHECK
        rejection_msg = "XIN LỖI TÔI CHỈ LÀ CHATBOT CHIÊM TINH"
        if not guard.get("is_astrology") or guard.get("confidence", 0) < 0.8:
            # Lấy số dư hiện tại để trả về đúng thay vì 0
            email = current_user.get("email")
            user_fresh = await asyncio.to_thread(user_db.get_by_email, email)
            current_balance = float(user_fresh.get("token_balance", 0.0) if user_fresh else current_user.get("token_balance", 0.0))
            
            return {
                "answer": rejection_msg,
                "analysis": "",
                "chart": "",
                "chart_svg": None,
                "partner_chart_svg": None,
                "chart_summary": None,
                "tokens_charged": 0,
                "user_token_balance": current_balance,
                "conversation_id": request.conversation_id,
            }

        analysis = last_analysis
        chart_svg = last_chart_svg
        partner_chart_svg = last_partner_chart_svg

        # =========================================
        # 🤖 2. MULTI-AGENT (RUN PARALLEL)
        # =========================================
        agents = ai_system.spawn(intents)
        
        from datetime import datetime
        current_date = datetime.now().strftime("%d/%m/%Y")

        # =========================================
        # 🧠 HYBRID RAG RETRIEVAL & ANSWER (FOLLOW-UP)
        # =========================================
        from chatbot.rag.rag_pipeline import answer_followup_with_hybrid_rag, pipeline_process_and_store
        
        # Seed chunks if not existing
        try:
            field_label = FIELD_LABELS.get(request.field, "Tổng quan")
            existing_chunks = await asyncio.to_thread(user_db.get_document_chunks, request.conversation_id)
            if not existing_chunks and init_log:
                seed_text = build_rag_seed_text(
                    init_log.get("chart"),
                    init_log.get("chart_summary"),
                    partner_json_data or partner_data,
                    init_log.get("compatibility"),
                    init_log.get("label")
                )
                if len(seed_text.strip()) >= 50:
                    await pipeline_process_and_store(request.conversation_id, current_user["id"], field_label, seed_text, user_db)
        except Exception as e:
            print(f"[RAG Seed Error] {e}")

        # Call Hybrid RAG
        has_rag = True
        answer = ""
        source_used = "NONE"
        hybrid_res = {}
        if "daily" in intents:
            print("[Followup] Daily intent detected. Bypassing RAG to run DailyAgent directly.")
            has_rag = False
        else:
            try:
                hybrid_res = await answer_followup_with_hybrid_rag(
                    user_id=current_user["id"],
                    chart_id=request.conversation_id,
                    question=question,
                    user_db=user_db
                )
                if hybrid_res.get("has_rag") is False or hybrid_res.get("source_used") == "NONE":
                    has_rag = False
                else:
                    answer = hybrid_res.get("answer")
                    source_used = hybrid_res.get("source_used", "NONE")
            except Exception as e:
                print(f"[Hybrid RAG Error] {e}")
                has_rag = False
                hybrid_res = {}

        if not has_rag:
            print("[Followup] No RAG data found. Falling back to specialist agents...")
            agent_results = await ai_system.run_agents(agents, {
                "question": question, 
                "birth_info": birth_info, 
                "current_date": current_date, 
                "memory": memory, 
                "emotion": emotion,
                "entities": entities,
                "raw_chart_data": raw_chart_data
            })
            
            # Filter out empty answers
            valid_results = [r for r in agent_results if isinstance(r, dict) and r.get("answer")]
            
            if not valid_results:
                # If no agents returned a response, use LLM general answer fallback
                from chatbot.utils.llm import LLM
                llm_model = LLM().get_llm()
                lang = request.language or "vi"
                if lang == "en":
                    fallback_prompt = f"""You are the astrology assistant of the MARA-AI system. 
The user is asking the following question for which the system has not found personalized data. Please answer the user's question accurately, deeply, and helpfully based on your astrological knowledge.

Question: {question}
Answer in English:"""
                else:
                    fallback_prompt = f"""Bạn là trợ lý chiêm tinh của hệ thống MARA-AI. 
Người dùng hỏi câu hỏi sau đây mà hệ thống chưa tìm thấy dữ liệu cá nhân hóa phù hợp. Hãy trả lời câu hỏi của người dùng một cách chính xác, sâu sắc và hữu ích dựa trên kiến thức chiêm tinh học của bạn.

Câu hỏi: {question}
Trả lời:"""
                fallback_res = await asyncio.to_thread(llm_model.invoke, fallback_prompt)
                raw_ans = fallback_res.content if hasattr(fallback_res, "content") else str(fallback_res)
                answer = re.sub(r"<think>.*?</think>", "", str(raw_ans), flags=re.DOTALL).strip()
                source_used = "LLM_FALLBACK"
            elif len(valid_results) == 1:
                res_agent = valid_results[0]
                ans = res_agent.get("answer", "")
                from chatbot.core.ai_system import AGENT_TITLES
                if ans and not ans.strip().startswith("#"):
                    title = AGENT_TITLES.get(res_agent.get("type", "general"), "Luận giải Chiêm tinh")
                    answer = f"### {title}\n\n{ans}"
                else:
                    answer = ans
                source_used = "AGENT"
            else:
                answer = await asyncio.to_thread(ai_system.fuse, valid_results, question)
                source_used = "AGENT"

        sources = []
        if source_used == "HYBRID_RAG_GRAPHRAG":
            rag_sources = hybrid_res.get("rag_sources", [])
            if isinstance(rag_sources, list) and rag_sources:
                # Top 3 most relevant RAG chunks
                for i, chunk in enumerate(rag_sources[:3]):
                    sources.append({
                        "chunk_index": chunk.get("chunk_index", i),
                        "section_name": f"Tài liệu RAG - {chunk.get('section_title', 'Chuyên môn')}",
                        "content": chunk["content"],
                        "semantic_score": chunk.get("similarity_score", 0.0),
                        "rerank_score": chunk.get("similarity_score", 0.0),
                        "final_score": chunk.get("similarity_score", 0.0),
                        "rank_position": i + 1
                    })
            else:
                sources.append({
                    "chunk_index": 0,
                    "section_name": "Tài liệu RAG",
                    "content": "Không tìm thấy chunk RAG phù hợp.",
                    "semantic_score": 0.0,
                    "rerank_score": 0.0,
                    "final_score": 0.0,
                    "rank_position": 1
                })
                
            # GraphRAG: Only include a single summary metric item in sources to keep the UI clean
            graph_sources = hybrid_res.get("graph_sources", {})
            if isinstance(graph_sources, dict):
                entities_count = len(graph_sources.get("entities", []))
                relationships_count = len(graph_sources.get("relationships", []))
                sources.append({
                    "chunk_index": 0,
                    "section_name": "Dữ liệu GraphRAG",
                    "content": f"Graph Database: Tìm thấy {entities_count} thực thể chiêm tinh và {relationships_count} quan hệ liên quan được đưa vào luận giải.",
                    "semantic_score": 1.0,
                    "rerank_score": 1.0,
                    "final_score": 1.0,
                    "rank_position": 1
                })
        elif source_used == "RAG":
            retrieved_chunks = hybrid_res.get("retrieved_chunks")
            if isinstance(retrieved_chunks, list):
                for i, chunk in enumerate(retrieved_chunks):
                    sources.append({
                        "chunk_index": chunk.get("chunk_index", i),
                        "section_name": chunk.get("section_title", "Chuyên môn"),
                        "content": chunk["content"],
                        "semantic_score": chunk.get("similarity_score", 0.0),
                        "rerank_score": chunk.get("similarity_score", 0.0),
                        "final_score": chunk.get("similarity_score", 0.0),
                        "rank_position": i + 1
                    })
        elif source_used == "GraphRAG":
            sources.append({
                "chunk_index": 0,
                "section_name": "Nguồn: GraphRAG",
                "content": hybrid_res.get("graph_context", ""),
                "semantic_score": 1.0,
                "rerank_score": 1.0,
                "final_score": 1.0,
                "rank_position": 1
            })
        elif source_used == "AGENT":
            sources.append({
                "chunk_index": 0,
                "section_name": "Hệ thống chuyên gia Chiêm tinh (MARA-AI)",
                "content": "Câu trả lời được sinh ra trực tiếp bởi các Agent chuyên gia dựa trên thông tin ngày sinh và câu hỏi của bạn.",
                "semantic_score": 1.0,
                "rerank_score": 1.0,
                "final_score": 1.0,
                "rank_position": 1
            })
        elif source_used == "LLM_FALLBACK":
            sources.append({
                "chunk_index": 0,
                "section_name": "Trí tuệ nhân tạo (LLM Fallback)",
                "content": "Không tìm thấy dữ liệu cá nhân hóa phù hợp, câu trả lời được lập luận dựa trên tri thức chiêm tinh học của mô hình ngôn ngữ lớn.",
                "semantic_score": 1.0,
                "rerank_score": 1.0,
                "final_score": 1.0,
                "rank_position": 1
            })
        else:
            sources.append({
                "chunk_index": 0,
                "section_name": "Không tìm thấy dữ liệu phù hợp",
                "content": "Dữ liệu bản đồ sao hiện tại chưa đủ thông tin cho câu hỏi này.",
                "semantic_score": 0.0,
                "rerank_score": 0.0,
                "final_score": 0.0,
                "rank_position": 1
            })

        # ================= TOKEN =================
        input_text = question
        tokens_in = token_counter.count_tokens(input_text)
        generation = str(answer or analysis or "")
        tokens_out = token_counter.count_tokens(generation)
        total_tokens = tokens_in + tokens_out
        cost = token_counter.calculate_cost(total_tokens)

        email = str(current_user.get("email") or "")
        current_balance = float(current_user.get("token_balance", 0.0))

        if current_user.get("is_admin"):
            new_balance = current_balance
            cost = 0
        else:
            new_balance = await asyncio.to_thread(
                token_counter.deduct_tokens,
                email=email,
                tokens=cost,
                description="AI followup"
            )
            if new_balance is None:
                new_balance = current_balance

        await asyncio.to_thread(
            user_db.save_chat_log,
            current_user["id"],
            request.conversation_id,
            question,
            answer,
            cost,
            None, # Không lưu lại bản đồ sao (analysis) vào mỗi followup để tránh nặng DB
            None,
            None, # Không lưu chart_svg
            None, # Không lưu partner_chart_svg
            None,
            None,
            None,  # Không lưu partner_json nhiều lần
            sources=sources # 🔥 LƯU SOURCES VÀO DB
        )

        # 🔥 FRESH FETCH TRƯỚC KHI TRẢ VỀ
        final_user = await asyncio.to_thread(user_db.get_by_email, email)
        final_balance = float(final_user.get("token_balance", 0.0) if final_user else new_balance)

        return {
            "answer": answer,
            "analysis": analysis,
            "chart": analysis,
            "chart_svg": chart_svg,
            "partner_chart_svg": partner_chart_svg,
            "chart_summary": None,
            "tokens_charged": float(cost),
            "user_token_balance": final_balance,
            "conversation_id": request.conversation_id,
            "sources": sources,
            "source_used": source_used,
            "domain": hybrid_res.get("domain", "general"),
            "rag_sources": hybrid_res.get("rag_sources", []),
            "graph_sources": hybrid_res.get("graph_sources", {"entities": [], "relationships": []})
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if token_counter is not None: token_counter.close()
        if user_db is not None: user_db.close()


# ============================================
# CHAT FOLLOWUP — SSE STREAMING
# ============================================

class ThinkTagFilter:
    """Filters out <think>...</think> reasoning tags from LLM output on-the-fly."""
    def __init__(self):
        self.in_think = False
        self.buffer = ""

    def filter_chunk(self, chunk: str) -> str:
        self.buffer += chunk
        if not self.in_think:
            if "<think>" in self.buffer:
                parts = self.buffer.split("<think>", 1)
                before = parts[0]
                self.in_think = True
                self.buffer = parts[1]
                return before + self.filter_chunk("")
            else:
                if len(self.buffer) > 7:
                    out = self.buffer[:-7]
                    self.buffer = self.buffer[-7:]
                    return out
                return ""
        else:
            if "</think>" in self.buffer:
                parts = self.buffer.split("</think>", 1)
                self.in_think = False
                self.buffer = parts[1]
                return self.filter_chunk("")
            else:
                if len(self.buffer) > 8:
                    self.buffer = self.buffer[-8:]
                return ""

    def flush(self) -> str:
        if not self.in_think:
            out = self.buffer
            self.buffer = ""
            return out
        return ""


@router.post("/chat-followup-stream")
async def chat_followup_stream(
    request: FollowupRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    SSE streaming version of /chat-followup.
    Returns text/event-stream with events: meta, text, done, error.
    """
    token_counter = TokenCounter()
    user_db = UserDB()

    # ---------- PHASE 1: Retrieval (runs synchronously before streaming) ----------
    try:
        question = (request.question or "").strip() or "Phân tích thêm"
        assert_conversation_owner(user_db, request.conversation_id, current_user["id"])
        logs = user_db.get_user_chat_logs(request.conversation_id)

        if not logs:
            raise HTTPException(status_code=400, detail="Conversation không tồn tại")

        first_question = logs[0]["question"]
        init_log = find_initial_chart_log(logs)

        # Parse user birth info
        name_match = re.search(r"Họ tên:\s*(.*?)\s*\|", first_question)
        date_match = re.search(r"Ngày sinh:\s*(\d+)/(\d+)/(\d+)\s*(\d+):(\d+)", first_question)
        city_match = re.search(r"Nơi sinh:\s*(.*?)\s*\|", first_question)
        partner_match = re.search(r"Partner:\s*(\{.*\}|None)", first_question)

        partner_data = None
        if partner_match and partner_match.group(1) != "None":
            try:
                partner_data = json.loads(partner_match.group(1))
            except:
                partner_data = None

        birth_info = {
            "user_id": current_user["id"],
            "name": name_match.group(1) if name_match else "Người dùng",
            "day": int(date_match.group(1)) if date_match else 1,
            "month": int(date_match.group(2)) if date_match else 1,
            "year": int(date_match.group(3)) if date_match else 2000,
            "hour": int(date_match.group(4)) if date_match else 0,
            "minute": int(date_match.group(5)) if date_match else 0,
            "city": city_match.group(1) if city_match else "Hanoi",
            "country": "VN",
            "partner": partner_data,
            "language": request.language or "vi"
        }
        memory = user_db.get_user_memory(current_user["id"]) or {}

        # Load context from logs
        last_analysis = clean_text(init_log.get("chart")) if init_log and init_log.get("chart") else ""
        last_chart_svg = init_log.get("chart_svg") if init_log else None
        last_raw_data = None
        partner_json_data = None

        for log in reversed(logs):
            if not last_chart_svg and log.get("chart_svg"):
                last_analysis = clean_text(log.get("chart"))
                last_chart_svg = log.get("chart_svg")
            if not last_raw_data and log.get("raw_data"):
                try:
                    last_raw_data = json.loads(log["raw_data"])
                except:
                    last_raw_data = log.get("raw_data")
            if not partner_json_data and log.get("partner_json"):
                try:
                    partner_json_data = json.loads(log["partner_json"])
                except:
                    pass

        birth_info["partner"] = partner_json_data or partner_data
        raw_chart_data = last_raw_data or (compact_chart_summary(init_log.get("chart_summary")) if init_log else "")
        if isinstance(raw_chart_data, (dict, list)):
            raw_chart_data = json.dumps(raw_chart_data, ensure_ascii=False)

        # Guard & Analyze
        guard_task = asyncio.to_thread(ai_system.guard.run, question)
        analyze_task = asyncio.to_thread(ai_system.analyze, question, memory, birth_info)
        guard, (intents, _, emotion, entities) = await asyncio.gather(guard_task, analyze_task)

        # Guard rejection — return a simple SSE rejection
        if not guard.get("is_astrology") or guard.get("confidence", 0) < 0.8:
            rejection_msg = "XIN LỖI TÔI CHỈ LÀ CHATBOT CHIÊM TINH"
            email = current_user.get("email")
            user_fresh = await asyncio.to_thread(user_db.get_by_email, email)
            current_balance = float(user_fresh.get("token_balance", 0.0) if user_fresh else current_user.get("token_balance", 0.0))

            async def guard_stream():
                yield f"data: {json.dumps({'type': 'meta', 'sources': [], 'source_used': 'NONE', 'domain': 'general'}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'text', 'content': rejection_msg}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'tokens_charged': 0.0, 'user_token_balance': current_balance}, ensure_ascii=False)}\n\n"
                if token_counter is not None: token_counter.close()
                if user_db is not None: user_db.close()

            return StreamingResponse(guard_stream(), media_type="text/event-stream")

        agents = ai_system.spawn(intents)
        from datetime import datetime
        current_date = datetime.now().strftime("%d/%m/%Y")

        # RAG seed
        from chatbot.rag.rag_pipeline import answer_followup_with_hybrid_rag, pipeline_process_and_store
        try:
            field_label = FIELD_LABELS.get(request.field, "Tổng quan")
            existing_chunks = await asyncio.to_thread(user_db.get_document_chunks, request.conversation_id)
            if not existing_chunks and init_log:
                seed_text = build_rag_seed_text(
                    init_log.get("chart"), init_log.get("chart_summary"),
                    partner_json_data or partner_data,
                    init_log.get("compatibility"), init_log.get("label")
                )
                if len(seed_text.strip()) >= 50:
                    await pipeline_process_and_store(request.conversation_id, current_user["id"], field_label, seed_text, user_db)
        except Exception as e:
            print(f"[RAG Seed Error] {e}")

        # Hybrid RAG retrieval
        has_rag = True
        source_used = "NONE"
        hybrid_res = {}
        if "daily" in intents:
            has_rag = False
        else:
            try:
                hybrid_res = await answer_followup_with_hybrid_rag(
                    user_id=current_user["id"],
                    chart_id=request.conversation_id,
                    question=question,
                    user_db=user_db
                )
                if hybrid_res.get("has_rag") is False or hybrid_res.get("source_used") == "NONE":
                    has_rag = False
                else:
                    source_used = hybrid_res.get("source_used", "NONE")
            except Exception as e:
                print(f"[Hybrid RAG Error] {e}")
                has_rag = False
                hybrid_res = {}

        # Agent fallback (non-streaming part — get the answer text)
        valid_results = []
        agent_answer = ""
        if not has_rag:
            agent_results = await ai_system.run_agents(agents, {
                "question": question, "birth_info": birth_info,
                "current_date": current_date, "memory": memory,
                "emotion": emotion, "entities": entities,
                "raw_chart_data": raw_chart_data
            })
            valid_results = [r for r in agent_results if isinstance(r, dict) and r.get("answer")]
            if not valid_results:
                source_used = "LLM_FALLBACK"
            elif len(valid_results) == 1:
                res_agent = valid_results[0]
                ans = res_agent.get("answer", "")
                from chatbot.core.ai_system import AGENT_TITLES
                if ans and not ans.strip().startswith("#"):
                    title = AGENT_TITLES.get(res_agent.get("type", "general"), "Luận giải Chiêm tinh")
                    agent_answer = f"### {title}\n\n{ans}"
                else:
                    agent_answer = ans
                source_used = "AGENT"
            else:
                agent_answer = await asyncio.to_thread(ai_system.fuse, valid_results, question)
                source_used = "AGENT"

        # Build sources list (same logic as sync endpoint)
        sources = []
        if source_used == "HYBRID_RAG_GRAPHRAG":
            rag_sources = hybrid_res.get("rag_sources", [])
            if isinstance(rag_sources, list) and rag_sources:
                for i, chunk in enumerate(rag_sources[:3]):
                    sources.append({
                        "chunk_index": chunk.get("chunk_index", i),
                        "section_name": f"Tài liệu RAG - {chunk.get('section_title', 'Chuyên môn')}",
                        "content": chunk["content"],
                        "semantic_score": chunk.get("similarity_score", 0.0),
                        "rerank_score": chunk.get("similarity_score", 0.0),
                        "final_score": chunk.get("similarity_score", 0.0),
                        "rank_position": i + 1
                    })
            else:
                sources.append({"chunk_index": 0, "section_name": "Tài liệu RAG", "content": "Không tìm thấy chunk RAG phù hợp.", "semantic_score": 0.0, "rerank_score": 0.0, "final_score": 0.0, "rank_position": 1})
            graph_sources = hybrid_res.get("graph_sources", {})
            if isinstance(graph_sources, dict):
                entities_count = len(graph_sources.get("entities", []))
                relationships_count = len(graph_sources.get("relationships", []))
                sources.append({"chunk_index": 0, "section_name": "Dữ liệu GraphRAG", "content": f"Graph Database: Tìm thấy {entities_count} thực thể chiêm tinh và {relationships_count} quan hệ liên quan.", "semantic_score": 1.0, "rerank_score": 1.0, "final_score": 1.0, "rank_position": 1})
        elif source_used == "AGENT":
            sources.append({"chunk_index": 0, "section_name": "Hệ thống chuyên gia Chiêm tinh (MARA-AI)", "content": "Câu trả lời được sinh ra trực tiếp bởi các Agent chuyên gia.", "semantic_score": 1.0, "rerank_score": 1.0, "final_score": 1.0, "rank_position": 1})
        elif source_used == "LLM_FALLBACK":
            sources.append({"chunk_index": 0, "section_name": "Trí tuệ nhân tạo (LLM Fallback)", "content": "Câu trả lời dựa trên tri thức chiêm tinh học của mô hình ngôn ngữ lớn.", "semantic_score": 1.0, "rerank_score": 1.0, "final_score": 1.0, "rank_position": 1})
        else:
            sources.append({"chunk_index": 0, "section_name": "Không tìm thấy dữ liệu phù hợp", "content": "Dữ liệu bản đồ sao hiện tại chưa đủ thông tin cho câu hỏi này.", "semantic_score": 0.0, "rerank_score": 0.0, "final_score": 0.0, "rank_position": 1})

    except HTTPException:
        if token_counter is not None: token_counter.close()
        if user_db is not None: user_db.close()
        raise
    except Exception as e:
        if token_counter is not None: token_counter.close()
        if user_db is not None: user_db.close()
        raise HTTPException(status_code=500, detail=str(e))

    # ---------- PHASE 2: SSE Generator ----------
    async def event_generator():
        filter_think = ThinkTagFilter()
        full_answer_parts: list[str] = []

        # 1) Send metadata first
        yield f"data: {json.dumps({'type': 'meta', 'sources': sources, 'source_used': source_used, 'domain': hybrid_res.get('domain', 'general')}, ensure_ascii=False)}\n\n"

        try:
            lang = request.language or "vi"
            if source_used == "HYBRID_RAG_GRAPHRAG":
                # Stream from LLM using hybrid context
                from chatbot.utils.llm import LLM
                llm_model = LLM().get_llm()
                hybrid_context = hybrid_res.get("hybrid_context", "")
                domain = hybrid_res.get("domain", "general")
                if lang == "en":
                    prompt = f"""You are a fun astrology assistant.

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

QUESTION: {question}
DOMAIN: {domain}
HYBRID_CONTEXT:
{hybrid_context}

ANSWER:"""
                else:
                    prompt = f"""Bạn là trợ lý chiêm tinh vui.

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

QUESTION: {question}
DOMAIN: {domain}
HYBRID_CONTEXT:
{hybrid_context}

ANSWER:"""
                async for chunk in llm_model.astream(prompt):
                    raw = chunk.content if hasattr(chunk, "content") else str(chunk)
                    text = filter_think.filter_chunk(raw if isinstance(raw, str) else str(raw))
                    if text:
                        full_answer_parts.append(text)
                        yield f"data: {json.dumps({'type': 'text', 'content': text}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0)  # yield CPU sau mỗi chunk — flush event loop ngay lập tức

                remainder = filter_think.flush()
                if remainder:
                    full_answer_parts.append(remainder)
                    yield f"data: {json.dumps({'type': 'text', 'content': remainder}, ensure_ascii=False)}\n\n"

            elif source_used == "LLM_FALLBACK":
                from chatbot.utils.llm import LLM
                llm_model = LLM().get_llm()
                if lang == "en":
                    fallback_prompt = f"""You are the astrology assistant of the MARA-AI system.
The user is asking the following question for which the system has not found personalized data. Please answer based on your astrological knowledge.

Question: {question}
Answer in English:"""
                else:
                    fallback_prompt = f"""Bạn là trợ lý chiêm tinh của hệ thống MARA-AI.
Người dùng hỏi câu hỏi sau đây mà hệ thống chưa tìm thấy dữ liệu cá nhân hóa phù hợp. Hãy trả lời dựa trên kiến thức chiêm tinh học của bạn.

Câu hỏi: {question}
Trả lời:"""
                async for chunk in llm_model.astream(fallback_prompt):
                    raw = chunk.content if hasattr(chunk, "content") else str(chunk)
                    text = filter_think.filter_chunk(raw if isinstance(raw, str) else str(raw))
                    if text:
                        full_answer_parts.append(text)
                        yield f"data: {json.dumps({'type': 'text', 'content': text}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0)  # yield CPU sau mỗi chunk

                remainder = filter_think.flush()
                if remainder:
                    full_answer_parts.append(remainder)
                    yield f"data: {json.dumps({'type': 'text', 'content': remainder}, ensure_ascii=False)}\n\n"

            elif source_used == "AGENT" and agent_answer:
                # Stream exactly from agent_answer without splitting to keep spacing 100% correct
                chunk_size = 6
                for i in range(0, len(agent_answer), chunk_size):
                    chunk = agent_answer[i:i+chunk_size]
                    full_answer_parts.append(chunk)
                    yield f"data: {json.dumps({'type': 'text', 'content': chunk}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.012)  # ~80 tokens/s — smooth như ChatGPT
            else:
                fallback_text = "The current natal chart data is not sufficient to answer this question." if lang == "en" else "Dữ liệu bản đồ sao hiện tại chưa đủ thông tin cho câu hỏi này."
                full_answer_parts.append(fallback_text)
                yield f"data: {json.dumps({'type': 'text', 'content': fallback_text}, ensure_ascii=False)}\n\n"

        except Exception as e:
            print(f"[SSE Streaming Error] {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)}, ensure_ascii=False)}\n\n"

        # 3) Save to DB & send done event
        try:
            answer_str = "".join(full_answer_parts).strip()
            tokens_in = token_counter.count_tokens(question)
            tokens_out = token_counter.count_tokens(answer_str)
            total_tokens = tokens_in + tokens_out
            cost = token_counter.calculate_cost(total_tokens)

            email = str(current_user.get("email") or "")
            current_balance = float(current_user.get("token_balance", 0.0))

            if current_user.get("is_admin"):
                new_balance = current_balance
                cost = 0
            else:
                new_balance = await asyncio.to_thread(
                    token_counter.deduct_tokens,
                    email=email, tokens=cost, description="AI followup (stream)"
                )
                if new_balance is None:
                    new_balance = current_balance

            await asyncio.to_thread(
                user_db.save_chat_log,
                current_user["id"], request.conversation_id,
                question, answer_str, cost,
                None, None, None, None, None, None, None,
                sources=sources
            )

            final_user = await asyncio.to_thread(user_db.get_by_email, email)
            final_balance = float(final_user.get("token_balance", 0.0) if final_user else new_balance)

            yield f"data: {json.dumps({'type': 'done', 'tokens_charged': float(cost), 'user_token_balance': final_balance}, ensure_ascii=False)}\n\n"
        except Exception as e:
            print(f"[SSE Done Phase Error] {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            if token_counter is not None: token_counter.close()
            if user_db is not None: user_db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # Tắt nginx buffer
            "Connection": "keep-alive",
        }
    )


# ============================================
# GET CHAT HISTORY
# ============================================
@router.get("/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):

    user_db = UserDB()

    conversations = user_db.get_user_conversations(current_user["id"])

    history = []

    for conv in conversations:

        logs = user_db.get_user_chat_logs(conv["id"])

        for log in logs:

            history.append({
                "id": f"q-{log['id']}",
                "role": "user",
                "content": log["question"],
                "timestamp": log["created_at"],
                "conversation_id": conv["id"]
            })

            # 🔥 FIX CONTENT NULL
            history.append({
                "id": f"a-{log['id']}",
                "role": "assistant",
                "content": log["answer"] or "",
                "analysis": log["chart"] or "",
                "chart": log["chart"], # 🔥 THÊM ĐỂ FRONTEND NHẬN DIỆN
                "answer": log["answer"] or "",
                "timestamp": log["created_at"],
                "tokens_charged": log["tokens_charged"],
                "chart_summary": log.get("chart_summary"),
                "chart_svg": log.get("chart_svg"),
                "partner_chart_svg": log.get("partner_chart_svg"),
                "compatibility": log.get("compatibility"),
                "label": log.get("label"),
                "sources": log.get("sources"), # 🔥 LẤY SOURCES TỪ DB
                "conversation_id": conv["id"]
            })

    if user_db is not None: user_db.close()

    return {"history": history}

# ============================================
# DELETE HISTORY
# ============================================

@router.delete("/history")
async def delete_chat_history(current_user: dict = Depends(get_current_user)):

    user_db = UserDB()

    user_db.delete_user_chat_logs(current_user["id"])

    if user_db is not None: user_db.close()

    return {"message": "Đã xóa lịch sử chat thành công"}


# ============================================
# SITE CONFIG
# ============================================

@router.get("/config")
async def get_site_config(request: Request):
    from fastapi import Request
    from app.routers.admin import ALL_SETTINGS_DEFAULTS
    db = UserDB()
    try:
        res = {}
        scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
        host = request.headers.get("host", "localhost:2643")
        base_url = f"{scheme}://{host}"
        
        for key, default in ALL_SETTINGS_DEFAULTS.items():
            if key == "rate_per_1000":
                continue
            val = db.get_setting(key, default)
            if isinstance(val, str):
                val = val.replace("http://localhost:2643", base_url).replace("http://127.0.0.1:2643", base_url)
            res[key] = val
        res["blog_posts"] = db.get_blog_posts()
        return res
    finally:
        db.close()
