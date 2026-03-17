import re
import pypandoc
import logging

logger = logging.getLogger(__name__)

def clean_extracted_text(text: str) -> str:
    """Aplica el pipeline completo de limpieza al texto extraído."""
    text = normalize_markdown(text)
    text = fix_spaced_words(text)
    text = improve_readability(text)
    text = remove_pdf_artifacts(text)
    return text.strip()

def normalize_markdown(md_text: str) -> str:
    try:
        md_text = pypandoc.convert_text(
            md_text, "gfm", format="markdown", extra_args=["--wrap=none"]
        )
    except Exception as e:
        logger.warning(f"Pandoc falló en normalización: {e}")
    
    return md_text.replace("\r\n", "\n").replace("\n\n\n", "\n\n")

def fix_spaced_words(text: str) -> str:
    """Une letras separadas: 'A n á l i s i s' -> 'Análisis'."""
    return re.sub(
        r'\b[a-zA-ZÁÉÍÓÚÑñ](?:\s[a-zA-ZÁÉÍÓÚÑñ]){2,}\b', 
        lambda m: m.group(0).replace(" ", ""), 
        text
    )

def improve_readability(text: str) -> str:
    # Elimina espacios en palabras en mayúsculas
    text = re.sub(r'\b(?:[A-ZÁÉÍÓÚÑ]\s){2,}[A-ZÁÉÍÓÚÑ]\b', lambda m: m.group(0).replace(" ", ""), text)
    # Corrige puntuación sin espacio
    text = re.sub(r"\.([A-ZÁÉÍÓÚÑ])", r". \1", text)
    # Normaliza viñetas y espacios múltiples
    text = text.replace("◦", "- ")
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text

def remove_pdf_artifacts(text: str) -> str:
    # Reemplaza ligaduras comunes
    ligatures = {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl"}
    for search, replace in ligatures.items():
        text = text.replace(search, replace)
    # Elimina números de página repetidos o fechas (patrones simples)
    text = re.sub(r'\b(\d+)\s+\1\s+(\d+)\b', r'\2', text)
    return text