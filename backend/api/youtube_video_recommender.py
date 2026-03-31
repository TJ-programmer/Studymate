from backend.service import LLMService

llm = LLMService()


async def llm_recommend(query: str):
    """
    Simple wrapper for YouTube recommendations
    """
    try:
        result = await llm.recommend_youtube(query)
        return result

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }