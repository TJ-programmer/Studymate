# StudyMate 📚

StudyMate is a local-first study assistant that combines:

- a React frontend for PDF viewing, chat, and YouTube recommendations
- a FastAPI backend for ingestion, retrieval, streaming responses, and video suggestions
- local RAG with Qdrant storage
- a local `llama-cpp-python` GGUF model for chat and query refinement

It is designed for learning from your own documents: upload a PDF, ask questions against the ingested content, and open relevant YouTube videos without leaving the app. 🚀

## Demo 🎥

GitHub does not reliably play local repo videos inline inside a README, so this section uses a GitHub-friendly preview.

Click the preview below to open the full demo video:

[![StudyMate demo preview](./demo-preview.gif)](./demo.mp4)

Direct file: [demo.mp4](./demo.mp4)

## Features ✨

- Upload and parse `pdf`, `txt`, `csv`, `xlsx`, `xls`, and images
- OCR fallback for scanned PDFs and images
- Page-aware retrieval with single-page or page-range filtering
- Streaming chat responses
- In-app YouTube video recommendations and player
- Persistent local chat and PDF session state in the browser
- Local Qdrant vector storage on disk

## Tech Stack 🛠️

- Frontend: React, Vite, Tailwind CSS, `react-pdf`
- Backend: FastAPI
- Vector DB: Qdrant local storage
- Embeddings: `sentence-transformers`
- Local LLM runtime: `llama-cpp-python`

## Project Structure 🗂️

```text
studymate/
|-- backend/
|   |-- api/                 # FastAPI routes
|   |-- core/                # parsing, chunking, embeddings, LLM, YouTube search
|   |-- model/               # local GGUF model
|   |-- storage/             # Qdrant integration
|   `-- requirements.txt
|-- frontend/
|   |-- src/components/Home.jsx
|   `-- package.json
|-- qdrant_storage/          # persisted vector store
`-- demo.mp4
```

## Prerequisites ✅

Install these before running the project:

- Node.js 18+ and npm
- Python 3.10+
- Git
- Tesseract OCR
- Poppler utilities for `pdf2image`

This repo also expects the local model file to exist at:

```text
backend/model/Qwen2.5-VL-3B-Instruct-Q8_0.gguf
```

It is already present in this workspace, but if you move the project to another machine, keep the same path or update the backend code.

## Backend Setup ⚙️

From the project root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart requests numpy openpyxl
```

Why the extra install line?

- `requirements.txt` currently covers the core ML/parsing packages
- the API also uses `fastapi`, `uvicorn`, `python-multipart`, `requests`, `numpy`, and Excel parsing support

## Frontend Setup 🎨

In a second terminal:

```powershell
cd frontend
npm install
```

## Running The App ▶️

Start the backend first:

```powershell
cd backend
.venv\Scripts\activate
uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8001
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run start
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8001`

## How To Use 🧭

1. Start backend and frontend.
2. Open the web app.
3. Upload a document from the left panel.
4. Wait for ingestion to finish.
5. Ask questions in chat.
6. Optionally adjust RAG context by page or page range.
7. Use YouTube recommendations to open suggested learning videos inside the app.

## Important Notes 📌

- The frontend is hardcoded to call the backend on `http://localhost:8001`.
- CORS currently allows Vite origins on port `5173`.
- OCR features depend on a working local Tesseract + Poppler installation.
- Chat and YouTube recommendation both rely on the local GGUF model loading successfully.
- YouTube search also requires a valid API key in [backend/core/youtube_video_generator.py](/e:/studymate/backend/core/youtube_video_generator.py).

## Main Entry Points 🧩

- Frontend UI: [frontend/src/components/Home.jsx](/e:/studymate/frontend/src/components/Home.jsx)
- FastAPI app: [backend/api/app.py](/e:/studymate/backend/api/app.py)

## Troubleshooting 🩺

### `ModuleNotFoundError` or missing package errors

Install the extra backend runtime packages:

```powershell
pip install fastapi uvicorn python-multipart requests numpy openpyxl
```

### OCR not working

Make sure both are installed and available in your system `PATH`:

- Tesseract OCR
- Poppler

### Frontend loads but chat/upload fails

Check that:

- backend is running on port `8001`
- frontend is running on port `5173`
- the local model file exists in `backend/model/`

### YouTube recommendations fail

Check:

- your internet connection
- YouTube Data API key validity
- quota limits for the API key

## Future Improvements 🌱

- move secrets like the YouTube API key into environment variables
- complete and lock backend dependencies in `requirements.txt`
- add Docker support
- add automated tests and health checks
