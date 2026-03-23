from fastapi import FastAPI,Form
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio

from backend.api.ingest import ingest_document
from backend.api.retrieve import retrieve_context
from backend.api.llm import llm_stream
app = FastAPI(title="Studymate api",version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# ingest enpoint
@app.post("/ingest")
async def api_ingest(
    file_path: str = Form(...),
    chat_id: str = Form(...),
    document_id: str = Form(None)
):
  
    try:
       
        if document_id is None:
            import uuid
            document_id = str(uuid.uuid4())

        result = ingest_document(document_id, chat_id, file_path)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"status": "FAILED", "error": str(e)})


# Retrieve endpoint
@app.get("/retrieve")
async def api_retrieve(
    chat_id: str,
    query: str,
    top_k: int = 5
):
    
    try:
        result = retrieve_context(chat_id, query, top_k)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"status": "FAILED", "error": str(e)})
    
@app.post("/chat")
async def chat(payload: ChatRequest):

    messages = [m.dict() for m in payload.messages]

    async def generator():
        async for token in llm_stream(messages):
            yield token.encode("utf-8")
            await asyncio.sleep(0)

    return StreamingResponse(
        generator(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )