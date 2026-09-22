from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.security.security import get_current_user
from chatbot.utils.llm import LLM
import asyncio
import os

router = APIRouter(tags=["Format Text"])

llm_name = os.environ.get("LLM_NAME")
llm = LLM().get_llm(llm_name)

class FormatTextRequest(BaseModel):
    text: str

@router.post("/format-rag-text")
async def format_rag_text(
    request: FormatTextRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        prompt = f"""Bạn là một chuyên gia chỉnh sửa và định dạng văn bản tài liệu tham khảo.
Nhiệm vụ của bạn là lấy đoạn văn bản thô (có thể bị lỗi font, dính chữ, khó đọc, thiếu xuống dòng) và định dạng lại cho thật đẹp mắt, dễ đọc, khoa học bằng Markdown.

Các quy tắc cần tuân thủ:
1. Sắp xếp lại cấu trúc với các Heading (ví dụ: ## Thời gian & Bối cảnh, ## Chi tiết sự kiện...).
2. Thêm xuống dòng, đoạn văn (paragraph) hợp lý để không bị dính một cục.
3. In đậm (bold) các từ khóa quan trọng, tên riêng, mốc thời gian, hoặc khái niệm chính.
4. TUYỆT ĐỐI KHÔNG tự bịa thêm thông tin ngoài đoạn văn bản gốc. Chỉ được sắp xếp và định dạng lại.
5. Xóa bỏ các ký tự rác hoặc thẻ HTML/Header thô thiển như [Header 1: ...].

VĂN BẢN THÔ CẦN ĐỊNH DẠNG:
{request.text}
"""
        response = await asyncio.to_thread(llm.invoke, prompt)
        formatted_text = response.content
        return {"formatted_text": formatted_text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
