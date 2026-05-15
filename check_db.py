import asyncio
from app.models.base_db import UserDB

async def check():
    db = UserDB()
    db.cursor.execute("SELECT COUNT(*) as count FROM conversation_chunks")
    res1 = db.cursor.fetchone()
    print("Total chunks:", res1["count"])
    
    db.cursor.execute("SELECT COUNT(*) as count FROM retrieval_logs")
    res2 = db.cursor.fetchone()
    print("Total retrieval logs:", res2["count"])

if __name__ == "__main__":
    asyncio.run(check())
