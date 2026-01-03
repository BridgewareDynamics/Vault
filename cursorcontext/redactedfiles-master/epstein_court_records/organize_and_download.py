#!/usr/bin/env python3
"""
Organize and Download PDFs by Case
Downloads PDFs from URLs and organizes them into case-based subdirectories
"""

import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Dict, List

try:
    import requests
except ImportError:
    print("Error: 'requests' library not found.")
    print("Install it with: pip install requests")
    sys.exit(1)

def extract_case_name(url: str) -> str:
    """Extract case name from URL path."""
    # Parse URL
    parsed = urllib.parse.urlparse(url)
    path_parts = parsed.path.split('/')
    
    # Look for "Court Records" or similar in path
    for i, part in enumerate(path_parts):
        if 'Court' in part and 'Record' in part:
            # Next part is usually the case folder
            if i + 1 < len(path_parts):
                case_name = urllib.parse.unquote(path_parts[i + 1])
                # Clean up case name for folder
                case_name = re.sub(r'[<>:"|?*]', '_', case_name)
                return case_name
    
    # Fallback: use domain + first meaningful path segment
    domain = parsed.netloc.replace('.', '_')
    for part in path_parts:
        if part and part != '/':
            clean_part = urllib.parse.unquote(part)
            clean_part = re.sub(r'[<>:"|?*]', '_', clean_part)
            if clean_part and not clean_part.endswith('.pdf'):
                return f"{domain}_{clean_part}"
    
    return "uncategorized"

def get_filename_from_url(url: str) -> str:
    """Extract filename from URL."""
    parsed = urllib.parse.urlparse(url)
    filename = Path(parsed.path).name
    filename = urllib.parse.unquote(filename)
    
    # Ensure it has .pdf extension
    if not filename.lower().endswith('.pdf'):
        filename += '.pdf'
    
    return filename

def organize_urls_by_case(urls: List[str]) -> Dict[str, List[str]]:
    """Organize URLs by case name."""
    cases = {}
    
    for url in urls:
        url = url.strip()
        if not url or not url.startswith('http'):
            continue
        
        case_name = extract_case_name(url)
        if case_name not in cases:
            cases[case_name] = []
        cases[case_name].append(url)
    
    return cases

def download_file(url: str, output_path: Path, session: requests.Session) -> bool:
    """Download a file with error handling."""
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        return True
    except Exception as e:
        print(f"      Error: {e}", file=sys.stderr)
        return False

def main():
    print("\n=== PDF Organizer and Downloader ===\n")
    
    # Check for command line argument
    if len(sys.argv) > 1:
        url_file = Path(sys.argv[1])
    else:
        # Look for default URL list files
        possible_files = [
            Path("urls/pdfsurl.txt"),
            Path("pdf_urls.txt"),
            Path("urls.txt")
        ]
        url_file = None
        for f in possible_files:
            if f.exists():
                url_file = f
                break
    
    if url_file is None or not url_file.exists():
        print("No URL file found.")
        print("\nUsage: python organize_and_download.py [url_file.txt]")
        print("\nOr provide PDF URLs (one per line, or paste multiple lines).")
        print("Press Ctrl+D (or Ctrl+Z on Windows) when done:\n")
        
        urls = []
        try:
            for line in sys.stdin:
                line = line.strip()
                if line and line.startswith('http'):
                    urls.append(line)
        except KeyboardInterrupt:
            print("\n\nInterrupted.", file=sys.stderr)
            return 1
        
        if not urls:
            print("No URLs provided.", file=sys.stderr)
            return 1
    else:
        print(f"Reading URLs from: {url_file}")
        urls = url_file.read_text(encoding='utf-8').splitlines()
        urls = [u.strip() for u in urls if u.strip() and u.strip().startswith('http')]
        print(f"Found {len(urls)} URLs")
    
    # Organize by case
    print("\nOrganizing URLs by case...")
    cases = organize_urls_by_case(urls)
    
    print(f"\nFound {len(cases)} case(s):")
    for case_name, case_urls in sorted(cases.items()):
        print(f"  • {case_name}: {len(case_urls)} PDF(s)")
    
    # Confirm
    response = input("\nProceed with download? (y/n): ").strip().lower()
    if response != 'y':
        print("Cancelled.")
        return 0
    
    # Create session
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
    })
    
    # Download files organized by case
    print(f"\nDownloading {len(urls)} PDF(s) into case folders...")
    
    total_downloaded = 0
    total_failed = 0
    
    for case_name, case_urls in sorted(cases.items()):
        print(f"\n[Case: {case_name}] {len(case_urls)} PDF(s)")
        
        # Create case directory
        case_dir = Path(case_name)
        case_dir.mkdir(exist_ok=True)
        
        for i, url in enumerate(case_urls, 1):
            filename = get_filename_from_url(url)
            output_path = case_dir / filename
            
            # Skip if already exists
            if output_path.exists():
                print(f"  [{i}/{len(case_urls)}] ⊙ Skipped (exists): {filename}")
                total_downloaded += 1
                continue
            
            print(f"  [{i}/{len(case_urls)}] ↓ Downloading: {filename}")
            
            if download_file(url, output_path, session):
                total_downloaded += 1
            else:
                total_failed += 1
            
            # Rate limiting (be polite)
            if i % 5 == 0 and i < len(case_urls):
                time.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"✓ Downloaded: {total_downloaded} PDF(s)")
    if total_failed > 0:
        print(f"⚠ Failed: {total_failed} PDF(s)")
    print(f"{'='*60}")
    
    print("\nCase directories created:")
    for case_name in sorted(cases.keys()):
        pdf_count = len(list(Path(case_name).glob('*.pdf')))
        print(f"  • {case_name}/ ({pdf_count} PDFs)")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user", file=sys.stderr)
        sys.exit(130)
