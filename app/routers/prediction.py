from fastapi import APIRouter, Depends, HTTPException
from app.security.security import get_current_user
from chatbot.utils.llm import LLM
from chatbot.utils.token_counter import TokenCounter
from app.models.base_db import UserDB, ChatHistoryDB
from pydantic import BaseModel
import os
import json
from datetime import datetime
import re
import asyncio
from kerykeion import AstrologicalSubject, ChartDataFactory, ChartDrawer
from chatbot.utils.geo import get_coordinates

router = APIRouter(prefix="/prediction", tags=["Prediction"])

class PredictionRequest(BaseModel):
    date: str  # YYYY-MM-DD
    field: str # Sự nghiệp, Tình cảm, Sức khỏe...
    birth_info: dict
    conversation_id: int | None = None
    language: str | None = "vi"

@router.post("/daily")
async def get_daily_prediction(request: PredictionRequest, current_user: dict = Depends(get_current_user)):
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
        llm_name = os.environ.get("LLM_NAME")
        llm = LLM().get_llm(llm_name)
        
        # 1. Thu thập bối cảnh & Tính toán bản đồ sao
        birth = request.birth_info
        name = birth.get('name', 'User')
        year = int(birth.get('year', 1990))
        month = int(birth.get('month', 1))
        day = int(birth.get('day', 1))
        hour = int(birth.get('hour', 12))
        minute = int(birth.get('minute', 0))
        city = birth.get('city', 'Hanoi')
        country = birth.get('country', 'VN')

        chart_svg = ""
        chart_data_str = ""
        lang = request.language or "vi"

        field_labels_vi = {
            "overview": "Tổng quan",
            "love": "Tình cảm",
            "career": "Sự nghiệp",
            "health": "Sức khỏe"
        }
        field_labels_en = {
            "overview": "General Overview",
            "love": "Love & Relationships",
            "career": "Career & Wealth",
            "health": "Health & Energy"
        }
        field_id = "overview"
        req_field_lower = (request.field or "").lower()
        if "tổng quan" in req_field_lower or "overview" in req_field_lower or "general" in req_field_lower:
            field_id = "overview"
        elif "tình cảm" in req_field_lower or "love" in req_field_lower:
            field_id = "love"
        elif "sự nghiệp" in req_field_lower or "career" in req_field_lower:
            field_id = "career"
        elif "sức khỏe" in req_field_lower or "health" in req_field_lower:
            field_id = "health"
        else:
            field_id = request.field or "overview"

        field_name = field_labels_en.get(field_id, field_id) if lang == "en" else field_labels_vi.get(field_id, field_id)

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
        except Exception as e:
            print(f"Lỗi tính toán bản đồ sao trong dự đoán ngày: {e}")

        if lang == "en":
            birth_context = f"""
        USER NATAL INFO:
        - Full Name: {name}
        - Birthdate: {day}/{month}/{year} at {hour}:{minute}
        - Birthplace: {city}
        {chart_data_str}
        """
        else:
            birth_context = f"""
        THÔNG TIN GỐC CỦA NGƯỜI DÙNG:
        - Họ tên: {name}
        - Ngày sinh: {day}/{month}/{year} lúc {hour}:{minute}
        - Nơi sinh: {city}
        {chart_data_str}
        """

        # 2. Xây dựng Prompt chuyên sâu
        if lang == "en":
            prompt = f"""
        You are a professional Astrologer. Please provide a SHORT, CONCISE prediction for date {request.date}.
        
        {birth_context}
        
        PREDICTION FIELD: "{field_name}"
        
        FORMATTING REQUIREMENTS (MANDATORY):
        1. MAIN TITLE: Must start with `# DAILY ENERGY INTERPRETATION {request.date}`.
        2. SECTIONS: Use `##` for section titles (e.g., `## Dominant Energy`).
        3. CONTENT:
           - Quick analysis of 2-3 transiting planetary impacts on the user's natal chart.
           - Brief highlights of opportunities and challenges in the field of "{field_name}".
           - Provide 2-3 concise action advice items.
           - Cosmic message (exactly 1 sentence).
           - Energy score (0-100).
        4. Present in complete Markdown format. Do not return arrays or raw objects.
        
        Return exactly in the following JSON format:
        {{
          "score": 85,
          "content": "## Main Impacts...\n* **Saturn:** ...\n\n## Opportunities & Challenges...\n...",
          "cosmic_message": "..."
        }}
        """
        else:
            prompt = f"""
        Bạn là một chuyên gia Chiêm tinh học. Hãy đưa ra dự đoán NGẮN GỌN, SÚC TÍCH cho ngày {request.date}.
        
        {birth_context}
        
        LĨNH VỰC DỰ ĐOÁN: "{field_name}"
        
        YÊU CẦU ĐỊNH DẠNG (BẮT BUỘC):
        1. TIÊU ĐỀ CHÍNH: Phải bắt đầu bằng `# LUẬN GIẢI NĂNG LƯỢNG NGÀY {request.date}`.
        2. CÁC MỤC LỚN: Sử dụng `##` cho các tiêu đề phần (ví dụ: `## Năng lượng Chủ đạo`).
        3. NỘI DUNG:
           - Phân tích nhanh 2-3 tác động chính từ các hành tinh đến bản đồ sao gốc.
           - Điểm tin nhanh về cơ hội và thách thức trong lĩnh vực "{field_name}".
           - Đưa ra 2-3 lời khuyên hành động ngắn gọn.
           - Thông điệp vũ trụ (1 câu duy nhất).
           - Chấm điểm năng lượng (0-100).
        4. Trình bày bằng định dạng Markdown hoàn chỉnh. Không trả về mảng hay đối tượng.

        {{
          "score": 85,
          "content": "## Tác động chính...\n* **Sao Thổ:** ...\n\n## Cơ hội & Thách thức...\n...",
          "cosmic_message": "..."
        }}
        """
        
        response = await asyncio.to_thread(llm.invoke, prompt)
        content = str(response.content if hasattr(response, "content") else response)
        
        # Extract JSON
        result_data = {
            "score": 75,
            "content": content,
            "cosmic_message": "Trust in yourself." if lang == "en" else "Hãy tin vào bản thân."
        }

        # --- HỆ THỐNG BÓC TÁCH DỮ LIỆU ĐA LỚP ---
        try:
            # Lớp 1: Thử parse JSON chuẩn
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                raw_json = json_match.group(0)
                try:
                    parsed = json.loads(raw_json)
                    if "score" in parsed: result_data["score"] = parsed["score"]
                    if "cosmic_message" in parsed: result_data["cosmic_message"] = parsed["cosmic_message"]
                    if "content" in parsed: result_data["content"] = parsed["content"]
                except:
                    # Lớp 2: Parse thủ công bằng Regex nếu JSON lỗi (thường do xuống dòng)
                    score_match = re.search(r'"score":\s*(\d+)', raw_json)
                    if score_match: result_data["score"] = int(score_match.group(1))
                    
                    msg_match = re.search(r'"cosmic_message":\s*"(.*?)"', raw_json, re.DOTALL)
                    if msg_match: result_data["cosmic_message"] = msg_match.group(1)
                    
                    content_match = re.search(r'"content":\s*"(.*?)"', raw_json, re.DOTALL)
                    if content_match: 
                        result_data["content"] = content_match.group(1)
                    else:
                        result_data["content"] = raw_json
        except:
            pass

        # Lớp 3: Làm sạch và định dạng nội dung
        def final_cleanup(text):
            # Nếu là list (AI trả về mảng các ý), gộp lại thành văn bản Markdown
            if isinstance(text, list):
                formatted_parts = []
                for item in text:
                    if isinstance(item, dict):
                        title = item.get('title') or item.get('heading') or ""
                        points = item.get('points') or item.get('items') or []
                        if title:
                            formatted_parts.append(f"## {title}")
                        if isinstance(points, list):
                            for p in points:
                                formatted_parts.append(f"* {p}")
                        elif points:
                            formatted_parts.append(f"* {points}")
                        
                        # Trường hợp dict không có title/points nhưng có nội dung khác
                        if not title and not points:
                            formatted_parts.append(str(item))
                    else:
                        formatted_parts.append(str(item))
                text = "\n\n".join(formatted_parts)
                
            text = str(text or "").strip()
            if not text: return ""
            
            # Xóa các key JSON phổ biến nếu còn sót do lỗi bóc tách
            text = re.sub(r'"score":\s*\d+,?', "", text)
            text = re.sub(r'"cosmic_message":\s*".*?",?', "", text, flags=re.DOTALL)
            text = re.sub(r'"content":\s*"', "", text)
            
            # Chỉ xóa ngoặc nhọn nếu nó bao quanh toàn bộ nội dung (dấu hiệu JSON chưa sạch)
            if text.startswith('{') and text.endswith('}'):
                text = text[1:-1].strip()
            
            # Làm sạch các dấu ngoặc kép dư thừa ở đầu/cuối
            text = text.strip().strip('"').strip("'")
            # Xử lý các ký tự xuống dòng bị escape
            text = text.replace("\\n", "\n")
            
            return text.strip()

        result_data["content"] = final_cleanup(result_data.get("content"))

        # 3. LƯU LỊCH SỬ DỮ LIỆU CẤU TRÚC
        conv_title = f"[Daily Forecast] - Date {request.date}" if lang == "en" else f"[Vận Trình Ngày] - Ngày {request.date}"
        new_conv_id = await asyncio.to_thread(history_db.create_conversation, current_user["id"], title=conv_title)
        
        msg_user = f"View daily forecast for {request.date} - Field: {field_name}" if lang == "en" else f"Xem vận trình ngày {request.date} - Lĩnh vực: {field_name}"
        
        if lang == "en":
            msg_bot = f"# DAILY ENERGY INTERPRETATION {request.date}\n\n**Energy Score: {result_data['score']}/100**\n\n{result_data['content']}\n\n> ✨ **Cosmic Message:** {result_data['cosmic_message']}"
        else:
            msg_bot = f"# LUẬN GIẢI NĂNG LƯỢNG NGÀY {request.date}\n\n**Chỉ số năng lượng: {result_data['score']}/100**\n\n{result_data['content']}\n\n> ✨ **Thông điệp:** {result_data['cosmic_message']}"
        
        # Deduct tokens
        tokens = token_counter.count_tokens(prompt + content)
        cost = token_counter.calculate_cost(tokens)

        chart_data = {
            "prediction": result_data,
            "date": request.date,
            "field": field_name,
            "birth_info": request.birth_info
        }

        await asyncio.to_thread(
            history_db.save_chat_log,
            user_id=current_user["id"],
            conversation_id=new_conv_id,
            question=msg_user,
            answer=msg_bot,
            tokens_charged=cost,
            chart="prediction",
            chart_summary=chart_data,
            chart_svg=chart_svg
        )
        
        email = str(current_user.get("email") or "")
        if not current_user.get("is_admin"):
            new_balance = await asyncio.to_thread(
                token_counter.deduct_tokens,
                email=email,
                tokens=cost,
                description=f"Dự đoán ngày mới: {field_name}"
            )
        else:
            db_user = await asyncio.to_thread(user_db.get_by_email, email)
            new_balance = db_user.get("token_balance", 0) if db_user else 0

        return {
            "prediction": result_data,
            "chart_svg": chart_svg,
            "user_token_balance": new_balance,
            "tokens_charged": cost
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if token_counter: token_counter.close()
        if user_db: user_db.close()
        if history_db: history_db.close()
