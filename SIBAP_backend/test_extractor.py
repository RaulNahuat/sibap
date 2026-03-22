import os
import sys
import glob

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.logic.document_parsers.pdf_engine import extract_pdf_with_layout
from app.utils.text_cleaner import clean_extracted_text

pdf_files = glob.glob("app/storage/documents/*.pdf")

for pdf_path in pdf_files:
    print(f"--- Testing {pdf_path} ---")
    try:
        raw_text, is_complex = extract_pdf_with_layout(pdf_path)
        clean_text = clean_extracted_text(raw_text)
        print(f"SUCCESS: Extracted {len(clean_text)} chars. Complex: {is_complex}")
        
        # Guardar en txt para manual inspection
        base = os.path.basename(pdf_path)
        with open(f"test_out_{base}.txt", "w", encoding="utf-8") as f:
            f.write(clean_text)
    except Exception as e:
        print(f"ERROR on {pdf_path}: {e}")
