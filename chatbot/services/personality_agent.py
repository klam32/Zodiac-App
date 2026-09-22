import re
from typing import Dict, Any, List
from kerykeion.utilities import get_house_number
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.utils.astro_cache import get_astrological_subject

class PersonalityAgent:
    """
    PersonalityAgent:
    - Phân tích tính cách dựa trên bản đồ sao
    - Dùng Sun, Moon, Ascendant + hành tinh
    """

    def __init__(self, llm_model):
        self.llm = llm_model
        self.conversation_history: List[Dict[str, str]] = []

    # =========================
    # ANALYZE PERSONALITY
    # =========================
    def analyze(self, birth_info: Dict[str, Any], raw_chart_data: str | None = None) -> Dict[str, Any]:

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

            # =========================
            # EXTRACT DATA
            # =========================
            def get_house(p):
                try:
                    return get_house_number(p.house) if p.house else 0
                except:
                    return 0

            chart_data_to_use = ""
            if raw_chart_data:
                chart_data_to_use = raw_chart_data
            elif subject is not None:
                # Fallback nếu không có raw_chart_data từ Orchestrator
                chart_data = {
                    "Sun": f"{getattr(subject.sun, 'sign', '')} (Nhà {get_house(subject.sun)})",
                    "Moon": f"{getattr(subject.moon, 'sign', '')} (Nhà {get_house(subject.moon)})",
                    "Ascendant": getattr(subject.ascendant, 'sign', ''),
                    "Mercury": getattr(subject.mercury, 'sign', ''),
                    "Venus": getattr(subject.venus, 'sign', ''),
                    "Mars": getattr(subject.mars, 'sign', '')
                }
                chart_data_to_use = str(chart_data)

        except Exception as e:
            return {
                "interpretation": f"Could not analyze personality: {str(e)}" if lang == "en" else f"Không thể phân tích tính cách: {str(e)}"
            }

        # =========================
        # PROMPT
        # =========================
        if lang == "en":
            prompt = f"""
 You are a psychological and behavioral analysis expert based on astrology.

USER INFO:
- Name: {name}
- Birthdate: {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')}
- Current Date: {birth_info.get('current_date', 'N/A')}

User asks:
"{birth_info.get("context")}"

Astrological Data (Must be used as the sole basis):
{chart_data_to_use}

⚠️ MANDATORY RULES (LOGIC & ACCURACY):
1. LOGIC CHECK: Based on the birthdate and current date, recognize the user's age.
   - If the question is about the past, analyze the formation of personality.
   - Always reply based on psychological maturity at the current age.
2. DATA-BASED: Absolutely do not fabricate planetary positions. Only use the data provided in "Astrological Data".
3. TRẢ LỜI ĐÚNG TRỌNG TÂM: Only focus on psychology and personality.
4. NO TECHNICAL TERMS: Absolutely DO NOT mention or explain technical astrology terms (planets, houses, zodiac signs, aspects). Focus entirely on practical psychological insights and advice.
5. FORMATTING: Use professional Markdown (##, -). DO NOT overuse bold formatting.

Answer in English:
"""
        else:
            prompt = f"""
 Bạn là chuyên gia phân tích tâm lý và hành vi dựa trên chiêm tinh học.

THÔNG TIN NGƯỜI DÙNG:
- Tên: {name}
- Ngày sinh: {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')}
- Ngày hiện tại: {birth_info.get('current_date', 'N/A')}

User hỏi:
"{birth_info.get("context")}"

Dữ liệu Chiêm tinh (Bắt buộc sử dụng làm cơ sở duy nhất):
{chart_data_to_use}

⚠️ QUY TẮC BẮT BUỘC (LOGIC & CHÍNH XÁC):
1. KIỂM TRA TÍNH LOGIC: Dựa vào ngày sinh và ngày hiện tại, hãy nhận diện độ tuổi của người dùng.
   - Nếu câu hỏi về quá khứ, hãy phân tích sự hình thái tính cách.
   - Luôn trả lời dựa trên sự trưởng thành tâm lý ở độ tuổi hiện tại.
2. DỰA TRÊN DỮ LIỆU: Tuyệt đối không được bịa đặt vị trí các hành tinh. Chỉ sử dụng dữ liệu được cung cấp ở mục "Dữ liệu Chiêm tinh".
3. TRẢ LỜI ĐÚNG TRỌNG TÂM: Chỉ tập trung vào tâm lý và tính cách.
4. TUYỆT ĐỐI KHÔNG nhắc đến hoặc giải thích các thuật ngữ chiêm tinh kỹ thuật (hành tinh, nhà, cung hoàng đạo, góc chiếu). Hãy tập trung hoàn toàn vào các khía cạnh tâm lý và lời khuyên thực tế.
5. ĐỊNH DẠNG: Sử dụng Markdown chuyên nghiệp (##, -). KHÔNG lạm dụng in đậm.

Trả lời:
"""

        response = self.llm.invoke(prompt)

        answer = response.content if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer)
        answer = answer.strip()

        return {
            "type": "personality",
            "agent": "personality",
            "interpretation": answer
        }

    # =========================
    # FOLLOW-UP CHAT
    # =========================
    def chat(self, question: str, lang: str = "vi") -> str:

        history_text = ""

        for msg in self.conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Psychologist"
            history_text += f"{role}: {msg['content']}\n"

        if lang == "en":
            prompt = f"""
You are a psychological analysis expert.

Here is the previous conversation:
{history_text}

The user asks further:
{question}

Requirements:
- ANSWER TO THE POINT from a practical psychological perspective.
- ABSOLUTELY DO NOT mention technical astrology terms.
- Present in clean, professional Markdown: Use headings (##) if needed and lists (-) for clarity. Do NOT overuse bold formatting.

Answer in English:
"""
        else:
            prompt = f"""
Bạn là chuyên gia phân tích tâm lý.

Dưới đây là cuộc hội thoại trước đó:
{history_text}

Người dùng hỏi thêm:
{question}

Yêu cầu:
- TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi dưới góc độ tâm lý học thực tế.
- TUYỆT ĐỐI KHÔNG nhắc đến các thuật ngữ chiêm tinh kỹ thuật.
- Trình bày bằng định dạng Markdown chuyên nghiệp, sạch sẽ: Sử dụng tiêu đề (##) nếu cần và danh sách (-) để thông tin rõ ràng. KHÔNG lạm dụng in đậm.

Trả lời:
"""

        response = self.llm.invoke(prompt)

        answer = response.content if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer).strip()

        self.conversation_history.append({
            "role": "user",
            "content": question
        })

        self.conversation_history.append({
            "role": "assistant",
            "content": answer
        })

        return answer
    
    def run(self, input_data):
        print(f"   🧠 [PersonalityAgent] - Đang phân tích tâm lý...")
        birth_info = input_data.get("birth_info", {})
        memory = input_data.get("memory")

        # 🔥 FIX QUAN TRỌNG
        if memory and isinstance(memory, dict):
            birth_info = {**birth_info, **memory}

        birth_info["current_date"] = input_data.get("current_date")

        return {
            "type": "personality",
            "answer": self.analyze(
                birth_info={
                    **birth_info,
                    "context": input_data.get("question")
                },
                raw_chart_data=input_data.get("raw_chart_data")
            ).get("interpretation", "")
        }
