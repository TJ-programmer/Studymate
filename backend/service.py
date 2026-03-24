from backend.core.parse import parse_file
from backend.core.chunk import chunk_text
from backend.core.embed import embed_texts, embed_query
from backend.storage.vectordb import insert_vectors, search_vectors, init_collection
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
import uuid
import numpy as np
from typing import List
from fastapi import UploadFile
class RAGService:

    async def ingest(self,file : UploadFile):
        print(f"[INGEST] Starting ingestion for file: {file.filename}")
        pages = await parse_file(file)
        print(f"[INGEST] Parsed {len(pages)} pages")


        all_chunks = []

        for page_data in pages:
            page_num = page_data["page"]
            text = page_data["text"]

            chunks = chunk_text(text, file)

            # attach metadata (VERY IMPORTANT for RAG)
            for chunk in chunks:
                all_chunks.append({
                    "text": chunk,
                    "page": page_num,
                    "source": file.filename
                })

        print(f"[INGEST] Created {len(all_chunks)} chunks")

        texts = [chunk["text"] for chunk in all_chunks]

        embeddings = embed_texts(texts)
        print(f"[INGEST] Generated embeddings for {len(embeddings)} chunks")

        points = []

        for idx, (chunk, vector) in enumerate(zip(all_chunks, embeddings)):
            point_id = str(uuid.uuid4())

            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "chunk_index": idx,
                        "text": chunk["text"],
                        "page": chunk["page"],
                        "source": chunk["source"],

                    }
                )
            )

            if idx % 10 == 0 or idx == len(all_chunks) - 1:
                print(f"[INGEST] Prepared point {idx+1}/{len(all_chunks)}")
                
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


    async def stream_llm_response(self, messages):

        import asyncio

        def extract_last_user(messages):
            return next(
                (m["content"] for m in reversed(messages) if m["role"] == "user"),
                ""
            )

        key_input = extract_last_user(messages)

        # 1️⃣ Cache check
        cached = get_cached(key_input)
        if cached:
            chunk_size = 24
            for i in range(0, len(cached), chunk_size):
                yield cached[i:i + chunk_size]
                await asyncio.sleep(0)
            return

        # 2️⃣ Stream LLM
        full_response = ""

        try:
            for token in llm_response(messages):
                if token:
                    full_response += token
                    yield token
                    await asyncio.sleep(0)

        except Exception:
            yield "\n[Error generating response]"
            return

        # 3️⃣ Save cache
        if full_response.strip() and len(full_response) < 5000:
            set_cache(key_input, full_response)
