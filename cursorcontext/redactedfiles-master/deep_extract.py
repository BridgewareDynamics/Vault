#!/usr/bin/env python3
"""
Deep extraction tool - Extract all possible data from PDFs with security risks.

This tool extracts:
1. All metadata (full values, not just keys)
2. OCR text layers (hidden searchable text behind images)
3. All visible text content
4. Incremental update analysis (version history hints)
5. Image extraction from scanned pages
6. Embedded fonts and resources
7. Document structure and object analysis
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any
import fitz  # PyMuPDF


def extract_full_metadata(doc: fitz.Document) -> Dict[str, Any]:
    """Extract complete metadata with all values."""
    metadata = doc.metadata or {}
    
    # Add additional document properties
    metadata['page_count'] = len(doc)
    metadata['is_encrypted'] = doc.is_encrypted
    metadata['needs_password'] = doc.needs_pass
    metadata['permissions'] = doc.permissions
    metadata['is_pdf'] = doc.is_pdf
    metadata['is_form_pdf'] = doc.is_form_pdf
    
    # Get PDF version
    try:
        metadata['pdf_version'] = doc.version
    except:
        pass
    
    return metadata


def extract_all_text(doc: fitz.Document) -> Dict[int, str]:
    """Extract all text from every page."""
    text_by_page = {}
    
    for page_num, page in enumerate(doc, 1):
        try:
            text = page.get_text()
            text_by_page[page_num] = text
        except Exception as e:
            text_by_page[page_num] = f"[ERROR: {e}]"
    
    return text_by_page


def extract_text_detailed(doc: fitz.Document) -> Dict[int, Dict]:
    """Extract detailed text information including formatting and position."""
    detailed_text = {}
    
    for page_num, page in enumerate(doc, 1):
        try:
            # Get text with detailed structure
            text_dict = page.get_text("dict")
            
            page_info = {
                'width': text_dict['width'],
                'height': text_dict['height'],
                'blocks': []
            }
            
            for block in text_dict.get('blocks', []):
                if block.get('type') == 0:  # Text block
                    block_info = {
                        'bbox': block['bbox'],
                        'lines': []
                    }
                    
                    for line in block.get('lines', []):
                        line_info = {
                            'bbox': line['bbox'],
                            'spans': []
                        }
                        
                        for span in line.get('spans', []):
                            span_info = {
                                'text': span['text'],
                                'font': span.get('font', 'Unknown'),
                                'size': span.get('size', 0),
                                'color': span.get('color', 0),
                                'bbox': span['bbox']
                            }
                            line_info['spans'].append(span_info)
                        
                        block_info['lines'].append(line_info)
                    
                    page_info['blocks'].append(block_info)
            
            detailed_text[page_num] = page_info
            
        except Exception as e:
            detailed_text[page_num] = {'error': str(e)}
    
    return detailed_text


def analyze_ocr_layer(doc: fitz.Document) -> Dict[int, Dict]:
    """Analyze OCR layer - detect scanned images with text overlay."""
    ocr_analysis = {}
    
    for page_num, page in enumerate(doc, 1):
        try:
            images = page.get_images()
            text = page.get_text().strip()
            
            page_data = {
                'has_images': len(images) > 0,
                'image_count': len(images),
                'has_text': len(text) > 0,
                'text_length': len(text),
                'images': []
            }
            
            # Get image details
            for img_index, img_info in enumerate(images):
                xref = img_info[0]
                
                try:
                    img_dict = doc.extract_image(xref)
                    
                    image_data = {
                        'xref': xref,
                        'width': img_dict['width'],
                        'height': img_dict['height'],
                        'colorspace': img_dict['colorspace'],
                        'bpc': img_dict['bpc'],
                        'size_bytes': len(img_dict['image']),
                    }
                    
                    page_data['images'].append(image_data)
                except Exception as e:
                    page_data['images'].append({'error': str(e)})
            
            # Determine if likely OCR'd
            if page_data['has_images'] and page_data['has_text']:
                # Check for large images (full page scans)
                for img in page_data['images']:
                    if isinstance(img, dict) and 'width' in img:
                        if img['width'] > 1000 and img['height'] > 1000:
                            page_data['likely_ocr'] = True
                            break
            
            ocr_analysis[page_num] = page_data
            
        except Exception as e:
            ocr_analysis[page_num] = {'error': str(e)}
    
    return ocr_analysis


def analyze_incremental_updates(pdf_path: Path) -> Dict[str, Any]:
    """Analyze incremental updates for version history clues."""
    analysis = {
        'has_incremental_updates': False,
        'xref_count': 0,
        'eof_count': 0,
        'file_size': 0,
        'trailer_count': 0
    }
    
    try:
        file_size = pdf_path.stat().st_size
        analysis['file_size'] = file_size
        
        # Read the entire file
        with open(pdf_path, 'rb') as f:
            data = f.read()
        
        # Count key markers
        analysis['xref_count'] = data.count(b'startxref')
        analysis['eof_count'] = data.count(b'%%EOF')
        analysis['trailer_count'] = data.count(b'trailer')
        
        # Multiple xref = incremental updates
        if analysis['xref_count'] > 1:
            analysis['has_incremental_updates'] = True
            analysis['estimated_versions'] = analysis['xref_count']
        
        # Find all startxref positions
        startxref_positions = []
        pos = 0
        while True:
            pos = data.find(b'startxref', pos)
            if pos == -1:
                break
            startxref_positions.append(pos)
            pos += 1
        
        analysis['startxref_positions'] = startxref_positions
        
    except Exception as e:
        analysis['error'] = str(e)
    
    return analysis


def extract_fonts_info(doc: fitz.Document) -> Dict[int, List[Dict]]:
    """Extract font information from each page."""
    fonts_by_page = {}
    
    for page_num, page in enumerate(doc, 1):
        try:
            # Get font list
            fonts = page.get_fonts()
            
            font_list = []
            for font in fonts:
                font_info = {
                    'xref': font[0],
                    'name': font[3] if len(font) > 3 else 'Unknown',
                    'type': font[1] if len(font) > 1 else 'Unknown',
                    'encoding': font[2] if len(font) > 2 else 'Unknown'
                }
                font_list.append(font_info)
            
            fonts_by_page[page_num] = font_list
            
        except Exception as e:
            fonts_by_page[page_num] = [{'error': str(e)}]
    
    return fonts_by_page


def extract_links_and_annotations(doc: fitz.Document) -> Dict[int, Dict]:
    """Extract all links and annotations with full details."""
    links_by_page = {}
    
    for page_num, page in enumerate(doc, 1):
        page_data = {
            'links': [],
            'annotations': []
        }
        
        try:
            # Get all links
            links = page.get_links()
            for link in links:
                page_data['links'].append({
                    'type': link.get('kind', 'unknown'),
                    'uri': link.get('uri', ''),
                    'page': link.get('page', -1),
                    'from_rect': link.get('from', []),
                    'to_point': link.get('to', None)
                })
            
            # Get all annotations
            annots = page.annots()
            if annots:
                for annot in annots:
                    try:
                        info = annot.info
                        annot_data = {
                            'type': annot.type[1] if hasattr(annot, 'type') else 'Unknown',
                            'content': info.get('content', ''),
                            'author': info.get('title', ''),
                            'subject': info.get('subject', ''),
                            'creation_date': info.get('creationDate', ''),
                            'modification_date': info.get('modDate', ''),
                            'rect': list(annot.rect) if hasattr(annot, 'rect') else []
                        }
                        page_data['annotations'].append(annot_data)
                    except Exception as e:
                        page_data['annotations'].append({'error': str(e)})
            
        except Exception as e:
            page_data['error'] = str(e)
        
        links_by_page[page_num] = page_data
    
    return links_by_page


def deep_extract(pdf_path: Path, output_dir: Path) -> Dict[str, Any]:
    """
    Perform deep extraction of all data from PDF.
    
    Args:
        pdf_path: Path to PDF file
        output_dir: Directory to save extracted data
    
    Returns:
        Summary of extracted data
    """
    output_dir.mkdir(exist_ok=True)
    
    result = {
        'filename': pdf_path.name,
        'success': False,
        'files_created': []
    }
    
    try:
        doc = fitz.open(str(pdf_path))
        
        # 1. Extract full metadata
        print(f"  [1/7] Extracting metadata...")
        metadata = extract_full_metadata(doc)
        metadata_file = output_dir / f"{pdf_path.stem}_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str)
        result['files_created'].append(metadata_file.name)
        
        # 2. Extract all text
        print(f"  [2/7] Extracting text content...")
        text_by_page = extract_all_text(doc)
        text_file = output_dir / f"{pdf_path.stem}_text.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            for page_num, text in text_by_page.items():
                f.write(f"\n{'=' * 80}\n")
                f.write(f"PAGE {page_num}\n")
                f.write(f"{'=' * 80}\n\n")
                f.write(text)
                f.write("\n")
        result['files_created'].append(text_file.name)
        
        # 3. Extract detailed text structure
        print(f"  [3/7] Extracting detailed text structure...")
        detailed_text = extract_text_detailed(doc)
        detailed_file = output_dir / f"{pdf_path.stem}_text_detailed.json"
        with open(detailed_file, 'w', encoding='utf-8') as f:
            json.dump(detailed_text, f, indent=2, default=str)
        result['files_created'].append(detailed_file.name)
        
        # 4. Analyze OCR layer
        print(f"  [4/7] Analyzing OCR layer...")
        ocr_analysis = analyze_ocr_layer(doc)
        ocr_file = output_dir / f"{pdf_path.stem}_ocr_analysis.json"
        with open(ocr_file, 'w', encoding='utf-8') as f:
            json.dump(ocr_analysis, f, indent=2, default=str)
        result['files_created'].append(ocr_file.name)
        
        # 5. Extract fonts
        print(f"  [5/7] Extracting font information...")
        fonts = extract_fonts_info(doc)
        fonts_file = output_dir / f"{pdf_path.stem}_fonts.json"
        with open(fonts_file, 'w', encoding='utf-8') as f:
            json.dump(fonts, f, indent=2, default=str)
        result['files_created'].append(fonts_file.name)
        
        # 6. Extract links and annotations
        print(f"  [6/7] Extracting links and annotations...")
        links = extract_links_and_annotations(doc)
        links_file = output_dir / f"{pdf_path.stem}_links_annotations.json"
        with open(links_file, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, default=str)
        result['files_created'].append(links_file.name)
        
        doc.close()
        
        # 7. Analyze incremental updates
        print(f"  [7/7] Analyzing incremental updates...")
        updates = analyze_incremental_updates(pdf_path)
        updates_file = output_dir / f"{pdf_path.stem}_updates.json"
        with open(updates_file, 'w', encoding='utf-8') as f:
            json.dump(updates, f, indent=2, default=str)
        result['files_created'].append(updates_file.name)
        
        result['success'] = True
        
    except Exception as e:
        result['error'] = str(e)
    
    return result


def main():
    """Main extraction function."""
    if len(sys.argv) < 2:
        print("Usage: python deep_extract.py <pdf_file>")
        print("   or: python deep_extract.py <pdf_file> <output_dir>")
        sys.exit(1)
    
    pdf_path = Path(sys.argv[1])
    
    if not pdf_path.exists():
        print(f"Error: {pdf_path} not found", file=sys.stderr)
        sys.exit(1)
    
    # Output directory
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2])
    else:
        output_dir = Path(f"extracted_{pdf_path.stem}")
    
    print(f"=" * 80)
    print(f"DEEP DATA EXTRACTION")
    print(f"=" * 80)
    print(f"Input:  {pdf_path}")
    print(f"Output: {output_dir}")
    print(f"=" * 80)
    print()
    
    result = deep_extract(pdf_path, output_dir)
    
    print()
    print(f"=" * 80)
    if result['success']:
        print(f"✓ EXTRACTION COMPLETE")
        print(f"=" * 80)
        print(f"\nExtracted {len(result['files_created'])} files:")
        for filename in result['files_created']:
            print(f"  • {filename}")
        print(f"\nAll files saved to: {output_dir.absolute()}")
    else:
        print(f"✗ EXTRACTION FAILED")
        print(f"=" * 80)
        print(f"Error: {result.get('error', 'Unknown error')}")
    
    return 0 if result['success'] else 1


if __name__ == "__main__":
    sys.exit(main())
