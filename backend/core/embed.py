from sentence_transformers import SentenceTransformer
from typing import List
from backend.config import EMBEDDING_MODEL

_model =  SentenceTransformer(EMBEDDING_MODEL)

def embed_texts(texts : List[str],batch_size :int =32) -> List[List]:
    embeddings = []

    for i in range(0,len(texts),batch_size):
        batch = texts[i:i+batch_size]

        embeddings.extend(_model.encode(batch,convert_to_numpy=True).tolist())

    return embeddings

def embed_query(query: str) ->list:
    return _model.encode(query,convert_to_numpy=True).tolist()


