import asyncio
from app.models.base_db import UserDB

async def check():
    db = UserDB()
    db.cursor.execute("SHOW TABLES")
    res = db.cursor.fetchall()
    print("Existing tables:")
    for row in res:
        print("-", list(row.values())[0])

if __name__ == "__main__":
    asyncio.run(check())
