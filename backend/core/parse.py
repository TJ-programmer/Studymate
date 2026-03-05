from pathlib import Path
import pandas as pd


# public entry function

def parse_file(file_path : str) -> str:
    file_path = file_path.strip().strip('"')
    ext = Path(file_path).suffix.lower()

    if ext == ".txt":
        return parse_txt(file_path)
    
    if ext == ".pdf":
        return parse_pdf(file_path)
    
    if ext in  [".png",".jpg",".jpeg"] :
        return parse_image(file_path)
    
    if ext == ".csv" :
        return parse_csv(file_path)
    
    if ext in [".xls",".xlsx"] :
        return parse_excel(file_path)
    
    raise ValueError(f"Unsupported file format : {ext}")

# text parser

def parse_txt(file_path : str) -> str:
    return Path(file_path).read_text(encoding="utf-8",errors="ignore")


# pdf parser(txt + ocr)

def parse_pdf(file_path :str) -> str:
    from PyPDF2 import PdfReader

    reader = PdfReader(file_path)

    pages_text=[]

    for page in reader.pages :
        text = page.extract_text()

        if text :
            pages_text.append(text)

    extracted_text = "\n".join(pages_text).strip()

    if len(extracted_text) < 50 :
        from pdf2image import convert_from_path
        import pytesseract 

        images = convert_from_path(file_path)
        text = []

        for img in images :
            text.append(pytesseract.image_to_string(img))

        return "\n".join(text)
    
    return extracted_text


# img parser

def parse_image(file_path : str) -> str:
    from PIL import Image
    import pytesseract

    img = Image.open(file_path)
    return pytesseract.image_to_string(img)

# csv parser

def parse_csv(file_path : str ) -> str:
    df = pd.read_csv(file_path)
    return df.to_csv(index=False)


# Excel (Xls/xlsx) parser

def parse_excel(file_path: str ) -> str:
    df = pd.read_excel(file_path)

    return df.to_csv(index=False)



