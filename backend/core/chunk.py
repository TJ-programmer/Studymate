from typing import List
from backend.config import CHUNK_OVERLAP,CHUNK_SIZE
from langchain_text_splitters import RecursiveCharacterTextSplitter  
from pathlib import Path
from fastapi import UploadFile
# public function entry
def chunk_text(text: str,file:UploadFile) -> List[str]:

    """
        source_type: text | pdf | ocr | csv | excel
    """

    ext = Path(file.filename).suffix.lower()

    if ext in [".csv",".xls",".xlsx"]:
        return chunk_tabular(text)
    
    return chunk_recursivesplit(text)

# recursive split  chunker

def chunk_recursivesplit(text :str) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap = CHUNK_OVERLAP,
        separators=["\n\n","\n","."," ",""]
    )

    return splitter.split_text(text)

# tabular splitter/chunker

def chunk_tabular(text: str) -> List[str]:
    lines = text.strip().split("\n")

    header = lines[0]
    rows = lines[1:]

    chunks = []
    current = [header]

    for row in rows:
        current.append(row)

        if len(" ".join(current).split()) >= CHUNK_SIZE:
            chunks.append("\n".join(current))
            current = [header]

    # final leftover
    if len(current) > 1:
        chunks.append("\n".join(current))

    return chunks

