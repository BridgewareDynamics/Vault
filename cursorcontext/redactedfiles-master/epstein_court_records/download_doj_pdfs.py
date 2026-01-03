#!/usr/bin/env python3
"""
DOJ Epstein Court Records Downloader
Downloads all PDFs from DOJ court records hub and subpages
"""

import re
import sys
import time
import urllib.parse
import urllib.request
import ssl
from pathlib import Path
from typing import Set

def download_file(url: str, output_path: Path) -> bool:
    """Download a file with error handling."""
    try:
        # Create SSL context that doesn't verify certificates
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
            output_path.write_bytes(response.read())
        return True
    except Exception as e:
        print(f"    Error: {e}", file=sys.stderr)
        return False

def extract_page_links(hub_html: str) -> Set[str]:
    """Extract all court-record listing page links from hub HTML."""
    links = set(re.findall(r'href="([^"]+)"', hub_html))
    abs_links = set()
    
    for link in links:
        if link.startswith("/"):
            abs_links.add("https://www.justice.gov" + link)
        elif link.startswith("https://www.justice.gov/"):
            abs_links.add(link)
    
    # Keep only likely court-record listing pages
    pages = {u for u in abs_links if "/epstein/" in u and ("court-records" in u or "court-record" in u)}
    pages.add("https://www.justice.gov/epstein/court-records")
    
    return pages

def extract_pdf_links(html_files: list[Path]) -> Set[str]:
    """Extract all PDF URLs from HTML files."""
    pdfs = set()
    
    for html_file in html_files:
        try:
            text = html_file.read_text(encoding="utf-8", errors="ignore")
            
            # Find absolute PDF URLs
            for match in re.findall(r'https?://www\.justice\.gov/[^"\s]+\.pdf', text):
                pdfs.add(match)
            
            # Find relative PDF URLs
            for match in re.findall(r'href="(/[^"]+\.pdf)"', text):
                pdfs.add("https://www.justice.gov" + match)
        except Exception as e:
            print(f"Warning: Error reading {html_file}: {e}", file=sys.stderr)
    
    return pdfs

def main():
    print("\n=== DOJ Epstein Court Records Downloader ===\n")
    
    # Step 1: Download the Court Records hub
    print("[Step 1/5] Downloading Court Records hub page...")
    hub_url = "https://www.justice.gov/epstein/court-records"
    hub_file = Path("hub.html")
    
    if download_file(hub_url, hub_file):
        print("✓ Downloaded hub.html")
    else:
        print("✗ Failed to download hub page", file=sys.stderr)
        return 1
    
    # Step 2: Extract subpage links
    print("\n[Step 2/5] Extracting subpage links...")
    hub_html = hub_file.read_text(encoding="utf-8", errors="ignore")
    pages = extract_page_links(hub_html)
    
    pages_file = Path("pages.txt")
    pages_file.write_text("\n".join(sorted(pages)) + "\n", encoding="utf-8")
    print(f"✓ Found {len(pages)} page URLs -> pages.txt")
    
    # Step 3: Fetch all listing pages (rate-limited)
    print(f"\n[Step 3/5] Fetching {len(pages)} listing pages (rate-limited)...")
    pages_dir = Path("pages")
    pages_dir.mkdir(exist_ok=True)
    
    page_files = []
    for i, url in enumerate(sorted(pages), 1):
        print(f"  [{i}/{len(pages)}] Fetching: {url}")
        page_file = pages_dir / f"page_{i}.html"
        
        if download_file(url, page_file):
            page_files.append(page_file)
        
        # Be polite - rate limiting
        if i < len(pages):
            time.sleep(1)
    
    print(f"✓ Downloaded {len(page_files)} listing pages")
    
    # Step 4: Extract all PDF links
    print("\n[Step 4/5] Extracting PDF URLs from all pages...")
    pdfs = extract_pdf_links(page_files)
    
    pdf_urls_file = Path("pdf_urls.txt")
    pdf_urls_file.write_text("\n".join(sorted(pdfs)) + "\n", encoding="utf-8")
    print(f"✓ Found {len(pdfs)} PDF URLs -> pdf_urls.txt")
    
    # Step 5: Download PDFs
    print(f"\n[Step 5/5] Downloading {len(pdfs)} PDFs...")
    print("  (This may take a while. Press Ctrl+C to stop)")
    
    # Check if aria2c is available
    import shutil
    if shutil.which("aria2c"):
        print("  Using aria2c for fast parallel downloads...\n")
        import subprocess
        result = subprocess.run(
            ["aria2c", "-c", "-x", "8", "-s", "8", "-i", "pdf_urls.txt"],
            capture_output=False
        )
        if result.returncode == 0:
            print("\n✓ Download complete!")
        else:
            print("\n⚠ aria2c exited with errors", file=sys.stderr)
    else:
        print("  aria2c not found. Using Python (slower)...")
        print("  (Install aria2 for faster downloads: winget install aria2.aria2)\n")
        
        pdfs_dir = Path("pdfs")
        pdfs_dir.mkdir(exist_ok=True)
        
        downloaded = 0
        failed = 0
        
        for i, url in enumerate(sorted(pdfs), 1):
            filename = Path(urllib.parse.urlparse(url).path).name
            filename = urllib.parse.unquote(filename)
            out_file = pdfs_dir / filename
            
            print(f"  [{i}/{len(pdfs)}] Downloading: {filename}")
            
            if download_file(url, out_file):
                downloaded += 1
            else:
                failed += 1
            
            # Rate limiting
            if i % 5 == 0 and i < len(pdfs):
                time.sleep(0.5)
        
        print(f"\n✓ Downloaded {downloaded} PDFs")
        if failed > 0:
            print(f"⚠ Failed to download {failed} PDFs", file=sys.stderr)
    
    print("\n=== Download Complete ===")
    print("PDF URLs saved to: pdf_urls.txt")
    print("Listing pages saved to: pages/")
    print("\nTo re-run just the download step:")
    print("  aria2c -c -x 8 -s 8 -i pdf_urls.txt")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user", file=sys.stderr)
        sys.exit(130)
