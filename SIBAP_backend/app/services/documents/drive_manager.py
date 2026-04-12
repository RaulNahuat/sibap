
import io
import re
import logging
from typing import Optional

import requests
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024    
DOWNLOAD_TIMEOUT_SECONDS: int = 30              
CHUNK_SIZE: int = 8192                          

_DRIVE_DOWNLOAD_URL = "https://drive.google.com/uc"
_DRIVE_ID_PATTERN = re.compile(
    r"(?:"
    r"/file/d/([a-zA-Z0-9_-]{25,})"    
    r"|[?&]id=([a-zA-Z0-9_-]{25,})"    
    r")"
)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}


def download_from_drive(url: str) -> bytes:
    file_id = _extract_file_id(url)
    if not file_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL de Google Drive inválida. Formatos soportados: /file/d/{ID} y ?id={ID}",
        )
    logger.info(f"Drive: file_id={file_id}")

    download_params = {"export": "download", "id": file_id}

    return _stream_download(file_id, download_params)


def _extract_file_id(url: str) -> Optional[str]:
    match = _DRIVE_ID_PATTERN.search(url)
    if match:
        return match.group(1) or match.group(2)
    return None


def _stream_download(file_id: str, params: dict) -> bytes:
    try:
        with requests.get(
            _DRIVE_DOWNLOAD_URL,
            params=params,
            headers=_HEADERS,
            stream=True,
            timeout=DOWNLOAD_TIMEOUT_SECONDS,
            allow_redirects=True,
        ) as resp:

            if resp.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Acceso denegado al archivo de Google Drive. "
                        "Asegúrate de que el archivo sea público: "
                        "Compartir → 'Cualquiera con el enlace'."
                    ),
                )
            if resp.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="El archivo no fue encontrado en Google Drive. Verifica que el enlace sea correcto.",
                )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Google Drive respondió con código HTTP {resp.status_code}.",
                )

            content_type = resp.headers.get("Content-Type", "")
            if "text/html" in content_type:
                html_chunk = resp.raw.read(4096).decode("utf-8", errors="ignore")
                confirm_match = re.search(r'href="(/uc\?[^"]+confirm=[^"]+)"', html_chunk)
                if confirm_match:
                    confirm_url = "https://drive.google.com" + confirm_match.group(1).replace("&amp;", "&")
                    logger.info(f"Drive: siguiendo URL de confirmación para {file_id}")
                    return _stream_download(file_id, {})  # re-intento sería con la URL directa
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        "El archivo es demasiado grande para descargarse automáticamente desde Drive. "
                        "Descárgalo manualmente y súbelo directamente al sistema."
                    ),
                )

            content_length = resp.headers.get("Content-Length")
            if content_length is not None:
                size = int(content_length)
                logger.debug(f"Drive: Content-Length={size} bytes (límite={MAX_FILE_SIZE_BYTES})")
                if size > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            f"El archivo pesa {size / (1024*1024):.1f} MB y supera "
                            f"el límite de 10 MB permitido."
                        ),
                    )

            buffer = io.BytesIO()
            downloaded = 0

            for chunk in resp.iter_content(chunk_size=CHUNK_SIZE):
                if not chunk:
                    continue
                downloaded += len(chunk)

                if downloaded > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            f"El archivo supera el límite de 10 MB permitido "
                            f"(descargados {downloaded / (1024*1024):.1f} MB)."
                        ),
                    )
                buffer.write(chunk)

            file_bytes = buffer.getvalue()
            logger.info(f"Drive: descarga completada — {len(file_bytes)} bytes para file_id={file_id}")
            return file_bytes

    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Timeout al descargar el archivo desde Google Drive (límite: {DOWNLOAD_TIMEOUT_SECONDS}s).",
        )
    except requests.exceptions.RequestException as exc:
        logger.error(f"Drive: error de red para file_id={file_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error de red al conectarse con Google Drive: {exc}",
        )
