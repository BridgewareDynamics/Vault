#!/usr/bin/env python3
"""
Wrapper script for The Vault File Security Checker.
Outputs JSON for Node.js integration.
"""
import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    import pdf_overlay_audit as audit
    from pdf_security_audit_advanced import audit_pdf_advanced
except ImportError as e:
    print(json.dumps({
        "error": f"Python dependencies missing: {e}. Please install: pip install pymupdf",
        "reports": []
    }), file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "PDF path required",
            "reports": []
        }), file=sys.stderr)
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    
    # Parse options
    black_threshold = 0.15
    min_overlap_area = 4.0
    min_hits = 1
    include_security = True

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == '--black-threshold':
            black_threshold = float(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--min-overlap-area':
            min_overlap_area = float(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--min-hits':
            min_hits = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--no-security-audit':
            include_security = False
            i += 1
        elif sys.argv[i] == '--json':
            i += 1
        else:
            i += 1

    try:
        print("PROGRESS:Validating PDF file...", file=sys.stderr, flush=True)
        # Validate PDF path exists
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        print("PROGRESS:Starting overlay redaction analysis...", file=sys.stderr, flush=True)
        # Run overlay audit
        report = audit.audit_pdf(
            pdf_path,
            black_threshold=black_threshold,
            min_overlap_area=min_overlap_area,
            min_hits=min_hits
        )

        # Run advanced security audit if requested
        security_findings = None
        if include_security:
            try:
                print("PROGRESS:Running advanced security and privacy audit...", file=sys.stderr, flush=True)
                security_findings = audit_pdf_advanced(pdf_path)
                # Set overlay risk based on overlay audit results
                if report.flagged_pages:
                    security_findings.overlay_risk = "YES"
                elif len(report.flagged_pages) == 0 and report.total_pages > 0:
                    security_findings.overlay_risk = "NO"
                print("PROGRESS:Advanced security audit complete.", file=sys.stderr, flush=True)
            except Exception as e:
                # Security audit failure shouldn't break the whole process
                # But log it for debugging
                print(f"Security audit warning: {e}", file=sys.stderr)
                # Create a minimal findings object with error note
                from pdf_security_audit_advanced import AdvancedSecurityFindings
                security_findings = AdvancedSecurityFindings()
                security_findings.notes.append(f"Security audit error: {type(e).__name__}")
        
        print("PROGRESS:Generating report...", file=sys.stderr, flush=True)

        # Format output
        output = {
            "tool": "PDF Overlay Redaction Risk Checker",
            "summary": {
                "total_pdfs": 1,
                "total_pages": report.total_pages,
                "pdfs_with_risks": 1 if report.flagged_pages else 0,
                "total_flagged_pages": len(report.flagged_pages)
            },
            "reports": [{
                "filename": report.filename,
                "total_pages": report.total_pages,
                "error": report.error,
                "flagged_pages": [{
                    "page_number": p.page_number,
                    "black_rect_count": p.black_rect_count,
                    "overlap_count": p.overlap_count,
                    "confidence_score": p.confidence_score,
                    "heuristic": p.heuristic
                } for p in report.flagged_pages]
            }]
        }

        # Add advanced security findings if available
        if security_findings:
            output["reports"][0]["security"] = {
                # Basic checks
                "has_metadata": security_findings.has_metadata,
                "metadata_keys": security_findings.metadata_keys,
                "metadata_details": security_findings.metadata_details,
                "has_attachments": security_findings.has_attachments,
                "attachment_count": security_findings.attachment_count,
                "attachment_names": security_findings.attachment_names,
                "has_annotations": security_findings.has_annotations,
                "annotation_count": security_findings.annotation_count,
                "annotation_types": security_findings.annotation_types,
                "has_forms": security_findings.has_forms,
                "form_field_count": security_findings.form_field_count,
                "has_layers": security_findings.has_layers,
                "layer_count": security_findings.layer_count,
                "has_javascript": security_findings.has_javascript,
                "javascript_count": security_findings.javascript_count,
                "has_actions": security_findings.has_actions,
                "has_thumbnails": security_findings.has_thumbnails,
                "incremental_updates": security_findings.incremental_updates,
                "version_count": security_findings.version_count,
                # Advanced checks
                "has_hidden_text": security_findings.has_hidden_text,
                "hidden_text_types": security_findings.hidden_text_types,
                "white_on_white_pages": security_findings.white_on_white_pages,
                "offpage_text_pages": security_findings.offpage_text_pages,
                "overlay_risk": security_findings.overlay_risk,
                "reviewer_names": security_findings.reviewer_names,
                "has_ocr_layer": security_findings.has_ocr_layer,
                "ocr_pages": security_findings.ocr_pages,
                "is_scanned": security_findings.is_scanned,
                "has_external_links": security_findings.has_external_links,
                "external_urls": security_findings.external_urls,
                "has_remote_resources": security_findings.has_remote_resources,
                "has_signatures": security_findings.has_signatures,
                "signature_count": security_findings.signature_count,
                "signer_names": security_findings.signer_names,
                "has_structure_tags": security_findings.has_structure_tags,
                "has_alt_text": security_findings.has_alt_text,
                "has_watermarks": security_findings.has_watermarks,
                "risk_score": security_findings.risk_score,
                "notes": security_findings.notes
            }

        print(json.dumps(output))
        
    except FileNotFoundError as e:
        print(json.dumps({
            "error": str(e),
            "reports": []
        }), file=sys.stderr)
        sys.exit(1)
    except PermissionError as e:
        print(json.dumps({
            "error": f"Permission denied: {pdf_path}",
            "reports": []
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        # Provide detailed error information for debugging
        import traceback
        error_type = type(e).__name__
        error_message = str(e)
        
        # Log full traceback to stderr for debugging
        print(f"Full error traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        
        print(json.dumps({
            "error": f"{error_type}: {error_message}",
            "reports": []
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
