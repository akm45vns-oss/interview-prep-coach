"""
PDF text extraction using pdfminer.six (more robust than PyPDF2 for complex layouts).
Falls back to PyPDF2 if pdfminer fails.
"""
import io
from typing import Optional

try:
    from pdfminer.high_level import extract_text_to_fp
    from pdfminer.layout import LAParams
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file given its bytes."""
    text = ""

    # Try pdfminer first (better layout handling)
    if PDFMINER_AVAILABLE:
        try:
            output = io.StringIO()
            extract_text_to_fp(
                io.BytesIO(file_bytes),
                output,
                laparams=LAParams(),
                output_type="text",
                codec="utf-8",
            )
            text = output.getvalue()
            if text.strip():
                return _clean_text(text)
        except Exception:
            pass

    # Fallback to PyPDF2
    if PYPDF2_AVAILABLE:
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages)
            if text.strip():
                return _clean_text(text)
        except Exception:
            pass

    return text


def _clean_text(text: str) -> str:
    """Basic text cleanup after extraction."""
    import re
    # Replace multiple spaces/tabs with single space
    text = re.sub(r"[ \t]+", " ", text)
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
