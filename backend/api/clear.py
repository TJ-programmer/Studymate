from backend.service import RAGService

rag = RAGService()

async def clear_document(source : str):
    try:
        result = await rag.clear(source)
        return result
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
    
