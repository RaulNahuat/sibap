import os
import tempfile
import logging
from pathlib import Path
from fastapi import UploadFile
import pymupdf4llm
import pypandoc
import mammoth
import fitz
from PIL import Image
import pytesseract
import re

# =========================
# CONFIGURACIÓN
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# =========================
# VALIDACIÓN
def validate_file(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Extensión {ext} no permitida.")

    if not content:
        raise ValueError("Archivo vacío.")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("El archivo excede el límite de 10MB.")

    return ext


# =========================
# OCR PARA PDF ESCANEADO
def ocr_pdf(pdf_path: str) -> str:
    """
    Extrae texto usando OCR cuando el PDF no contiene texto digital.
    """
    logger.info("Ejecutando OCR (PDF escaneado detectado)...")

    doc = fitz.open(pdf_path)
    text_output = []

    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        text = pytesseract.image_to_string(img, lang="spa+eng")
        text_output.append(text)

    return "\n".join(text_output)


# =========================
# NORMALIZACIÓN MARKDOWN
def normalize_markdown(md_text: str) -> str:
    """
    Limpia saltos y normaliza tablas Markdown.
    """
    try:
        md_text = pypandoc.convert_text(
            md_text,
            "gfm",
            format="markdown",
            extra_args=["--wrap=none"]
        )
    except Exception as e:
        logger.warning(f"Pandoc no pudo normalizar markdown: {e}")

    md_text = md_text.replace("\r\n", "\n")
    md_text = md_text.replace("\n\n\n", "\n\n")

    return md_text.strip()

def improve_readability(text: str) -> str:
    """
    Mejora la legibilidad del texto extraído sin ser destructivo.
    """
    text = re.sub(
        r'\b(?:[A-ZÁÉÍÓÚÑ]\s){2,}[A-ZÁÉÍÓÚÑ]\b',
        lambda m: m.group(0).replace(" ", ""),
        text
    )

    text = re.sub(r"\.([A-ZÁÉÍÓÚÑ])", r". \1", text)
    text = text.replace("◦", "- ")
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()

def fix_spaced_words(text: str) -> str:
    """
    Une letras individuales que han sido separadas por espacios.
    Ejemplo: 'A n á l i s i s' -> 'Análisis'
    Solo actúa si detecta una secuencia de letras de 1 carácter separadas por 1 espacio.
    """
    def join_match(match):
        return match.group(0).replace(" ", "")

    text = re.sub(r'\b[a-zA-ZÁÉÍÓÚÑñ](?:\s[a-zA-ZÁÉÍÓÚÑñ]){2,}\b', join_match, text)

    return text

def clean_pdf_text(text: str) -> str:
    """
    Limpieza profunda específica para PDFs (diapositivas, libros, papers).
    """
    ligatures = {
        "ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl",
        "ﬅ": "st", "ﬆ": "st", "Æ": "AE", "æ": "ae", "Œ": "OE", "œ": "oe"
    }
    for search, replace in ligatures.items():
        text = text.replace(search, replace)

    text = re.sub(r'\b(\d+)\s+\1\s+(\d+)\b', r'\2', text)
    text = re.sub(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', '', text)

    def join_broken_caps(match):
        return match.group(0).replace(" ", "")
    text = re.sub(r'\b[A-ZÁÉÍÓÚÑ]{1,2}(?:\s[A-ZÁÉÍÓÚÑ]{1,3}){2,}\b', join_broken_caps, text)

    return text


# =========================
# EXTRACCIÓN PDF
import re

def extract_pdf(temp_path: str) -> str:
    """
    Extrae texto de PDF con detección robusta de columnas y orden de lectura natural.
    """
    try:
        doc = fitz.open(temp_path)
    except Exception as e:
        logger.error(f"Error crítico al abrir PDF: {e}")
        return ""

    all_text = []

    for page in doc:
        try:
            page_dict = page.get_text("dict")
            blocks = page_dict.get("blocks", [])
            
            if not blocks:
                fallback_text = page.get_text("text", sort=True)
                if fallback_text.strip():
                    all_text.append(fallback_text)
                continue

            extracted_blocks = []
            page_rect = page.rect
            mid_x = page_rect.width / 2

            for b in blocks:
                if b.get("type", 0) != 0 or "lines" not in b:
                    continue

                block_segments = []
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        text_part = span.get("text", "").strip()
                        if text_part:
                            block_segments.append(text_part)

                text_content = " ".join(block_segments).strip()
                if not text_content:
                    continue

                bbox = b.get("bbox", (0, 0, 0, 0))
                
                extracted_blocks.append({
                    "text": text_content,
                    "y0": bbox[1],
                    "center_x": (bbox[0] + bbox[2]) / 2 if len(bbox) >= 3 else 0
                })

            if not extracted_blocks:
                fallback_text = page.get_text("text", sort=True)
                if fallback_text.strip():
                    all_text.append(fallback_text)
                continue

            left_col = [b for b in extracted_blocks if b["center_x"] < mid_x]
            right_col = [b for b in extracted_blocks if b["center_x"] >= mid_x]

            left_col.sort(key=lambda x: x["y0"])
            right_col.sort(key=lambda x: x["y0"])

            page_text = "\n".join(b["text"] for b in (left_col + right_col))
            all_text.append(page_text)

        except Exception as page_err:
            logger.warning(f"Error en página {page.number}, aplicando fallback nativo: {page_err}")
            all_text.append(page.get_text("text", sort=True))

    if doc:
        doc.close()

    final_text = "\n\n".join(all_text)

    if len(final_text.strip()) < 50:
        logger.warning(f"Contenido digital insuficiente ({len(final_text)} car), ejecutando OCR...")
        try:
            final_text = ocr_pdf(temp_path)
        except Exception as ocr_err:
            logger.error(f"OCR también falló o no está configurado: {ocr_err}")

    final_text = normalize_markdown(final_text)
    final_text = improve_readability(final_text)
    final_text = clean_pdf_text(final_text)
    final_text = fix_spaced_words(final_text)

    return final_text


# =========================
# EXTRACCIÓN DOCX
def extract_docx(temp_path: str) -> str:
    """
    Extrae DOCX priorizando Pandoc.
    """
    try:
        text = pypandoc.convert_file(
            temp_path,
            "md",
            extra_args=["--wrap=none"]
        )
        text = normalize_markdown(text)
        return text

    except Exception as e:
        logger.warning(f"Pandoc falló, usando Mammoth: {e}")
        with open(temp_path, "rb") as docx_file:
            result = mammoth.convert_to_markdown(docx_file)
        return normalize_markdown(result.value)


# =========================
# EXTRACCIÓN TXT
def extract_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")


# =========================
# PROCESADOR PRINCIPAL
def process_document(content: bytes, filename: str) -> dict:
    extension = validate_file(filename, content)

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name

    text = ""

    try:
        if extension == ".pdf":
            text = extract_pdf(temp_path)

        elif extension == ".docx":
            text = extract_docx(temp_path)

        elif extension == ".txt":
            text = extract_txt(content)

        if not text.strip():
            raise ValueError("No se pudo extraer contenido legible.")

    except Exception as e:
        logger.error(f"Error procesando documento: {e}")
        raise ValueError(f"Error procesando el documento: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "filename": filename,
        "extension": extension,
        "char_count": len(text),
        "text": text
    }
