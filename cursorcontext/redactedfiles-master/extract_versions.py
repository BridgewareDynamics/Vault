#!/usr/bin/env python3
"""
PDF Version History Extractor - Extract old versions from incrementally updated PDFs.

This tool attempts to reconstruct earlier versions of a PDF by parsing
each xref table and extracting the objects that were active at that point.
"""

import sys
import re
from pathlib import Path
from typing import List, Dict, Tuple


def find_xref_positions(pdf_data: bytes) -> List[int]:
    """Find all startxref positions in the PDF."""
    positions = []
    pattern = b'startxref\n'
    
    pos = 0
    while True:
        pos = pdf_data.find(pattern, pos)
        if pos == -1:
            break
        
        # Read the number after startxref
        num_start = pos + len(pattern)
        num_end = pdf_data.find(b'\n', num_start)
        
        if num_end != -1:
            try:
                xref_offset = int(pdf_data[num_start:num_end].strip())
                positions.append(xref_offset)
            except ValueError:
                pass
        
        pos += 1
    
    return positions


def extract_text_at_version(pdf_path: Path, xref_position: int) -> Dict:
    """
    Attempt to extract content visible at a specific xref version.
    This is simplified - full reconstruction would require parsing the entire PDF structure.
    """
    result = {
        'xref_position': xref_position,
        'objects_found': [],
        'text_objects': [],
        'error': None
    }
    
    try:
        with open(pdf_path, 'rb') as f:
            # Read the entire file
            pdf_data = f.read()
            
            # Find the xref table at this position
            f.seek(xref_position)
            xref_data = f.read(10000)  # Read 10KB from xref position
            
            # Parse xref table entries
            xref_match = re.search(rb'xref\s+(\d+)\s+(\d+)', xref_data)
            if xref_match:
                start_obj = int(xref_match.group(1))
                num_objects = int(xref_match.group(2))
                
                result['objects_found'] = list(range(start_obj, start_obj + num_objects))
            
            # Look for text objects (BT...ET blocks) in the region
            # This is a simplified approach
            text_pattern = rb'BT\s+(.*?)\s+ET'
            text_matches = re.findall(text_pattern, xref_data, re.DOTALL)
            
            for match in text_matches:
                # Try to extract actual text strings
                string_pattern = rb'\((.*?)\)'
                strings = re.findall(string_pattern, match)
                
                for s in strings:
                    try:
                        decoded = s.decode('latin-1', errors='ignore')
                        if decoded.strip():
                            result['text_objects'].append(decoded)
                    except:
                        pass
            
            # Also search backwards from xref to find objects
            search_start = max(0, xref_position - 100000)  # Search 100KB before xref
            f.seek(search_start)
            region_data = f.read(xref_position - search_start)
            
            # Find all stream objects
            obj_pattern = rb'(\d+)\s+\d+\s+obj'
            obj_matches = re.finditer(obj_pattern, region_data)
            
            for match in obj_matches:
                obj_num = int(match.group(1))
                if obj_num not in result['objects_found']:
                    result['objects_found'].append(obj_num)
    
    except Exception as e:
        result['error'] = str(e)
    
    return result


def extract_raw_content_sections(pdf_path: Path, xref_positions: List[int]) -> List[Dict]:
    """
    Extract raw content sections between xref tables.
    Each section represents what was added in that version.
    """
    sections = []
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
        
        # Add boundaries
        boundaries = [0] + sorted(xref_positions) + [len(pdf_data)]
        
        for i in range(len(boundaries) - 1):
            start = boundaries[i]
            end = boundaries[i + 1]
            
            section_data = pdf_data[start:end]
            
            section = {
                'version': i,
                'start_byte': start,
                'end_byte': end,
                'size_bytes': end - start,
                'content_preview': section_data[:500].decode('latin-1', errors='ignore'),
                'stream_count': section_data.count(b'stream'),
                'endstream_count': section_data.count(b'endstream'),
                'text_operators': {
                    'BT_count': section_data.count(b'BT'),  # Begin Text
                    'ET_count': section_data.count(b'ET'),  # End Text
                    'Tj_count': section_data.count(b'Tj'),  # Show text
                    'TJ_count': section_data.count(b'TJ'),  # Show text array
                },
                'has_content': b'stream' in section_data or b'BT' in section_data
            }
            
            # Try to extract visible text strings
            text_strings = []
            string_pattern = rb'\((.*?)\)(?:\s*Tj|\s*TJ)'
            matches = re.findall(string_pattern, section_data)
            
            for match in matches:
                try:
                    decoded = match.decode('latin-1', errors='ignore')
                    if decoded.strip() and len(decoded) < 200:
                        text_strings.append(decoded)
                except:
                    pass
            
            section['text_strings'] = text_strings
            
            sections.append(section)
    
    except Exception as e:
        sections.append({'error': str(e)})
    
    return sections


def reconstruct_versions_with_pymupdf(pdf_path: Path, output_dir: Path) -> List[Dict]:
    """
    Use PyMuPDF to try to reconstruct versions by reading the PDF at different points.
    This is experimental and may not work for all PDFs.
    """
    import fitz
    import shutil
    
    results = []
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
        
        # Find xref positions
        xref_positions = find_xref_positions(pdf_data)
        
        if not xref_positions:
            return [{'error': 'No xref positions found'}]
        
        print(f"Found {len(xref_positions)} versions (xref tables)")
        
        # For each version, try to truncate the file at that point and open it
        for i, xref_pos in enumerate(xref_positions):
            print(f"\n  Processing Version {i + 1}/{len(xref_positions)}...")
            
            version_result = {
                'version': i + 1,
                'xref_position': xref_pos,
                'success': False
            }
            
            # Find the next %%EOF after this xref
            eof_pattern = b'%%EOF'
            eof_pos = pdf_data.find(eof_pattern, xref_pos)
            
            if eof_pos != -1:
                # Truncate at this EOF
                truncated_data = pdf_data[:eof_pos + len(eof_pattern)]
                
                # Save truncated version
                temp_file = output_dir / f"version_{i + 1}_temp.pdf"
                with open(temp_file, 'wb') as f:
                    f.write(truncated_data)
                
                # Try to open with PyMuPDF
                try:
                    doc = fitz.open(str(temp_file))
                    
                    version_result['success'] = True
                    version_result['page_count'] = len(doc)
                    
                    # Extract text from this version
                    all_text = ""
                    for page in doc:
                        all_text += page.get_text()
                    
                    version_result['text'] = all_text
                    version_result['text_length'] = len(all_text)
                    
                    # Save this version as a separate PDF
                    output_pdf = output_dir / f"version_{i + 1}_of_{len(xref_positions)}.pdf"
                    shutil.copy(str(temp_file), str(output_pdf))
                    version_result['output_file'] = output_pdf.name
                    
                    # Save text to file
                    text_file = output_dir / f"version_{i + 1}_of_{len(xref_positions)}.txt"
                    with open(text_file, 'w', encoding='utf-8') as f:
                        f.write(f"VERSION {i + 1} OF {len(xref_positions)}\n")
                        f.write(f"=" * 80 + "\n")
                        f.write(f"xref position: {xref_pos}\n")
                        f.write(f"Pages: {len(doc)}\n")
                        f.write(f"Text length: {len(all_text)} characters\n")
                        f.write(f"\n{'=' * 80}\n")
                        f.write(f"EXTRACTED TEXT\n")
                        f.write(f"{'=' * 80}\n\n")
                        f.write(all_text)
                    
                    version_result['text_file'] = text_file.name
                    
                    print(f"    ✓ Version {i + 1}: {len(doc)} page(s), {len(all_text)} chars of text")
                    
                    doc.close()
                    
                except Exception as e:
                    version_result['error'] = str(e)
                    print(f"    ✗ Version {i + 1}: Failed to open - {e}")
                
                # Clean up temp file
                try:
                    temp_file.unlink()
                except:
                    pass
            
            results.append(version_result)
    
    except Exception as e:
        results.append({'error': str(e)})
    
    return results


def main():
    """Main extraction function."""
    if len(sys.argv) < 2:
        print("Usage: python extract_versions.py <pdf_file>")
        sys.exit(1)
    
    pdf_path = Path(sys.argv[1])
    
    if not pdf_path.exists():
        print(f"Error: {pdf_path} not found", file=sys.stderr)
        sys.exit(1)
    
    output_dir = Path(f"versions_{pdf_path.stem}")
    output_dir.mkdir(exist_ok=True)
    
    print(f"=" * 80)
    print(f"PDF VERSION HISTORY EXTRACTOR")
    print(f"=" * 80)
    print(f"Input:  {pdf_path}")
    print(f"Output: {output_dir}")
    print(f"=" * 80)
    
    # Method 1: Reconstruct versions with PyMuPDF
    print(f"\n[Method 1] Reconstructing versions with PyMuPDF...")
    print("=" * 80)
    
    results = reconstruct_versions_with_pymupdf(pdf_path, output_dir)
    
    # Summary
    print(f"\n{'=' * 80}")
    print(f"EXTRACTION SUMMARY")
    print(f"{'=' * 80}")
    
    successful = [r for r in results if r.get('success')]
    
    if successful:
        print(f"\n✓ Successfully extracted {len(successful)} version(s):")
        for r in successful:
            print(f"\n  Version {r['version']}:")
            print(f"    PDF: {r.get('output_file', 'N/A')}")
            print(f"    Text: {r.get('text_file', 'N/A')}")
            print(f"    Pages: {r.get('page_count', 0)}")
            print(f"    Text length: {r.get('text_length', 0)} characters")
        
        print(f"\nAll files saved to: {output_dir.absolute()}")
    else:
        print(f"\n✗ No versions could be extracted")
        for r in results:
            if 'error' in r:
                print(f"  Error: {r['error']}")
    
    # Method 2: Raw section analysis
    print(f"\n{'=' * 80}")
    print(f"[Method 2] Analyzing raw content sections...")
    print(f"{'=' * 80}")
    
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()
    
    xref_positions = find_xref_positions(pdf_data)
    sections = extract_raw_content_sections(pdf_path, xref_positions)
    
    # Save section analysis
    import json
    sections_file = output_dir / "section_analysis.json"
    with open(sections_file, 'w', encoding='utf-8') as f:
        json.dump(sections, f, indent=2, default=str)
    
    print(f"\nSection analysis saved to: {sections_file.name}")
    
    for section in sections:
        if 'version' in section:
            print(f"\n  Section {section['version']}:")
            print(f"    Bytes: {section['start_byte']} to {section['end_byte']} ({section['size_bytes']} bytes)")
            print(f"    Text operators: {section['text_operators']['Tj_count']} Tj, {section['text_operators']['TJ_count']} TJ")
            if section['text_strings']:
                print(f"    Text strings found: {len(section['text_strings'])}")
                for s in section['text_strings'][:3]:  # Show first 3
                    print(f"      - {repr(s[:60])}")
    
    print(f"\n{'=' * 80}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'=' * 80}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
