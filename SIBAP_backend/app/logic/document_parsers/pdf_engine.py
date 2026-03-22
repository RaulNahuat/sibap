import fitz
import pdfplumber
import logging
import time
from collections import Counter

logger = logging.getLogger(__name__)

def is_inside_table(bbox, table_bboxes):
    """Verifica si un bloque de texto está dentro de los límites de una tabla."""
    x0, y0, x1, y1 = bbox
    for t_bbox in table_bboxes:
        tx0, ty0, tx1, ty1 = t_bbox
        # Margen de error de 2 puntos para capturar bordes
        if x0 >= (tx0 - 2) and y0 >= (ty0 - 2) and x1 <= (tx1 + 2) and y1 <= (ty1 + 2):
            return True
    return False

def get_dominant_font_size(doc, max_pages=10):
    """Calcula el tamaño de fuente dominante basándose en las primeras páginas para mayor velocidad."""
    sizes = []
    # Analizar solo las primeras N páginas para consistencia y rapidez
    for i, page in enumerate(doc):
        if i >= max_pages:
            break
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if b["type"] == 0:
                for line in b["lines"]:
                    for span in line["spans"]:
                        sizes.append(round(span["size"]))
    return Counter(sizes).most_common(1)[0][0] if sizes else 12

def extract_tables_from_page(plumber_page):
    """Extrae tablas de una página de pdfplumber y las convierte a Markdown."""
    table = plumber_page.extract_table()
    if not table or len(table) < 2: return ""
    
    md_table = "\n"
    for i, row in enumerate(table):
        clean_row = [str(cell).replace('\n', ' ').strip() if cell else "" for cell in row]
        if not any(clean_row): continue
        md_table += "| " + " | ".join(clean_row) + " |\n"
        if i == 0: md_table += "| " + " | ".join(["---"] * len(row)) + " |\n"
    return md_table

def extract_pdf_with_layout(temp_path: str) -> str:
    start_time = time.time()
    
    try:
        doc = fitz.open(temp_path)
        pdf_p = pdfplumber.open(temp_path)  # Abrir una sola vez
        base_size = get_dominant_font_size(doc)
        logger.info(f"Iniciando extracción de {len(doc)} páginas. Tamaño base: {base_size}")
    except Exception as e:
        logger.error(f"Error abriendo PDF: {e}")
        return ""

    all_content = []
    try:
        for page_index, page in enumerate(doc):
            plumber_page = pdf_p.pages[page_index]
            
            # 1. Obtener bboxes de las tablas en esta página
            tables = plumber_page.find_tables()
            table_bboxes = [t.bbox for t in tables]
            
            blocks = page.get_text("dict")["blocks"]
            mid_x = page.rect.width / 2
            extracted_blocks = []

            for b in blocks:
                if b["type"] == 0:
                    # Ignorar texto si está dentro de una tabla detectada
                    if is_inside_table(b["bbox"], table_bboxes):
                        continue

                    block_text = []
                    max_size = 0
                    for line in b["lines"]:
                        line_text = "".join([s["text"] for s in line["spans"]])
                        max_size = max(max_size, max([s["size"] for s in line["spans"]]))
                        block_text.append(line_text)
                    
                    full_text = " ".join(block_text).strip()
                    if not full_text: continue

                    if max_size > base_size + 4 and len(full_text) < 60:
                        full_text = f"\n# {full_text}\n"
                    elif max_size > base_size + 2 and len(full_text) < 100:
                        full_text = f"\n## {full_text}\n"

                    extracted_blocks.append({
                        "text": full_text,
                        "y0": b["bbox"][1],
                        "center_x": (b["bbox"][0] + b["bbox"][2]) / 2
                    })

            left = sorted([b for b in extracted_blocks if b["center_x"] < mid_x], key=lambda x: x["y0"])
            right = sorted([b for b in extracted_blocks if b["center_x"] >= mid_x], key=lambda x: x["y0"])
            
            page_text = "\n".join([b["text"] for b in (left + right)])
            table_md = extract_tables_from_page(plumber_page)
            all_content.append(f"{page_text}\n{table_md}")
            
    except Exception as e:
        logger.error(f"Error durante la extracción: {e}")
    finally:
        doc.close()
        pdf_p.close()
    
    end_time = time.time()
    logger.info(f"Extracción completada en {end_time - start_time:.2f} segundos.")
    return "\n\n".join(all_content)