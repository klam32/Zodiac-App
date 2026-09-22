from fastapi import APIRouter, Depends, HTTPException
from app.security.security import get_current_user
from chatbot.utils.llm import LLM
from chatbot.utils.token_counter import TokenCounter
from app.models.base_db import UserDB, ChatHistoryDB
from pydantic import BaseModel
import os
import json
import calendar as py_calendar
from datetime import datetime
import re
import asyncio
from kerykeion import AstrologicalSubject, ChartDataFactory, ChartDrawer
from chatbot.utils.geo import get_coordinates

router = APIRouter(prefix="/calendar", tags=["Calendar"])

class CalendarRequest(BaseModel):
    month: int
    year: int
    field: str
    birth_info: dict | None = None
    conversation_id: int | None = None
    language: str | None = "vi"

@router.post("/good-bad-days")
async def get_good_bad_days(request: CalendarRequest, current_user: dict = Depends(get_current_user)):
    user_db = None
    history_db = None
    token_counter = None

    try:
        # Kiểm tra số dư token
        if not current_user.get("is_admin") and float(current_user.get("token_balance", 0.0)) <= 0:
            lang = request.language or "vi"
            msg = "You have run out of tokens. Please recharge to continue using the service." if lang == "en" else "Bạn đã hết tokens. Vui lòng nạp thêm để tiếp tục sử dụng dịch vụ."
            raise HTTPException(
                status_code=402,
                detail=msg
            )

        user_db = await asyncio.to_thread(UserDB)
        history_db = await asyncio.to_thread(ChatHistoryDB)
        token_counter = await asyncio.to_thread(TokenCounter)
        
        now = datetime.now()
        lang = request.language or "vi"

        field_labels_vi = {
            "overview": "Tổng quan",
            "love": "Tình duyên",
            "career": "Sự nghiệp",
            "health": "Sức khỏe",
            "wealth": "Tài lộc"
        }
        field_labels_en = {
            "overview": "General Fortune",
            "love": "Love & Relationships",
            "career": "Career & Fame",
            "health": "Health & Wellbeing",
            "wealth": "Wealth & Business"
        }
        field_id = "overview"
        req_field_lower = (request.field or "").lower()
        if "tổng quan" in req_field_lower or "overview" in req_field_lower or "general" in req_field_lower or "astrology" in req_field_lower:
            field_id = "overview"
        elif "tình cảm" in req_field_lower or "tình duyên" in req_field_lower or "love" in req_field_lower:
            field_id = "love"
        elif "sự nghiệp" in req_field_lower or "career" in req_field_lower or "fame" in req_field_lower:
            field_id = "career"
        elif "sức khỏe" in req_field_lower or "health" in req_field_lower or "wellbeing" in req_field_lower:
            field_id = "health"
        elif "tài lộc" in req_field_lower or "wealth" in req_field_lower or "business" in req_field_lower:
            field_id = "wealth"
        else:
            field_id = request.field or "overview"

        field_name = field_labels_en.get(field_id, field_id) if lang == "en" else field_labels_vi.get(field_id, field_id)
        if request.year < now.year or (request.year == now.year and request.month < now.month):
             raise HTTPException(
                 status_code=400, 
                 detail="Please select a month in the current or future." if lang == "en" else "Vui lòng chọn tháng trong hiện tại hoặc tương lai."
             )

        llm_name = os.environ.get("LLM_NAME")
        llm = LLM().get_llm(llm_name)
        
        _, num_days = py_calendar.monthrange(request.year, request.month)
        
        birth_context = ""
        chart_svg = ""
        chart_data_str = ""

        if request.birth_info:
            name = request.birth_info.get('name', 'User')
            year = int(request.birth_info.get('year', 1990))
            month = int(request.birth_info.get('month', 1))
            day = int(request.birth_info.get('day', 1))
            hour = int(request.birth_info.get('hour', 12))
            minute = int(request.birth_info.get('minute', 0))
            city = request.birth_info.get('city', 'Hanoi')
            country = request.birth_info.get('country', 'VN')

            try:
                lat, lng, tz_str = get_coordinates(city, country)
                user_chart = AstrologicalSubject(
                    name, year, month, day, hour, minute,
                    city=city, nation=country,
                    lat=lat, lng=lng,
                    tz_str=tz_str,
                    online=False
                )

                # Generate SVG
                natal_data = ChartDataFactory.create_natal_chart_data(user_chart.model())
                drawer = ChartDrawer(natal_data, theme="dark")
                chart_svg = drawer.generate_svg_string(remove_css_variables=True)

                # Format data for LLM
                planets_keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"]
                planets = [f"- {getattr(user_chart, k).name}: {getattr(user_chart, k).sign} (" + (f"House {getattr(user_chart, k).house}" if lang == "en" else f"Nhà {getattr(user_chart, k).house}") + ")" for k in planets_keys if hasattr(user_chart, k)]
                
                if lang == "en":
                    chart_data_str = f"""
                NATAL CHART:
                Ascendant: {user_chart.ascendant.sign}
                Planets:
                {chr(10).join(planets)}
                """
                else:
                    chart_data_str = f"""
                BẢN ĐỒ SAO GỐC (NATAL CHART):
                Cung Mọc (Ascendant): {user_chart.ascendant.sign}
                Các hành tinh:
                {chr(10).join(planets)}
                """

                if lang == "en":
                    birth_context = f"""
                User Info:
                Full Name: {name}
                Birthdate: {day}/{month}/{year} at {hour}:{minute}
                Birthplace: {city}
                {chart_data_str}
                """
                else:
                    birth_context = f"""
                Thông tin người dùng:
                Họ tên: {name}
                Ngày sinh: {day}/{month}/{year} lúc {hour}:{minute}
                Nơi sinh: {city}
                {chart_data_str}
                """
            except Exception as e:
                print(f"Lỗi tính toán bản đồ sao: {e}")
                birth_context = f"User Info: {name}, born {day}/{month}/{year}" if lang == "en" else f"Thông tin người dùng: {name}, sinh ngày {day}/{month}/{year}"

        if lang == "en":
            prompt = f"""
        You are a senior professional astrologer. Please construct the Auspicious Calendar for {request.month}/{request.year} in the field of "{field_name}".
        
        {birth_context}
        
        TASKS:
        1. Analyze transiting planets (Transits) in the month {request.month}/{request.year} relative to the user's natal chart.
        2. Identify days that are genuinely Good (good) or Bad (bad) for the field of "{field_name}".
        
        FORMATTING RULES (MANDATORY):
        - RETURN ONLY JSON. Only list special days (good or bad).
        - Number of special days: around 6-10 days.
        - JSON Format:
        {{
          "special_days": [
            {{"day": 5, "quality": "good", "reason": "Short reason based on aspects/transits..."}},
            {{"day": 12, "quality": "bad", "reason": "Short reason..."}}
          ],
          "summary": "Summary of this month's trend (100 words)..."
        }}
        """
        else:
            prompt = f"""
        Bạn là bậc thầy chiêm tinh học cao cấp. Hãy lập lịch Cát Tường tháng {request.month}/{request.year} cho lĩnh vực "{field_name}".
        
        {birth_context}
        
        NHIỆM VỤ:
        1. Phân tích các hành tinh quá cảnh (Transits) trong tháng {request.month}/{request.year} so với bản đồ sao gốc.
        2. Tìm các ngày thực sự Cát (good) hoặc Hung (bad) cho lĩnh vực "{field_name}".
        
        YÊU CẦU ĐỊNH DẠNG (BẮT BUỘC):
        - TRẢ JSON DUY NHẤT. Chỉ liệt kê các ngày đặc biệt (tốt hoặc xấu).
        - Số lượng ngày đặc biệt: khoảng 6-10 ngày.
        - JSON Format:
        {{
          "special_days": [
            {{"day": 5, "quality": "good", "reason": "Lý do ngắn gọn dựa trên góc chiếu..."}},
            {{"day": 12, "quality": "bad", "reason": "Lý do ngắn gọn..."}}
          ],
          "summary": "Tóm tắt xu hướng tháng này (100 từ)..."
        }}
        """

        response = await asyncio.to_thread(llm.invoke, prompt)
        content = str(response.content if hasattr(response, "content") else response)
        
        # Bóc tách JSON
        def extract_json(text):
            code_block = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
            if code_block: return code_block.group(1)
            first = text.find('{'); last = text.rfind('}')
            return text[first:last+1] if first != -1 and last != -1 else text

        special_days = []
        summary = ""
        try:
            raw_json = extract_json(content)
            data = json.loads(raw_json)
            special_days = data.get("special_days", [])
            summary = data.get("summary", "")
        except:
            # Fallback bóc tách bằng Regex nếu LLM trả về text lộn xộn
            summary_match = re.search(r'"summary"\s*:\s*"(.*?)"', content, re.DOTALL)
            summary = summary_match.group(1) if summary_match else ("Monthly trend data currently unavailable." if lang == "en" else "Dữ liệu tóm tắt hiện không khả dụng.")
            blocks = re.findall(r'\{[^{}]*?"day"\s*:\s*(\d+).*?\}', content, re.DOTALL)
            for block in blocks:
                try:
                    d_match = re.search(r'"day"\s*:\s*(\d+)', block)
                    q_match = re.search(r'"quality"\s*:\s*"(good|bad|neutral)"', block)
                    r_match = re.search(r'"reason"\s*:\s*"(.*?)"', block)
                    if d_match and q_match:
                        special_days.append({
                            "day": int(d_match.group(1)),
                            "quality": q_match.group(1),
                            "reason": r_match.group(1) if r_match else ""
                        })
                except: continue

        # Tạo danh sách 30 ngày đầy đủ
        days_data = []
        special_map = {d['day']: d for d in special_days}
        for d in range(1, num_days + 1):
            if d in special_map:
                days_data.append(special_map[d])
            else:
                days_data.append({
                    "day": d,
                    "quality": "neutral",
                    "reason": "Neutral day, no major astrological movements." if lang == "en" else "Ngày bình hòa, không có biến động chiêm tinh lớn."
                })

        # 3. TẠO ĐOẠN CHAT
        conv_title = f"[Auspicious Calendar] - Month {request.month}/{request.year}" if lang == "en" else f"[Lịch Cát Tường] - Tháng {request.month}/{request.year}"
        new_conv_id = await asyncio.to_thread(history_db.create_conversation, current_user["id"], title=conv_title)
        
        msg_user = f"View auspicious calendar for month {request.month}/{request.year} - Field: {field_name}" if lang == "en" else f"Xem lịch cát tường tháng {request.month}/{request.year} - Lĩnh vực: {field_name}"
        
        good_list = [f"Day {d['day']}: {d['reason']}" if lang == "en" else f"Ngày {d['day']}: {d['reason']}" for d in days_data if d['quality'] == 'good']
        bad_list = [f"Day {d['day']}: {d['reason']}" if lang == "en" else f"Ngày {d['day']}: {d['reason']}" for d in days_data if d['quality'] == 'bad']
        
        if lang == "en":
            msg_bot = f"### 🗓️ AUSPICIOUS CALENDAR FOR {request.month}/{request.year}\n\n"
            msg_bot += f"**Field:** {field_name}\n\n"
            
            if good_list:
                msg_bot += "✅ **GOOD DAYS (AUSPICIOUS):**\n" + "\n".join([f"- {i}" for i in good_list]) + "\n\n"
            if bad_list:
                msg_bot += "❌ **BAD DAYS (INASPICIOUS):**\n" + "\n".join([f"- {i}" for i in bad_list]) + "\n\n"
                
            msg_bot += f"**Summary:**\n{summary}"
        else:
            msg_bot = f"### 🗓️ LỊCH CÁT TƯỜNG THÁNG {request.month}/{request.year}\n\n"
            msg_bot += f"**Lĩnh vực:** {field_name}\n\n"
            
            if good_list:
                msg_bot += "✅ **NGÀY TỐT (CÁT):**\n" + "\n".join([f"- {i}" for i in good_list]) + "\n\n"
            if bad_list:
                msg_bot += "❌ **NGÀY XẤU (HUNG):**\n" + "\n".join([f"- {i}" for i in bad_list]) + "\n\n"
                
            msg_bot += f"**Tóm lược:**\n{summary}"

        # Deduct tokens
        tokens = token_counter.count_tokens(prompt + content)
        cost = token_counter.calculate_cost(tokens)
        
        email = str(current_user.get("email") or "")
        if not current_user.get("is_admin"):
            new_balance = await asyncio.to_thread(token_counter.deduct_tokens, email=email, tokens=cost, description=f"Lịch Cát Tường: {field_name}")
        else:
            db_user = await asyncio.to_thread(user_db.get_by_email, email)
            new_balance = db_user.get("token_balance", 0) if db_user else 0

        chart_data = {
            "days": days_data,
            "summary": summary,
            "field": field_name,
            "month": request.month,
            "year": request.year,
            "birth_info": request.birth_info
        }
        
        await asyncio.to_thread(
            history_db.save_chat_log,
            user_id=current_user["id"],
            conversation_id=new_conv_id,
            question=msg_user,
            answer=msg_bot,
            tokens_charged=cost,
            chart="calendar",
            chart_summary=chart_data,
            chart_svg=chart_svg
        )

        return {
            "days": days_data,
            "summary": summary,
            "chart_svg": chart_svg,
            "user_token_balance": new_balance,
            "conversation_id": new_conv_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if user_db: user_db.close()
        if history_db: history_db.close()
        if token_counter: token_counter.close()
