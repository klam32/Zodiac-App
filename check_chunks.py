import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.models.base_db import UserDB
db = UserDB()
db.cursor.execute("SELECT id FROM conversations ORDER BY id DESC LIMIT 1")
conv_id = db.cursor.fetchone()["id"]

chunks = db.get_document_chunks(conv_id)
for c in chunks:
    if "Động Lực" in c["content"] or "Cơ Hội Phát Triển" in c["content"]:
        print("\n--- FOUND CHUNK ---")
        print(f"Index: {c['chunk_index']}")
        print(f"Content:\n{c['content']}")
