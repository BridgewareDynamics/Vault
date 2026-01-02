#!/usr/bin/env python3
"""
PDF Overlay Redaction Risk Checker - CLI Tool

A command-line tool to detect potential insecure overlay redactions in PDF files.

IMPORTANT SECURITY & ETHICAL NOTICE:
=====================================
This tool is designed SOLELY for security auditing and compliance checking.
It detects RISK INDICATORS of insecure redactions but does NOT:
  - Extract redacted content
  - Display redacted text
  - Save redacted information to disk or console

This tool only reports PAGE NUMBERS and overlap COUNTS to indicate potential risks.

LEGAL DISCLAIMER:
-----------------
- Detection does not prove that redactions are insecure
- This is a heuristic tool; false positives may occur
- Users are responsible for proper handling of sensitive documents
- Always verify findings manually before taking action

Usage examples:
  python overlay_checker.py input.pdf
  python overlay_checker.py /path/to/folder --recursive
  python overlay_checker.py input.pdf --json --output report.json
  python overlay_checker.py folder/ --csv --min-overlap-area 5.0
"""

import argparse
import json
import csv
import sys
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import pdf_overlay_audit as audit
from pdf_security_audit import audit_pdf_security, SecurityFindings, format_security_report


def format_text_report(reports: List[audit.PDFRiskReport], security_enabled: bool = True, pdf_paths: Optional[Dict[str, Path]] = None) -> str:
    """
    Format reports as human-readable text.
    
    Args:
        reports: List of PDFRiskReport objects
        security_enabled: Include security audit results
        pdf_paths: Mapping of filename to full path for security audit
    
    Returns:
        Formatted text string
    """
    if pdf_paths is None:
        pdf_paths = {}
    
    lines = []
    lines.append("=" * 80)
    lines.append("PDF OVERLAY REDACTION RISK CHECKER - REPORT")
    lines.append("=" * 80)
    lines.append("")
    lines.append("SECURITY NOTICE: This tool detects risk indicators only.")
    lines.append("It does NOT extract or display any redacted content.")
    lines.append("")
    
    total_pdfs = len(reports)
    total_pages = sum(r.total_pages for r in reports if not r.error)
    total_flagged_pages = sum(len(r.flagged_pages) for r in reports)
    pdfs_with_risks = sum(1 for r in reports if r.flagged_pages)
    pdfs_with_errors = sum(1 for r in reports if r.error)
    
    lines.append(f"Total PDFs scanned: {total_pdfs}")
    lines.append(f"Total pages scanned: {total_pages}")
    lines.append(f"PDFs with potential risks: {pdfs_with_risks}")
    lines.append(f"Total pages flagged: {total_flagged_pages}")
    lines.append(f"PDFs with errors: {pdfs_with_errors}")
    lines.append("")
    lines.append("-" * 80)
    
    # Report each PDF
    for report in reports:
        lines.append("")
        lines.append(f"File: {report.filename}")
        
        if report.error:
            lines.append(f"  ERROR: {report.error}")
            continue
        
        lines.append(f"  Total pages: {report.total_pages}")
        
        if not report.flagged_pages:
            lines.append("  Status: No risks detected")
        else:
            lines.append(f"  Status: {len(report.flagged_pages)} page(s) flagged")
            lines.append("")
            lines.append("  Flagged pages:")
            
            for risk in report.flagged_pages:
                lines.append(
                    f"    Page {risk.page_number}: "
                    f"{risk.black_rect_count} black rect(s), "
                    f"{risk.overlap_count} overlap(s) detected "
                    f"[confidence: {risk.confidence_score}]"
                )
        
        # Security findings for this file
        if security_enabled and not report.error:
            try:
                print(f"  Running security audit on {report.filename}...", file=sys.stderr)
                # Get full path for security audit
                full_path = pdf_paths.get(report.filename)
                if full_path and full_path.exists():
                    security = audit_pdf_security(full_path)
                    lines.append("")
                    lines.append("  Security & Privacy Findings:")
                    security_text = format_security_report(security, verbose=False)
                    for line in security_text.split('\n')[2:]:  # Skip header
                        if line.strip():
                            lines.append(f"    {line}")
                    print(f"  ✓ Security audit completed", file=sys.stderr)
                else:
                    lines.append("")
                    lines.append(f"  Security audit: File path not found")
            except Exception as e:
                print(f"  ⚠ Security audit failed: {e}", file=sys.stderr)
                lines.append("")
                lines.append(f"  Security audit: Error - {type(e).__name__}")
    
    lines.append("")
    lines.append("=" * 80)
    lines.append("REMINDER: These are heuristic findings. Manual verification required.")
    lines.append("=" * 80)
    
    return "\n".join(lines)


def format_json_report(reports: List[audit.PDFRiskReport]) -> str:
    """
    Format reports as JSON.
    
    Args:
        reports: List of PDFRiskReport objects
    
    Returns:
        JSON string
    """
    data = {
        "tool": "PDF Overlay Redaction Risk Checker",
        "security_notice": "This tool detects risk indicators only. No redacted content is extracted or displayed.",
        "disclaimer": "Findings are heuristic and may include false positives. Manual verification required.",
        "summary": {
            "total_pdfs": len(reports),
            "total_pages": sum(r.total_pages for r in reports if not r.error),
            "pdfs_with_risks": sum(1 for r in reports if r.flagged_pages),
            "total_flagged_pages": sum(len(r.flagged_pages) for r in reports),
            "pdfs_with_errors": sum(1 for r in reports if r.error)
        },
        "reports": []
    }
    
    for report in reports:
        report_data = {
            "filename": report.filename,
            "total_pages": report.total_pages,
            "error": report.error,
            "flagged_pages": []
        }
        
        for risk in report.flagged_pages:
            report_data["flagged_pages"].append({
                "page_number": risk.page_number,
                "black_rect_count": risk.black_rect_count,
                "overlap_count": risk.overlap_count,
                "confidence_score": risk.confidence_score,
                "heuristic": risk.heuristic
            })
        
        data["reports"].append(report_data)
    
    return json.dumps(data, indent=2)


def format_csv_report(reports: List[audit.PDFRiskReport], security_enabled: bool = True, pdf_paths: Optional[Dict[str, Path]] = None, risks_only: bool = False) -> str:
    """
    Format reports as CSV with security audit findings.
    
    Args:
        reports: List of PDFRiskReport objects
        security_enabled: Include security audit results
        pdf_paths: Mapping of filename to full path for security audit
        risks_only: Only include PDFs with security risks beyond metadata
    
    Returns:
        CSV string
    """
    if pdf_paths is None:
        pdf_paths = {}
    
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header with security columns
    writer.writerow([
        "filename",
        "total_pages",
        "overlay_risk",
        "flagged_pages",
        "removable_overlay",
        "has_metadata",
        "metadata_keys",
        "has_attachments",
        "attachment_count",
        "has_annotations",
        "annotation_count",
        "has_forms",
        "form_field_count",
        "has_layers",
        "layer_count",
        "has_javascript",
        "has_actions",
        "has_thumbnails",
        "incremental_updates",
        "security_notes",
        "error"
    ])
    
    # Data rows
    for report in reports:
        # Initialize security data
        sec_data = {
            "has_metadata": "N/A",
            "metadata_keys": "N/A",
            "has_attachments": "N/A",
            "attachment_count": "N/A",
            "has_annotations": "N/A",
            "annotation_count": "N/A",
            "has_forms": "N/A",
            "form_field_count": "N/A",
            "has_layers": "N/A",
            "layer_count": "N/A",
            "has_javascript": "N/A",
            "has_actions": "N/A",
            "has_thumbnails": "N/A",
            "incremental_updates": "N/A",
            "security_notes": ""
        }
        
        # Run security audit if enabled
        if security_enabled and not report.error:
            try:
                full_path = pdf_paths.get(report.filename)
                if full_path and full_path.exists():
                    security = audit_pdf_security(full_path)
                    sec_data = {
                        "has_metadata": "YES" if security.has_metadata else "NO",
                        "metadata_keys": str(len(security.metadata_keys)) if security.has_metadata else "0",
                        "has_attachments": "YES" if security.has_attachments else "NO",
                        "attachment_count": str(security.attachment_count),
                        "has_annotations": "YES" if security.has_annotations else "NO",
                        "annotation_count": str(security.annotation_count),
                        "has_forms": "YES" if security.has_forms else "NO",
                        "form_field_count": str(security.form_field_count),
                        "has_layers": "YES" if security.has_layers else "NO",
                        "layer_count": str(security.layer_count),
                        "has_javascript": "YES" if security.has_javascript else "NO",
                        "has_actions": "YES" if security.has_actions else "NO",
                        "has_thumbnails": "YES" if security.has_thumbnails else "NO",
                        "incremental_updates": "YES" if security.incremental_updates_suspected else "NO",
                        "security_notes": "; ".join(security.notes) if security.notes else ""
                    }
            except Exception as e:
                sec_data["security_notes"] = f"Security audit error: {type(e).__name__}"
        
        # Determine if overlay is removable (high confidence)
        removable_overlay = "N/A"
        if report.flagged_pages:
            # Check if any flagged page has high confidence (likely removable)
            high_conf_pages = [p for p in report.flagged_pages if p.confidence_score >= 0.7]
            if high_conf_pages:
                removable_overlay = "YES"
            else:
                removable_overlay = "MAYBE"
        
        # Filter for risks-only mode
        if risks_only:
            has_significant_risk = (
                report.flagged_pages or  # Has overlay risks
                sec_data["has_attachments"] == "YES" or
                sec_data["has_annotations"] == "YES" or
                sec_data["has_forms"] == "YES" or
                sec_data["has_layers"] == "YES" or
                sec_data["has_javascript"] == "YES" or
                sec_data["has_actions"] == "YES" or
                sec_data["has_thumbnails"] == "YES" or
                sec_data["incremental_updates"] == "YES"
            )
            if not has_significant_risk:
                continue  # Skip this PDF
        
        # Write row with all data
        writer.writerow([
            report.filename,
            report.total_pages,
            "YES" if report.flagged_pages else "NO",
            len(report.flagged_pages),
            removable_overlay,
            sec_data["has_metadata"],
            sec_data["metadata_keys"],
            sec_data["has_attachments"],
            sec_data["attachment_count"],
            sec_data["has_annotations"],
            sec_data["annotation_count"],
            sec_data["has_forms"],
            sec_data["form_field_count"],
            sec_data["has_layers"],
            sec_data["layer_count"],
            sec_data["has_javascript"],
            sec_data["has_actions"],
            sec_data["has_thumbnails"],
            sec_data["incremental_updates"],
            sec_data["security_notes"],
            report.error or ""
        ])
    
    return output.getvalue()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Detect potential insecure overlay redactions in PDFs (risk detection only - no content extraction)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s input.pdf
  %(prog)s /path/to/folder --recursive
  %(prog)s input.pdf --json --output report.json
  %(prog)s folder/ --csv --min-overlap-area 5.0 --black-threshold 0.2

IMPORTANT:
  This tool only detects risk indicators. It does NOT extract, display, or
  save any redacted content. All findings are heuristic and require manual
  verification.
        """
    )
    
    parser.add_argument(
        "input_path",
        type=str,
        help="Path to PDF file or directory to scan"
    )
    
    parser.add_argument(
        "--recursive", "-r",
        action="store_true",
        help="Recursively scan subdirectories (only applies to directory input)"
    )
    
    parser.add_argument(
        "--min-overlap-area",
        type=float,
        default=4.0,
        help="Minimum overlap area in square points to count as overlap (default: 4.0)"
    )
    
    parser.add_argument(
        "--black-threshold",
        type=float,
        default=0.15,
        help="Maximum RGB component value (0.0-1.0) to consider color as black (default: 0.15)"
    )
    
    parser.add_argument(
        "--min-hits",
        type=int,
        default=1,
        help="Minimum number of overlaps to flag a page (default: 1)"
    )    
    parser.add_argument(
        "--no-security-audit",
        action="store_true",
        help="Skip security and privacy audit (metadata, attachments, etc.)"
    )
    
    parser.add_argument(
        "--security-risks-only",
        action="store_true",
        help="CSV: Only include PDFs with security risks beyond metadata (attachments, annotations, forms, layers, JavaScript, thumbnails, incremental updates, or overlay risks)"
    )
    
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output report in JSON format"
    )
    
    parser.add_argument(
        "--csv",
        action="store_true",
        help="Output report in CSV format"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.black_threshold < 0.0 or args.black_threshold > 1.0:
        parser.error("--black-threshold must be between 0.0 and 1.0")
    
    if args.min_overlap_area < 0.0:
        parser.error("--min-overlap-area must be non-negative")
    
    if args.min_hits < 1:
        parser.error("--min-hits must be at least 1")
    
    if args.json and args.csv:
        parser.error("Cannot specify both --json and --csv")
    
    # Convert input path
    input_path = Path(args.input_path)
    
    if not input_path.exists():
        print(f"Error: Input path does not exist: {input_path}", file=sys.stderr)
        return 1
    
    # Audit parameters
    audit_kwargs = {
        "black_threshold": args.black_threshold,
        "min_overlap_area": args.min_overlap_area,
        "min_hits": args.min_hits
    }
    
    # Perform audit
    reports: List[audit.PDFRiskReport] = []
    pdf_paths = {}  # Map filename to full path for security audit
    
    if input_path.is_file():
        if input_path.suffix.lower() != ".pdf":
            print(f"Error: Input file must be a PDF: {input_path}", file=sys.stderr)
            return 1
        
        report = audit.audit_pdf(input_path, **audit_kwargs)
        reports.append(report)
        pdf_paths[report.filename] = input_path
    
    elif input_path.is_dir():
        reports = audit.audit_directory(input_path, args.recursive, **audit_kwargs)
        
        # Build path mapping for directory scans
        if args.recursive:
            pdf_files = list(input_path.rglob("*.pdf"))
        else:
            pdf_files = list(input_path.glob("*.pdf"))
        
        for pdf_file in pdf_files:
            pdf_paths[pdf_file.name] = pdf_file
        
        if not reports:
            print(f"Warning: No PDF files found in {input_path}", file=sys.stderr)
            return 0
    
    else:
        print(f"Error: Invalid input path: {input_path}", file=sys.stderr)
        return 1
    
    # Format output
    security_enabled = not args.no_security_audit
    
    if args.json:
        output_text = format_json_report(reports)
    elif args.csv:
        output_text = format_csv_report(reports, security_enabled=security_enabled, pdf_paths=pdf_paths, risks_only=args.security_risks_only)
        # Log count if filtering for risks only
        if args.security_risks_only:
            risk_count = output_text.count('\n') - 1  # Subtract header row
            print(f"Found {risk_count} PDF(s) with significant security risks (beyond metadata only)", file=sys.stderr)
    else:
        output_text = format_text_report(reports, security_enabled=security_enabled, pdf_paths=pdf_paths)
    
    # Write output
    if args.output:
        try:
            output_file = Path(args.output)
            output_file.write_text(output_text, encoding="utf-8")
            print(f"Report written to: {output_file}", file=sys.stderr)
        except Exception as e:
            print(f"Error writing output file: {e}", file=sys.stderr)
            return 1
    else:
        print(output_text)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
