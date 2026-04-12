import re
import logging
from typing import List

logger = logging.getLogger(__name__)
_CHARS_PER_TOKEN: int = 4

def _token_estimate(text: str) -> int:
    return len(text) // _CHARS_PER_TOKEN


def _split_by_separator(text: str, separator: str) -> List[str]:
    parts = text.split(separator)
    return [p.strip() for p in parts if p.strip()]


def _merge_chunks(
    splits: List[str],
    chunk_size_chars: int,
    overlap_chars: int,
    separator: str = " ",
) -> List[str]:
    chunks: List[str] = []
    current: List[str] = []
    current_len: int = 0

    for split in splits:
        split_len = len(split)

        if current_len + split_len > chunk_size_chars and current:
            chunk_text = separator.join(current).strip()
            if chunk_text:
                chunks.append(chunk_text)

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
    if not text or not text.strip():
        logger.warning("chunk_service: texto vacío recibido, devolviendo lista vacía.")
        return []

    chunk_size_chars = chunk_size * _CHARS_PER_TOKEN
    overlap_chars = overlap * _CHARS_PER_TOKEN

    if len(text) <= chunk_size_chars:
        return [text.strip()]

    separators = ["\n\n", "\n", ". ", " "]

    def _recursive_split(txt: str, separators: List[str]) -> List[str]:
        separator = separators[0]
        remaining_seps = separators[1:]

        raw_splits = _split_by_separator(txt, separator)

        good_splits: List[str] = []
        final_splits: List[str] = []

        for seg in raw_splits:
            if len(seg) <= chunk_size_chars:
                good_splits.append(seg)
            else:
                if good_splits:
                    merged = _merge_chunks(good_splits, chunk_size_chars, overlap_chars)
                    final_splits.extend(merged)
                    good_splits = []

                if remaining_seps:
                    sub_splits = _recursive_split(seg, remaining_seps)
                    final_splits.extend(sub_splits)
                else:
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
