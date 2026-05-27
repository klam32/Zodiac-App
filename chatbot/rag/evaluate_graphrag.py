import os
import sys
import time
import google.generativeai as genai

# Thêm đường dẫn project vào sys.path để import các module local
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from chatbot.rag.knowledge_graph import get_astrology_kg, extract_astrology_entities

# Cấu hình API Key (Lấy từ biến môi trường hoặc thay trực tiếp)
# Mặc định lấy từ os.environ, nếu không có bạn hãy thay "YOUR_API_KEY" bằng key thật.
API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY")
genai.configure(api_key=API_KEY)

def call_llm(prompt: str) -> str:
    """
    Gọi Google Vertex AI / Gemini API.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[LỖI KHI GỌI GEMINI API]: {e}"

def build_prompt(facts: list, user_query: str) -> str:
    """
    Xây dựng Prompt tối ưu để giảm Hallucination, bắt buộc LLM chỉ dùng facts.
    """
    facts_str = "\n".join(facts) if facts else "Không có tri thức nào được cung cấp."
    
    prompt = f"""[TRI THỨC]
{facts_str}

[HƯỚNG DẪN]
* Chỉ sử dụng thông tin trong TRI THỨC để trả lời.
* Không được bịa thêm kiến thức chiêm tinh ngoài TRI THỨC.
* Nếu TRI THỨC không đủ để trả lời hoàn chỉnh, hãy nói rõ là dữ liệu hệ thống chưa đủ, nhưng vẫn dựa trên những gì có.
* Giải thích dễ hiểu, tự nhiên.

[CÂU HỎI]
{user_query}

[TRẢ LỜI]
"""
    return prompt

def run_pipeline(query: str, mode: str = "kg_rag"):
    """
    Chạy pipeline GraphRAG hoặc LLM thường.
    mode: "kg_rag" (dùng Knowledge Graph) hoặc "no_kg" (gọi thẳng LLM)
    """
    start_time = time.time()
    
    entities = []
    facts = []
    
    if mode == "kg_rag":
        # 1. Trích xuất thực thể
        entities = extract_astrology_entities(query)
        
        # 2. Tìm đồ thị con (max_depth=2 theo yêu cầu)
        kg = get_astrology_kg()
        facts = kg.extract_subgraph(entities, max_depth=2)
        
        # 3. Build prompt
        prompt = build_prompt(facts, query)
    else:
        # Mode no_kg: Hỏi trực tiếp
        prompt = query
        
    # 4. Gọi LLM
    response = call_llm(prompt)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    return {
        "entities": entities,
        "facts": facts,
        "prompt": prompt,
        "response": response,
        "time": processing_time
    }

def compare_modes(query: str):
    """
    Chạy so sánh 2 chế độ để phục vụ đánh giá luận văn.
    """
    print("=" * 80)
    print(f"🌟 SO SÁNH GRAPHRAG (GEMINI) VÀ TRUYỀN THỐNG 🌟")
    print(f"Câu hỏi: '{query}'")
    print("=" * 80)
    
    # ----------------------------------------
    # 1. CHẠY TRỰC TIẾP (NO KG)
    # ----------------------------------------
    print("\n[1] CHẾ ĐỘ: NO_KG (Gọi trực tiếp Gemini)")
    res_no_kg = run_pipeline(query, mode="no_kg")
    print(f"⏱ Thời gian xử lý : {res_no_kg['time']:.2f} giây")
    print(f"🤖 Trả lời của AI:\n{res_no_kg['response']}")
    print("-" * 80)
    
    # ----------------------------------------
    # 2. CHẠY KÈM GRAPHRAG (KG_RAG)
    # ----------------------------------------
    print("\n[2] CHẾ ĐỘ: KG_RAG (Kết hợp Knowledge Graph)")
    res_kg = run_pipeline(query, mode="kg_rag")
    print(f"🔍 Thực thể nhận diện : {res_kg['entities']}")
    print(f"🪐 Số lượng Facts    : {len(res_kg['facts'])}")
    for f in res_kg['facts']:
        print(f"   {f}")
    
    print("\n📜 Prompt được tạo ra:")
    print(res_kg['prompt'])
    
    print(f"⏱ Thời gian xử lý   : {res_kg['time']:.2f} giây")
    print(f"🤖 Trả lời của AI:\n{res_kg['response']}")
    print("=" * 80)

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')
    
    # CẢNH BÁO: Phải nhập API key trước khi test
    if API_KEY == "YOUR_API_KEY":
        print("⚠️ BẠN CẦN NHẬP GEMINI API KEY VÀO FILE NÀY ĐỂ TEST!")
        print("Mở file chatbot/rag/evaluate_graphrag.py và sửa biến API_KEY.")
    else:
        # Test Query phục vụ báo cáo
        test_query = "Tôi có Sao Hỏa ở Bạch Dương thì sao?"
        compare_modes(test_query)
