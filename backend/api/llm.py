# use llm service to setup def
from backend.service import LLMService

llm = LLMService()

async def llm_stream(user_prompt: str):
    
    async for token in llm.stream_llm_response(
        user_prompt=user_prompt
    ):
        yield token
