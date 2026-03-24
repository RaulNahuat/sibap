import re
import fitz
import pdfplumber
import logging
import time
from collections import Counter

logger = logging.getLogger(__name__)

OVERLAP_THRESHOLD = 0.60   
TABLE_PADDING = 4          
BOLD_FLAG = 0b10000        

_NOISE_RE = re.compile(
    r'^[\s\|─│\-–—=*•·°~`]+$'   
    r'|^\s*\d{1,4}\s*$'          
    r'|^\s*[A-Za-z]\s*$'         
    r'|^\s*\|?\s*[a-zA-Z0-9]\s*\|?\s*$',  
    re.UNICODE,
)

def _bbox_overlap_ratio(block_bbox: tuple, table_bbox: tuple) -> float:
    bx0, by0, bx1, by1 = block_bbox
    tx0, ty0, tx1, ty1 = table_bbox
    ix = max(0.0, min(bx1, tx1) - max(bx0, tx0))
    iy = max(0.0, min(by1, ty1) - max(by0, ty0))
    intersection = ix * iy
    block_area = max(1.0, (bx1 - bx0) * (by1 - by0))
    return intersection / block_area


def is_inside_table(bbox: tuple, table_bboxes: list,
                    threshold: float = OVERLAP_THRESHOLD) -> bool:
    return any(_bbox_overlap_ratio(bbox, t) >= threshold for t in table_bboxes)


def _expand_bboxes(bboxes: list, pad: float = TABLE_PADDING) -> list:
    return [(x0 - pad, y0 - pad, x1 + pad, y1 + pad)
            for x0, y0, x1, y1 in bboxes]


def _is_noise(text: str) -> bool:
    return bool(_NOISE_RE.match(text.strip()))


def _classify_heading(max_size: float, is_bold: bool,
                      text_len: int, base_size: float) -> str:
    if max_size > base_size + 4 and text_len < 80:
        return "#"
    if (max_size > base_size + 2 or is_bold) and text_len < 120:
        return "##"
    if is_bold and text_len < 200:
        return "###"
    return ""



def get_dominant_font_size(doc, max_pages: int = 10) -> float:
    sizes = []
    for i, page in enumerate(doc):
        if i >= max_pages:
            break
        for b in page.get_text("dict")["blocks"]:
            if b["type"] == 0:
                for line in b["lines"]:
                    for span in line["spans"]:
                        sizes.append(round(span["size"]))
    return Counter(sizes).most_common(1)[0][0] if sizes else 12


def extract_tables_from_page(plumber_page) -> str:
    tables = plumber_page.find_tables()
    if not tables:
        return ""

    md_parts = []
    for tbl in tables:
        data = tbl.extract()
        if not data or len(data) < 2:
            continue

        rows_md = []
        for i, row in enumerate(data):
            clean = [str(cell).replace("\n", " ").strip() if cell else "" for cell in row]
            if not any(clean):
                continue
            rows_md.append("| " + " | ".join(clean) + " |")
            if i == 0:
                rows_md.append("| " + " | ".join(["---"] * len(row)) + " |")

        if rows_md:
            md_parts.append("\n" + "\n".join(rows_md) + "\n")

    return "\n".join(md_parts)


from typing import Tuple

# ── Función principal de extracción ──────────────────────────────────────────

def extract_pdf_with_layout(temp_path: str) -> Tuple[str, bool]:
    start_time = time.time()

    try:
        doc = fitz.open(temp_path)
        pdf_p = pdfplumber.open(temp_path)
        base_size = get_dominant_font_size(doc)
        logger.info(
            "Iniciando extracción: %d páginas, tamaño base=%.1f",
            len(doc), base_size
        )
    except Exception as exc:
        logger.error("Error abriendo PDF '%s': %s", temp_path, exc)
        return ""

    all_content = []
    is_complex = False

    try:
        for page_index, page in enumerate(doc):
            plumber_page = pdf_p.pages[page_index]
            raw_bboxes = [t.bbox for t in plumber_page.find_tables()]
            if raw_bboxes:
                is_complex = True
            table_bboxes = _expand_bboxes(raw_bboxes)
            blocks = page.get_text("dict", sort=True)["blocks"]
            extracted_blocks = []

            for b in blocks:
                if b["type"] != 0:
                    continue
                if is_inside_table(b["bbox"], table_bboxes):
                    continue

                block_lines = []
                max_size = 0.0
                any_bold = False

                for line in b["lines"]:
                    line_text = "".join(s["text"] for s in line["spans"])
                    for span in line["spans"]:
                        sz = span["size"]
                        if sz > max_size:
                            max_size = sz
                        if span.get("flags", 0) & BOLD_FLAG:
                            any_bold = True
                    block_lines.append(line_text)

                full_text = " ".join(block_lines).strip()
                if not full_text or _is_noise(full_text):
                    continue

                heading_prefix = _classify_heading(
                    max_size, any_bold, len(full_text), base_size
                )
                if heading_prefix:
                    full_text = f"\n{heading_prefix} {full_text}\n"

                extracted_blocks.append({
                    "text": full_text,
                    "y0": b["bbox"][1],
                    "center_x": (b["bbox"][0] + b["bbox"][2]) / 2,
                })

            page_text = "\n\n".join(blk["text"] for blk in extracted_blocks)

            table_md = extract_tables_from_page(plumber_page)
            all_content.append(f"{page_text}\n\n{table_md}\n" if table_md else page_text)

    except Exception as exc:
        logger.error("Error durante la extracción en página %d: %s", page_index, exc)
    finally:
        doc.close()
        pdf_p.close()

    elapsed = time.time() - start_time
    logger.info("Extracción completada en %.2f s. Complejo: %s", elapsed, is_complex)
    return "\n\n".join(all_content), is_complex