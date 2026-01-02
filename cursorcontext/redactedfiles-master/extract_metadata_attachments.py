"""
Extract detailed metadata and attachments from PDFs with security risks.
"""

import csv
import sys
from pathlib import Path
import fitz  # PyMuPDF
from typing import List, Dict, Any


def extract_metadata(pdf_path: Path) -> Dict[str, str]:
    """
    Extract metadata from a PDF file.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        Dictionary of metadata key-value pairs
    """
    metadata = {}
    
    try:
        doc = fitz.open(str(pdf_path))
        
        # Get standard metadata
        doc_metadata = doc.metadata
        if doc_metadata:
            for key, value in doc_metadata.items():
                if value:  # Only include non-empty values
                    metadata[key] = str(value)
        
        doc.close()
        
    except Exception as e:
        print(f"  Error extracting metadata from {pdf_path.name}: {e}", file=sys.stderr)
    
    return metadata


def extract_attachments(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Extract attachment information from a PDF file.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        List of attachment dictionaries
    """
    attachments = []
    
    try:
        doc = fitz.open(str(pdf_path))
        
        # Get embedded files count
        embfile_count = doc.embfile_count()
        
        if embfile_count > 0:
            # Get list of embedded file names
            embfile_names = doc.embfile_names()
            
            for name in embfile_names:
                try:
                    # Get file info
                    file_info = doc.embfile_info(name)
                    
                    attachment = {
                        "pdf_filename": pdf_path.name,
                        "attachment_name": name,
                        "size": file_info.get("size", 0),
                        "description": file_info.get("desc", ""),
                        "filename": file_info.get("filename", name),
                        "creation_date": file_info.get("creationDate", ""),
                        "modification_date": file_info.get("modDate", ""),
                    }
                    attachments.append(attachment)
                    
                except Exception as e:
                    print(f"  Warning: Could not extract info for attachment '{name}' in {pdf_path.name}: {e}", file=sys.stderr)
        
        doc.close()
        
    except Exception as e:
        print(f"  Error extracting attachments from {pdf_path.name}: {e}", file=sys.stderr)
    
    return attachments


def main():
    """Main processing function."""
    
    # Read the security risks CSV
    risks_csv = Path("security_risks_only.csv")
    if not risks_csv.exists():
        print(f"Error: {risks_csv} not found.", file=sys.stderr)
        return 1
    
    print("Reading security risks CSV...")
    with open(risks_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Found {len(rows)} PDFs with security risks")
    
    # Filter PDFs with metadata or attachments
    with_metadata = [r for r in rows if r['has_metadata'] == 'YES']
    with_attachments = [r for r in rows if r['has_attachments'] == 'YES']
    
    print(f"  - {len(with_metadata)} PDFs with metadata")
    print(f"  - {len(with_attachments)} PDFs with attachments")
    
    # Extract metadata
    if with_metadata:
        print(f"\n{'='*80}")
        print("EXTRACTING METADATA")
        print('='*80)
        
        all_metadata = []
        pdfs_dir = Path("kino_documents")
        
        for row in with_metadata:
            filename = row['filename'].strip('"')
            pdf_path = pdfs_dir / filename
            
            if not pdf_path.exists():
                print(f"  Warning: File not found: {filename}")
                continue
            
            print(f"Extracting metadata: {filename}")
            metadata = extract_metadata(pdf_path)
            
            if metadata:
                # Create a row with filename and all metadata key-value pairs
                metadata_row = {
                    "filename": filename,
                    "total_pages": row['total_pages'],
                }
                
                # Add each metadata field
                for key, value in metadata.items():
                    metadata_row[f"metadata_{key}"] = value
                
                all_metadata.append(metadata_row)
                print(f"  Found {len(metadata)} metadata field(s)")
            else:
                print(f"  No metadata extracted")
        
        # Save metadata to CSV
        if all_metadata:
            metadata_csv = Path("pdf_metadata.csv")
            
            # Get all unique metadata keys across all PDFs
            all_keys = set()
            for item in all_metadata:
                all_keys.update(item.keys())
            
            fieldnames = ['filename', 'total_pages'] + sorted([k for k in all_keys if k.startswith('metadata_')])
            
            with open(metadata_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()
                writer.writerows(all_metadata)
            
            print(f"\n[OK] Saved metadata for {len(all_metadata)} PDFs to: {metadata_csv.absolute()}")
            
            # Display first few rows
            print(f"\n{'='*80}")
            print("METADATA PREVIEW (first 10 PDFs)")
            print('='*80)
            for i, item in enumerate(all_metadata[:10], 1):
                print(f"\n{i}. {item['filename']}")
                for key, value in sorted(item.items()):
                    if key.startswith('metadata_'):
                        display_key = key.replace('metadata_', '')
                        print(f"   {display_key}: {value}")
    
    # Extract attachments
    if with_attachments:
        print(f"\n{'='*80}")
        print("EXTRACTING ATTACHMENTS")
        print('='*80)
        
        all_attachments = []
        pdfs_dir = Path("kino_documents")
        
        for row in with_attachments:
            filename = row['filename'].strip('"')
            pdf_path = pdfs_dir / filename
            
            if not pdf_path.exists():
                print(f"  Warning: File not found: {filename}")
                continue
            
            print(f"Extracting attachments: {filename}")
            attachments = extract_attachments(pdf_path)
            
            if attachments:
                all_attachments.extend(attachments)
                print(f"  Found {len(attachments)} attachment(s)")
            else:
                print(f"  No attachments extracted")
        
        # Save attachments to CSV
        if all_attachments:
            attachments_csv = Path("pdf_attachments.csv")
            
            fieldnames = ['pdf_filename', 'attachment_name', 'filename', 'size', 'description', 'creation_date', 'modification_date']
            
            with open(attachments_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(all_attachments)
            
            print(f"\n[OK] Saved {len(all_attachments)} attachments to: {attachments_csv.absolute()}")
            
            # Display attachment summary
            print(f"\n{'='*80}")
            print("ATTACHMENTS PREVIEW")
            print('='*80)
            for att in all_attachments[:10]:
                print(f"\nPDF: {att['pdf_filename']}")
                print(f"  Attachment: {att['attachment_name']}")
                print(f"  Size: {att['size']:,} bytes")
                if att['description']:
                    print(f"  Description: {att['description']}")
    
    print(f"\n{'='*80}")
    print("EXTRACTION COMPLETE")
    print('='*80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
