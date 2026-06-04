import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set stdout to UTF-8
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.models.base_db import UserDB

def check():
    db = UserDB()
    db.cursor.execute("SELECT * FROM settings")
    settings = db.cursor.fetchall()
    print("--- Current Settings ---")
    for s in settings:
        print(f"{s['key']}: {s['value']}")
    db.close()

if __name__ == '__main__':
    check()
