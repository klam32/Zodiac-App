import asyncio
from app.models.base_db import UserDB
from chatbot.rag.rag_pipeline import pipeline_process_and_store

async def test():
    db = UserDB()
    # Fake chart_to_save
    chart_to_save = """## Tổng quan
Đây là tổng quan về bản đồ sao. Bản đồ sao cho thấy bạn có nhiều tiềm năng về công việc và sự nghiệp.

## Sự nghiệp
Bạn sẽ có cơ hội thăng tiến tốt trong năm nay. Mặt trời ở nhà số 10.
""" * 10 # make it long enough > 50 chars
    print("Testing pipeline_process_and_store...")
    await pipeline_process_and_store(9999, 1, "Tổng quan", chart_to_save, db)
    
    # Check if saved
    db.cursor.execute("SELECT * FROM conversation_chunks WHERE conversation_id=9999")
    res = db.cursor.fetchall()
    print("Chunks saved:", len(res))

if __name__ == "__main__":
    asyncio.run(test())
