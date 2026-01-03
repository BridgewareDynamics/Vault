# DOJ Epstein Court Records Downloader - Quick Start

This directory contains a script to download all PDFs from the DOJ Epstein court records.

## Quick Start

1. Open a terminal in this directory:
   ```bash
   cd epstein_court_records
   ```

2. Run the download script:
   ```bash
   python download_doj_pdfs.py
   ```

## What It Does

The script will:
1. Download the DOJ hub page (https://www.justice.gov/epstein/court-records)
2. Extract all "See files at..." subpage links
3. Fetch all listing pages (with rate limiting to be polite)
4. Extract all PDF URLs from those pages
5. Download all PDFs

## Requirements

- **Python 3** (already installed on your system)
- **aria2** (optional, but recommended for faster downloads)
  - Install via: `winget install aria2.aria2`
  - Without aria2, the script will use PowerShell's slower download method

## Output Files

- `hub.html` - The main court records page
- `pages.txt` - List of all listing page URLs
- `pages/` - Downloaded listing pages
- `pdf_urls.txt` - List of all PDF URLs found
- PDFs will be downloaded to current directory (or `pdfs/` if using PowerShell method)

## Rate Limiting

The script includes delays to be polite to the DOJ servers:
- 1 second between page fetches
- Parallel PDF downloads (if using aria2)

## Re-running Downloads

If the download is interrupted, you can resume with:
```powershell
aria2c -c -x 8 -s 8 -i pdf_urls.txt
```

The `-c` flag resumes interrupted downloads.

## Troubleshooting

If you get execution policy errors, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Source

Based on Option 1 from the DOJ court records download guide, adapted for Windows PowerShell.
