"""
Download Kino court documents from assets.getkino.com
Format: vol00008-2-efta########.pdf
Range: EFTA00009676 to EFTA00039387
"""

import requests
import time
from pathlib import Path
import sys


def download_document(doc_number: int, output_dir: Path) -> bool:
    """
    Download a single document from Kino assets.
    
    Args:
        doc_number: Document number (will be zero-padded to 8 digits)
        output_dir: Directory to save the PDF
    
    Returns:
        True if successful, False otherwise
    """
    # Format: https://assets.getkino.com/documents/vol00008-2-efta########.pdf
    url = f"https://assets.getkino.com/documents/vol00008-2-efta{doc_number:08d}.pdf"
    doc_id = f"EFTA{doc_number:08d}"
    filename = f"vol00008-2-efta{doc_number:08d}.pdf"
    
    output_path = output_dir / filename
    
    # Skip if already downloaded
    if output_path.exists():
        return None  # Return None for skipped
    
    try:
        # Download with timeout
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            # Save the file
            output_path.write_bytes(response.content)
            file_size = len(response.content) / 1024  # KB
            print(f"[OK] Downloaded: {doc_id} ({file_size:.1f} KB)")
            return True
            
        elif response.status_code == 404:
            return False  # Not found
            
        else:
            print(f"[ERR] Error {response.status_code}: {doc_id}", file=sys.stderr)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[NET] Network error for {doc_id}: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[ERR] Unexpected error for {doc_id}: {e}", file=sys.stderr)
        return False


def main():
    """Main download function."""
    
    # Configuration
    start_num = 10620
    end_num = 39387
    output_dir = Path("kino_documents")
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    total_docs = end_num - start_num + 1
    
    print("=" * 80)
    print("KINO DOCUMENT DOWNLOADER")
    print("=" * 80)
    print(f"Range: EFTA{start_num:08d} to EFTA{end_num:08d}")
    print(f"Total documents: {total_docs:,}")
    print(f"Output directory: {output_dir.absolute()}")
    print("=" * 80)
    
    # Download statistics
    success_count = 0
    not_found_count = 0
    skip_count = 0
    
    try:
        for doc_num in range(start_num, end_num + 1):
            result = download_document(doc_num, output_dir)
            
            if result is None:
                skip_count += 1
                if skip_count % 100 == 0:
                    print(f"[SKIP] {skip_count} files already exist...")
            elif result:
                success_count += 1
            else:
                not_found_count += 1
                if not_found_count <= 20:  # Only show first 20 404s
                    print(f"[404] Not found: EFTA{doc_num:08d}")
            
            # Progress update every 100 documents
            if (doc_num - start_num + 1) % 100 == 0:
                progress = ((doc_num - start_num + 1) / total_docs) * 100
                print(f"\nProgress: {progress:.1f}% ({doc_num - start_num + 1}/{total_docs})")
                print(f"  Downloaded: {success_count}, Not found: {not_found_count}, Skipped: {skip_count}\n")
            
            # Rate limiting - be respectful to the server
            time.sleep(0.5)  # 500ms delay between requests
    
    except KeyboardInterrupt:
        print("\n\nDownload interrupted by user (Ctrl+C)")
        print(f"Progress: {success_count} downloaded, {not_found_count} not found, {skip_count} skipped")
        return 1
    
    # Final summary
    print("\n" + "=" * 80)
    print("DOWNLOAD COMPLETE")
    print("=" * 80)
    print(f"Successfully downloaded: {success_count}")
    print(f"Not found (404): {not_found_count}")
    print(f"Skipped (already exist): {skip_count}")
    print(f"Total processed: {success_count + not_found_count + skip_count}")
    print("=" * 80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
