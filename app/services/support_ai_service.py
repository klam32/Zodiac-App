import os
from typing import Optional
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage

class SupportAIService:
    def __init__(self):
        project_id = os.getenv("PROJECT_ID")
        location = os.getenv("LOCATION", "us-central1")
        model_name = os.getenv("VERTEX_MODEL_NAME", "gemini-1.5-flash")
        
        # Initialize Vertex AI if not already initialized
        import vertexai
        try:
            vertexai.init(project=project_id, location=location)
        except Exception:
            pass
            
        try:
            self.llm: Optional[ChatVertexAI] = ChatVertexAI(
                model=model_name,
                temperature=0.2,
                max_output_tokens=1024,
            )
        except Exception:
            self.llm = None

    def get_support_reply(self, message: str, language: str = "vi") -> str:
        if not self.llm:
            if language == "vi":
                return "[Trợ lý AI đang hỗ trợ tạm thời khi admin chưa online]\n\nXin lỗi bạn, trợ lý AI hiện đang gặp sự cố kết nối. Vui lòng chờ admin online hoặc gửi báo cáo sự cố qua hệ thống nạp tiền."
            else:
                return "[AI Assistant is assisting temporarily while admin is offline]\n\nSorry, the AI Assistant is currently experiencing connection issues. Please wait for the admin to get online or submit an issue report."

        prompt_vi = """Bạn là Trợ lý AI hỗ trợ khách hàng của Zodiac Whisper.
Admin hiện đang offline, bạn hỗ trợ tạm thời cho người dùng.

Nhiệm vụ:
- Trả lời ngắn gọn, lịch sự, dễ hiểu.
- Hướng dẫn người dùng xử lý sự cố.
- Nếu liên quan thanh toán/token, hướng dẫn người dùng gửi báo cáo sự cố kèm mã hóa đơn, mã giao dịch và ảnh minh chứng.
- Không được tự xác nhận đã cộng token.
- Không được nói rằng bạn là admin.
- Luôn nói rõ nếu vấn đề cần admin kiểm tra.
- Trả lời theo ngôn ngữ hiện tại của người dùng: tiếng Việt.

Knowledge cơ bản:
- Người dùng có thể nạp token ở mục "Nạp Tokens".
- Nếu đã thanh toán nhưng chưa nhận token, người dùng cần gửi "Báo cáo sự cố & thanh toán" (trong mục hỗ trợ thanh toán hoặc tài khoản).
- Báo cáo nên có tiêu đề, mã hóa đơn, mã giao dịch, nội dung và ảnh minh chứng.
- Admin sẽ kiểm tra và phản hồi qua email.
- Token dùng để sử dụng các tính năng AI như bản đồ sao, vận trình ngày, lịch cát tường và chatbot.
"""

        prompt_en = """You are the AI Support Assistant of Zodiac Whisper.
The admin is currently offline, so you are assisting the user temporarily.

Tasks:
- Reply concisely, politely, and clearly.
- Guide the user on how to resolve their issue.
- If it relates to payments/tokens, guide the user to submit an issue report with invoice code, transaction code, and evidence screenshot.
- Never confirm that tokens have been added by you.
- Do not claim that you are the real admin.
- Always make it clear if the issue needs admin inspection.
- Reply in the user's language: English.

Core Knowledge:
- Users can top up tokens in the "Deposit Tokens" section.
- If paid but tokens are not received, users should send a "Payment & Issue Report".
- The report should include title, invoice code, transaction code, details, and attachment screenshot.
- Admin will verify and reply via email.
- Tokens are used for AI features like birth chart interpretation, daily prediction, auspicious calendar, and chatbot.
"""
        
        system_prompt = prompt_vi if language == "vi" else prompt_en
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]
        
        try:
            response = self.llm.invoke(messages)
            prefix = "[Trợ lý AI đang hỗ trợ tạm thời khi admin chưa online]\n\n" if language == "vi" else "[AI Assistant is assisting temporarily while admin is offline]\n\n"
            return prefix + str(response.content)
        except Exception as e:
            print("Support AI Error:", e)
            if language == "vi":
                return "[Trợ lý AI đang hỗ trợ tạm thời khi admin chưa online]\n\nCó lỗi xảy ra khi xử lý phản hồi. Vui lòng thử lại sau hoặc chờ admin phản hồi trực tiếp."
            else:
                return "[AI Assistant is assisting temporarily while admin is offline]\n\nAn error occurred while generating the reply. Please try again later or wait for the admin's response."
