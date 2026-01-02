# Browser-Based PDF Download Instructions

Since the DOJ website requires authentication, you can download the PDFs directly in Chrome.

## Step 1: Download PDFs via Browser

1. **Open the DOJ Court Records page in Chrome:**
   - Go to: https://www.justice.gov/epstein/court-records
   - Click on any case that has "See files at..." link

2. **Open Chrome DevTools:**
   - Press `F12` or `Ctrl+Shift+J` (Windows) or `Cmd+Option+J` (Mac)

3. **Copy and paste the script:**
   - Open the file: `browser_download_script.js`
   - Copy all the contents
   - Paste into the Console tab and press Enter

4. **Allow multiple downloads:**
   - Chrome will ask for permission to download multiple files
   - Click "Allow"

5. **Wait for downloads to complete:**
   - The script downloads PDFs with names like: `CaseName____filename.pdf`
   - Check your Downloads folder as files arrive

## Step 2: Organize into Case Folders

After downloads complete, run the Python organizer:

```bash
python organize_downloads.py
```

This will:
- Find all PDFs in your Downloads folder with case prefixes
- Create case folders in the current directory
- Move PDFs into their respective case folders
- Rename files back to original names

## Alternative: Manual Organization

If you prefer to download manually:

1. Visit each case page on the DOJ website
2. Save PDFs directly into case folders you create
3. Use the naming convention from the URL path

## Next Steps

After organizing PDFs into case folders, you can:

1. **Run the redaction checker:**
   ```bash
   cd ..
   python annotate_overlaps.py --interactive
   ```

2. **Select folder mode** and choose the case folder to check

3. **Review flagged pages** with red overlays showing redacted text

## Troubleshooting

**If downloads don't start:**
- Make sure you're on a page with PDF links
- Check that popups aren't blocked
- Try smaller batches by navigating to specific case pages

**If the organizer can't find files:**
- Check your Downloads folder path
- Look for files with `____` in the name
- Manually specify the Downloads path when prompted

**If you get 401 errors:**
- The automated Python downloader won't work
- Use the browser method instead (this file's instructions)
