import time
import asyncio
from chatbot.utils.astro_cache import get_astrological_subject
from chatbot.services.astrology_agent import build_natal_payload
from chatbot.utils.llm import LLM

async def main():
    print("Starting benchmark...")
    
    # 1. Astro subject calculation time
    t0 = time.time()
    subject = get_astrological_subject("Test User", 2000, 1, 1, 12, 0, "Hanoi", "VN")
    t1 = time.time()
    print(f"get_astrological_subject took: {t1 - t0:.4f} seconds")
    
    # 2. Build payload (SVG + Chart Summary)
    t0 = time.time()
    chart_data_str, svg_string, chart_summary = build_natal_payload(
        "Test User", 2000, 1, 1, 12, 0, "Hanoi", "VN"
    )
    t1 = time.time()
    print(f"build_natal_payload took: {t1 - t0:.4f} seconds")
    
    # 3. LLM call time
    t0 = time.time()
    llm = LLM().get_llm()
    t1 = time.time()
    print(f"LLM initialization took: {t1 - t0:.4f} seconds")
    
    t0 = time.time()
    res = await asyncio.to_thread(llm.invoke, "Xin chào, hãy giới thiệu ngắn gọn về cung Xử Nữ trong 1 câu.")
    t1 = time.time()
    print(f"LLM invoke (short) took: {t1 - t0:.4f} seconds | Response: {res.content if hasattr(res, 'content') else res}")

if __name__ == "__main__":
    asyncio.run(main())
