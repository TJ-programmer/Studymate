from backend.service import RAGService

rag = RAGService()

async def ingest_document(file):
    try:
        result = await rag.ingest(file)
        print(f"Ingested {result['chunks']} chunks ")
        return result
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
    
