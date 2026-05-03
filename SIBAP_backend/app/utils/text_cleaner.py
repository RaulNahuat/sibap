"""
text_cleaner.py — Limpiador de texto extraído de PDF para SIBAP (v3)
=====================================================================
Pipeline de limpieza en orden:
  1. _normalize_unicode       — canonicaliza caracteres tipográficos especiales
  2. _normalize_math_italic   — convierte letras Unicode cursivas matemáticas a ASCII
  3. _remove_visual_noise     — elimina ruido de diseño (| i |, reglas, página-nros)
  4. _join_split_headings     — une encabezados partidos por saltos de página/columna
  5. _reconstruct_formulas    — reconstruye fórmulas financieras en LaTeX correcto
  6. _wrap_math_blocks        — detecta ecuaciones simbólicas residuales y las envuelve en $$
  7. _collapse_blank_lines    — normaliza líneas en blanco excesivas (>2 → 2)
"""

import re

# ──Normalización de caracteres tipográficos ───────────────────────────────

_UNICODE_MAP: dict[str, str] = {
    "\u2018": "'",   # comilla simple izquierda
    "\u2019": "'",   # comilla simple derecha
    "\u201c": '"',   # comilla doble izquierda
    "\u201d": '"',   # comilla doble derecha
    "\u2013": "-",   # guion medio (en-dash)
    "\u2014": "--",  # guion largo (em-dash)
    "\u2212": "-",   # signo menos tipográfico U+2212
    "\u00d7": "*",   # signo de multiplicación ×
    "\u00f7": "/",   # signo de división ÷
    "\u2248": "~",   # aproximadamente igual
    "\u221e": "inf", # infinito
}


def _normalize_unicode(text: str) -> str:
    """Reemplaza caracteres tipográficos por equivalentes ASCII seguros."""
    for orig, repl in _UNICODE_MAP.items():
        text = text.replace(orig, repl)
    return text


# ──Normalización de letras Unicode matemáticas cursivas ───────────────────
def _normalize_math_italic(text: str) -> str:
    """
    Convierte letras matemáticas cursivas Unicode a su equivalente ASCII.

    Rangos cubiertos:
      U+1D434 – U+1D44D  →  A-Z  (Mathematical Italic Capital)
      U+1D44E – U+1D467  →  a-z  (Mathematical Italic Small)
        * U+1D455 no existe en Unicode; h cursivo usa U+210E (ℎ)

    Ejemplo: '𝑃= 𝑅1 -(1 + 𝑖)-𝑛 𝑖'  →  'P= R1 -(1 + i)-n i'
    """
    result = []
    for ch in text:
        cp = ord(ch)
        if 0x1D434 <= cp <= 0x1D44D:                    # A-Z cursivo
            result.append(chr(ord('A') + cp - 0x1D434))
        elif 0x1D44E <= cp <= 0x1D467:                  # a-z cursivo
            if cp == 0x1D455:                            # h no asignado
                result.append('h')
            else:
                result.append(chr(ord('a') + cp - 0x1D44E))
        elif cp == 0x210E:                               # ℎ alternativo
            result.append('h')
        else:
            result.append(ch)
    return ''.join(result)


# ──Eliminación de ruido visual ────────────────────────────────────────────
_NOISE_LINE_RE = re.compile(
    r"^[ \t]*(?:\|[ \t]*)+[A-Za-z0-9][ \t]*(?:\|[ \t]*)+$"   # | i | y similares
    r"|^[ \t]*[-─│═|~=]{2,}[ \t]*$"                            # reglas horizontales
    r"|^\s*\d{1,4}\s*$",                                        # números de página solos
    re.MULTILINE | re.UNICODE,
)


def _remove_visual_noise(text: str) -> str:
    """Elimina líneas de ruido visual que no aportan contenido semántico."""
    return _NOISE_LINE_RE.sub("", text)


# ─Unión de encabezados partidos ─────────────────────────────────────────
_HEADING_CONT_RE = re.compile(
    r"(#{1,3}[ \t][^\n]+[^.!?:\n])\n[ \t]*#{0,3}[ \t]*"
    r"([A-ZÁÉÍÓÚÜÑ\u00c0-\u00ffA-Za-záéíóúüñ][^\n]+)",
    re.UNICODE,
)


def _join_split_headings(text: str) -> str:
    """
    Une encabezados fragmentados por saltos de página o columna.
    Aplica el patrón iterativamente hasta que no haya más coincidencias.
    """
    prev = None
    while prev != text:
        prev = text
        text = _HEADING_CONT_RE.sub(r"\1 \2", text)
    return text


# ──Reconstrucción de fórmulas ──────────────────────
_FORMULA_PATTERNS = [
    (
        re.compile(
            r"P\s*=\s*R\s*1\s*-\s*\(?\s*1\s*\+\s*i\s*\)?\s*-?\s*n\s+i",
            re.IGNORECASE,
        ),
        r"$$P = R\\left[\\frac{1-(1+i)^{-n}}{i}\\right]$$",
    ),
    (
        re.compile(
            r"[Ss]\s*=\s*[Rr]\s*\(?\s*1\s*\+\s*[Ii]\s*\)?\s*n\s*-\s*1\s+[Ii]",
            re.IGNORECASE,
        ),
        r"$$S = R\\left[\\frac{(1+i)^{n}-1}{i}\\right]$$",
    ),
    (
        re.compile(
            r"[Rr]\s*=\s*[Pp]\s*[Ii]\s*[/÷]?\s*1\s*-\s*\(?\s*1\s*\+\s*[Ii]\s*\)?\s*-?\s*[Nn]",
            re.IGNORECASE,
        ),
        r"$$R = \\frac{P \\cdot i}{1-(1+i)^{-n}}$$",
    ),
    (
        re.compile(
            r"\bI\s*=\s*\(?\s*[Cc]\s*\)?\s*\(?\s*[Ii]\s*\)?\s*\(?\s*[Tt]\s*\)?",
        ),
        r"$$I = C \\cdot i \\cdot t$$",
    ),
]


def _reconstruct_formulas(text: str) -> str:
    segments = re.split(r"(\$\$.*?\$\$)", text, flags=re.DOTALL)
    result = []
    for seg in segments:
        if seg.startswith("$$"):
            result.append(seg)  # ya es LaTeX, no tocar
        else:
            for pattern, replacement in _FORMULA_PATTERNS:
                seg = pattern.sub(replacement, seg)
            result.append(seg)
    return "".join(result)


# ──Envuelto genérico de expresiones simbólicas residuales ────────────────
_MATH_LINE_RE = re.compile(
    r"(?m)^[ \t]*"
    r"(?:"
    r"[A-Z]{1,3}\s*=\s*[A-Z0-9\s\(\)\[\]\^\+\-\*/\\.{},]{6,}"   # VP = R(1+i)^n
    r"|[a-z]{1,3}\s*=\s*[A-Za-z0-9\s\(\)\[\]\^\+\-\*/\\.{},]{6,}"  # i = r/m
    r")"
    r"[ \t]*$",
    re.UNICODE,
)


def _wrap_math_blocks(text: str) -> str:
    segments = re.split(r"(\$\$.*?\$\$)", text, flags=re.DOTALL)
    result = []
    for seg in segments:
        if seg.startswith("$$"):
            result.append(seg)
        else:
            result.append(_MATH_LINE_RE.sub(
                lambda m: f"\n$$\n{m.group(0).strip()}\n$$\n", seg
            ))
    return "".join(result)


# ──Colapso de líneas en blanco ────────────────────────────────────────────
def _collapse_blank_lines(text: str) -> str:
    """Reduce tres o más líneas en blanco consecutivas a exactamente dos."""
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" +", " ", text)
    return text


# ── Función pública principal ─────────────────────────────────────────────────
def clean_extracted_text(text: str) -> str:
    if not text:
        return ""

    text = _normalize_unicode(text)
    text = _normalize_math_italic(text)
    text = _remove_visual_noise(text)
    text = _join_split_headings(text)
    text = _reconstruct_formulas(text)
    text = _wrap_math_blocks(text)
    text = _collapse_blank_lines(text)
    return text.strip()