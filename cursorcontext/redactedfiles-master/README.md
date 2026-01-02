# PDF Overlay Redaction Risk Checker

A Python tool to detect potential insecure "overlay" redactions in PDF files—where black rectangles may have been drawn over text without actually removing the underlying content.

## ⚠️ IMPORTANT SECURITY & ETHICAL NOTICE

**This tool is designed SOLELY for security auditing and compliance checking.**

### What This Tool Does:
- ✅ Detects **risk indicators** of insecure overlay redactions
- ✅ Reports **page numbers** and **overlap counts**
- ✅ Generates audit reports in text, JSON, or CSV format

### What This Tool Does NOT Do:
- ❌ Extract redacted content
- ❌ Display redacted text
- ❌ Save redacted information to disk or console
- ❌ Prove definitively that redactions are insecure

### Legal & Ethical Responsibility:
- This is a **heuristic tool** and may produce false positives
- **Manual verification is required** for all findings
- Users are **responsible** for proper handling of sensitive documents
- Use only for **authorized security audits** and compliance checks
- Detection does **not** constitute proof of security vulnerability

---

## Features

- **Risk Detection**: Identifies pages where black filled rectangles overlap with text bounding boxes
- **Batch Processing**: Scan individual PDFs or entire directories (with optional recursion)
- **Multiple Output Formats**: Text summary, JSON, or CSV reports
- **Configurable Thresholds**: Adjust sensitivity for black color detection and overlap area
- **No Content Extraction**: Processes only geometric coordinates, never text content
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Fast & Efficient**: Pre-filters and early exits to optimize performance

---

## Installation

### Requirements
- Python 3.11 or higher
- PyMuPDF (fitz) library

### Setup

1. **Clone or download this repository:**
   ```bash
   cd /path/to/redactedfiles
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   Or install PyMuPDF directly:
   ```bash
   pip install pymupdf
   ```

3. **Verify installation:**
   ```bash
   python overlay_checker.py --help
   ```

---

## Usage

### Basic Commands

**Scan a single PDF:**
```bash
python overlay_checker.py input.pdf
```

**Scan all PDFs in a directory:**
```bash
python overlay_checker.py /path/to/folder
```

**Scan directory recursively:**
```bash
python overlay_checker.py /path/to/folder --recursive
```

### Output Formats

**JSON output:**
```bash
python overlay_checker.py input.pdf --json --output report.json
```

**CSV output:**
```bash
python overlay_checker.py folder/ --csv --output report.csv
```

**Text output to file:**
```bash
python overlay_checker.py input.pdf --output report.txt
```

### Advanced Options

**Adjust sensitivity:**
```bash
python overlay_checker.py input.pdf \
  --min-overlap-area 5.0 \
  --black-threshold 0.2 \
  --min-hits 2
```

**Parameters:**
- `--min-overlap-area FLOAT`: Minimum intersection area (sq points) to count as overlap (default: 4.0)
- `--black-threshold FLOAT`: Maximum RGB component value (0.0-1.0) to consider black (default: 0.15)
- `--min-hits INT`: Minimum overlaps required to flag a page (default: 1)

### Full CLI Options

```
usage: overlay_checker.py [-h] [--recursive] [--min-overlap-area FLOAT]
                          [--black-threshold FLOAT] [--min-hits INT]
                          [--json] [--csv] [--output FILE]
                          input_path

positional arguments:
  input_path            Path to PDF file or directory to scan

options:
  -h, --help            Show help message and exit
  --recursive, -r       Recursively scan subdirectories
  --min-overlap-area FLOAT
                        Minimum overlap area in square points (default: 4.0)
  --black-threshold FLOAT
                        Maximum RGB value to consider black (default: 0.15)
  --min-hits INT        Minimum overlaps to flag a page (default: 1)
  --json                Output report in JSON format
  --csv                 Output report in CSV format
  --output FILE, -o FILE
                        Output file path (default: stdout)
```

---

## How It Works

### Detection Algorithm

1. **Extract Drawing Objects**: Retrieves filled shapes from each PDF page using `page.get_drawings()`
2. **Filter Black Rectangles**: Identifies rectangles with fill colors near black (RGB components ≤ threshold)
3. **Extract Text Bounds**: Gets bounding boxes for text without extracting actual content
4. **Compute Overlaps**: Calculates intersection area between black rectangles and text bounds
5. **Flag Risks**: Reports pages where overlaps exceed minimum thresholds

### Heuristic Limitations

This tool uses **heuristic detection** and has limitations:

- **False Positives**: May flag legitimate design elements (borders, headers, decorative boxes)
- **False Negatives**: May miss:
  - Non-rectangular redaction shapes
  - Non-black colors used for redaction
  - Redactions using image overlays instead of vector shapes
  - Text rendered as images
- **No Content Verification**: Cannot determine if underlying text is actually sensitive

**Always manually verify flagged pages** before taking action.

---

## Example Output

### Text Format
```
================================================================================
PDF OVERLAY REDACTION RISK CHECKER - REPORT
================================================================================

SECURITY NOTICE: This tool detects risk indicators only.
It does NOT extract or display any redacted content.

Total PDFs scanned: 2
Total pages scanned: 15
PDFs with potential risks: 1
Total pages flagged: 3
PDFs with errors: 0

--------------------------------------------------------------------------------

File: document1.pdf
  Total pages: 10
  Status: 3 page(s) flagged

  Flagged pages:
    Page 2: 1 black rect(s), 5 overlap(s) detected
    Page 5: 2 black rect(s), 3 overlap(s) detected
    Page 8: 1 black rect(s), 1 overlap(s) detected

File: document2.pdf
  Total pages: 5
  Status: No risks detected

================================================================================
REMINDER: These are heuristic findings. Manual verification required.
================================================================================
```

### JSON Format
```json
{
  "tool": "PDF Overlay Redaction Risk Checker",
  "security_notice": "This tool detects risk indicators only...",
  "summary": {
    "total_pdfs": 1,
    "total_pages": 10,
    "pdfs_with_risks": 1,
    "total_flagged_pages": 2
  },
  "reports": [
    {
      "filename": "document.pdf",
      "total_pages": 10,
      "error": null,
      "flagged_pages": [
        {
          "page_number": 2,
          "black_rect_count": 1,
          "overlap_count": 5,
          "heuristic": "black_fill_rect_overlap_text"
        }
      ]
    }
  ]
}
```

---

## Testing

### Run Unit Tests

```bash
cd tests
python test_overlay_audit.py
```

The test suite includes:
- Color detection tests (black vs non-black)
- Geometric overlap computation tests
- Overlap detection logic tests
- Data structure tests

All tests use synthetic `fitz.Rect` objects and do not require PDF files.

---

## Project Structure

```
redactedfiles/
├── overlay_checker.py          # CLI entry point
├── pdf_overlay_audit.py        # Core library functions
├── tests/
│   └── test_overlay_audit.py   # Unit tests
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

---

## Use Cases

### Legitimate Use Cases ✅
- Security audits of internal documents
- Compliance checking before public release
- Quality assurance for redaction processes
- Educational demonstrations of PDF security risks

### Prohibited Use Cases ❌
- Unauthorized access to redacted information
- Extraction of classified or sensitive content
- Circumventing legitimate privacy protections
- Any use violating applicable laws or regulations

---

## Troubleshooting

### Common Issues

**"PDF is encrypted and requires a password"**
- The PDF is password-protected. You must decrypt it first or provide authentication.

**"Invalid or corrupt PDF"**
- The file may be damaged or not a valid PDF. Try opening it in a PDF viewer to verify.

**"Permission denied"**
- Check file permissions. On Windows, ensure the file is not open in another program.

**No risks detected but manual inspection shows redactions:**
- Increase sensitivity with `--black-threshold 0.25` or decrease `--min-overlap-area 2.0`
- Some redactions may use non-black colors or image-based techniques

**Many false positives:**
- Increase thresholds: `--min-overlap-area 10.0 --min-hits 3`
- Adjust black threshold to be more strict: `--black-threshold 0.10`

---

## Performance Considerations

- **Large PDFs**: Processing time scales with page count and complexity
- **Optimization**: Tool uses early exit strategies and pre-filtering
- **Memory**: Processes one page at a time to minimize memory usage
- **Batch Processing**: For large directories, consider using `--recursive` with targeted paths

---

## Contributing

This is a security tool. Contributions should:
1. Maintain the "no content extraction" principle
2. Include appropriate security warnings
3. Add test coverage for new features
4. Follow Python best practices (type hints, docstrings)

---

## License

This tool is provided for educational and authorized security auditing purposes only.

---

## Disclaimer

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.**

The authors and contributors:
- Make no guarantees about detection accuracy
- Are not responsible for misuse or unauthorized access
- Assume no liability for damages resulting from use of this tool
- Strongly recommend manual verification of all findings

**Use responsibly and ethically. Respect privacy and legal boundaries.**

---

## References

- **PyMuPDF Documentation**: https://pymupdf.readthedocs.io/
- **PDF Reference (ISO 32000)**: https://www.iso.org/standard/75839.html
- **NIST Guidelines for Media Sanitization**: https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final

---

## Contact & Support

For security concerns or responsible disclosure of vulnerabilities in this tool, please follow responsible disclosure practices.

For usage questions, refer to this README and the built-in help:
```bash
python overlay_checker.py --help
```
