from .pdf_engine import extract_pdf_with_layout
from .docx_engine import extract_docx
from .pptx_engine import extract_pptx

def get_text_from_file(extension: str, temp_path: str, content: bytes = None) -> str:
    if extension == ".pdf":
        return extract_pdf_with_layout(temp_path)
    
    elif extension == ".docx":
        return extract_docx(temp_path)
    
    elif extension == ".pptx":
        return extract_pptx(temp_path)
    
    elif extension == ".txt":
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")
            
    return ""