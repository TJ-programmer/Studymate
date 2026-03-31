from fastapi import FastAPI,Form,UploadFile,File
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio

from backend.api.ingest import ingest_document
from backend.api.retrieve import retrieve_context
from backend.api.llm import llm_stream
from backend.api.clear import clear_document
from backend.api.youtube_video_recommender import llm_recommend
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
    context: str

# ingest enpoint
@app.post("/ingest")
async def api_ingest(
    file: UploadFile = File(...),
):
  
    try:
       

        result = await ingest_document(file)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"status": "FAILED", "error": str(e)})


# Retrieve endpoint
@app.get("/retrieve")
async def api_retrieve(
    source: str,
    query: str,
    top_k: int = 5,
    page: int = None,
    start_page: int = None,
    end_page: int = None
):
    try:
        result = retrieve_context(
            source=source,
            query=query,
            top_k=top_k,
            page=page,
            start_page=start_page,
            end_page=end_page
        )
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"status": "FAILED", "error": str(e)})

@app.post("/clear")
async def clear(source : str ):
    try:
       

        result = await clear_document(source)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"status": "FAILED", "error": str(e)})
    
@app.post("/chat")
async def chat(payload: ChatRequest):

    messages = [m.dict() for m in payload.messages]
    context = payload.context
    async def generator():
        async for token in llm_stream(messages,context):
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

@app.get("/youtube")
async def youtube(query: str):
    return await llm_recommend(query)