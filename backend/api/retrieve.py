from backend.service import RAGService

rag = RAGService()

def retrieve_context(
    source,
    query,
    page=None,
    start_page=None,
    end_page=None,
    top_k=5
):
    try:
        context = rag.retrieve(
            query=query,
            top_k=top_k,
            source=source,
            page=page,
            start_page=start_page,
            end_page=end_page
        )

        return {
            "status": "SUCCESS",
            "context": context
        }

    except Exception as e:
        return {
            "status": "FAILED",
            "error": str(e)
        }