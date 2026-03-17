"""
chunk_service.py
----------------
Divide texto largo en fragmentos (chunks) para indexado en vector store.

Estrategia: RecursiveCharacterTextSplitter manual — no requiere LangChain.
  1. Intenta dividir en párrafos (\\n\\n)
  2. Si un trozo sigue siendo grande, divide en oraciones (. / \\n)
  3. Como último recurso, divide por palabras
"""

import re
import logging
from typing import List

logger = logging.getLogger(__name__)

# ~4 caracteres por token promedio en español
_CHARS_PER_TOKEN: int = 4


def _token_estimate(text: str) -> int:
    """Estimación rápida de tokens basada en caracteres."""
    return len(text) // _CHARS_PER_TOKEN


def _split_by_separator(text: str, separator: str) -> List[str]:
    """Divide texto por un separador y elimina segmentos vacíos."""
    parts = text.split(separator)
    return [p.strip() for p in parts if p.strip()]


def _merge_chunks(
    splits: List[str],
    chunk_size_chars: int,
    overlap_chars: int,
    separator: str = " ",
) -> List[str]:
    """
    Combina segmentos pequeños en chunks del tamaño objetivo,
    añadiendo solapamiento entre chunks consecutivos.
    """
    chunks: List[str] = []
    current: List[str] = []
    current_len: int = 0

    for split in splits:
        split_len = len(split)

        # Si añadir este segmento supera el límite, cierra el chunk actual
        if current_len + split_len > chunk_size_chars and current:
            chunk_text = separator.join(current).strip()
            if chunk_text:
                chunks.append(chunk_text)

            # Calcula el overlap: retrocede segmentos hasta cubrir overlap_chars
            overlap_parts: List[str] = []
            overlap_len = 0
            for part in reversed(current):
                if overlap_len + len(part) > overlap_chars:
                    break
                overlap_parts.insert(0, part)
                overlap_len += len(part) + len(separator)

            current = overlap_parts
            current_len = overlap_len

        current.append(split)
        current_len += split_len + len(separator)

    # Último chunk residual
    if current:
        chunk_text = separator.join(current).strip()
        if chunk_text:
            chunks.append(chunk_text)

    return chunks


def split_text(
    text: str,
    chunk_size: int = 600,
    overlap: int = 100,
) -> List[str]:
    """
    Divide `text` en chunks de aprox. `chunk_size` tokens con `overlap` tokens de solapamiento.

    Args:
        text:        Texto plano a dividir.
        chunk_size:  Tamaño objetivo en tokens (default 600 ≈ 2,400 caracteres).
        overlap:     Solapamiento entre chunks en tokens (default 100 ≈ 400 caracteres).

    Returns:
        Lista de strings, cada uno siendo un chunk listo para embeddear.
    """
    if not text or not text.strip():
        logger.warning("chunk_service: texto vacío recibido, devolviendo lista vacía.")
        return []

    # Convertir tokens → caracteres para las operaciones internas
    chunk_size_chars = chunk_size * _CHARS_PER_TOKEN
    overlap_chars = overlap * _CHARS_PER_TOKEN

    # Si el texto completo ya cabe en un solo chunk, devolverlo tal cual
    if len(text) <= chunk_size_chars:
        return [text.strip()]

    # Jerarquía de separadores: párrafos > oraciones > palabras
    separators = ["\n\n", "\n", ". ", " "]

    def _recursive_split(txt: str, separators: List[str]) -> List[str]:
        separator = separators[0]
        remaining_seps = separators[1:]

        raw_splits = _split_by_separator(txt, separator)

        # Segmentos que ya tienen el tamaño correcto
        good_splits: List[str] = []
        final_splits: List[str] = []

        for seg in raw_splits:
            if len(seg) <= chunk_size_chars:
                good_splits.append(seg)
            else:
                # Primero, mezcla los buenos segmentos acumulados
                if good_splits:
                    merged = _merge_chunks(good_splits, chunk_size_chars, overlap_chars)
                    final_splits.extend(merged)
                    good_splits = []

                # Divide recursivamente el segmento grande
                if remaining_seps:
                    sub_splits = _recursive_split(seg, remaining_seps)
                    final_splits.extend(sub_splits)
                else:
                    # Último recurso: corte bruto por palabras
                    words = seg.split(" ")
                    merged = _merge_chunks(words, chunk_size_chars, overlap_chars, separator=" ")
                    final_splits.extend(merged)

        if good_splits:
            merged = _merge_chunks(good_splits, chunk_size_chars, overlap_chars)
            final_splits.extend(merged)

        return final_splits

    chunks = _recursive_split(text, separators)

    logger.info(
        f"chunk_service: texto de {len(text):,} chars dividido en {len(chunks)} chunks "
        f"(objetivo ~{chunk_size} tokens, overlap ~{overlap} tokens)."
    )
    return chunks
