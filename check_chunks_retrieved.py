import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from app.models.base_db import UserDB
db = UserDB()
db.cursor.execute("SELECT id FROM conversations ORDER BY id DESC LIMIT 1")
conv_id = db.cursor.fetchone()["id"]
chunks = db.get_document_chunks(conv_id)
found = False
for c in chunks:
    if "Nguồn Năng Lượng Nội Tại" in c['content']:
        print(f"FOUND IN CHUNK {c['chunk_index']}:")
        print(c['content'])
        found = True
if not found:
    print("Not found!")
