"""
PDF Overlay Redaction Risk Auditor - Core Library

This module provides functions to detect potential insecure overlay redactions in PDFs.
It identifies cases where black rectangles may have been drawn over text without actually
removing the underlying content.

SECURITY & ETHICAL NOTICE:
This tool is designed for security auditing purposes only. It detects RISK indicators
but does NOT extract, display, or save any redacted content. All processing is done
in-memory and no sensitive data is written to disk or console.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Optional
import fitz  # PyMuPDF


@dataclass
class PageRisk:
    """Represents risk assessment for a single PDF page."""
    page_number: int  # 1-indexed
    black_rect_count: int
    overlap_count: int
    confidence_score: int = 0
    heuristic: str = "black_fill_rect_overlap_text"


@dataclass
class PDFRiskReport:
    """Complete risk report for a PDF file."""
    filename: str
    total_pages: int
    flagged_pages: List[PageRisk]
    error: Optional[str] = None


def is_color_black(color: Optional[Tuple[float, ...]], threshold: float = 0.15) -> bool:
    """
    Determine if a color is close enough to black.
    
    Args:
        color: RGB, CMYK, or grayscale color tuple (values 0.0-1.0)
        threshold: Maximum value for each component to consider black (0.0-1.0)
    
    Returns:
        True if color is considered black
    """
    if not color:
        return False
    
    # Grayscale (single value)
    if len(color) == 1:
        return color[0] <= threshold
    
    # RGB (3 values)
    if len(color) == 3:
        r, g, b = color[0], color[1], color[2]
        return r <= threshold and g <= threshold and b <= threshold
    
    # CMYK (4 values): black is usually high K with low C, M, Y
    if len(color) == 4:
        c, m, y, k = color
        return (k >= 1.0 - threshold) and (c <= threshold) and (m <= threshold) and (y <= threshold)
    
    # Fallback for other color spaces
    return all(c <= threshold for c in color)


def compute_overlap_area(rect1: fitz.Rect, rect2: fitz.Rect) -> float:
    """
    Compute the intersection area between two rectangles.
    
    Args:
        rect1: First rectangle
        rect2: Second rectangle
    
    Returns:
        Area of intersection in square points
    """
    intersection = rect1 & rect2  # fitz.Rect intersection operator
    if intersection.is_empty or not intersection.is_valid:
        return 0.0
    return intersection.get_area()


def extract_black_rectangles(
    page: fitz.Page,
    black_threshold: float = 0.15,
    min_dimension: float = 2.0,
    max_coverage_ratio: float = 0.95
) -> List[fitz.Rect]:
    """
    Extract filled black rectangles from a PDF page that could be redaction overlays.
    
    Args:
        page: PyMuPDF page object
        black_threshold: Maximum RGB component value to consider black (0.0-1.0)
        min_dimension: Minimum width/height to avoid thin lines (points)
        max_coverage_ratio: Ignore rects covering >95% of page (likely backgrounds)
    
    Returns:
        List of black rectangle bounds
    """
    black_rects: List[fitz.Rect] = []
    page_area = page.rect.get_area()
    
    try:
        drawings = page.get_drawings()
    except Exception:
        # Some PDFs may not support drawings extraction
        return black_rects
    
    for drawing in drawings:
        # Check if it has a fill color (not just stroke)
        fill_color = drawing.get("fill")
        if not fill_color:
            continue
        
        # Check if fill is black
        if not is_color_black(fill_color, black_threshold):
            continue
        
        # Candidate rects can come from drawing["rect"] OR from drawing["items"]
        candidates: List[fitz.Rect] = []
        
        # Check main rect
        rect = drawing.get("rect")
        if isinstance(rect, fitz.Rect):
            candidates.append(rect)
        
        # Check items for rectangle paths (common form: ("re", Rect, ...))
        for item in drawing.get("items", []) or []:
            if len(item) >= 2 and isinstance(item[1], fitz.Rect):
                candidates.append(item[1])
        
        # Process each candidate rectangle
        for rect in candidates:
            # Filter out very thin lines
            if rect.width < min_dimension or rect.height < min_dimension:
                continue
            
            # Filter out near-full-page fills (likely backgrounds, not redactions)
            rect_area = rect.get_area()
            if rect_area > 0 and (rect_area / page_area) > max_coverage_ratio:
                continue
            
            black_rects.append(rect)
    
    # De-duplicate near-identical rectangles
    unique: List[fitz.Rect] = []
    for r in black_rects:
        if not any((abs(r.x0 - u.x0) < 0.5 and abs(r.y0 - u.y0) < 0.5 and
                    abs(r.x1 - u.x1) < 0.5 and abs(r.y1 - u.y1) < 0.5) for u in unique):
            unique.append(r)
    
    return unique


def get_text_rectangles(page: fitz.Page) -> List[fitz.Rect]:
    """
    Extract text bounding boxes from a page WITHOUT extracting text content.
    Uses span-based extraction for better accuracy than word-based.
    
    Args:
        page: PyMuPDF page object
    
    Returns:
        List of text bounding rectangles (no text content included)
    
    SECURITY NOTE: This function extracts only geometric bounds, not text.
    Text content from spans is immediately discarded.
    """
    text_rects: List[fitz.Rect] = []
    
    try:
        # Use rawdict for more accurate span-based bounding boxes
        # Spans are more reliable than words (handles ligatures, OCR issues)
        raw_dict = page.get_text("rawdict")
        
        for block in raw_dict.get("blocks", []):
            # Type 0 = text block, Type 1 = image block
            if block.get("type") != 0:
                continue
            
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    bbox = span.get("bbox")
                    if bbox and len(bbox) == 4:
                        # Extract only coordinates, discard all text content
                        text_rects.append(fitz.Rect(*bbox))
    
    except Exception:
        # Handle cases where text extraction fails
        pass
    
    return text_rects


def detect_overlaps(
    black_rects: List[fitz.Rect],
    text_rects: List[fitz.Rect],
    min_overlap_area: float = 4.0,
    stop_after: Optional[int] = None
) -> int:
    """
    Count how many black rectangles overlap with text (per-black-rect metric).
    
    Args:
        black_rects: List of black filled rectangles
        text_rects: List of text bounding boxes
        min_overlap_area: Minimum intersection area to count as overlap (sq points)
        stop_after: Stop counting after this many overlaps (performance optimization)
    
    Returns:
        Count of black rects that overlap with at least one text rect
    """
    overlap_count = 0
    
    # Count per black rect (more interpretable risk metric)
    for black_rect in black_rects:
        for text_rect in text_rects:
            if compute_overlap_area(black_rect, text_rect) >= min_overlap_area:
                overlap_count += 1
                break  # Count each black rect only once
        
        # Early exit optimization
        if stop_after is not None and overlap_count >= stop_after:
            return overlap_count
    
    return overlap_count


def audit_page(
    page: fitz.Page,
    page_num: int,
    black_threshold: float = 0.15,
    min_overlap_area: float = 4.0,
    min_hits: int = 1
) -> Optional[PageRisk]:
    """
    Audit a single page for overlay redaction risk with confidence scoring.
    
    Args:
        page: PyMuPDF page object
        page_num: Page number (1-indexed)
        black_threshold: Color threshold for black detection (0.0-1.0)
        min_overlap_area: Minimum overlap area to count (sq points)
        min_hits: Minimum overlaps to flag the page
    
    Returns:
        PageRisk object if page is flagged, None otherwise
    """
    # Extract potential redaction rectangles
    black_rects = extract_black_rectangles(page, black_threshold)
    
    if not black_rects:
        return None  # No potential redaction boxes found
    
    # Extract text bounds (no content)
    text_rects = get_text_rectangles(page)
    
    if not text_rects:
        return None  # No text to overlap with
    
    # Detect overlaps with early exit optimization
    overlap_count = detect_overlaps(black_rects, text_rects, min_overlap_area, stop_after=min_hits)
    
    # Calculate confidence score
    score = 0
    if len(black_rects) > 0:
        score += 3  # Black rectangles present
    if overlap_count >= min_hits:
        score += 3  # Overlaps detected
    
    # Check for redaction-like rectangles (wide and short)
    redaction_like = sum(1 for r in black_rects if r.width > r.height * 3)
    if redaction_like > 0:
        score += 1
    
    # Multiple rectangles common in redacted documents
    if len(black_rects) >= 3:
        score += 1
    
    # Flag if overlaps meet threshold
    if overlap_count >= min_hits:
        return PageRisk(
            page_number=page_num,
            black_rect_count=len(black_rects),
            overlap_count=overlap_count,
            confidence_score=score
        )
    
    return None


def audit_pdf(
    pdf_path: Path,
    black_threshold: float = 0.15,
    min_overlap_area: float = 4.0,
    min_hits: int = 1
) -> PDFRiskReport:
    """
    Audit an entire PDF file for overlay redaction risks.
    
    Args:
        pdf_path: Path to PDF file
        black_threshold: Color threshold for black detection (0.0-1.0)
        min_overlap_area: Minimum overlap area to count (sq points)
        min_hits: Minimum overlaps to flag a page
    
    Returns:
        PDFRiskReport with findings
    """
    flagged_pages = []
    error = None
    total_pages = 0
    
    try:
        doc = fitz.open(str(pdf_path))
        total_pages = len(doc)
        
        # Check if PDF is encrypted/protected
        if doc.is_encrypted and not doc.authenticate(""):
            error = "PDF is encrypted and requires a password"
            doc.close()
            return PDFRiskReport(
                filename=pdf_path.name,
                total_pages=0,
                flagged_pages=[],
                error=error
            )
        
        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1  # 1-indexed for user display
            
            risk = audit_page(
                page,
                page_num,
                black_threshold,
                min_overlap_area,
                min_hits
            )
            
            if risk:
                flagged_pages.append(risk)
        
        doc.close()
    
    except FileNotFoundError:
        error = f"File not found: {pdf_path}"
    except fitz.FileDataError as e:
        error = f"Invalid or corrupt PDF: {e}"
    except PermissionError:
        error = f"Permission denied: {pdf_path}"
    except Exception as e:
        error = f"Unexpected error: {type(e).__name__}: {e}"
    
    return PDFRiskReport(
        filename=pdf_path.name,
        total_pages=total_pages,
        flagged_pages=flagged_pages,
        error=error
    )


def audit_directory(
    dir_path: Path,
    recursive: bool = False,
    **audit_kwargs
) -> List[PDFRiskReport]:
    """
    Audit all PDF files in a directory.
    
    Args:
        dir_path: Path to directory
        recursive: Whether to scan subdirectories
        **audit_kwargs: Additional arguments passed to audit_pdf()
    
    Returns:
        List of PDFRiskReport objects
    """
    reports = []
    
    if not dir_path.exists():
        return reports
    
    if not dir_path.is_dir():
        return reports
    
    # Find all PDF files
    pattern = "**/*.pdf" if recursive else "*.pdf"
    
    try:
        pdf_files = sorted(dir_path.glob(pattern))
        
        for pdf_file in pdf_files:
            if pdf_file.is_file():
                report = audit_pdf(pdf_file, **audit_kwargs)
                reports.append(report)
    
    except PermissionError:
        # Handle cases where we can't access certain directories
        pass
    
    return reports
