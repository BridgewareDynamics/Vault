#!/usr/bin/env python3
"""
PDF Overlay Annotation Tool - Visual Verification

Creates an annotated PDF showing detected black rectangles and overlapping text regions.
Allows manual verification of risk detection without extracting text content.

Usage:
  python annotate_overlaps.py input.pdf output.pdf
  python annotate_overlaps.py input.pdf output.pdf --pages 18,19,20
  python annotate_overlaps.py --interactive
"""

import argparse
import sys
from pathlib import Path
from typing import List, Optional
import fitz
import os

from pdf_overlay_audit import (
    extract_black_rectangles,
    get_text_rectangles,
    compute_overlap_area
)
from pdf_security_audit import audit_pdf_security, format_security_report


def annotate_page_overlaps(
    page: fitz.Page,
    black_threshold: float = 0.15,
    min_overlap_area: float = 4.0,
    show_text: bool = True
) -> int:
    """
    Annotate a page by drawing semi-transparent overlays and showing overlapped text.
    
    Args:
        page: PyMuPDF page object
        black_threshold: Color threshold for black detection
        min_overlap_area: Minimum overlap area
        show_text: If True, display the text that's under the overlay
    
    Returns:
        Number of black rectangles with overlaps detected
    """
    # Extract black rectangles
    black_rects = extract_black_rectangles(page, black_threshold)
    
    # Get words with text content for display
    try:
        words = page.get_text("words")  # (x0, y0, x1, y1, word, block_no, line_no, word_no)
    except Exception:
        words = []
    
    overlap_count = 0
    
    # Process each black rectangle
    for rect in black_rects:
        overlapped_words = []
        
        # Find words that overlap with this black rectangle
        for word_tuple in words:
            x0, y0, x1, y1, word_text = word_tuple[0:5]
            word_rect = fitz.Rect(x0, y0, x1, y1)
            
            if compute_overlap_area(rect, word_rect) >= min_overlap_area:
                overlapped_words.append(word_text)
        
        if overlapped_words:
            overlap_count += 1
            
            # Draw red semi-transparent filled rectangle
            annot = page.add_rect_annot(rect)
            annot.set_colors(stroke=(1, 0, 0), fill=(1, 0, 0))  # Red border and fill
            annot.set_border(width=2)
            annot.set_opacity(0.4)  # Semi-transparent
            annot.update()
            
            # Display the overlapped text directly on the red rectangle if requested
            if show_text and overlapped_words:
                text = " ".join(overlapped_words)
                # Truncate if too long
                if len(text) > 100:
                    text = text[:97] + "..."
                
                # Position text in the center of the rectangle
                rect_height = rect.y1 - rect.y0
                rect_width = rect.x1 - rect.x0
                
                # Choose font size based on rectangle height
                if rect_height < 10:
                    fontsize = 6
                elif rect_height < 15:
                    fontsize = 8
                else:
                    fontsize = 10
                
                # Center the text vertically in the rectangle
                text_y = rect.y0 + (rect_height / 2) + (fontsize / 3)
                text_x = rect.x0 + 3
                
                # Add text directly on the red rectangle with white color for contrast
                page.insert_text((text_x, text_y), text, 
                               fontsize=fontsize, color=(1, 1, 1))  # White text
    
    return overlap_count


def add_security_summary_page(doc: fitz.Document, input_path: Path, pages_annotated: int, total_overlays: int) -> None:
    """
    Add a summary page at the end of the document with security findings.
    
    Args:
        doc: PyMuPDF document to add page to
        input_path: Original PDF path for security audit
        pages_annotated: Number of pages with overlays
        total_overlays: Total overlays detected
    """
    # Create new blank page
    page = doc.new_page(width=612, height=792)  # US Letter size
    
    # Title
    page.insert_text((50, 50), "PDF SECURITY & PRIVACY AUDIT SUMMARY", 
                    fontsize=16, color=(0, 0, 0.8), fontname="helv-bold")
    page.insert_text((50, 70), "="*60, fontsize=10, color=(0, 0, 0.5))
    
    # Overlay redaction findings
    y = 100
    page.insert_text((50, y), "Overlay Redaction Analysis:", 
                    fontsize=12, color=(0, 0, 0), fontname="helv-bold")
    y += 20
    page.insert_text((50, y), f"  Pages with potential overlay redactions: {pages_annotated}", 
                    fontsize=10, color=(0, 0, 0))
    y += 15
    page.insert_text((50, y), f"  Total black rectangles over text: {total_overlays}", 
                    fontsize=10, color=(0, 0, 0))
    y += 25
    
    # Security audit
    try:
        security = audit_pdf_security(input_path)
        security_text = format_security_report(security, verbose=True)
        
        page.insert_text((50, y), "Additional Security Checks:", 
                        fontsize=12, color=(0, 0, 0), fontname="helv-bold")
        y += 20
        
        # Parse and add security findings
        for line in security_text.split('\n')[2:]:  # Skip header
            if line.strip():
                # Color code warnings vs ok
                if line.strip().startswith('⚠'):
                    color = (0.8, 0.3, 0)  # Orange for warnings
                elif line.strip().startswith('✓'):
                    color = (0, 0.5, 0)  # Green for OK
                else:
                    color = (0, 0, 0)  # Black for notes
                
                page.insert_text((50, y), line, fontsize=9, color=color)
                y += 14
                
                # Add new page if running out of space
                if y > 750:
                    page = doc.new_page(width=612, height=792)
                    y = 50
    
    except Exception as e:
        page.insert_text((50, y), f"Security audit error: {type(e).__name__}", 
                        fontsize=10, color=(0.8, 0, 0))
        y += 15
    
    # Footer
    y = max(y + 20, 700)
    page.insert_text((50, y), "="*60, fontsize=10, color=(0, 0, 0.5))
    y += 15
    page.insert_text((50, y), "Generated by PDF Overlay Redaction Risk Checker", 
                    fontsize=8, color=(0, 0, 0.5))
    page.insert_text((50, y + 12), "This is a security audit - verify all findings manually", 
                    fontsize=8, color=(0, 0, 0.5))


def annotate_pdf(
    input_path: Path,
    output_path: Path,
    pages: Optional[List[int]] = None,
    black_threshold: float = 0.15,
    min_overlap_area: float = 4.0,
    only_flagged: bool = True,
    show_text: bool = True
) -> None:
    """
    Create an annotated version of the PDF showing detected overlaps.
    
    Args:
        input_path: Input PDF path
        output_path: Output annotated PDF path
        pages: Optional list of specific pages to annotate (1-indexed)
        black_threshold: Color threshold for black detection
        min_overlap_area: Minimum overlap area
        only_flagged: If True, output only contains pages with overlaps
        show_text: If True, display the overlapped text on the page
    """
    try:
        doc = fitz.open(str(input_path))
        
        if doc.is_encrypted and not doc.authenticate(""):
            print(f"Error: PDF is encrypted", file=sys.stderr)
            doc.close()
            return
        
        # Create new document if only outputting flagged pages
        if only_flagged:
            output_doc = fitz.open()
        else:
            output_doc = doc
        
        total_overlaps = 0
        pages_annotated = 0
        
        print(f"Processing {len(doc)} pages...", file=sys.stderr)
        
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            
            # Skip if specific pages requested and this isn't one
            if pages is not None and page_num not in pages:
                continue
            
            # Annotate the page
            overlaps = annotate_page_overlaps(
                page,
                black_threshold,
                min_overlap_area,
                show_text=show_text
            )
            
            if overlaps > 0:
                total_overlaps += overlaps
                pages_annotated += 1
                print(f"  Page {page_num}: {overlaps} overlay(s) detected", file=sys.stderr)
                
                # If only_flagged mode, copy this page to output
                if only_flagged:
                    output_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
                    # Add page number annotation
                    new_page = output_doc[-1]
                    text = f"Original Page {page_num}"
                    new_page.insert_text((50, 20), text, fontsize=10, color=(0, 0, 1))
        
        # Skip saving if no pages were flagged in only_flagged mode
        if only_flagged and pages_annotated == 0:
            if output_doc != doc:
                output_doc.close()
            doc.close()
            print(f"  No overlaps detected - skipping output file", file=sys.stderr)
            return
        
        # Add security summary page at the end
        add_security_summary_page(output_doc, input_path, pages_annotated, total_overlaps)
        
        # Save annotated PDF
        output_doc.save(str(output_path), garbage=4, deflate=True)
        
        if only_flagged and output_doc != doc:
            output_doc.close()
        doc.close()
        
        print(f"\nAnnotation complete:", file=sys.stderr)
        print(f"  Pages with overlaps: {pages_annotated}", file=sys.stderr)
        print(f"  Total overlays marked: {total_overlaps}", file=sys.stderr)
        print(f"  Output saved to: {output_path}", file=sys.stderr)
        print(f"\nLegend:", file=sys.stderr)
        print(f"  RED semi-transparent overlay = Detected black rectangle covering text", file=sys.stderr)
        if show_text:
            print(f"  WHITE text on red overlay = Overlapped text content", file=sys.stderr)
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def interactive_mode():
    """Run the tool in interactive mode with guided prompts."""
    print("\n=== PDF Overlay Annotation Tool - Interactive Mode ===\n")
    
    # Step 1: Choose single file or folder
    print("Do you want to process:")
    print("  1. A single PDF file")
    print("  2. All PDF files in a folder")
    
    while True:
        choice = input("\nEnter choice (1 or 2): ").strip()
        if choice in ["1", "2"]:
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    # Step 2: Select file or folder
    if choice == "1":
        # Single file mode
        current_dir = Path.cwd()
        pdf_files = list(current_dir.glob("**/*.pdf"))
        
        if not pdf_files:
            print("\nNo PDF files found in current directory and subdirectories.")
            return 1
        
        print(f"\nFound {len(pdf_files)} PDF file(s):\n")
        for idx, pdf_file in enumerate(pdf_files, 1):
            rel_path = pdf_file.relative_to(current_dir)
            size_mb = pdf_file.stat().st_size / (1024 * 1024)
            print(f"  {idx}. {rel_path} ({size_mb:.1f} MB)")
        
        while True:
            file_choice = input(f"\nSelect file number (1-{len(pdf_files)}): ").strip()
            try:
                file_idx = int(file_choice) - 1
                if 0 <= file_idx < len(pdf_files):
                    input_path = pdf_files[file_idx]
                    break
            except ValueError:
                pass
            print(f"Invalid choice. Please enter a number between 1 and {len(pdf_files)}.")
        
        # Single file - ask for output name
        default_output = input_path.stem + "_annotated.pdf"
        output_name = input(f"\nOutput filename (default: {default_output}): ").strip()
        if not output_name:
            output_name = default_output
        
        output_path = input_path.parent / output_name
        files_to_process = [(input_path, output_path)]
        
    else:
        # Folder mode
        print("\nAvailable folders with PDF files:")
        current_dir = Path.cwd()
        
        # Find folders containing PDFs
        folders_with_pdfs = set()
        for pdf_file in current_dir.glob("**/*.pdf"):
            folders_with_pdfs.add(pdf_file.parent)
        
        folders = sorted(folders_with_pdfs)
        
        if not folders:
            print("No folders with PDF files found.")
            return 1
        
        for idx, folder in enumerate(folders, 1):
            rel_path = folder.relative_to(current_dir) if folder != current_dir else Path(".")
            pdf_count = len(list(folder.glob("*.pdf")))
            print(f"  {idx}. {rel_path} ({pdf_count} PDF file(s))")
        
        while True:
            folder_choice = input(f"\nSelect folder number (1-{len(folders)}): ").strip()
            try:
                folder_idx = int(folder_choice) - 1
                if 0 <= folder_idx < len(folders):
                    selected_folder = folders[folder_idx]
                    break
            except ValueError:
                pass
            print(f"Invalid choice. Please enter a number between 1 and {len(folders)}.")
        
        # Create output subfolder
        output_folder = selected_folder / "annotated_output"
        output_folder.mkdir(exist_ok=True)
        
        # Prepare list of files to process
        pdf_files_in_folder = list(selected_folder.glob("*.pdf"))
        files_to_process = [
            (pdf_file, output_folder / (pdf_file.stem + "_annotated.pdf"))
            for pdf_file in pdf_files_in_folder
        ]
        
        print(f"\nWill process {len(files_to_process)} PDF file(s) from {selected_folder.relative_to(current_dir)}")
        print(f"Output will be saved to: {output_folder.relative_to(current_dir)}")
    
    # Step 3: Choose page output mode
    print("\nPage output mode:")
    print("  1. Only pages with detected overlaps (recommended)")
    print("  2. All pages")
    
    while True:
        page_mode = input("\nEnter choice (1 or 2): ").strip()
        if page_mode in ["1", "2"]:
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    only_flagged = (page_mode == "1")
    
    # Step 4: Show text option
    print("\nShow overlapped text on annotations:")
    print("  1. Yes - show text (default)")
    print("  2. No - only show red overlays")
    
    while True:
        text_mode = input("\nEnter choice (1 or 2): ").strip()
        if text_mode in ["1", "2", ""]:
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    show_text = (text_mode != "2")
    
    # Step 5: Confirm and process
    print("\n" + "="*60)
    print(f"Ready to process {len(files_to_process)} file(s)")
    print(f"Output mode: {'Flagged pages only' if only_flagged else 'All pages'}")
    print(f"Show text: {'Yes' if show_text else 'No'}")
    print("="*60)
    
    confirm = input("\nProceed? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Cancelled.")
        return 0
    
    # Process files
    print("\n")
    for idx, (input_path, output_path) in enumerate(files_to_process, 1):
        print(f"[{idx}/{len(files_to_process)}] Processing: {input_path.name}")
        try:
            annotate_pdf(
                input_path,
                output_path,
                pages=None,
                black_threshold=0.15,
                min_overlap_area=4.0,
                only_flagged=only_flagged,
                show_text=show_text
            )
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
    
    print("\n✓ Processing complete!")
    return 0


def main():
    # Check if running in interactive mode
    if len(sys.argv) == 1 or (len(sys.argv) == 2 and sys.argv[1] in ["-i", "--interactive"]):
        return interactive_mode()
    
    parser = argparse.ArgumentParser(
        description="Annotate PDF with visual markers showing detected overlay redaction risks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --interactive                          # Interactive mode with guided prompts
  %(prog)s input.pdf annotated_output.pdf
  %(prog)s input.pdf output.pdf --pages 18,19,20
  %(prog)s input.pdf output.pdf --all-pages

By default, output contains ONLY pages with detected overlaps.

Legend:
  RED semi-transparent overlay = Detected black rectangle covering text
        """
    )
    
    parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Run in interactive mode with guided prompts"
    )
    
    parser.add_argument(
        "input_pdf",
        type=str,
        nargs="?",
        help="Path to input PDF file"
    )
    
    parser.add_argument(
        "output_pdf",
        type=str,
        nargs="?",
        help="Path to output annotated PDF file"
    )
    
    parser.add_argument(
        "--pages",
        type=str,
        help="Comma-separated list of page numbers to annotate (1-indexed). If omitted, all pages are processed."
    )
    
    parser.add_argument(
        "--min-overlap-area",
        type=float,
        default=4.0,
        help="Minimum overlap area in square points (default: 4.0)"
    )
    
    parser.add_argument(
        "--black-threshold",
        type=float,
        default=0.15,
        help="Maximum RGB component value to consider black (default: 0.15)"
    )
    
    parser.add_argument(
        "--all-pages",
        action="store_true",
        help="Include all pages in output (default: only pages with overlaps)"
    )
    
    parser.add_argument(
        "--no-text",
        action="store_true",
        help="Don't display the overlapped text (only show red overlays)"
    )
    
    args = parser.parse_args()
    
    # Check if interactive mode requested
    if args.interactive:
        return interactive_mode()
    
    # Validate required arguments for non-interactive mode
    if not args.input_pdf or not args.output_pdf:
        print("Error: input_pdf and output_pdf are required (or use --interactive mode)", file=sys.stderr)
        parser.print_help()
        return 1
    
    # Validate input
    input_path = Path(args.input_pdf)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return 1
    
    if not input_path.is_file() or input_path.suffix.lower() != ".pdf":
        print(f"Error: Input must be a PDF file: {input_path}", file=sys.stderr)
        return 1
    
    # Parse pages if specified
    pages = None
    if args.pages:
        try:
            pages = [int(p.strip()) for p in args.pages.split(",")]
            print(f"Annotating specific pages: {pages}", file=sys.stderr)
        except ValueError:
            print(f"Error: Invalid page numbers: {args.pages}", file=sys.stderr)
            return 1
    
    output_path = Path(args.output_pdf)
    
    # Perform annotation
    annotate_pdf(
        input_path,
        output_path,
        pages,
        args.black_threshold,
        args.min_overlap_area,
        only_flagged=not args.all_pages,
        show_text=not args.no_text
    )
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
