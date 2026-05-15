import networkx as nx  # type: ignore[import-untyped]
import json
import os
from chatbot.rag.neo4j_knowledge_graph import Neo4jAstrologyGraph

class AstrologyGraph:
    """
    Knowledge Graph for Astrology.
    Lưu trữ và truy xuất các logic Chiêm tinh học dưới dạng Đồ thị (GraphRAG).
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self._build_knowledge_base()

    def _add_triplet(self, subject, predicate, object_):
        """Thêm một cặp kiến thức (Triplet) vào đồ thị."""
        # Thêm đỉnh nếu chưa có
        if not self.graph.has_node(subject):
            self.graph.add_node(subject, type="entity")
        if not self.graph.has_node(object_):
            self.graph.add_node(object_, type="entity")
            
        # Thêm cạnh có hướng
        self.graph.add_edge(subject, object_, relation=predicate)

    def _build_knowledge_base(self):
        """Khởi tạo tập kiến thức cốt lõi (Core Ontology)."""
        triplets = [
            # Dữ liệu mẫu Cung - Hành tinh chủ quản (Ruling Planets)
            ("Bạch Dương", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Hỏa"),
            ("Kim Ngưu", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Kim"),
            ("Song Tử", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Thủy"),
            ("Cự Giải", "ĐƯỢC_CAI_QUẢN_BỞI", "Mặt Trăng"),
            ("Sư Tử", "ĐƯỢC_CAI_QUẢN_BỞI", "Mặt Trời"),
            ("Xử Nữ", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Thủy"),
            ("Thiên Bình", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Kim"),
            ("Bọ Cạp", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Diêm Vương"),
            ("Bọ Cạp", "CŨNG_ĐƯỢC_CAI_QUẢN_BỞI", "Sao Hỏa"),
            ("Nhân Mã", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Mộc"),
            ("Ma Kết", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Thổ"),
            ("Bảo Bình", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Thiên Vương"),
            ("Bảo Bình", "CŨNG_ĐƯỢC_CAI_QUẢN_BỞI", "Sao Thổ"),
            ("Song Ngư", "ĐƯỢC_CAI_QUẢN_BỞI", "Sao Hải Vương"),
            ("Song Ngư", "CŨNG_ĐƯỢC_CAI_QUẢN_BỞI", "Sao Mộc"),
            
            # Nguyên tố (Elements)
            ("Bạch Dương", "THUỘC_NGUYÊN_TỐ", "Lửa"),
            ("Sư Tử", "THUỘC_NGUYÊN_TỐ", "Lửa"),
            ("Nhân Mã", "THUỘC_NGUYÊN_TỐ", "Lửa"),
            ("Kim Ngưu", "THUỘC_NGUYÊN_TỐ", "Đất"),
            ("Xử Nữ", "THUỘC_NGUYÊN_TỐ", "Đất"),
            ("Ma Kết", "THUỘC_NGUYÊN_TỐ", "Đất"),
            ("Song Tử", "THUỘC_NGUYÊN_TỐ", "Khí"),
            ("Thiên Bình", "THUỘC_NGUYÊN_TỐ", "Khí"),
            ("Bảo Bình", "THUỘC_NGUYÊN_TỐ", "Khí"),
            ("Cự Giải", "THUỘC_NGUYÊN_TỐ", "Nước"),
            ("Bọ Cạp", "THUỘC_NGUYÊN_TỐ", "Nước"),
            ("Song Ngư", "THUỘC_NGUYÊN_TỐ", "Nước"),
            
            # Cung Nhà (Houses) và ý nghĩa đại diện
            ("Nhà 1", "ĐẠI_DIỆN_CHO", "Bản ngã, ngoại hình, tính cách"),
            ("Nhà 2", "ĐẠI_DIỆN_CHO", "Tài chính, giá trị vật chất"),
            ("Nhà 3", "ĐẠI_DIỆN_CHO", "Giao tiếp, tư duy, anh em"),
            ("Nhà 4", "ĐẠI_DIỆN_CHO", "Gia đình, gốc rễ, quá khứ"),
            ("Nhà 5", "ĐẠI_DIỆN_CHO", "Tình yêu, sáng tạo, con cái"),
            ("Nhà 6", "ĐẠI_DIỆN_CHO", "Sức khỏe, công việc hàng ngày"),
            ("Nhà 7", "ĐẠI_DIỆN_CHO", "Hôn nhân, đối tác, kẻ thù"),
            ("Nhà 8", "ĐẠI_DIỆN_CHO", "Sự chuyển hóa, tình dục, tài sản chung"),
            ("Nhà 9", "ĐẠI_DIỆN_CHO", "Học vấn cao, tôn giáo, du lịch"),
            ("Nhà 10", "ĐẠI_DIỆN_CHO", "Sự nghiệp, danh tiếng, địa vị"),
            ("Nhà 11", "ĐẠI_DIỆN_CHO", "Bạn bè, cộng đồng, ước mơ"),
            ("Nhà 12", "ĐẠI_DIỆN_CHO", "Tiềm thức, sự hy sinh, nghiệp quả"),
            
            # Cung Nhà gắn liền với Cung Hoàng Đạo
            ("Nhà 1", "TƯƠNG_ỨNG_VỚI_CUNG", "Bạch Dương"),
            ("Nhà 2", "TƯƠNG_ỨNG_VỚI_CUNG", "Kim Ngưu"),
            ("Nhà 5", "TƯƠNG_ỨNG_VỚI_CUNG", "Sư Tử"),
            ("Nhà 7", "TƯƠNG_ỨNG_VỚI_CUNG", "Thiên Bình"),
            ("Nhà 10", "TƯƠNG_ỨNG_VỚI_CUNG", "Ma Kết"),
            
            # Hành tinh và Ý nghĩa (Planetary meanings)
            ("Mặt Trời", "ĐẠI_DIỆN_CHO", "Cái tôi, năng lượng sống, mục tiêu"),
            ("Mặt Trăng", "ĐẠI_DIỆN_CHO", "Cảm xúc, bản năng, tiềm thức"),
            ("Sao Thủy", "ĐẠI_DIỆN_CHO", "Trí tuệ, giao tiếp, tư duy"),
            ("Sao Kim", "ĐẠI_DIỆN_CHO", "Tình yêu, vẻ đẹp, sự lãng mạn"),
            ("Sao Hỏa", "ĐẠI_DIỆN_CHO", "Hành động, sinh lực, sự tranh đấu"),
            ("Sao Mộc", "ĐẠI_DIỆN_CHO", "May mắn, sự mở rộng, triết lý"),
            ("Sao Thổ", "ĐẠI_DIỆN_CHO", "Kỷ luật, trách nhiệm, giới hạn"),
            ("Sao Thiên Vương", "ĐẠI_DIỆN_CHO", "Sự đột phá, nổi loạn, công nghệ"),
            ("Sao Hải Vương", "ĐẠI_DIỆN_CHO", "Ảo tưởng, tâm linh, trực giác"),
            ("Sao Diêm Vương", "ĐẠI_DIỆN_CHO", "Sự lột xác, quyền lực, biến đổi sâu sắc"),
            
            # Ý nghĩa Nguyên tố
            ("Lửa", "ĐẠI_DIỆN_CHO", "Nhiệt huyết, đam mê, hành động nhanh"),
            ("Đất", "ĐẠI_DIỆN_CHO", "Thực tế, ổn định, kiên nhẫn"),
            ("Khí", "ĐẠI_DIỆN_CHO", "Tư duy, giao tiếp, lý trí"),
            ("Nước", "ĐẠI_DIỆN_CHO", "Cảm xúc, trực giác, sự đồng cảm"),
            
            # Các thực thể khái niệm chung
            ("Sự nghiệp", "LIÊN_QUAN_MẬT_THIẾT_ĐẾN", "Nhà 10"),
            ("Sự nghiệp", "LIÊN_QUAN_ĐẾN", "Nhà 6"),
            ("Sự nghiệp", "LIÊN_QUAN_ĐẾN", "Nhà 2"),
            ("Tình duyên", "LIÊN_QUAN_MẬT_THIẾT_ĐẾN", "Nhà 7"),
            ("Tình duyên", "LIÊN_QUAN_ĐẾN", "Nhà 5"),
            ("Tình duyên", "LIÊN_QUAN_ĐẾN", "Sao Kim"),
            ("Sức khỏe", "LIÊN_QUAN_MẬT_THIẾT_ĐẾN", "Nhà 6"),
        ]
        
        for sub, pred, obj in triplets:
            self._add_triplet(sub, pred, obj)

    def extract_subgraph(self, entities: list, max_depth: int = 1) -> list:
        """
        Thuật toán GraphRAG: 
        Cho danh sách các đỉnh (entities), trích xuất đồ thị con xung quanh trong bán kính max_depth.
        Trả về danh sách các sự kiện (Graph Facts) dạng chuỗi.
        """
        facts = set()
        
        # Chỉ xét các entity có trong đồ thị
        valid_entities = [e for e in entities if self.graph.has_node(e)]
        if not valid_entities:
            return []

        # Thuật toán BFS để lấy k-hop neighborhood
        for start_node in valid_entities:
            # Undirected view để tìm cả liên kết ngược
            undirected_graph = self.graph.to_undirected(as_view=True)
            
            # Tính khoảng cách ngắn nhất từ start_node
            lengths = nx.single_source_shortest_path_length(undirected_graph, start_node, cutoff=max_depth)
            neighborhood = set(lengths.keys())
            
            # Trích xuất các cạnh trong neighborhood này từ đồ thị gốc (có hướng)
            subgraph = self.graph.subgraph(neighborhood)
            
            for u, v, data in subgraph.edges(data=True):
                relation = data.get("relation", "LIÊN QUAN")
                fact = f"- {u} [{relation}] {v}"
                facts.add(fact)
                
        return list(facts)

# Biến toàn cục để khởi tạo KG 1 lần
def init_kg():
    try:
        # Thử khởi tạo Neo4j
        print("[KnowledgeGraph] Dang kiem tra ket noi Neo4j...")
        kg = Neo4jAstrologyGraph()
        # Kiểm tra nhanh kết nối
        kg.query("MATCH (n) RETURN count(n) LIMIT 1")
        print("[KnowledgeGraph] Da ket noi Neo4j thanh cong.")
        return kg
    except Exception as e:
        print(f"[KnowledgeGraph] Can not connect to Neo4j ({e}). Falling back to NetworkX (In-memory).")
        return AstrologyGraph()

kg_instance = init_kg()

def get_astrology_kg():
    return kg_instance

def extract_astrology_entities(text: str) -> list:
    """Trích xuất các thực thể chiêm tinh từ văn bản của người dùng."""
    if not text:
        return []
        
    keywords = [
        "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ", 
        "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư", 
        "Mặt Trời", "Mặt Trăng", "Sao Thủy", "Sao Kim", "Sao Hỏa", "Sao Mộc", 
        "Sao Thổ", "Sao Thiên Vương", "Sao Hải Vương", "Sao Diêm Vương", 
        "Nhà 1", "Nhà 2", "Nhà 3", "Nhà 4", "Nhà 5", "Nhà 6", "Nhà 7", "Nhà 8", 
        "Nhà 9", "Nhà 10", "Nhà 11", "Nhà 12",
        "Sự nghiệp", "Tình duyên", "Sức khỏe", "Lửa", "Đất", "Khí", "Nước"
    ]
    
    found = []
    text_lower = text.lower()
    for kw in keywords:
        if kw.lower() in text_lower:
            found.append(kw)
    return found

def extract_astrology_entities_llm(text: str, llm) -> list:
    """
    Trích xuất thực thể bằng LLM (Zero-shot NER) để vượt qua giới hạn của keyword.
    Tự động chuẩn hóa từ đồng nghĩa (VD: công việc -> Sự nghiệp).
    """
    if not text or not llm:
        return extract_astrology_entities(text)
        
    prompt = f"""
Bạn là hệ thống nhận diện thực thể (NER) Chiêm tinh học.
Hãy trích xuất các khái niệm Chiêm tinh từ văn bản sau.
Bao gồm: Cung hoàng đạo, Hành tinh, Cung nhà (Nhà 1-12), Yếu tố (Lửa, Nước...), Lĩnh vực (Sự nghiệp, Tình duyên, Sức khỏe).
LƯU Ý: Tự động chuẩn hóa từ đồng nghĩa (VD: "công việc/đi làm" -> "Sự nghiệp", "tình cảm/yêu đương" -> "Tình duyên", "bệnh tật" -> "Sức khỏe").

VĂN BẢN:
"{text}"

ĐẦU RA:
- CHỈ trả về các thực thể phân tách bằng dấu phẩy. KHÔNG GIẢI THÍCH.
- Ví dụ: Xử Nữ, Sự nghiệp, Nhà 10
"""
    try:
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)
        
        # Parse danh sách
        import re
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
        entities = [e.strip() for e in content.split(",") if e.strip()]
        
        # Chỉ giữ lại các entity có trong đồ thị
        kg = get_astrology_kg()
        if hasattr(kg, 'has_node'):
            valid_entities = [e for e in entities if kg.has_node(e)]
        else:
            # Fallback for networkx
            valid_entities = [e for e in entities if isinstance(kg, AstrologyGraph) and kg.graph.has_node(e)]
        
        # Kết hợp cả keyword matching để không bỏ sót
        keyword_entities = extract_astrology_entities(text)
        final_entities = list(set(valid_entities + keyword_entities))
        
        return final_entities
    except Exception as e:
        print(f"[KnowledgeGraph] Lỗi LLM NER: {e}")
        return extract_astrology_entities(text)
