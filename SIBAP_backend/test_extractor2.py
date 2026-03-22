import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.logic.document_parsers.pdf_engine import extract_pdf_with_layout
from app.utils.text_cleaner import clean_extracted_text

pdf_path = "app/storage/documents/a06e4b27944c47139a31c1ce1768eee5.pdf"

try:
    raw_text, is_complex = extract_pdf_with_layout(pdf_path)
    clean_text = clean_extracted_text(raw_text)
    print("--- EXTRACTED TEXT ---")
    print(clean_text[:1500])
except Exception as e:
    print(f"Error: {e}")
