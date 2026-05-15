from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class Neo4jAstrologyGraph:
    """
    Neo4j implementation for Astrology Knowledge Graph.
    Lưu trữ và truy xuất các logic Chiêm tinh học bằng cơ sở dữ liệu Neo4j.
    """
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def query(self, cypher, parameters=None):
        with self.driver.session() as session:
            result = session.run(cypher, parameters)
            return [record for record in result]

    def add_triplet(self, subject, predicate, object_, subject_type="Entity", object_type="Entity", source="", chunk_id=0):
        """Thêm một cặp kiến thức (Triplet) vào Neo4j kèm theo Metadata."""
        cypher = (
            "MERGE (s:Entity {name: $subject}) "
            "SET s.type = $sub_type "
            "MERGE (o:Entity {name: $object}) "
            "SET o.type = $obj_type "
            "MERGE (s)-[r:RELATION {type: $predicate}]->(o) "
            "ON CREATE SET r.source = $source, r.chunk_id = $chunk_id "
            "RETURN s, r, o"
        )
        self.query(cypher, {
            "subject": subject, 
            "predicate": predicate, 
            "object": object_,
            "sub_type": subject_type,
            "obj_type": object_type,
            "source": source,
            "chunk_id": chunk_id
        })

    def extract_subgraph(self, entities: list, max_depth: int = 1) -> list:
        """
        Thuật toán GraphRAG bằng Cypher:
        Trích xuất các quan hệ xung quanh các thực thể trong bán kính max_depth.
        """
        if not entities:
            return []

        # Cypher query để lấy các node và cạnh liên quan
        # Sử dụng variable length paths: (e)-[*1..max_depth]-(neighbor)
        cypher = (
            "MATCH (e:Entity) WHERE e.name IN $entities "
            "MATCH (e)-[r:RELATION*1..%d]-(neighbor) "
            "UNWIND r AS rel "
            "WITH DISTINCT startNode(rel) AS s, endNode(rel) AS o, rel "
            "RETURN s.name AS subject, rel.type AS relation, o.name AS object"
        ) % max_depth

        records = self.query(cypher, {"entities": entities})
        
        facts = set()
        for record in records:
            fact = f"- {record['subject']} [{record['relation']}] {record['object']}"
            facts.add(fact)
            
        return list(facts)

    def has_node(self, name: str) -> bool:
        """Kiểm tra xem một thực thể có tồn tại trong đồ thị không."""
        cypher = "MATCH (e:Entity {name: $name}) RETURN count(e) AS count"
        result = self.query(cypher, {"name": name})
        return result[0]["count"] > 0
