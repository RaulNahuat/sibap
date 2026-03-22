from typing import Tuple

from .pdf_engine import extract_pdf_with_layout
from .docx_engine import extract_docx
from .pptx_engine import extract_pptx

def get_text_from_file(extension: str, file_path: str, content: bytes) -> Tuple[str, bool]:
    """
    Rutea el archivo al motor adecuado según su extensión.
    Retorna una tupla: (texto_extraído: str, is_complex: bool)
    """
    ext = extension.lower()
    
    if ext == ".pdf":
        return extract_pdf_with_layout(file_path)
    elif ext == ".docx":
        # Todo documento DOCX/PPTX original subido por el usuario
        # lo marcamos como complejo para conservarlo, ya que la extracción
        # texto plano pierde mucha estructura original.
        return extract_docx(file_path), True
    elif ext == ".pptx":
        return extract_pptx(file_path), True
    elif ext == ".txt":
        return content.decode("utf-8", errors="replace"), False
    else:
        raise ValueError(f"Extensión no soportada: {ext}")