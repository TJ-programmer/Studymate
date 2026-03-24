from pathlib import Path
from fastapi import UploadFile
import pandas as pd
from io import BytesIO


# =========================
# MAIN ENTRY
# =========================

async def parse_file(file: UploadFile):
    ext = Path(file.filename).suffix.lower()
    content = await file.read()

    if ext == ".txt":
        return [{"page": 1, "text": parse_txt_bytes(content)}]
    
    if ext == ".pdf":
        return parse_pdf_bytes(content)
    
    if ext in [".png", ".jpg", ".jpeg"]:
        return [{"page": 1, "text": parse_image_bytes(content)}]
    
    if ext == ".csv":
        return [{"page": 1, "text": parse_csv_bytes(content)}]
    
    if ext in [".xls", ".xlsx"]:
        return [{"page": 1, "text": parse_excel_bytes(content)}]
    
    raise ValueError(f"Unsupported file format: {ext}")


# =========================
# TXT
# =========================

def parse_txt_bytes(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


# =========================
# PDF (PAGE-WISE + OCR)
# =========================

def parse_pdf_bytes(content: bytes):
    from PyPDF2 import PdfReader

    reader = PdfReader(BytesIO(content))
    pages_data = []

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""

        # OCR fallback for scanned pages
        if len(text.strip()) < 20:
            try:
                from pdf2image import convert_from_bytes
                import pytesseract

                images = convert_from_bytes(
                    content,
                    first_page=i + 1,
                    last_page=i + 1
                )

                text = pytesseract.image_to_string(images[0])
            except Exception as e:
                text = f"[OCR FAILED: {str(e)}]"

        pages_data.append({
            "page": i + 1,
            "text": text.strip()
        })

    return pages_data


# =========================
# IMAGE (OCR)
# =========================

def parse_image_bytes(content: bytes) -> str:
    from PIL import Image
    import pytesseract

    img = Image.open(BytesIO(content))
    return pytesseract.image_to_string(img)


# =========================
# CSV
# =========================

def parse_csv_bytes(content: bytes) -> str:
    df = pd.read_csv(BytesIO(content))
    return df.to_csv(index=False)


# =========================
# EXCEL
# =========================

def parse_excel_bytes(content: bytes) -> str:
    df = pd.read_excel(BytesIO(content))
    return df.to_csv(index=False)


