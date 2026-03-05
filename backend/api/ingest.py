from backend.service import RAGService

rag = RAGService()

def ingest_document(document_id, chat_id, file_path):
    try:
        result = rag.ingest(document_id, chat_id, file_path)
        print(f"Ingested {result['chunks']} chunks for document {document_id}")
        return result
    except Exception as e:
        print(f"Error ingesting document {document_id}: {e}")
        return {"status": "FAILED", "error": str(e)}
    
