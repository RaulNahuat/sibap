import re

def clean_extracted_text(text: str) -> str:
    # 1. Unir títulos que se cortaron en dos líneas
    # Ejemplo: "## 1.Definición de \n ## amortización" -> "## 1.Definición de amortización"
    text = re.sub(r'(#+ .*?)\n\s*#*\s*([a-zÁéíóúñ])', r'\1 \2', text)

    # 2. Eliminar '#' huérfanos que no tienen texto al lado
    text = re.sub(r'(?m)^\s*#\s*$', '', text)
    
    # 3. Formatear fórmulas financieras complejas (LaTeX Estándar)
    # Detecta la estructura de anualidades: P = R [ (1 - (1+i)^-n) / i ]
    text = re.sub(
        r'P\s*=\s*R\s*1\s*−\s*\(1\s*\+\s*i\)\s*−\s*n\s*i', 
        r'$$P = R \\left[ \\frac{1 - (1 + i)^{-n}}{i} \\right]$$', 
        text, flags=re.IGNORECASE
    )

    # 4. Formatear la relación de amortización
    text = re.sub(
        r'ABONO\s*=\s*INTERÉS\s*\+\s*AMORTIZACIÓN', 
        r'$$ABONO = INTERÉS + AMORTIZACIÓN$$', 
        text, flags=re.IGNORECASE
    )

    # 5. Normalizar espacios y saltos de línea excesivos
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    
    return text.strip()