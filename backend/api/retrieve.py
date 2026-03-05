from backend.service import RAGService
rag= RAGService()

def retrieve_context(chat_id, query, top_k=5):
    try:
        context = rag.retrieve(chat_id, query, top_k)
        return {"status": "SUCCESS", "context": context}
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
