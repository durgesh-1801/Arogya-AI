"""
PDF text extraction using PyMuPDF (fitz).
"""

from pathlib import Path

import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str | Path) -> tuple[str, int]:
    """
    Extract all text from a PDF file.

    Args:
        file_path: Path to the PDF on disk.

    Returns:
        Tuple of (combined text, page count).

    Raises:
        ValueError: If the file cannot be opened as a PDF.
    """
    path = Path(file_path)
    if not path.is_file():
        raise ValueError(f"PDF not found: {path}")

    doc = fitz.open(path)
    try:
        page_count = len(doc)
        parts: list[str] = []

        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text("text")
            if text and text.strip():
                parts.append(text.strip())

        combined = "\n\n".join(parts)
        return combined, page_count
    finally:
        doc.close()
