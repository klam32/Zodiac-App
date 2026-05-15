from dotenv import load_dotenv
load_dotenv()
from langchain_google_vertexai import VertexAIEmbeddings

def test():
    emb = VertexAIEmbeddings(model_name="text-embedding-004")
    res = emb.embed_query("hello")
    print("Embedding size:", len(res))

if __name__ == "__main__":
    test()
