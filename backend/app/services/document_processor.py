import os
import fitz
import docx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """Extract text from PDF file using PyMuPDF (fitz)."""
    text_parts = []
    page_count = 0
    try:
        doc = fitz.open(file_path)
        page_count = len(doc)
        for page_num, page in enumerate(doc, start=1):
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(f"\n--- Page {page_num} ---\n{page_text}")
            else:
                text_parts.append(f"\n--- Page {page_num} ---\n[No extractable text]")
        doc.close()
        return "\n".join(text_parts), page_count
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        raise


def extract_text_from_docx(file_path: str) -> tuple[str, Optional[int]]:
    """Extract text from DOCX file using python-docx."""
    text_parts = []
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)
        full_text = "\n".join(text_parts)
        page_breaks = full_text.count("\f") + 1
        return full_text, page_breaks if page_breaks > 0 else None
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        raise


def extract_text_from_txt(file_path: str) -> tuple[str, Optional[int]]:
    """Extract text from TXT file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        return text, None
    except Exception as e:
        logger.error(f"Error extracting TXT text: {e}")
        raise


def extract_text_from_md(file_path: str) -> tuple[str, Optional[int]]:
    """Extract text from Markdown file."""
    return extract_text_from_txt(file_path)


def extract_text(file_path: str, file_type: str) -> tuple[str, Optional[int]]:
    """Extract text from any supported file type."""
    ext = file_type.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".md":
        return extract_text_from_md(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def validate_file_extension(filename: str) -> bool:
    """Check if the file extension is supported."""
    supported = [".pdf", ".docx", ".txt", ".md"]
    ext = os.path.splitext(filename)[1].lower()
    return ext in supported
