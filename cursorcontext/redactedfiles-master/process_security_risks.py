"""
Process PDFs with security risks: remove overlays and extract annotations.
"""

import csv
import sys
from pathlib import Path
import fitz  # PyMuPDF
from typing import List, Dict, Any


def remove_overlay_redactions(pdf_path: Path, output_dir: Path) -> bool:
    """
    Remove overlay redactions from a PDF by deleting black rectangles.
    
    Args:
        pdf_path: Path to input PDF
        output_dir: Directory to save cleaned PDF
    
    Returns:
        True if successful, False otherwise
    """
    try:
        doc = fitz.open(str(pdf_path))
        modified = False
        
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            
            # Get all drawings on the page
            drawings = page.get_drawings()
            
            # Find black rectangles to remove
            rects_to_remove = []
            for drawing in drawings:
                # Check if it's a filled rectangle with black color
                if drawing.get("type") == "f" and drawing.get("fill"):
                    fill_color = drawing.get("fill")
                    # Check if color is black (RGB values close to 0)
                    if fill_color and len(fill_color) >= 3:
                        if all(c <= 0.15 for c in fill_color[:3]):
                            rect = drawing.get("rect")
                            if rect:
                                rects_to_remove.append(fitz.Rect(rect))
            
            # Remove the black rectangles by drawing white rectangles over them
            if rects_to_remove:
                modified = True
                for rect in rects_to_remove:
                    # Draw white rectangle to cover the black one
                    page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
        
        if modified:
            # Save the cleaned PDF
            output_path = output_dir / f"cleaned_{pdf_path.name}"
            doc.save(str(output_path), garbage=4, deflate=True)
            print(f"  ✓ Removed overlays: {output_path.name}")
            doc.close()
            return True
        else:
            print(f"  ⚠ No overlays found to remove: {pdf_path.name}")
            doc.close()
            return False
            
    except Exception as e:
        print(f"  ✗ Error processing {pdf_path.name}: {e}", file=sys.stderr)
        return False


def extract_annotations(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Extract annotation details from a PDF.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        List of annotation dictionaries
    """
    annotations = []
    
    try:
        doc = fitz.open(str(pdf_path))
        
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            
            annot = page.first_annot
            while annot:
                annot_data = {
                    "filename": pdf_path.name,
                    "page": page_num,
                    "type": annot.type[1] if annot.type else "Unknown",  # Get string name
                    "content": annot.info.get("content", ""),
                    "subject": annot.info.get("subject", ""),
                    "author": annot.info.get("title", ""),  # 'title' is often the author
                    "rect": str(annot.rect),
                    "color": str(annot.colors) if hasattr(annot, 'colors') else "",
                    "flags": annot.flags,
                }
                annotations.append(annot_data)
                annot = annot.next
        
        doc.close()
        
    except Exception as e:
        print(f"  ✗ Error extracting annotations from {pdf_path.name}: {e}", file=sys.stderr)
    
    return annotations


def main():
    """Main processing function."""
    # Read the security risks CSV
    risks_csv = Path("security_risks_only.csv")
    if not risks_csv.exists():
        print(f"Error: {risks_csv} not found. Run overlay_checker.py first with --security-risks-only flag.", file=sys.stderr)
        return 1
    
    print("Reading security risks CSV...")
    with open(risks_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Create output directories
    cleaned_dir = Path("cleaned_pdfs")
    cleaned_dir.mkdir(exist_ok=True)
    
    # Filter PDFs
    removable_overlays = [r for r in rows if r['removable_overlay'] == 'YES']
    with_annotations = [r for r in rows if r['has_annotations'] == 'YES']
    
    print(f"\nFound:")
    print(f"  - {len(removable_overlays)} PDFs with removable overlays")
    print(f"  - {len(with_annotations)} PDFs with annotations")
    
    # Process overlays
    if removable_overlays:
        print(f"\n{'='*80}")
        print("REMOVING OVERLAY REDACTIONS")
        print('='*80)
        
        pdfs_dir = Path("pdfs")
        success_count = 0
        
        for row in removable_overlays:
            filename = row['filename'].strip('"')
            pdf_path = pdfs_dir / filename
            
            if not pdf_path.exists():
                print(f"  ⚠ File not found: {filename}")
                continue
            
            print(f"\nProcessing: {filename}")
            if remove_overlay_redactions(pdf_path, cleaned_dir):
                success_count += 1
        
        print(f"\n✓ Successfully cleaned {success_count}/{len(removable_overlays)} PDFs")
        print(f"  Output directory: {cleaned_dir.absolute()}")
    
    # Extract annotations
    if with_annotations:
        print(f"\n{'='*80}")
        print("EXTRACTING ANNOTATIONS")
        print('='*80)
        
        all_annotations = []
        pdfs_dir = Path("pdfs")
        
        for row in with_annotations:
            filename = row['filename'].strip('"')
            pdf_path = pdfs_dir / filename
            
            if not pdf_path.exists():
                print(f"  ⚠ File not found: {filename}")
                continue
            
            print(f"\nExtracting from: {filename}")
            annotations = extract_annotations(pdf_path)
            
            if annotations:
                all_annotations.extend(annotations)
                print(f"  ✓ Found {len(annotations)} annotation(s)")
            else:
                print(f"  ⚠ No annotations extracted")
        
        # Save annotations to CSV
        if all_annotations:
            annotations_csv = Path("extracted_annotations.csv")
            
            with open(annotations_csv, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['filename', 'page', 'type', 'content', 'subject', 'author', 'rect', 'color', 'flags']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(all_annotations)
            
            print(f"\n✓ Saved {len(all_annotations)} annotations to: {annotations_csv.absolute()}")
        else:
            print("\n⚠ No annotations were extracted")
    
    print(f"\n{'='*80}")
    print("PROCESSING COMPLETE")
    print('='*80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
