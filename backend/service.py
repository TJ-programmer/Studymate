from backend.core.parse import parse_file
from backend.core.chunk import chunk_text
from backend.core.embed import embed_texts, embed_query
from backend.storage.vectordb import insert_vectors, search_vectors, init_collection
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
import uuid
import numpy as np
from typing import List

class RAGService:

    def ingest(self, document_id: str, chat_id: str, file_path: str):
        print(f"[INGEST] Starting ingestion for file: {file_path}")
        text = parse_file(file_path)
        print(f"[INGEST] Parsed text length: {len(text)} characters")

        chunks = chunk_text(text, file_path=file_path)
        print(f"[INGEST] Created {len(chunks)} chunks")

        embeddings = embed_texts(chunks)
        print(f"[INGEST] Generated embeddings for {len(embeddings)} chunks")

        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "document_id": document_id,
                        "chat_id": chat_id,
                        "file_path": file_path,
                        "chunk_index": idx,
                        "text": chunk
                    }
                )
            )
            if idx % 10 == 0 or idx == len(chunks) - 1:
                print(f"[INGEST] Prepared point {idx+1}/{len(chunks)} with id {point_id}")

        insert_vectors(points)
        print(f"[INGEST] Inserted {len(points)} vectors into the vector database")
        return {"status": "READY", "chunks": len(points)}

    def retrieve(self, chat_id: str, query: str, top_k: int = 5):
        print(f"[RETRIEVE] Retrieving for chat_id: {chat_id} with query: '{query}'")
        q_vector = embed_query(query)
        print(f"[RETRIEVE] Generated query embedding")
        
        # Get more results for reranking
        results = search_vectors(q_vector, chat_id=chat_id, top_k=top_k*3)
        print(f"[RETRIEVE] Retrieved {len(results)} vectors from database")
        
        # Convert ScoredPoint objects to dict format for reranking
        retrieved_chunks = [
            {
                "text": point.payload.get("text", ""),
                "score": point.score,
                **point.payload  # Include all other payload fields
            }
            for point in results
        ]
        
        results = rerank(query, retrieved_chunks, top_k=top_k)
        print(f"[RETRIEVE] Reranked top {top_k} results")
        
        context = assemble_context(results, max_tokens=2000)
        print(f"[RETRIEVE] Assembled context with length {len(context.split())} tokens")
        
        return context


# Rerank function
def rerank(query: str, retrieved_chunks: List[dict], top_k: int = 5) -> List[dict]:
    print(f"[RERANK] Reranking {len(retrieved_chunks)} retrieved chunks")
    if not retrieved_chunks:
        print("[RERANK] No chunks to rerank")
        return []

    chunk_texts = [c['text'] for c in retrieved_chunks]
    chunk_embeddings = embed_texts(chunk_texts)
    print(f"[RERANK] Generated embeddings for {len(chunk_embeddings)} chunks")

    q_vector = embed_query(query)
    print(f"[RERANK] Generated query embedding for reranking")

    def cosine_sim(a, b):
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    for i, chunk in enumerate(retrieved_chunks):
        chunk['score'] = cosine_sim(q_vector, chunk_embeddings[i])
        print(f"[RERANK] Chunk {i} score: {chunk['score']:.4f}")

    reranked = sorted(retrieved_chunks, key=lambda x: x['score'], reverse=True)
    print(f"[RERANK] Top {top_k} chunks selected after reranking")
    return reranked[:top_k]


# Assemble context function
def assemble_context(chunks: List[dict], max_tokens: int = 2000) -> str:
    print(f"[ASSEMBLE] Assembling context from {len(chunks)} chunks")
    context = ""
    current_tokens = 0

    for i, chunk in enumerate(chunks):
        chunk_tokens = len(chunk['text'].split())
        if current_tokens + chunk_tokens > max_tokens:
            print(f"[ASSEMBLE] Reached max tokens limit ({max_tokens}). Stopping assembly.")
            break
        context += "\n" + chunk['text']
        current_tokens += chunk_tokens
        print(f"[ASSEMBLE] Added chunk {i}, current total tokens: {current_tokens}")

    print(f"[ASSEMBLE] Context assembled with {current_tokens} tokens")
    return context.strip()

from backend.core.LLm_stream import llm_response
from backend.core.cache import get_cached, set_cache
from backend.core.rate_limiter import check_rate_limit


class LLMService :


    async def stream_llm_response(self,user_prompt: str):
        
         # 1 Rate limiting (implement after auth setup)
        # if not check_rate_limit(user_id):
        #     yield "Rate limit exceeded. Please wait."
        #     return

        # 2 cache
        cached = get_cached(user_prompt)
        if cached:
            # Keep UX consistent: cached replies should still stream incrementally.
            chunk_size = 24
            for i in range(0, len(cached), chunk_size):
                yield cached[i:i + chunk_size]
            return
        
        # 3 stream LLM

        full_response= ""

        for token in llm_response(user_prompt):
            full_response += token
            yield token


        # 4 save cache

        set_cache(user_prompt,full_response)

