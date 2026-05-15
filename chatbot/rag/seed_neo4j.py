import sys
import os

# Thêm thư mục gốc vào path để import được chatbot
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from chatbot.rag.knowledge_graph import AstrologyGraph
from chatbot.rag.neo4j_knowledge_graph import Neo4jAstrologyGraph

def seed_neo4j():
    """Di chuyển dữ liệu từ NetworkX (static) sang Neo4j."""
    print("Starting data seed to Neo4j...")
    
    # Lấy triplets từ class cũ
    old_kg = AstrologyGraph()
    # Mocking triplets access since it's hardcoded in _build_knowledge_base
    # Actually, we can just extract them from the networkx graph edges
    triplets = []
    for u, v, data in old_kg.graph.edges(data=True):
        triplets.append((u, data.get("relation"), v))
    
    print(f"Found {len(triplets)} triplets to migrate.")
    
    new_kg = Neo4jAstrologyGraph()
    
    # Xóa dữ liệu cũ nếu muốn bắt đầu sạch
    # new_kg.query("MATCH (n) DETACH DELETE n")
    
    count = 0
    for sub, pred, obj in triplets:
        try:
            new_kg.add_triplet(sub, pred, obj)
            count += 1
            if count % 10 == 0:
                print(f"Imported {count}/{len(triplets)}...")
        except Exception as e:
            print(f"Error importing {sub}: {e}")
            
    print(f"Done! Successfully imported {count} relations to Neo4j.")
    new_kg.close()

if __name__ == "__main__":
    seed_neo4j()
