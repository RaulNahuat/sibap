from typing import Tuple, Callable, Dict

from .pdf_engine import extract_pdf_with_layout
from .docx_engine import extract_docx
from .pptx_engine import extract_pptx

_PARSERS: Dict[str, Callable[[str], str]] = {
    ".pdf": extract_pdf_with_layout,
    ".docx": extract_docx,
    ".pptx": extract_pptx,
}

_COMPLEX_EXTENSIONS = {".docx", ".pptx"}

def get_text_from_file(extension: str, file_path: str, content: bytes) -> Tuple[str, bool]:
    ext = extension.lower()
    
    if ext == ".txt":
        return content.decode("utf-8", errors="replace"), False

    parser = _PARSERS.get(ext)
    if not parser:
        raise ValueError(f"Extensión no soportada: {ext}")
        
    result = parser(file_path)
    
    if isinstance(result, tuple):
        text, p_is_complex = result
    else:
        text, p_is_complex = result, False
        
    final_is_complex = (ext in _COMPLEX_EXTENSIONS) or p_is_complex
    return text, final_is_complex
