import json
import re
import unicodedata


class GuardAgent:
    def __init__(self, llm):
        self.llm = llm

    def _normalize(self, text: str) -> str:
        text = (text or "").lower()
        text = unicodedata.normalize("NFD", text)
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        return text.replace("đ", "d")

    def _fast_decision(self, question: str):
        q = self._normalize(question)
        if not q.strip():
            return {"is_astrology": False, "confidence": 0}

        personal_markers = [
            "toi", "minh", "em", "anh", "chi", "tui", "ban than",
            "nguoi yeu", "doi tac", "vo", "chong", "crush"
        ]
        astrology_terms = [
            "chiem tinh", "cung hoang dao", "ban do sao", "natal",
            "mat troi", "mat trang", "cung moc", "sao kim", "sao hoa",
            "nha 1", "nha 2", "nha 3", "nha 4", "nha 5", "nha 6",
            "nha 7", "nha 8", "nha 9", "nha 10", "nha 11", "nha 12",
            "cung", "tu vi", "van han", "van trinh", "daily",
            "ngay sinh", "thang sinh", "nam sinh", "sao", "hom nay", "ngay mai"
        ]
        domain_terms = [
            "tinh yeu", "tinh cam", "hon nhan", "su nghiep", "cong viec",
            "viec lam", "nghe", "tai chinh", "tien bac", "suc khoe",
            "nang luong", "tinh cach", "diem manh", "diem yeu",
            "van menh", "hop voi", "phu hop"
        ]
        pure_offtopic_terms = [
            "viet code", "debug code", "lap trinh python", "javascript",
            "react", "sql", "database", "api", "html", "css",
            "lich su", "thoi tiet", "tin tuc", "phap luat"
        ]

        has_personal = any(k in q for k in personal_markers)
        has_domain = any(k in q for k in domain_terms)

        if any(k in q for k in astrology_terms):
            return {"is_astrology": True, "confidence": 0.98}

        if has_personal and has_domain:
            return {"is_astrology": True, "confidence": 0.95}

        if any(k in q for k in pure_offtopic_terms):
            return {"is_astrology": False, "confidence": 0.95}

        return None

    def _build_prompt(self, question: str) -> str:
        return f"""
Bạn là hệ thống kiểm duyệt thông minh.

========================
NHIỆM VỤ
========================
Xác định câu hỏi có thể trả lời bằng CHIÊM TINH hay không.

========================
ĐƯỢC PHÉP (TRUE)
========================
Bao gồm:

1. Chiêm tinh trực tiếp:
- cung hoàng đạo
- bản đồ sao
- hành tinh

2. Câu hỏi cá nhân có thể luận giải bằng chiêm tinh:
- "Hôm nay tôi thế nào?"
- "Tình yêu của tôi ra sao?"
- "Sức khỏe tôi ổn không?"
- "Công việc tôi thế nào?"

========================
KHÔNG ĐƯỢC PHÉP (FALSE)
========================
- Code, lập trình
- IT, kỹ thuật
- Hỏi kiến thức chuyên ngành
- Hỏi ngoài đời không liên quan cá nhân
- Hỏi về luật các luật
- Hỏi về lịch sử 

========================
QUY TẮC
========================
- Nếu câu hỏi liên quan đến bản thân người hỏi → TRUE
- Nếu có thể dùng chiêm tinh để trả lời → TRUE
- Nếu là kỹ thuật / code → FALSE

========================
CÂU HỎI
========================
"{question}"

========================
OUTPUT JSON:
{{
  "is_astrology": true/false,
  "confidence": 0-1
}}
"""

    def _extract_json(self, text: str):
        if not text:
            return None

        # remove markdown
        text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```", "", text)

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None

        try:
            return json.loads(match.group())
        except:
            return None

    def _fallback_rule(self, question: str) -> bool:
        """
        Rule backup để chống LLM ngu
        """
        blacklist = [
            "python", "code", "lập trình", "java", "c++",
            "api", "html", "css", "javascript", "react"
        ]
        q = (question or "").lower()
        return not any(k in q for k in blacklist)
    
    def _allow_personal_question(self, question: str) -> bool:
        keywords = [
            "tôi", "mình", "tình yêu", "sức khỏe",
            "hôm nay", "công việc", "tính cách"
        ]
        q = (question or "").lower()

        return any(k in q for k in keywords)
    def run(self, question: str):

        if not question or not question.strip():
            return {"is_astrology": False, "confidence": 0}

        fast = self._fast_decision(question)
        if fast is not None:
            return fast

        prompt = self._build_prompt(question)

        try:
            res = self.llm.invoke(prompt)
            content = res.content if hasattr(res, "content") else str(res)

            data = self._extract_json(content)

            if not data:
                return {"is_astrology": False, "confidence": 0}

            is_astro = bool(data.get("is_astrology", False))
            confidence = float(data.get("confidence", 0))

            # =========================
            # 🔥 FINAL DECISION (QUAN TRỌNG)
            # =========================
            if (
                not is_astro
                or confidence < 0.8
                or not self._fallback_rule(question)
            ):
                return {"is_astrology": False, "confidence": confidence}

            return {"is_astrology": True, "confidence": confidence}

        except Exception as e:
            print("GuardAgent error:", e)
            return {"is_astrology": False, "confidence": 0}
