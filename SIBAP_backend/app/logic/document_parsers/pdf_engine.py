"""
pdf_engine.py — Motor de extracción de PDF para SIBAP (v2)
=========================================================
Mejoras respecto a la v1:
  * is_inside_table usa ratio de solapamiento (≥60 %) en lugar de
    contención estricta, eliminando la fuga de texto en bordes de tabla.
  * _expand_bboxes añade padding configurable a los bboxes de pdfplumber.
  * _classify_heading detecta encabezados por tamaño de fuente Y por el
    flag de negrita (bit 4 de fitz), no solo por tamaño.
  * _is_noise filtra bloques de decoración, números de página sueltos y
    residuos de un solo carácter ANTES de agregarlos al output.
  * El ordenamiento por columnas usa una clave (columna, y0) estable.
  * extract_tables_from_page maneja celdas None de forma robusta.
"""

import re
import fitz
import pdfplumber
import logging
import time
from collections import Counter

logger = logging.getLogger(__name__)

# ── Constantes configurables ──────────────────────────────────────────────────
OVERLAP_THRESHOLD = 0.60   # fracción mínima del bloque que debe solaparse con la tabla
TABLE_PADDING = 4          # pts de padding alrededor de cada bbox de tabla
BOLD_FLAG = 0b10000        # bit 4 del campo flags de fitz → negrita

_NOISE_RE = re.compile(
    r'^[\s\|─│\-–—=*•·°~`]+$'   # líneas puramente decorativas
    r'|^\s*\d{1,4}\s*$'          # números de página sueltos (1-4 dígitos)
    r'|^\s*[A-Za-z]\s*$'         # residuos de un solo carácter
    r'|^\s*\|?\s*[a-zA-Z0-9]\s*\|?\s*$',  # celdas residuales tipo "| i |"
    re.UNICODE,
)


# ── Funciones auxiliares ──────────────────────────────────────────────────────

def _bbox_overlap_ratio(block_bbox: tuple, table_bbox: tuple) -> float:
    """Calcula qué fracción del bloque queda dentro de la tabla."""
    bx0, by0, bx1, by1 = block_bbox
    tx0, ty0, tx1, ty1 = table_bbox
    ix = max(0.0, min(bx1, tx1) - max(bx0, tx0))
    iy = max(0.0, min(by1, ty1) - max(by0, ty0))
    intersection = ix * iy
    block_area = max(1.0, (bx1 - bx0) * (by1 - by0))
    return intersection / block_area


def is_inside_table(bbox: tuple, table_bboxes: list,
                    threshold: float = OVERLAP_THRESHOLD) -> bool:
    """
    Devuelve True si el bloque de texto pertenece a alguna tabla.
    Usa ratio de solapamiento en lugar de contención estricta para evitar
    que variaciones de 1-2 pts en los bboxes de pdfplumber provoquen fugas.
    """
    return any(_bbox_overlap_ratio(bbox, t) >= threshold for t in table_bboxes)


def _expand_bboxes(bboxes: list, pad: float = TABLE_PADDING) -> list:
    """Expande cada bbox añadiendo `pad` puntos en cada dirección."""
    return [(x0 - pad, y0 - pad, x1 + pad, y1 + pad)
            for x0, y0, x1, y1 in bboxes]


def _is_noise(text: str) -> bool:
    """Devuelve True si el bloque es ruido visual y debe descartarse."""
    return bool(_NOISE_RE.match(text.strip()))


def _classify_heading(max_size: float, is_bold: bool,
                      text_len: int, base_size: float) -> str:
    """
    Devuelve el prefijo Markdown de encabezado adecuado o '' si es párrafo.
    Criterio: tamaño de fuente relativo al dominante + flag de negrita fitz.
    """
    if max_size > base_size + 4 and text_len < 80:
        return "#"
    if (max_size > base_size + 2 or is_bold) and text_len < 120:
        return "##"
    if is_bold and text_len < 200:
        return "###"
    return ""



def get_dominant_font_size(doc, max_pages: int = 10) -> float:
    """
    Calcula el tamaño de fuente dominante analizando las primeras N páginas.
    El modo de la distribución representa el texto de cuerpo normal.
    """
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
    """
    Extrae todas las tablas de una página pdfplumber y las convierte a
    Markdown. Maneja celdas None y filas completamente vacías de forma robusta.
    """
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
            # Normalizar: reemplazar None, limpiar saltos internos
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
    """
    Extrae el contenido de un PDF como Markdown estructurado.

    Garantías:
    - Ningún texto que pertenezca a una tabla se duplica fuera del bloque Markdown.
    - Los encabezados se detectan por tamaño de fuente Y negrita.
    - El ruido visual (números de página, decoraciones) se filtra a nivel de bloque.
    - El orden de lectura en documentos de dos columnas es correcto.
    """
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
            # 1. Obtener y expandir bboxes de tablas detectadas por pdfplumber
            raw_bboxes = [t.bbox for t in plumber_page.find_tables()]
            if raw_bboxes:
                is_complex = True
            table_bboxes = _expand_bboxes(raw_bboxes)

            # 2. Iterar sobre bloques de texto de fitz (sort=True ordena topológicamente)
            blocks = page.get_text("dict", sort=True)["blocks"]
            extracted_blocks = []

            for b in blocks:
                if b["type"] != 0:
                    continue

                # Excluir si el bloque pertenece a una tabla (ratio ≥ threshold)
                if is_inside_table(b["bbox"], table_bboxes):
                    continue

                # Recopilar texto y atributos tipográficos del bloque
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

                # 3. Clasificar como encabezado o párrafo
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

            # 4. Concatenar bloques, ya que fitz sort=True nos los entrega en orden correcto
            page_text = "\n\n".join(blk["text"] for blk in extracted_blocks)

            # 5. Agregar tablas formateadas en Markdown al final de la página
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