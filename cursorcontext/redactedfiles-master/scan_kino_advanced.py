#!/usr/bin/env python3
"""
Scan all Kino documents with advanced security audit.
"""

import csv
import sys
from pathlib import Path
from pdf_security_audit_advanced import audit_pdf_advanced, AdvancedSecurityFindings

def main():
    """Scan all PDFs in kino_documents folder."""
    
    kino_dir = Path("kino_documents")
    
    if not kino_dir.exists():
        print(f"Error: {kino_dir} directory not found", file=sys.stderr)
        return 1
    
    # Find all PDFs
    pdf_files = sorted(list(kino_dir.glob("*.pdf")))
    
    if not pdf_files:
        print(f"Error: No PDF files found in {kino_dir}", file=sys.stderr)
        return 1
    
    print(f"=" * 80)
    print(f"ADVANCED SECURITY SCAN - KINO DOCUMENTS")
    print(f"=" * 80)
    print(f"Found {len(pdf_files)} PDF files to scan\n")
    
    results = []
    
    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] Scanning: {pdf_path.name}...", end=" ")
        sys.stdout.flush()
        
        try:
            findings = audit_pdf_advanced(pdf_path)
            results.append((pdf_path.name, findings))
            
            # Show risk level
            if findings.risk_score >= 70:
                print(f"HIGH RISK ({findings.risk_score})")
            elif findings.risk_score >= 40:
                print(f"MEDIUM RISK ({findings.risk_score})")
            else:
                print(f"LOW RISK ({findings.risk_score})")
                
        except Exception as e:
            print(f"ERROR: {e}")
            results.append((pdf_path.name, None))
    
    # Generate CSV report
    print(f"\n{'=' * 80}")
    print("GENERATING CSV REPORT")
    print('=' * 80)
    
    output_csv = Path("kino_advanced_security_audit.csv")
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'filename',
            'risk_score',
            'has_metadata',
            'metadata_keys',
            'has_hidden_text',
            'hidden_text_types',
            'white_on_white_pages',
            'offpage_text_pages',
            'overlay_risk',
            'has_attachments',
            'attachment_count',
            'attachment_names',
            'has_annotations',
            'annotation_count',
            'annotation_types',
            'has_forms',
            'form_field_count',
            'reviewer_names',
            'has_ocr_layer',
            'is_scanned',
            'ocr_pages_count',
            'has_javascript',
            'javascript_count',
            'has_external_links',
            'external_url_count',
            'external_urls',
            'has_remote_resources',
            'has_signatures',
            'signature_count',
            'signer_names',
            'has_layers',
            'layer_count',
            'incremental_updates',
            'version_count',
            'has_structure_tags',
            'has_alt_text',
            'has_watermarks',
            'has_actions',
            'has_thumbnails',
            'notes',
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for filename, findings in results:
            if findings is None:
                row = {'filename': filename, 'notes': 'Error during scan'}
            else:
                row = {
                    'filename': filename,
                    'risk_score': findings.risk_score,
                    'has_metadata': 'YES' if findings.has_metadata else 'NO',
                    'metadata_keys': len(findings.metadata_keys),
                    'has_hidden_text': 'YES' if findings.has_hidden_text else 'NO',
                    'hidden_text_types': ', '.join(findings.hidden_text_types) if findings.hidden_text_types else '',
                    'white_on_white_pages': ', '.join(map(str, findings.white_on_white_pages)) if findings.white_on_white_pages else '',
                    'offpage_text_pages': ', '.join(map(str, findings.offpage_text_pages)) if findings.offpage_text_pages else '',
                    'overlay_risk': findings.overlay_risk,
                    'has_attachments': 'YES' if findings.has_attachments else 'NO',
                    'attachment_count': findings.attachment_count,
                    'attachment_names': ', '.join(findings.attachment_names) if findings.attachment_names else '',
                    'has_annotations': 'YES' if findings.has_annotations else 'NO',
                    'annotation_count': findings.annotation_count,
                    'annotation_types': ', '.join(findings.annotation_types) if findings.annotation_types else '',
                    'has_forms': 'YES' if findings.has_forms else 'NO',
                    'form_field_count': findings.form_field_count,
                    'reviewer_names': ', '.join(findings.reviewer_names) if findings.reviewer_names else '',
                    'has_ocr_layer': 'YES' if findings.has_ocr_layer else 'NO',
                    'is_scanned': 'YES' if findings.is_scanned else 'NO',
                    'ocr_pages_count': len(findings.ocr_pages),
                    'has_javascript': 'YES' if findings.has_javascript else 'NO',
                    'javascript_count': findings.javascript_count,
                    'has_external_links': 'YES' if findings.has_external_links else 'NO',
                    'external_url_count': len(findings.external_urls),
                    'external_urls': '; '.join(findings.external_urls[:5]) if findings.external_urls else '',  # First 5 only
                    'has_remote_resources': 'YES' if findings.has_remote_resources else 'NO',
                    'has_signatures': 'YES' if findings.has_signatures else 'NO',
                    'signature_count': findings.signature_count,
                    'signer_names': ', '.join(findings.signer_names) if findings.signer_names else '',
                    'has_layers': 'YES' if findings.has_layers else 'NO',
                    'layer_count': findings.layer_count,
                    'incremental_updates': 'YES' if findings.incremental_updates else 'NO',
                    'version_count': findings.version_count,
                    'has_structure_tags': 'YES' if findings.has_structure_tags else 'NO',
                    'has_alt_text': 'YES' if findings.has_alt_text else 'NO',
                    'has_watermarks': 'YES' if findings.has_watermarks else 'NO',
                    'has_actions': 'YES' if findings.has_actions else 'NO',
                    'has_thumbnails': 'YES' if findings.has_thumbnails else 'NO',
                    'notes': '; '.join(findings.notes) if findings.notes else '',
                }
            
            writer.writerow(row)
    
    print(f"\n[OK] Saved to: {output_csv.absolute()}")
    
    # Generate summary statistics
    print(f"\n{'=' * 80}")
    print("SUMMARY STATISTICS")
    print('=' * 80)
    
    valid_findings = [f for _, f in results if f is not None]
    
    if valid_findings:
        high_risk = sum(1 for f in valid_findings if f.risk_score >= 70)
        medium_risk = sum(1 for f in valid_findings if 40 <= f.risk_score < 70)
        low_risk = sum(1 for f in valid_findings if f.risk_score < 40)
        
        print(f"Total PDFs scanned: {len(valid_findings)}")
        print(f"  HIGH RISK (70+):   {high_risk} ({high_risk*100//len(valid_findings)}%)")
        print(f"  MEDIUM RISK (40-69): {medium_risk} ({medium_risk*100//len(valid_findings)}%)")
        print(f"  LOW RISK (<40):    {low_risk} ({low_risk*100//len(valid_findings)}%)")
        print()
        
        # Issue counts
        with_metadata = sum(1 for f in valid_findings if f.has_metadata)
        with_hidden_text = sum(1 for f in valid_findings if f.has_hidden_text)
        with_attachments = sum(1 for f in valid_findings if f.has_attachments)
        with_annotations = sum(1 for f in valid_findings if f.has_annotations)
        with_forms = sum(1 for f in valid_findings if f.has_forms)
        with_ocr = sum(1 for f in valid_findings if f.has_ocr_layer)
        with_javascript = sum(1 for f in valid_findings if f.has_javascript)
        with_links = sum(1 for f in valid_findings if f.has_external_links)
        with_signatures = sum(1 for f in valid_findings if f.has_signatures)
        with_incremental = sum(1 for f in valid_findings if f.incremental_updates)
        
        print("Issue Breakdown:")
        print(f"  Metadata:           {with_metadata}")
        print(f"  Hidden Text:        {with_hidden_text}")
        print(f"  Attachments:        {with_attachments}")
        print(f"  Annotations:        {with_annotations}")
        print(f"  Forms:              {with_forms}")
        print(f"  OCR Layers:         {with_ocr}")
        print(f"  JavaScript:         {with_javascript}")
        print(f"  External Links:     {with_links}")
        print(f"  Digital Signatures: {with_signatures}")
        print(f"  Incremental Updates: {with_incremental}")
        
        # Top 10 highest risk files
        print(f"\n{'=' * 80}")
        print("TOP 10 HIGHEST RISK FILES")
        print('=' * 80)
        
        sorted_results = sorted([(name, f) for name, f in results if f is not None], 
                               key=lambda x: x[1].risk_score, reverse=True)
        
        for i, (name, findings) in enumerate(sorted_results[:10], 1):
            print(f"{i:2d}. {name:50s} Risk: {findings.risk_score:3d}")
    
    print(f"\n{'=' * 80}")
    print("SCAN COMPLETE")
    print('=' * 80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
