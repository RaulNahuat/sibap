import fitz
import pytesseract
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def ocr_pdf(pdf_path: str) -> str:
    logger.info("Iniciando OCR en PDF escaneado...")
    doc = fitz.open(pdf_path)
    text_output = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text_output.append(pytesseract.image_to_string(img, lang="spa+eng"))
    doc.close()
    return "\n".join(text_output)

def extract_pdf_with_layout(temp_path: str) -> str:
    try:
        doc = fitz.open(temp_path)
    except Exception as e:
        logger.error(f"No se pudo abrir PDF: {e}")
        return ""

    all_text = []
    for page in doc:
        # Lógica robusta de columnas (como tenías originalmente)
        page_dict = page.get_text("dict")
        blocks = page_dict.get("blocks", [])
        mid_x = page.rect.width / 2
        
        extracted_blocks = []
        for b in blocks:
            if b.get("type") == 0 and "lines" in b:
                text_content = " ".join([" ".join([s["text"] for s in l["spans"]]) for l in b["lines"]]).strip()
                if text_content:
                    extracted_blocks.append({
                        "text": text_content,
                        "y0": b["bbox"][1],
                        "center_x": (b["bbox"][0] + b["bbox"][2]) / 2
                    })

        left = sorted([b for b in extracted_blocks if b["center_x"] < mid_x], key=lambda x: x["y0"])
        right = sorted([b for b in extracted_blocks if b["center_x"] >= mid_x], key=lambda x: x["y0"])
        all_text.append("\n".join([b["text"] for b in (left + right)]))
    
    doc.close()
    final_text = "\n\n".join(all_text)

    # Fallback a OCR si el texto es muy pobre
    if len(final_text.strip()) < 50:
        final_text = ocr_pdf(temp_path)
        
    return final_text