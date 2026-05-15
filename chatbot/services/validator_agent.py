import re
import json


class ValidatorAgent:
    def __init__(self, llm):
        self.llm = llm

    # =========================
    # 🤖 LLM REFINE
    # =========================
    def _llm_refine(self, text: str) -> str:
        prompt = f"""
Bạn là chuyên gia biên tập nội dung và thiết kế trải nghiệm văn bản (UX Writing) cấp cao.

NHIỆM VỤ: Biến văn bản thô thành một bản luận giải có thẩm mỹ cao, chuyên nghiệp và cuốn hút.

1. CHUẨN HÓA CẤU TRÚC (Hierarchy): 
   - Tiêu đề chính duy nhất ở đầu bài dùng # (Ví dụ: # LUẬN GIẢI BẢN ĐỒ SAO).
   - Các mục lớn dùng ## (Ví dụ: ## Tổng quan). KHÔNG sử dụng icon trong tiêu đề.
   - Các mục nhỏ dùng ###.
2. TỐI ƯU TRÌNH BÀY (Minimalism):
   - TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi của người dùng.
   - Trình bày văn bản TỰ NHIÊN, sạch sẽ và thanh lịch.
   - KHÔNG lạm dụng in đậm (**). Chỉ sử dụng khi thực sự cần thiết cho tiêu đề hoặc từ khóa cực kỳ quan trọng.
   - Sử dụng danh sách gạch đầu dòng (-) hoặc số để thông tin rõ ràng.
   - Đảm bảo khoảng cách giữa các đoạn (spacing) thoáng đãng, dễ đọc.
3. LOẠI BỎ RÁC (No Metadata): 
   - Tuyệt đối xóa mọi ký tự JSON (Ví dụ: `{{"chart": ...}}`), code block, hoặc các ghi chú kỹ thuật.
   - TRẢ VỀ NỘI DUNG VĂN BẢN TRỰC TIẾP. KHÔNG ĐƯỢC MỞ ĐẦU BẰNG {{"chart": ...}} HOẶC BẤT KỲ DẤU NGOẶC NHỌN NÀO.

NỘI DUNG CẦN BIÊN TẬP:
{text}

YÊU CẦU: Chỉ trả về văn bản Markdown sạch, đẹp, KHÔNG có cấu trúc JSON, KHÔNG bọc trong dấu nháy. KHÔNG trả lời thêm bất kỳ câu nào khác nằm ngoài việc hoàn thiện format.
"""

        try:
            res = self.llm.invoke(prompt)
            content = res.content if hasattr(res, "content") else str(res)
            # Remove any thinking blocks if present
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            
            # Xóa các block code markdown json
            content = re.sub(r"```(json|markdown)?\n", "", content).replace("\n```", "").strip()

            # Xóa sạch các dấu vết JSON nếu AI lỡ tay để lại (Surgical Strip)
            if '{"chart"' in content.replace(' ', '') or '{"answer"' in content.replace(' ', ''):
                match = re.search(r'"(?:chart|answer)"\s*:\s*"(.*?)"(?:\s*,|\s*\})', content, re.DOTALL)
                if match:
                    content = match.group(1)
                else:
                    # Loại bỏ chuỗi `{ "chart": "` hoặc tương tự ở bất kỳ đâu
                    content = re.sub(r'\{\s*"(?:chart|answer)"\s*:\s*"?\s*', '', content)
                    content = re.sub(r'"?\s*\}?$', '', content.strip())

            # Cleanup thô nếu vẫn còn dấu ngoặc nhọn ở đầu/cuối
            if content.startswith('{') and content.endswith('}'):
                content = content[1:-1].strip()

            content = content.strip(' "')
            return content
        except:
            return text

    # =========================
    # 🚀 MAIN
    # =========================
    def run(self, text: str):
        if not text: return ""

        # 1. Clear JSON strings if exist
        text = text.strip()
        text = text.replace("```json", "").replace("```markdown", "").replace("```", "").strip()
        
        # 🛡️ Robust Extraction: Tìm nội dung trong nháy kép sau key "chart" hoặc "answer"
        chart_match = re.search(r'"chart"\s*:\s*"(.*?)"(?:\s*,|\s*\})', text, re.DOTALL)
        answer_match = re.search(r'"answer"\s*:\s*"(.*?)"(?:\s*,|\s*\})', text, re.DOTALL)
        
        if chart_match:
            text = chart_match.group(1)
        elif answer_match:
            text = answer_match.group(1)
        elif '{"chart"' in text.replace(' ', '') or '{"answer"' in text.replace(' ', ''):
            try:
                data = json.loads(text)
                text = data.get("chart", data.get("answer", text))
            except:
                # Nếu không loads được JSON, ép cắt chuỗi
                text = re.sub(r'\{\s*"(?:chart|answer)"\s*:\s*"?\s*', '', text)
                text = re.sub(r'"?\s*\}?$', '', text.strip())

        # Tránh đưa chuỗi bắt đầu bằng JSON vào LLM
        text = re.sub(r'\{\s*"(?:chart|answer)"\s*:\s*"?\s*', '', text)

        # 2. LLM Refine
        refined = self._llm_refine(text)

        # 3. Final Post-process
        refined = refined.replace("\\n", "\n")
        refined = re.sub(r"\n{3,}", "\n\n", refined)
        
        # Một lần nữa, đề phòng lỗi còn sót lại vô điều kiện
        refined = re.sub(r'\{\s*"(?:chart|answer|response|text)"\s*:\s*"?\s*', '', refined)
        refined = re.sub(r'"?\s*\}\s*$', '', refined.strip())
        
        # Có thể AI lỗi trả về '```' hoặc 'json\n'
        if refined.lower().startswith("json\n"):
            refined = refined[5:]
        if refined.startswith("```"):
            refined = refined.strip("`").strip()
            
        return refined.strip()