import re
from typing import Dict, Any, List
from datetime import datetime
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.utils.astro_cache import get_astrological_subject

def calculate_aspects(natal_subject, transit_subject):
    aspects = []
    aspect_types = [
        {"name": "Trùng tụ (0°)", "angle": 0, "orb": 8},
        {"name": "Lục hợp (60°)", "angle": 60, "orb": 6},
        {"name": "Vuông góc (90°)", "angle": 90, "orb": 6},
        {"name": "Tam hợp (120°)", "angle": 120, "orb": 6},
        {"name": "Đối đỉnh (180°)", "angle": 180, "orb": 6}
    ]
    
    planets = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]
    
    for tp in planets:
        if not hasattr(transit_subject, tp): continue
        t_planet = getattr(transit_subject, tp)
        
        for np in planets:
            if not hasattr(natal_subject, np): continue
            n_planet = getattr(natal_subject, np)
            
            diff = abs(t_planet.abs_pos - n_planet.abs_pos)
            diff = min(diff, 360 - diff)
            
            for asp in aspect_types:
                if abs(diff - asp["angle"]) <= asp["orb"]:
                    aspects.append(f"Transit {t_planet.name} ({t_planet.sign}) tạo góc {asp['name']} với Natal {n_planet.name}")
                    
    return aspects

class DailyAgent:
    """
    DailyAgent:
    - Dự đoán tử vi hàng ngày
    """

    def __init__(self, llm_model):
        self.llm = llm_model
        self.conversation_history: List[Dict[str, str]] = []

    # =========================
    # DAILY PREDICTION
    # =========================
    def predict(self, birth_info: Dict[str, Any]) -> Dict[str, Any]:

        name = birth_info.get("name", "Người dùng")
        today = datetime.now().strftime("%d/%m/%Y")

        try:
            subject = get_astrological_subject(
                name,
                int(birth_info["year"]),
                int(birth_info["month"]),
                int(birth_info["day"]),
                int(birth_info.get("hour", 0)),
                int(birth_info.get("minute", 0)),
                birth_info.get("city", "Hanoi"),
                birth_info.get("country", "VN"),
            )
            
            # Tính Transit Chart cho ngày hôm nay
            now = datetime.now()
            transit_subject = get_astrological_subject(
                "Transit",
                now.year,
                now.month,
                now.day,
                now.hour,
                now.minute,
                birth_info.get("city", "Hanoi"),
                birth_info.get("country", "VN"),
            )

            sun_sign = subject.sun.sign
            moon_sign = subject.moon.sign
            asc = subject.ascendant.sign
            
            # Tính góc chiếu giữa Transit và Natal
            aspects = calculate_aspects(subject, transit_subject)
            aspects_str = "\n".join([f"- {asp}" for asp in aspects]) if aspects else "Không có góc chiếu đáng chú ý."

        except Exception as e:
            return {
                "interpretation": f"Không thể dự đoán tử vi: {str(e)}"
            }

        # =========================
        # PROMPT
        # =========================
        prompt = f"""
Bạn là chuyên gia dự đoán tử vi hàng ngày bằng thiên văn học.
📅 Ngày: {today}
Trạng thái tâm lý người dùng: {birth_info.get('emotion', 'trung tính')}

Thông tin Chiêm tinh (Natal Chart):
- Sun: {sun_sign}
- Moon: {moon_sign}
- Asc: {asc}

Sự kiện góc chiếu hôm nay (Transits vs Natal):
{aspects_str}

Câu hỏi người dùng: {birth_info.get("context", "")}

⚠️ QUY TẮC BẮT BUỘC (LOGIC & CHÍNH XÁC):
1. ĐỊNH HƯỚNG DỮ LIỆU: Tuyệt đối không được bịa đặt vị trí các hành tinh. Chỉ sử dụng dữ liệu được cung cấp ở các mục "Thông tin Chiêm tinh" và "Sự kiện góc chiếu hôm nay".
2. ĐIỀU CHỈNH GIỌNG ĐIỆU: Phản hồi phù hợp với trạng thái tâm lý "{birth_info.get('emotion', 'trung tính')}" của người dùng. Nếu họ lo âu/buồn bã, hãy đồng cảm. Nếu họ tò mò/trung tính, hãy phân tích khách quan.
3. TIÊU ĐỀ CHÍNH: Phải bắt đầu bằng `# LUẬN GIẢI NĂNG LƯỢNG NGÀY {today}`.
4. CÁC MỤC LỚN: Sử dụng `##` cho các tiêu đề phần (ví dụ: `## Năng lượng Chủ đạo`).
5. NỘI DUNG:
   - Dựa CHỦ YẾU vào thông số Transits góc chiếu bên trên để đưa ra dự đoán chính xác nhất.
   - Trả lời đúng trọng tâm về năng lượng và xu hướng ngày {today}.
   - Tuyệt đối không nhắc đến các thuật ngữ chiêm tinh kỹ thuật.
   - Đưa ra ít nhất 2 nhận định và 1 lời khuyên thực tế.
6. PHONG CÁCH: Markdown chuyên nghiệp, sạch sẽ, ngôn ngữ truyền cảm hứng.

Trả lời:
"""

        response = self.llm.invoke(prompt)

        answer = response.content if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer).strip()

        # Đảm bảo có tiêu đề H1 nếu AI quên
        if not answer.startswith("#"):
            answer = f"# LUẬN GIẢI NĂNG LƯỢNG NGÀY {today}\n\n" + answer

        return {
            "type":"daily",
            "agent": "daily",
            "interpretation": answer
        }

    # =========================
    # FOLLOW-UP CHAT
    # =========================
    def chat(self, question: str) -> str:

        history_text = ""

        for msg in self.conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Astrologer"
            history_text += f"{role}: {msg['content']}\n"

        prompt = f"""
Bạn là chuyên gia tử vi hàng ngày.

Dưới đây là cuộc hội thoại trước đó:
{history_text}

Người dùng hỏi thêm:
{question}
Trạng thái tâm lý hiện tại: {self.conversation_history[-1].get("emotion", "trung tính") if self.conversation_history else "trung tính"}

Yêu cầu:
- ĐIỀU CHỈNH GIỌNG ĐIỆU theo tâm lý người dùng.
- TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi, súc tích và dễ hiểu.
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
        print(f"   ☀️ [DailyAgent] - Đang phân tích vận trình ngày...")
        question = input_data.get("question", "").lower()

        # 🔥 FIX MEMORY
        birth_info = input_data.get("birth_info", {})
        memory = input_data.get("memory")

        if memory and isinstance(memory, dict):
            birth_info = {**birth_info, **memory}

        daily_keywords = [
            "hôm nay",
            "hôm nay tôi",
            "today",
            "ngày hôm nay",
            "hiện tại tôi",
            "dạo này tôi"
        ]

        future_keywords = [
            "sau",
            "tương lai",
            "bao giờ",
            "khi nào",
            "sau này",
            "30 tuổi",
            "sẽ không",
            "có không"
        ]

        if any(k in question for k in future_keywords):
            return {
                "type": "daily",
                "answer": ""
            }

        if not any(k in question for k in daily_keywords):
            return {
                "type": "daily",
                "answer": ""
            }

        return {
            "type": "daily",
            "answer": self.predict(
                birth_info={
                    **birth_info,  # 🔥 dùng memory
                    "context": input_data.get("question"),
                    "emotion": input_data.get("emotion", "trung tính"),
                    "raw_chart_data": input_data.get("raw_chart_data")
                }
            ).get("interpretation", "")
        }
