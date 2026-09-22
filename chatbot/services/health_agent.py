import re
from typing import Dict, Any, List
from kerykeion.utilities import get_house_number
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.utils.astro_cache import get_astrological_subject

class HealthAgent:
    """
    HealthAgent:
    - Phân tích sức khỏe, thói quen, năng lượng
    - Focus: House 6 + Moon + Mars
    """

    def __init__(self, llm_model):
        self.llm = llm_model
        self.conversation_history: List[Dict[str, str]] = []

    # =========================
    # MAIN ANALYZE
    # =========================
    def analyze(self, birth_info: Dict[str, Any], context: str, raw_chart_data: str | None = None) -> Dict[str, Any]:

        name = birth_info.get("name", "Người dùng")
        lang = birth_info.get("language", "vi")

        try:
            subject = None if raw_chart_data else get_astrological_subject(
                name,
                int(birth_info["year"]),
                int(birth_info["month"]),
                int(birth_info["day"]),
                int(birth_info.get("hour", 0)),
                int(birth_info.get("minute", 0)),
                birth_info.get("city", "Hanoi"),
                birth_info.get("country", "VN"),
            )

            def get_house(p):
                try:
                    return get_house_number(p.house) if p.house else 0
                except:
                    return 0

            health_data_to_use = ""
            if raw_chart_data:
                health_data_to_use = raw_chart_data
            elif subject is not None:
                # Fallback nếu không có raw_chart_data từ Orchestrator
                health_data = {
                    "Moon": f"{getattr(subject.moon, 'sign', '')} (Nhà {get_house(subject.moon)})",
                    "Mars": f"{getattr(subject.mars, 'sign', '')} (Nhà {get_house(subject.mars)})",
                    "House 6": getattr(subject.sixth_house, 'sign', None) if getattr(subject, 'sixth_house', None) else None
                }
                health_data_to_use = str(health_data)

        except Exception as e:
            return {
                "interpretation": f"Could not analyze health: {str(e)}" if lang == "en" else f"Không thể phân tích sức khỏe: {str(e)}"
            }

        # =========================
        # PROMPT (QUAN TRỌNG)
        # =========================
        if lang == "en":
            prompt = f"""
 You are a health and energy advisor based on astrology.

USER INFO:
- Name: {name}
- Birthdate: {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')}
- Current Date: {birth_info.get('current_date', 'N/A')}

Astrological Data (Must be used as the sole basis):
{health_data_to_use}

User asks:
"{context}"

⚠️ MANDATORY RULES (LOGIC & ACCURACY):
1. LOGIC CHECK: Based on the birthdate and current date, recognize the user's age.
   - If the question is about the past, analyze past tendencies or long-term impacts.
   - If the question is about the future, provide forecasts.
   - Always reply based on the user's current age.
2. DATA-BASED: Absolutely do not fabricate planetary positions. Only use the data provided in "Astrological Data".
3. TRẢ LỜI ĐÚNG TRỌNG TÂM: Only focus on health, energy, and well-being.
4. NO TECHNICAL TERMS: Absolutely DO NOT mention or explain technical astrology terms (planets, houses, zodiac signs, aspects). Focus entirely on practical health, energy, and lifestyle advice.
5. FORMATTING: Use professional Markdown (##, -). DO NOT overuse bold formatting.

Answer in English:
"""
        else:
            prompt = f"""
 Bạn là chuyên gia tư vấn sức khỏe và năng lượng dựa trên chiêm tinh học.

THÔNG TIN NGƯỜI DÙNG:
- Tên: {name}
- Ngày sinh: {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')}
- Ngày hiện tại: {birth_info.get('current_date', 'N/A')}

Dữ liệu Chiêm tinh (Bắt buộc sử dụng làm cơ sở duy nhất):
{health_data_to_use}

User hỏi:
"{context}"

⚠️ QUY TẮC BẮT BUỘC (LOGIC & CHÍNH XÁC):
1. KIỂM TRA TÍNH LOGIC: Dựa vào ngày sinh và ngày hiện tại, hãy xác định xem câu hỏi của user có hợp lý về mặt thời gian không.
   - Ví dụ: Nếu user sinh năm 2003 và hỏi về "sau 10 tuổi" (tức là từ năm 2013), hãy nhận biết đây là một giai đoạn TRONG QUÁ KHỨ.
   - Nếu câu hỏi về quá khứ, hãy trả lời theo hướng phân tích xu hướng đã diễn ra hoặc ảnh hưởng lâu dài.
   - Nếu câu hỏi về tương lai, hãy đưa ra dự báo.
2. DỰA TRÊN DỮ LIỆU: Tuyệt đối không được bịa đặt vị trí các hành tinh. Chỉ sử dụng dữ liệu được cung cấp ở mục "Dữ liệu Chiêm tinh".
3. TRẢ LỜI ĐÚNG TRỌNG TÂM: Chỉ tập trung vào sức khỏe và năng lượng.
4. TUYỆT ĐỐI KHÔNG nhắc đến hoặc giải thích các thuật ngữ chiêm tinh kỹ thuật (hành tinh, nhà, cung hoàng đạo, góc chiếu). Hãy tập trung hoàn toàn vào các khía cạnh sức khỏe, năng lượng và thói quen sinh hoạt thực tế.
5. ĐỊNH DẠNG: Sử dụng Markdown chuyên nghiệp (##, -). KHÔNG lạm dụng in đậm.

Trả lời:
"""

        response = self.llm.invoke(prompt)
        answer = response.content if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer).strip()

        return {
            "type": "health",
            "answer": answer
        }

    # =========================
    # RUN
    # =========================
    def run(self, input_data):
        print(f"   🌿 [HealthAgent] - Đang phân tích sức khỏe...")
        birth_info = input_data.get("birth_info", {})
        memory = input_data.get("memory")

        if memory and isinstance(memory, dict):
            birth_info = {**birth_info, **memory}

        birth_info["current_date"] = input_data.get("current_date")

        return self.analyze(
            birth_info=birth_info,
            context=input_data.get("question"),
            raw_chart_data=input_data.get("raw_chart_data")
        )
