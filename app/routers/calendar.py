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

@router.post("/good-bad-days")
async def get_good_bad_days(request: CalendarRequest, current_user: dict = Depends(get_current_user)):
    user_db = None
    history_db = None
    token_counter = None

    try:
        user_db = await asyncio.to_thread(UserDB)
        history_db = await asyncio.to_thread(ChatHistoryDB)
        token_counter = await asyncio.to_thread(TokenCounter)
        
        now = datetime.now()
        if request.year < now.year or (request.year == now.year and request.month < now.month):
             raise HTTPException(status_code=400, detail="Vui lòng chọn tháng trong hiện tại hoặc tương lai.")

        llm_name = os.environ.get("LLM_NAME", "vertex")
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
                lat, lng = get_coordinates(city, country)
                user_chart = AstrologicalSubject(
                    name, year, month, day, hour, minute,
                    city=city, nation=country,
                    lat=lat, lng=lng
                )

                # Generate SVG
                natal_data = ChartDataFactory.create_natal_chart_data(user_chart.model())
                drawer = ChartDrawer(natal_data, theme="dark")
                chart_svg = drawer.generate_svg_string(remove_css_variables=True)

                # Format data for LLM
                planets_keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"]
                planets = [f"- {getattr(user_chart, k).name}: {getattr(user_chart, k).sign} (Nhà {getattr(user_chart, k).house})" for k in planets_keys if hasattr(user_chart, k)]
                
                chart_data_str = f"""
                BẢN ĐỒ SAO GỐC (NATAL CHART):
                Cung Mọc (Ascendant): {user_chart.ascendant.sign}
                Các hành tinh:
                {chr(10).join(planets)}
                """

                birth_context = f"""
                Thông tin người dùng:
                Họ tên: {name}
                Ngày sinh: {day}/{month}/{year} lúc {hour}:{minute}
                Nơi sinh: {city}
                {chart_data_str}
                """
            except Exception as e:
                print(f"Lỗi tính toán bản đồ sao: {e}")
                birth_context = f"Thông tin người dùng: {name}, sinh ngày {day}/{month}/{year}"

        prompt = f"""
        Bạn là bậc thầy chiêm tinh học cao cấp. Hãy lập lịch Cát Tường tháng {request.month}/{request.year} cho lĩnh vực "{request.field}".
        
        {birth_context}
        
        NHIỆM VỤ:
        1. Phân tích các hành tinh quá cảnh (Transits) trong tháng {request.month}/{request.year} so với bản đồ sao gốc.
        2. Tìm các ngày thực sự Cát (good) hoặc Hung (bad) cho lĩnh vực "{request.field}".
        
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
        content = response.content if hasattr(response, "content") else str(response)
        
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
            summary = summary_match.group(1) if summary_match else "Dữ liệu tóm tắt hiện không khả dụng."
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
                    "reason": "Ngày bình hòa, không có biến động chiêm tinh lớn."
                })

        # 3. TẠO ĐOẠN CHAT
        conv_title = f"[Lịch Cát Tường] - Tháng {request.month}/{request.year}"
        new_conv_id = await asyncio.to_thread(history_db.create_conversation, current_user["id"], title=conv_title)
        
        msg_user = f"Xem lịch cát tường tháng {request.month}/{request.year} - Lĩnh vực: {request.field}"
        
        good_list = [f"Ngày {d['day']}: {d['reason']}" for d in days_data if d['quality'] == 'good']
        bad_list = [f"Ngày {d['day']}: {d['reason']}" for d in days_data if d['quality'] == 'bad']
        
        msg_bot = f"### 🗓️ LỊCH CÁT TƯỜNG THÁNG {request.month}/{request.year}\n\n"
        msg_bot += f"**Lĩnh vực:** {request.field}\n\n"
        
        if good_list:
            msg_bot += "✅ **NGÀY TỐT (CÁT):**\n" + "\n".join([f"- {i}" for i in good_list]) + "\n\n"
        if bad_list:
            msg_bot += "❌ **NGÀY XẤU (HUNG):**\n" + "\n".join([f"- {i}" for i in bad_list]) + "\n\n"
            
        msg_bot += f"**Tóm lược:**\n{summary}"

        # Deduct tokens
        tokens = token_counter.count_tokens(prompt + content)
        cost = token_counter.calculate_cost(tokens)
        
        email = current_user.get("email")
        if not current_user.get("is_admin"):
            new_balance = await asyncio.to_thread(token_counter.deduct_tokens, email=email, tokens=cost, description=f"Lịch Cát Tường: {request.field}")
        else:
            db_user = await asyncio.to_thread(user_db.get_by_email, email)
            new_balance = db_user.get("token_balance", 0) if db_user else 0

        chart_data = {
            "days": days_data,
            "summary": summary,
            "field": request.field,
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
