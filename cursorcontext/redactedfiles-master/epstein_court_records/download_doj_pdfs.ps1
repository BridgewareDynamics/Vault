# DOJ Epstein Court Records Downloader
# PowerShell version for Windows
# Downloads all PDFs from DOJ court records hub and subpages

Write-Host "`n=== DOJ Epstein Court Records Downloader ===`n" -ForegroundColor Cyan

# Step 1: Download the Court Records hub
Write-Host "[Step 1/5] Downloading Court Records hub page..." -ForegroundColor Yellow
$hubUrl = "https://www.justice.gov/epstein/court-records"
$hubFile = "hub.html"

try {
    Invoke-WebRequest -Uri $hubUrl -OutFile $hubFile -UseBasicParsing
    Write-Host "✓ Downloaded hub.html" -ForegroundColor Green
} catch {
    Write-Host "Error downloading hub page: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Extract subpage links using Python
Write-Host "`n[Step 2/5] Extracting subpage links..." -ForegroundColor Yellow

# Create Python script to extract page links
Set-Content -Path "extract_pages.py" -Value @"
import re, sys, urllib.parse, pathlib

hub = pathlib.Path("hub.html").read_text(encoding="utf-8", errors="ignore")

# Get internal DOJ links (including "See files at ..." pages)
links = set(re.findall(r'href="([^"]+)"', hub))
abs_links = set()
for l in links:
    if l.startswith("/"):
        abs_links.add("https://www.justice.gov" + l)
    elif l.startswith("https://www.justice.gov/"):
        abs_links.add(l)

# Keep only likely court-record listing pages
pages = {u for u in abs_links if "/epstein/" in u and ("court-records" in u or "court-record" in u)}
pages.add("https://www.justice.gov/epstein/court-records")

pathlib.Path("pages.txt").write_text("\n".join(sorted(pages))+"\n", encoding="utf-8")
print(f"Wrote {len(pages)} page URLs to pages.txt", file=sys.stderr)
"@

python extract_pages.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error extracting page links" -ForegroundColor Red
    exit 1
}

# Step 3: Fetch all listing pages (rate-limited)
Write-Host "`n[Step 3/5] Fetching all listing pages (rate-limited)..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path "pages" | Out-Null

$pages = Get-Content "pages.txt"
$i = 0
foreach ($url in $pages) {
    $i++
    Write-Host "  [$i/$($pages.Count)] Fetching: $url" -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $url -OutFile "pages\page_$i.html" -UseBasicParsing
        Start-Sleep -Seconds 1  # Be polite - rate limiting
    } catch {
        Write-Host "    Warning: Failed to fetch $url" -ForegroundColor Yellow
    }
}

Write-Host "✓ Downloaded $i listing pages" -ForegroundColor Green

# Step 4: Extract all PDF links
Write-Host "`n[Step 4/5] Extracting PDF URLs from all pages..." -ForegroundColor Yellow

# Create Python script to extract PDF URLs
Set-Content -Path "extract_pdfs.py" -Value @"
import re, glob, pathlib

pdfs = set()
for fn in glob.glob("pages/*.html"):
    txt = pathlib.Path(fn).read_text(encoding="utf-8", errors="ignore")
    for m in re.findall(r'https?://www\.justice\.gov/[^"\s]+\.pdf', txt):
        pdfs.add(m)
    for m in re.findall(r'href="(/[^"]+\.pdf)"', txt):
        pdfs.add("https://www.justice.gov" + m)

pathlib.Path("pdf_urls.txt").write_text("\n".join(sorted(pdfs)) + "\n", encoding="utf-8")
print(f"Found {len(pdfs)} PDF URLs -> pdf_urls.txt")
"@

python extract_pdfs.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error extracting PDF URLs" -ForegroundColor Red
    exit 1
}

$pdfCount = (Get-Content "pdf_urls.txt").Count
Write-Host "✓ Found $pdfCount PDF URLs" -ForegroundColor Green

# Step 5: Download PDFs
Write-Host "`n[Step 5/5] Downloading PDFs..." -ForegroundColor Yellow

# Check if aria2c is available
$aria2Exists = Get-Command aria2c -ErrorAction SilentlyContinue

if ($aria2Exists) {
    Write-Host "  Using aria2c for fast parallel downloads..." -ForegroundColor Cyan
    aria2c -c -x 8 -s 8 -i pdf_urls.txt
} else {
    Write-Host "  aria2c not found. Using PowerShell (slower, but works)..." -ForegroundColor Yellow
    Write-Host "  (Install aria2 for faster downloads: winget install aria2.aria2)" -ForegroundColor Gray
    
    New-Item -ItemType Directory -Force -Path "pdfs" | Out-Null
    
    $urls = Get-Content "pdf_urls.txt"
    $downloaded = 0
    $failed = 0
    
    foreach ($url in $urls) {
        $filename = [System.IO.Path]::GetFileName($url)
        # Decode URL-encoded characters
        $filename = [System.Uri]::UnescapeDataString($filename)
        # Clean up filename
        $filename = $filename -replace '[\\/:*?"<>|]', '_'
        $outFile = "pdfs\$filename"
        
        try {
            Write-Host "  [$($downloaded + $failed + 1)/$($urls.Count)] Downloading: $filename" -ForegroundColor Gray
            Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
            $downloaded++
        } catch {
            Write-Host "    Failed: $filename" -ForegroundColor Red
            $failed++
        }
        
        # Rate limiting
        if (($downloaded + $failed) % 5 -eq 0) {
            Start-Sleep -Milliseconds 500
        }
    }
    
    Write-Host "`n✓ Downloaded $downloaded PDFs" -ForegroundColor Green
    if ($failed -gt 0) {
        Write-Host "⚠ Failed to download $failed PDFs" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Download Complete ===" -ForegroundColor Cyan
Write-Host "PDF URLs saved to: pdf_urls.txt" -ForegroundColor White
Write-Host "Listing pages saved to: pages\" -ForegroundColor White
Write-Host "`nTo re-run just the download step:" -ForegroundColor Gray
Write-Host "  aria2c -c -x 8 -s 8 -i pdf_urls.txt" -ForegroundColor Gray

# Cleanup temporary Python scripts
Remove-Item -Path "extract_pages.py" -ErrorAction SilentlyContinue
Remove-Item -Path "extract_pdfs.py" -ErrorAction SilentlyContinue
