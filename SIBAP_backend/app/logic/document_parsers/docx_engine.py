import pypandoc
import mammoth
import logging

logger = logging.getLogger(__name__)

def extract_docx(temp_path: str) -> str:
    try:
        text = pypandoc.convert_file(temp_path, "md", extra_args=["--wrap=none"])
        return text
    except Exception as e:
        logger.warning(f"Pandoc falló, usando Mammoth: {e}")
        with open(temp_path, "rb") as docx_file:
            result = mammoth.convert_to_markdown(docx_file)
            return result.value