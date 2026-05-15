import re
import random
from typing import Dict, Any, List
from kerykeion import AstrologicalSubject, ChartDataFactory, ChartDrawer
from chatbot.utils.text_cleaner import normalize_markdown
from chatbot.utils.geo import get_coordinates
import os

def slugify(name: str):
    name = name.lower()
    name = re.sub(r"[àáạảãâầấậẩẫăằắặẳẵ]", "a", name)
    name = re.sub(r"[èéẹẻẽêềếệểễ]", "e", name)
    name = re.sub(r"[ìíịỉĩ]", "i", name)
    name = re.sub(r"[òóọỏõôồốộổỗơờớợởỡ]", "o", name)
    name = re.sub(r"[ùúụủũưừứựửữ]", "u", name)
    name = re.sub(r"[ỳýỵỷỹ]", "y", name)
    name = re.sub(r"đ", "d", name)
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"[^\w_]", "", name)
    return name

def save_chart(svg: str, name: str):
    if not svg: return None
    folder = "chatbot/output/chart"
    os.makedirs(folder, exist_ok=True)
    safe_name = slugify(name)
    filename = f"partner_{safe_name}.svg"
    path = os.path.join(folder, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    return path

def get_label(percent):
    if percent >= 80: return "Rất hợp 💖"
    elif percent >= 60: return "Khá hợp 💕"
    elif percent >= 40: return "Trung bình 🤝"
    else: return "Khó hòa hợp ⚠️"

def extract_chart(subject):
    return {
        "Sun": subject.sun.sign,
        "Moon": subject.moon.sign,
        "Mercury": subject.mercury.sign,
        "Venus": subject.venus.sign,
        "Mars": subject.mars.sign,
        "Jupiter": subject.jupiter.sign,
        "Saturn": subject.saturn.sign,
    }

class LoveAgent:
    def __init__(self, llm_model):
        self.llm = llm_model
        self.conversation_history: List[Dict[str, str]] = []
    
    def analyze(self, birth_info: Dict[str, Any], context: str = None, raw_chart_data: str = None) -> Dict[str, Any]:
        name = birth_info.get("name", "Người dùng")
        partner = birth_info.get("partner")

        try:
            lat1, lng1 = get_coordinates(birth_info.get("city", "Hanoi"), birth_info.get("country", "VN"))
            
            p1 = AstrologicalSubject(
                name,
                int(birth_info["year"]),
                int(birth_info["month"]),
                int(birth_info["day"]),
                int(birth_info.get("hour", 0)),
                int(birth_info.get("minute", 0)),
                city=birth_info.get("city", "Hanoi"),
                nation=birth_info.get("country", "VN"),
                lat=lat1, lng=lng1
            )

            if not partner:
                chart1 = extract_chart(p1)
                prompt = f"Tư vấn tình yêu cá nhân cho {name}. Dữ liệu: {chart1}. Yêu cầu phân tích sâu nhu cầu tình cảm."
                response = self.llm.invoke(prompt)
                answer = response.content if hasattr(response, "content") else str(response)
                answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
                # Đảm bảo gộp lại nếu AI trả về list
                if isinstance(answer, list):
                    answer = "\n".join([str(i) for i in answer])

                return {
                    "type": "love",
                    "answer": normalize_markdown(answer),
                    "interpretation": normalize_markdown(answer),
                    "compatibility": None,
                    "label": None,
                    "chart_svg": None,
                    "partner_chart_svg": None
                }

            lat2, lng2 = get_coordinates(partner.get("city", "Hanoi"), partner.get("country", "VN"))
            
            p2 = AstrologicalSubject(
                partner.get("name", "Đối tác"),
                int(partner["year"]),
                int(partner["month"]),
                int(partner["day"]),
                int(partner.get("hour", 0)),
                int(partner.get("minute", 0)),
                city=partner.get("city", "Hanoi"),
                nation=partner.get("country", "VN"),
                lat=lat2, lng=lng2
            )

            try:
                data1 = ChartDataFactory.create_natal_chart_data(p1.model())
                svg1 = ChartDrawer(data1, theme="dark").generate_svg_string(remove_css_variables=True)
            except: svg1 = None

            try:
                data2 = ChartDataFactory.create_natal_chart_data(p2.model())
                svg2 = ChartDrawer(data2, theme="dark").generate_svg_string(remove_css_variables=True)
                save_chart(svg2, p2.name)
            except: svg2 = None

            chart1 = extract_chart(p1)
            chart2 = extract_chart(p2)

            prompt = f"""
             Bạn là chuyên gia tư vấn tình cảm.

THÔNG TIN:
- Người 1: {p1.name} (Sinh {birth_info.get('day')}/{birth_info.get('month')}/{birth_info.get('year')})
- Người 2: {p2.name} (Sinh {partner.get('day')}/{partner.get('month')}/{partner.get('year')})
- Ngày hiện tại: {birth_info.get('current_date', 'N/A')}

Dữ liệu Chiêm tinh (Bắt buộc sử dụng làm cơ sở duy nhất):
{raw_chart_data if raw_chart_data else f"{p1.name}: {chart1}"}
{f"{p2.name}: {chart2}" if partner and not raw_chart_data else ""}

⚠️ QUY TẮC BẮT BUỘC (LOGIC & CHÍNH XÁC):
1. ĐỊNH HƯỚNG DỮ LIỆU: Tuyệt đối không được bịa đặt vị trí các hành tinh. Chỉ sử dụng dữ liệu được cung cấp ở mục "Dữ liệu Chiêm tinh".
2. ĐIỀU CHỈNH GIỌNG ĐIỆU: Phản hồi phù hợp với trạng thái tâm lý "{birth_info.get('emotion', 'trung tính')}" của người dùng. Nếu họ lo âu/buồn bã, hãy đồng cảm. Nếu họ tò mò/trung tính, hãy phân tích khách quan.
3. LOGIC: Dựa vào ngày sinh và ngày hiện tại, nhận diện độ tuổi để đưa ra lời khuyên phù hợp (teen, trưởng thành, trung niên).
4. HIERARCHY:
   - Tiêu đề chính duy nhất ở đầu bài dùng # (VD: # TƯƠNG HỢP TÌNH DUYÊN - {p1.name} & {p2.name}).
   - Các mục lớn dùng ##. KHÔNG sử dụng icon trong tiêu đề.
5. GIẢI THÍCH: CẦN giải thích chi tiết các thuật ngữ chiêm tinh (hành tinh, nhà, góc chiếu) để người dùng hiểu sâu sắc bản đồ sao của mình.
6. ĐỘ TƯƠNG HỢP: Hãy đưa ra một con số phần trăm tương hợp (ví dụ: 85%) và giải thích rõ ràng tại sao lại có con số đó dựa trên sự hòa hợp hoặc xung đột giữa các hành tinh của hai người.
7. MINIMALISM: KHÔNG lạm dụng in đậm (**). Sử dụng danh sách (-) để thông tin rõ ràng.

TIẾNG VIỆT 100%. TRẢ VỀ VĂN BẢN MARKDOWN TRỰC TIẾP.
"""

            response = self.llm.invoke(prompt)
            answer = response.content if hasattr(response, "content") else str(response)
            answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
            answer = normalize_markdown(answer).strip()

            match = re.search(r"(\d{1,3})%", answer)
            compatibility = int(match.group(1)) if match else random.randint(65, 85)
            label = get_label(compatibility)

            # Đảm bảo gộp lại nếu AI trả về list
            if isinstance(answer, list):
                answer = "\n".join([str(i) for i in answer])

            return {
                "type": "love",
                "answer": answer,
                "interpretation": answer,  # Thêm field này để khớp với chatbot.py
                "compatibility": compatibility,
                "label": label,
                "chart_svg": svg1,
                "partner_chart_svg": svg2
            }
        except Exception as e:
            print("LoveAgent Error:", e)
            return {"answer": "Lỗi phân tích chiêm tinh.", "type": "love"}

    def chat(self, question: str, chart1: dict, chart2: dict = None, name1: str = "User", name2: str = "Partner", emotion: str = "trung tính") -> str:
        history_text = ""
        for msg in self.conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Expert"
            history_text += f"{role}: {msg['content']}\n"

        context_data = f"- {name1}: {chart1}\n"
        if chart2: context_data += f"- {name2}: {chart2}\n"

        prompt = f"""
        Chuyên gia Tư vấn Tình cảm. 
        Dữ liệu bản đồ sao: {context_data}
        Lịch sử: {history_text}
        Câu hỏi: "{question}"

        ⚠️ QUY TẮC BẮT BUỘC:
        - ĐIỀU CHỈNH GIỌNG ĐIỆU: Phản hồi theo trạng thái tâm lý "{emotion}" của người dùng. Đồng cảm nếu họ buồn/lo âu, khách quan nếu họ tò mò.
        - TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi dưới góc độ tâm lý và tình cảm.
        - TUYỆT ĐỐI KHÔNG giải thích các yếu tố chiêm tinh kỹ thuật (hành tinh, nhà, góc chiếu).
        - Nếu hỏi cá nhân trả lời theo chart cá nhân, nếu hỏi cả hai trả lời kết hợp.
        - Trình bày bằng định dạng Markdown chuyên nghiệp, sạch sẽ: Sử dụng tiêu đề (##) nếu cần và danh sách (-) để thông tin rõ ràng. KHÔNG lạm dụng in đậm.
        """

        response = self.llm.invoke(prompt)
        answer = response.content if hasattr(response, "content") else str(response)
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = normalize_markdown(answer).strip()

        self.conversation_history.append({"role": "user", "content": question})
        self.conversation_history.append({"role": "assistant", "content": answer})
        return answer

    def run(self, input_data):
        print(f"   💘 [LoveAgent] - Đang phân tích tình duyên...")
        question = input_data.get("question")
        birth_info = input_data.get("birth_info", {})
        memory = input_data.get("memory")
        if memory and isinstance(memory, dict):
            birth_info = {**birth_info, **memory}

        birth_info["current_date"] = input_data.get("current_date")
        birth_info["emotion"] = input_data.get("emotion", "trung tính")

        try:
            lat1, lng1 = get_coordinates(birth_info.get("city", "Hanoi"), birth_info.get("country", "VN"))
            
            p1 = AstrologicalSubject(
                birth_info["name"], 
                int(birth_info["year"]), 
                int(birth_info["month"]), 
                int(birth_info["day"]), 
                int(birth_info.get("hour", 0)), 
                int(birth_info.get("minute", 0)), 
                city=birth_info.get("city", "Hanoi"),
                nation=birth_info.get("country", "VN"),
                lat=lat1, lng=lng1
            )
            chart1 = extract_chart(p1)
            p2 = None
            chart2 = None
            partner = birth_info.get("partner")
            if partner:
                lat2, lng2 = get_coordinates(partner.get("city", "Hanoi"), partner.get("country", "VN"))
                
                p2 = AstrologicalSubject(
                    partner["name"], 
                    int(partner["year"]), 
                    int(partner["month"]), 
                    int(partner["day"]), 
                    int(partner.get("hour", 0)), 
                    int(partner.get("minute", 0)), 
                    city=partner.get("city", "Hanoi"),
                    nation=partner.get("country", "VN"),
                    lat=lat2, lng=lng2
                )
                chart2 = extract_chart(p2)
        except Exception as e:
            print("LoveAgent Run Error:", e)
            return {
                "answer": f"Lỗi dữ liệu: {str(e)}", 
                "interpretation": f"Lỗi dữ liệu: {str(e)}",
                "type": "love"
            }

        if question:
            return {
                "type": "love",
                "answer": self.chat(question, chart1, chart2, p1.name, p2.name if p2 else "Đối tác", birth_info.get("emotion", "trung tính"))
            }
        return self.analyze(birth_info, raw_chart_data=input_data.get("raw_chart_data"))