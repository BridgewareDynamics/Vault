#!/usr/bin/env python3
"""
PDF Overlay Redaction Validator - TEST/VALIDATION TOOL ONLY

WARNING: This script extracts text content for validation purposes.
USE ONLY on test files or with explicit authorization.

This tool is separate from the main checker and is intended to:
1. Validate that the detection algorithm works correctly
2. Verify that text exists under detected black rectangles
3. Test and demonstrate the security risk

DO NOT USE on sensitive or classified documents without proper authorization.
"""

import argparse
import csv
import sys
from pathlib import Path
from typing import List, Dict
import fitz

from pdf_overlay_audit import (
    extract_black_rectangles,
    get_text_rectangles,
    compute_overlap_area
)


def is_text_visually_obscured(page: fitz.Page, text_rect: fitz.Rect, darkness_threshold: float = 0.3) -> bool:
    """
    Check if a text region is actually visually obscured by rendering the page.
    
    Args:
        page: PyMuPDF page object
        text_rect: Rectangle containing text
        darkness_threshold: Ratio of dark pixels needed to consider text obscured (0.0-1.0)
    
    Returns:
        True if text appears to be obscured (covered by dark content)
    """
    try:
        # Render the page to a pixmap (image)
        # Use a reasonable resolution (72 DPI is default, 150 is good balance)
        zoom = 2.0  # 2x zoom = 144 DPI
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, clip=text_rect)
        
        # Get pixel data
        # PyMuPDF returns RGB data as bytes
        width = pix.width
        height = pix.height
        
        if width == 0 or height == 0:
            return False
        
        # Sample pixels in the text region
        # Count how many are dark (near black)
        samples = pix.samples  # Raw pixel data as bytes
        n_components = pix.n  # Usually 3 (RGB) or 4 (RGBA)
        
        dark_pixel_count = 0
        total_pixels = width * height
        
        # Check every pixel (or sample if too many)
        step = max(1, total_pixels // 1000)  # Sample up to 1000 pixels
        
        for i in range(0, total_pixels, step):
            pixel_start = i * n_components
            if pixel_start + 2 < len(samples):
                # Get RGB values (0-255)
                r = samples[pixel_start]
                g = samples[pixel_start + 1]
                b = samples[pixel_start + 2]
                
                # Check if pixel is dark (all components < 50 out of 255)
                if r < 50 and g < 50 and b < 50:
                    dark_pixel_count += 1
        
        # Calculate ratio of dark pixels
        sampled_pixels = (total_pixels + step - 1) // step
        if sampled_pixels == 0:
            return False
        
        dark_ratio = dark_pixel_count / sampled_pixels
        
        # If more than threshold% of pixels are dark, consider text obscured
        return dark_ratio >= darkness_threshold
    
    except Exception:
        # If rendering fails, assume not obscured (conservative)
        return False


def extract_overlapped_text(
    pdf_path: Path,
    black_threshold: float = 0.15,
    min_overlap_area: float = 4.0,
    visual_verification: bool = True
) -> List[Dict]:
    """
    Extract ALL text that overlaps with black rectangles for comprehensive validation.
    Processes every page in the PDF and extracts all overlapped content.
    
    Args:
        visual_verification: If True, verify text is actually obscured by rendering
    
    Returns:
        List of dictionaries with page, rect info, and overlapped text
    """
    results = []
    total_pages = 0
    pages_with_redactions = 0
    total_black_rects = 0
    
    try:
        doc = fitz.open(str(pdf_path))
        total_pages = len(doc)
        
        if doc.is_encrypted and not doc.authenticate(""):
            print(f"Error: PDF is encrypted", file=sys.stderr)
            doc.close()
            return results
        
        print(f"Processing {total_pages} pages...", file=sys.stderr)
        
        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            
            # Progress indicator for large PDFs
            if page_num % 10 == 0:
                print(f"  Processed {page_num}/{total_pages} pages...", file=sys.stderr)
            
            # Extract black rectangles
            black_rects = extract_black_rectangles(page, black_threshold)
            
            if not black_rects:
                continue
            
            pages_with_redactions += 1
            total_black_rects += len(black_rects)
            
            # Get words with text content (for validation only)
            try:
                words = page.get_text("words")
            except Exception:
                continue
            
            # Check each black rectangle for overlapped text
            for rect_idx, black_rect in enumerate(black_rects):
                overlapped_words = []
                overlapped_word_rects = []
                
                for word_tuple in words:
                    x0, y0, x1, y1, word_text = word_tuple[0:5]
                    word_rect = fitz.Rect(x0, y0, x1, y1)
                    
                    overlap = compute_overlap_area(black_rect, word_rect)
                    
                    if overlap >= min_overlap_area:
                        overlapped_words.append(word_text)
                        overlapped_word_rects.append(word_rect)
                
                # Visual verification: check if text is actually obscured
                if overlapped_words:
                    is_obscured = True
                    if visual_verification:
                        # Check if at least one word is visually obscured
                        is_obscured = any(
                            is_text_visually_obscured(page, word_rect)
                            for word_rect in overlapped_word_rects
                        )
                    
                    # Only add if visually verified OR verification is disabled
                    if is_obscured:
                        results.append({
                            "page": page_num,
                            "rect_index": rect_idx + 1,
                            "rect_bounds": f"({black_rect.x0:.1f},{black_rect.y0:.1f},{black_rect.x1:.1f},{black_rect.y1:.1f})",
                            "rect_width": f"{black_rect.width:.1f}",
                            "rect_height": f"{black_rect.height:.1f}",
                            "word_count": len(overlapped_words),
                            "overlapped_text": " ".join(overlapped_words),
                            "visually_verified": visual_verification
                        })
        
        doc.close()
        
        print(f"\nExtraction complete:", file=sys.stderr)
        print(f"  Total pages scanned: {total_pages}", file=sys.stderr)
        print(f"  Pages with black rectangles: {pages_with_redactions}", file=sys.stderr)
        print(f"  Total black rectangles found: {total_black_rects}", file=sys.stderr)
        print(f"  Rectangles with overlapped text: {sum(1 for r in results if r['word_count'] > 0)}", file=sys.stderr)
        print(f"  Total results extracted: {len(results)}", file=sys.stderr)
    
    except Exception as e:
        print(f"Error processing PDF: {e}", file=sys.stderr)
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="VALIDATION TOOL: Extract overlapped text to verify detection (TEST FILES ONLY)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
WARNING: This tool extracts text content for validation purposes.
         Use ONLY on test files or with proper authorization.

Example:
  %(prog)s testfile.pdf --csv -o validation_results.csv
  %(prog)s /path/to/folder --recursive --csv -o all_results.csv
        """
    )
    
    parser.add_argument(
        "pdf_path",
        type=str,
        help="Path to test PDF file or directory"
    )
    
    parser.add_argument(
        "--recursive", "-r",
        action="store_true",
        help="Recursively scan subdirectories"
    )
    
    parser.add_argument(
        "--min-overlap-area",
        type=float,
        default=4.0,
        help="Minimum overlap area (default: 4.0)"
    )
    
    parser.add_argument(
        "--black-threshold",
        type=float,
        default=0.15,
        help="Black color threshold (default: 0.15)"
    )
    
    parser.add_argument(
        "--no-visual-verification",
        action="store_true",
        help="Disable visual verification (faster but may include false positives)"
    )
    
    parser.add_argument(
        "--csv",
        action="store_true",
        help="Output as CSV format"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    # Validation
    input_path = Path(args.pdf_path)
    if not input_path.exists():
        print(f"Error: Path not found: {input_path}", file=sys.stderr)
        return 1
    
    print("=" * 80, file=sys.stderr)
    print("WARNING: VALIDATION TOOL - EXTRACTS TEXT CONTENT", file=sys.stderr)
    print("Use only on test files or with proper authorization!", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    print("", file=sys.stderr)
    
    # Collect PDF files to process
    pdf_files = []
    if input_path.is_file():
        if input_path.suffix.lower() != ".pdf":
            print(f"Error: Not a PDF file: {input_path}", file=sys.stderr)
            return 1
        pdf_files.append(input_path)
    elif input_path.is_dir():
        pattern = "**/*.pdf" if args.recursive else "*.pdf"
        pdf_files = sorted(input_path.glob(pattern))
        if not pdf_files:
            print(f"No PDF files found in: {input_path}", file=sys.stderr)
            return 0
        print(f"Found {len(pdf_files)} PDF file(s) to process\n", file=sys.stderr)
    else:
        print(f"Error: Invalid path: {input_path}", file=sys.stderr)
        return 1
    
    # Extract overlapped text from all files
    all_results = []
    visual_verification = not args.no_visual_verification
    
    for pdf_file in pdf_files:
        print(f"Processing: {pdf_file.name}...", file=sys.stderr)
        results = extract_overlapped_text(
            pdf_file,
            args.black_threshold,
            args.min_overlap_area,
            visual_verification
        )
        # Add filename to each result and filter out empty/no text entries
        for result in results:
            result["filename"] = pdf_file.name
            # Only include results with actual text content
            text = result.get("overlapped_text", "").strip()
            # Exclude empty, no-text markers, single symbols, and single dashes
            if (text and 
                text != "[NO TEXT DETECTED]" and 
                text not in ["-", "■", "â– "] and
                result.get("word_count", 0) > 0 and
                len(text) > 1):  # Exclude single-character entries
                all_results.append(result)
    
    results = all_results
    
    if not results:
        print("No overlapped text detected.", file=sys.stderr)
        return 0
    
    print(f"\nTotal redactions found: {len(results)}", file=sys.stderr)
    print("", file=sys.stderr)
    
    # Format output
    if args.csv:
        import io
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["filename", "page", "rect_index", "rect_bounds", "rect_width", "rect_height", "word_count", "overlapped_text", "visually_verified"],
            extrasaction='ignore'  # Ignore extra fields
        )
        writer.writeheader()
        writer.writerows(results)
        output_text = output.getvalue()
    else:
        lines = []
        lines.append(f"\nValidation Results")
        lines.append(f"Total black rectangles found: {len(results)}")
        lines.append(f"Rectangles with text: {sum(1 for r in results if r['word_count'] > 0)}\n")
        
        current_file = None
        for result in results:
            if result.get("filename") != current_file:
                current_file = result.get("filename")
                lines.append(f"\n{'='*80}")
                lines.append(f"File: {current_file}")
                lines.append('='*80)
            
            lines.append(f"\nPage {result['page']}, Rectangle #{result['rect_index']}")
            lines.append(f"  Bounds: {result['rect_bounds']} (W:{result['rect_width']}pt, H:{result['rect_height']}pt)")
            lines.append(f"  Word count: {result['word_count']}")
            lines.append(f"  Text: {result['overlapped_text']}")
        
        output_text = "\n".join(lines)
    
    # Write output
    if args.output:
        try:
            Path(args.output).write_text(output_text, encoding="utf-8")
            print(f"Results written to: {args.output}", file=sys.stderr)
        except Exception as e:
            print(f"Error writing file: {e}", file=sys.stderr)
            return 1
    else:
        print(output_text)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
