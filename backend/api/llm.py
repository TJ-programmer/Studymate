# use llm service to setup def
from backend.service import LLMService

llm = LLMService()

async def llm_stream(messages,context):
    
    async for token in llm.stream_llm_response(
        messages=messages,
        context= context
    ):
        yield token
