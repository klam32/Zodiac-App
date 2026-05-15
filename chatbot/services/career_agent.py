import re
from typing import Dict, Any, List
from kerykeion import AstrologicalSubject
from kerykeion.utilities import get_house_number
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.utils.geo import get_coordinates

class CareerAgent:
    """
    CareerAgent:
    - Phân tích sự nghiệp & tài chính dựa trên bản đồ sao
    - Focus: House 2, 6, 10 + Jupiter, Saturn, Mars
    """

    def __init__(self, llm_model):
        self.llm = llm_model
        self.conversation_history: List[Dict[str, str]] = []

    # =========================
    # MAIN ANALYZE
    # =========================
    def analyze(self, birth_info: Dict[str, Any], context: str, raw_chart_data: str = None) -> Dict[str, Any]:

        name = birth_info.get("name", "Người dùng")

        try:
            lat, lng = get_coordinates(birth_info.get("city", "Hanoi"), birth_info.get("country", "VN"))
            
            subject = AstrologicalSubject(
                name,
                int(birth_info["year"]),
                int(birth_info["month"]),
                int(birth_info["day"]),
                int(birth_info.get("hour", 0)),
                int(birth_info.get("minute", 0)),
                city=birth_info.get("city", "Hanoi"),
                nation=birth_info.get("country", "VN"),
                lat=lat, lng=lng
            )

            # =========================
            # HELPER
            # =========================
            def get_house(p):
                try:
                    return get_house_number(p.house) if p.house else 0
                except:
                    return 0

            # =========================
            # EXTRACT CAREER DATA
            # =========================
            if raw_chart_data:
                chart_data_str = raw_chart_data
            else:
                # Fallback nếu không có dữ liệu truyền vào
                planets_keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"]
                planets_list = [getattr(subject, k) for k in planets_keys if getattr(subject, k)]
                houses_keys = ["first_house","second_house","third_house","fourth_house","fifth_house","sixth_house","seventh_house","eighth_house","ninth_house","tenth_house","eleventh_house","twelfth_house"]
                houses_list = [getattr(subject, k) for k in houses_keys if getattr(subject, k)]
                
                planets_str = [f"- {p.name}: {p.sign}" for p in planets_list]
                houses_str = [f"- {h.name}: {h.sign}" for h in houses_list]
                chart_data_str = f"Ascendant: {subject.ascendant.sign}\nPlanets:\n" + "\n".join(planets_str) + "\nHouses:\n" + "\n".join(houses_str)

        except Exception as e:
            return {
                "interpretation": f"Không thể phân tích sự nghiệp: {str(e)}"
            }

        # =========================
        # PROMPT
        # =========================
        prompt = f"""
 Bạn là chuyên gia định hướng nghề nghiệp và tài chính dựa trên chiêm tinh học.

THÔNG TIN NGƯỜI DÙNG:
- Tên: {name}
- Ngày sinh: {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')}
- Ngày hiện tại: {birth_info.get('current_date', 'N/A')}
- Trạng thái tâm lý hiện tại: {birth_info.get('emotion', 'trung tính')}

User hỏi:
"{context}"

Thông tin Chiêm tinh (Bắt buộc sử dụng làm cơ sở duy nhất):
{chart_data_str}

⚠️ QUY TẮC BẮT BUỘC (LOGIC & CHÍNH XÁC):
1. ĐIỀU CHỈNH GIỌNG ĐIỆU: Phản hồi phù hợp với trạng thái tâm lý của người dùng. Nếu họ lo âu/buồn bã, hãy đồng cảm và động viên. Nếu họ tò mò/trung tính, hãy phân tích khách quan và chuyên nghiệp.
2. KIỂM TRA TÍNH LOGIC: Dựa vào ngày sinh và ngày hiện tại, hãy xác định xem câu hỏi của user có hợp lý về mặt thời gian không.
   - Ví dụ: Nếu user sinh năm 2003 và hỏi về "định hướng sự nghiệp khi 5 tuổi", hãy nhận biết đây là một giai đoạn ĐÃ QUA và có thể không hợp lý để hỏi về "định hướng".
   - Luôn trả lời dựa trên độ tuổi hiện tại của người dùng.
4. DỰA TRÊN DỮ LIỆU: Tuyệt đối không được bịa đặt vị trí các hành tinh. Chỉ sử dụng dữ liệu được cung cấp ở mục "Thông tin Chiêm tinh".
5. TUYỆT ĐỐI KHÔNG nhắc đến hoặc giải thích các thuật ngữ chiêm tinh kỹ thuật (hành tinh, nhà, cung hoàng đạo, góc chiếu). Hãy tập trung hoàn toàn vào các khía cạnh định hướng sự nghiệp và tài chính thực tế.
5. ĐỊNH DẠNG: Sử dụng Markdown chuyên nghiệp (##, -). KHÔNG lạm dụng in đậm.

Trả lời:
"""

        response = self.llm.invoke(prompt)

        answer = response.content if hasattr(response, "content") else str(response)

        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer)
        answer = answer.strip()

        return {
            "type": "career",
            "agent": "career",
            "interpretation": answer
        }

    # =========================
    # FOLLOW-UP CHAT
    # =========================
    def chat(self, question: str) -> str:

        history_text = ""

        for msg in self.conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Career Expert"
            history_text += f"{role}: {msg['content']}\n"

        prompt = f"""
 Bạn là chuyên gia định hướng nghề nghiệp.

Dưới đây là cuộc hội thoại trước đó:
{history_text}

Người dùng hỏi thêm:
{question}

Yêu cầu:
- TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi, mang tính định hướng sự nghiệp thực tế.
- TUYỆT ĐỐI KHÔNG nhắc đến các thuật ngữ chiêm tinh kỹ thuật.
- Trình bày bằng định dạng Markdown chuyên nghiệp, sạch sẽ: Sử dụng tiêu đề (##) nếu cần và danh sách (-) để thông tin rõ ràng. KHÔNG lạm dụng in đậm.
- Tiếp nối mạch hội thoại tự nhiên.

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
        print(f"   💼 [CareerAgent] - Đang phân tích sự nghiệp...")
        birth_info = input_data.get("birth_info", {})
        memory = input_data.get("memory")

        if memory and isinstance(memory, dict):
            birth_info = {**birth_info, **memory}

        birth_info["current_date"] = input_data.get("current_date")
        birth_info["emotion"] = input_data.get("emotion", "trung tính")

        return {
            "type": "career",
            "answer": self.analyze(
                birth_info=birth_info,
                context=input_data.get("question"),
                raw_chart_data=input_data.get("raw_chart_data")
            ).get("interpretation", "")
        }