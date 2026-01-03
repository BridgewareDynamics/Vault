"""
Advanced Security Scanner for Epstein Court Records
Scans PDFs in epstein_court_records/file directory with comprehensive 12-point security audit
"""

import os
import sys
from pathlib import Path
import csv
import time
from pdf_security_audit_advanced import audit_pdf_advanced

# ANSI Color Codes
class Color:
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

def scan_directory(pdf_dir: str, output_csv: str):
    """Scan all PDFs in directory with advanced security audit"""
    
    pdf_dir = Path(pdf_dir)
    if not pdf_dir.exists():
        print(f"Error: Directory not found: {pdf_dir}")
        return
    
    # Get all PDF files
    pdf_files = sorted([f for f in pdf_dir.iterdir() if f.suffix.lower() == '.pdf'])
    total = len(pdf_files)
    
    if total == 0:
        print(f"No PDF files found in {pdf_dir}")
        return
    
    print(f"\n{'='*80}")
    print(f"ADVANCED SECURITY SCAN - EPSTEIN COURT RECORDS")
    print(f"{'='*80}")
    print(f"Directory: {pdf_dir}")
    print(f"Total PDFs: {total}")
    print(f"Output CSV: {output_csv}")
    print(f"{'='*80}\n")
    
    # ASCII Banner
    print(f"\n{Color.CYAN}" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + "  ██████╗ ██████╗ ███████╗    ███████╗███████╗ ██████╗██╗   ██╗██████╗ ".center(78) + "█")
    print("█" + "  ██╔══██╗██╔══██╗██╔════╝    ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗".center(78) + "█")
    print("█" + "  ██████╔╝██║  ██║█████╗      ███████╗█████╗  ██║     ██║   ██║██████╔╝".center(78) + "█")
    print("█" + "  ██╔═══╝ ██║  ██║██╔══╝      ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗".center(78) + "█")
    print("█" + "  ██║     ██████╔╝██║         ███████║███████╗╚██████╗╚██████╔╝██║  ██║".center(78) + "█")
    print("█" + "  ╚═╝     ╚═════╝ ╚═╝         ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝".center(78) + "█")
    print("█" + " "*78 + "█")
    print("█" + f"        {Color.BOLD}ADVANCED FORENSIC SECURITY SCANNER v2.0{Color.RESET}{Color.CYAN}".center(88) + "█")
    print("█" + "        Epstein Court Records - 12-Point Security Audit".center(78) + "█")
    print("█" + " "*78 + "█")
    print("█"*80 + Color.RESET)
    print(f"\n{Color.BLUE}[>]{Color.RESET} TARGET: {Color.WHITE}{pdf_dir}{Color.RESET}")
    print(f"{Color.BLUE}[>]{Color.RESET} CORPUS SIZE: {Color.WHITE}{total}{Color.RESET} documents")
    print(f"{Color.BLUE}[>]{Color.RESET} OUTPUT STREAM: {Color.WHITE}{output_csv}{Color.RESET}")
    print(f"{Color.BLUE}[>]{Color.RESET} INITIATING DEEP SCAN...\n")
    print(f"{Color.GRAY}" + "─"*80 + Color.RESET)
    
    results = []
    stats = {
        'total': total,
        'high_risk': 0,
        'medium_risk': 0,
        'low_risk': 0,
        'errors': 0,
        'metadata': 0,
        'hidden_text': 0,
        'attachments': 0,
        'annotations': 0,
        'forms': 0,
        'ocr': 0,
        'javascript': 0,
        'links': 0,
        'signatures': 0,
        'incremental': 0
    }
    
    start_time = time.time()
    
    for i, pdf_path in enumerate(pdf_files, 1):
        filename = pdf_path.name
        
        # Progress bar
        pct = (i / total) * 100
        bar_len = 40
        filled = int(bar_len * i / total)
        bar = f"{Color.GREEN}{'█' * filled}{Color.GRAY}{'░' * (bar_len - filled)}{Color.RESET}"
        
        # Calculate speed and ETA
        elapsed = time.time() - start_time
        if i > 1:
            speed = i / elapsed
            eta = (total - i) / speed
            eta_str = f"{int(eta//60)}m{int(eta%60):02d}s"
        else:
            speed = 0
            eta_str = "calculating..."
        
        # Print progress line with colors
        print(f"\r[{bar}] {Color.CYAN}{pct:5.1f}%{Color.RESET} | {Color.WHITE}{i:4d}/{total}{Color.RESET} | {Color.MAGENTA}{speed:.1f} doc/s{Color.RESET} | ETA: {Color.YELLOW}{eta_str}{Color.RESET} | {Color.RED}H:{stats['high_risk']}{Color.RESET} {Color.YELLOW}M:{stats['medium_risk']}{Color.RESET} {Color.GREEN}L:{stats['low_risk']}{Color.RESET}", end='', flush=True)
        
        try:
            # Run advanced security audit
            findings = audit_pdf_advanced(str(pdf_path))
            
            # Calculate risk level from score
            if findings.risk_score >= 40:
                risk_level = 'HIGH'
                stats['high_risk'] += 1
            elif findings.risk_score >= 20:
                risk_level = 'MEDIUM'
                stats['medium_risk'] += 1
            else:
                risk_level = 'LOW'
                stats['low_risk'] += 1
            
            if findings.has_metadata:
                stats['metadata'] += 1
            if findings.has_hidden_text:
                stats['hidden_text'] += 1
            if findings.has_attachments:
                stats['attachments'] += 1
            if findings.has_annotations:
                stats['annotations'] += 1
            if findings.has_forms:
                stats['forms'] += 1
            if findings.has_ocr_layer:
                stats['ocr'] += 1
            if findings.has_javascript:
                stats['javascript'] += 1
            if findings.has_external_links:
                stats['links'] += 1
            if findings.has_signatures:
                stats['signatures'] += 1
            if findings.incremental_updates:
                stats['incremental'] += 1
            
            # Log findings for this file with colors
            findings_list = []
            if findings.has_metadata: findings_list.append(f"{Color.BLUE}Meta:{len(findings.metadata_keys)}{Color.RESET}")
            if findings.has_hidden_text: findings_list.append(f"{Color.RED}Hidden:{','.join(findings.hidden_text_types)}{Color.RESET}")
            if findings.has_javascript: findings_list.append(f"{Color.MAGENTA}JS:{findings.javascript_count}{Color.RESET}")
            if findings.has_signatures: findings_list.append(f"{Color.YELLOW}Sig:{findings.signature_count}{Color.RESET}")
            if findings.has_external_links: findings_list.append(f"{Color.CYAN}URLs:{len(findings.external_urls)}{Color.RESET}")
            if findings.has_attachments: findings_list.append(f"{Color.GREEN}Attach:{findings.attachment_count}{Color.RESET}")
            if findings.has_annotations: findings_list.append(f"{Color.GRAY}Anno:{findings.annotation_count}{Color.RESET}")
            if findings.has_forms: findings_list.append(f"{Color.WHITE}Forms:{findings.form_field_count}{Color.RESET}")
            if findings.incremental_updates: findings_list.append(f"{Color.DIM}Incr:{findings.version_count}{Color.RESET}")
            
            # Print detailed log for non-LOW risk files or files with interesting findings
            if risk_level != 'LOW' or findings_list:
                print(f"\r{'':120}\r", end='')  # Clear line
                findings_str = ' | '.join(findings_list) if findings_list else f'{Color.GREEN}clean{Color.RESET}'
                
                # Color code risk level
                if risk_level == 'HIGH':
                    risk_color = f"{Color.RED}{Color.BOLD}{risk_level}{Color.RESET}"
                elif risk_level == 'MEDIUM':
                    risk_color = f"{Color.YELLOW}{risk_level}{Color.RESET}"
                else:
                    risk_color = f"{Color.GREEN}{risk_level}{Color.RESET}"
                
                print(f"{Color.GRAY}[{i:4d}]{Color.RESET} {risk_color:6s} {Color.DIM}({findings.risk_score:3.0f}){Color.RESET} | {Color.WHITE}{filename[:45]:<45s}{Color.RESET} | {findings_str}")
                print(f"[{bar}] {Color.CYAN}{pct:5.1f}%{Color.RESET} | {Color.WHITE}{i:4d}/{total}{Color.RESET} | {Color.MAGENTA}{speed:.1f} doc/s{Color.RESET} | ETA: {Color.YELLOW}{eta_str}{Color.RESET} | {Color.RED}H:{stats['high_risk']}{Color.RESET} {Color.YELLOW}M:{stats['medium_risk']}{Color.RESET} {Color.GREEN}L:{stats['low_risk']}{Color.RESET}", end='', flush=True)
            
            # Store result
            results.append({
                'filename': filename,
                'risk_score': findings.risk_score,
                'risk_level': risk_level,
                'has_metadata': 'YES' if findings.has_metadata else 'NO',
                'metadata_count': len(findings.metadata_keys),
                'metadata_keys': ', '.join(findings.metadata_keys) if findings.metadata_keys else '',
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
                'external_urls': ', '.join(findings.external_urls[:5]) if findings.external_urls else '',
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
                'notes': '; '.join(findings.notes) if findings.notes else ''
            })
            
        except Exception as e:
            stats['errors'] += 1
            # Clear progress line and show detailed error
            print(f"\r{'':120}\r", end='')  # Clear line
            print(f"{Color.GRAY}[{i:4d}]{Color.RESET} {Color.RED}{Color.BOLD}⚠️  ERROR{Color.RESET} | {Color.WHITE}{filename[:45]:<45s}{Color.RESET} | {Color.RED}{type(e).__name__}{Color.RESET}: {Color.GRAY}{str(e)[:60]}{Color.RESET}")
            print(f"[{bar}] {Color.CYAN}{pct:5.1f}%{Color.RESET} | {Color.WHITE}{i:4d}/{total}{Color.RESET} | {Color.MAGENTA}{speed:.1f} doc/s{Color.RESET} | ETA: {Color.YELLOW}{eta_str}{Color.RESET} | {Color.RED}H:{stats['high_risk']}{Color.RESET} {Color.YELLOW}M:{stats['medium_risk']}{Color.RESET} {Color.GREEN}L:{stats['low_risk']}{Color.RESET}", end='', flush=True)
            results.append({
                'filename': filename,
                'risk_score': 0,
                'has_metadata': 'NO',
                'metadata_count': 0,
                'metadata_keys': '',
                'has_hidden_text': 'NO',
                'hidden_text_types': '',
                'white_on_white_pages': '',
                'offpage_text_pages': '',
                'overlay_risk': 'ERROR',
                'has_attachments': 'NO',
                'attachment_count': 0,
                'attachment_names': '',
                'has_annotations': 'NO',
                'annotation_count': 0,
                'annotation_types': '',
                'has_forms': 'NO',
                'form_field_count': 0,
                'reviewer_names': '',
                'has_ocr_layer': 'NO',
                'is_scanned': 'NO',
                'ocr_pages_count': 0,
                'has_javascript': 'NO',
                'javascript_count': 0,
                'has_external_links': 'NO',
                'external_url_count': 0,
                'external_urls': '',
                'has_remote_resources': 'NO',
                'has_signatures': 'NO',
                'signature_count': 0,
                'signer_names': '',
                'has_layers': 'NO',
                'layer_count': 0,
                'incremental_updates': 'NO',
                'version_count': 0,
                'has_structure_tags': 'NO',
                'has_alt_text': 'NO',
                'has_watermarks': 'NO',
                'has_actions': 'NO',
                'has_thumbnails': 'NO',
                'notes': f'ERROR: {str(e)}'
            })
    
    # Clear progress line
    print("\r" + " "*120 + "\r", end='')
    
    # Write CSV
    print(f"\n{Color.GRAY}" + "─"*80 + Color.RESET)
    print(f"\n{Color.BLUE}[>]{Color.RESET} Writing output to CSV...")
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        if results:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)
    
    # Final stats
    elapsed_total = time.time() - start_time
    print(f"\n{Color.GREEN}{Color.BOLD}[✓] SCAN COMPLETE{Color.RESET}")
    print(f"{Color.BLUE}[>]{Color.RESET} Processing Time: {Color.WHITE}{int(elapsed_total//60)}m {int(elapsed_total%60)}s{Color.RESET}")
    print(f"{Color.BLUE}[>]{Color.RESET} Throughput: {Color.WHITE}{stats['total']/elapsed_total:.2f}{Color.RESET} documents/second")
    print(f"\n{Color.BOLD}[THREAT ASSESSMENT]{Color.RESET}")
    print(f"  ├─ {Color.RED}HIGH RISK:{Color.RESET}     {Color.WHITE}{stats['high_risk']:4d}{Color.RESET} documents ({stats['high_risk']/stats['total']*100:.1f}%)")
    print(f"  ├─ {Color.YELLOW}MEDIUM RISK:{Color.RESET}   {Color.WHITE}{stats['medium_risk']:4d}{Color.RESET} documents ({stats['medium_risk']/stats['total']*100:.1f}%)")
    print(f"  └─ {Color.GREEN}LOW RISK:{Color.RESET}      {Color.WHITE}{stats['low_risk']:4d}{Color.RESET} documents ({stats['low_risk']/stats['total']*100:.1f}%)")
    print(f"\n{Color.BOLD}[SECURITY FINDINGS]{Color.RESET}")
    print(f"  ├─ Metadata:      {Color.CYAN}{stats['metadata']:4d}{Color.RESET} documents")
    print(f"  ├─ Hidden Text:   {Color.CYAN}{stats['hidden_text']:4d}{Color.RESET} documents")
    print(f"  ├─ JavaScript:    {Color.CYAN}{stats['javascript']:4d}{Color.RESET} documents")
    print(f"  ├─ Signatures:    {Color.CYAN}{stats['signatures']:4d}{Color.RESET} documents")
    print(f"  ├─ Ext. Links:    {Color.CYAN}{stats['links']:4d}{Color.RESET} documents")
    print(f"  ├─ Attachments:   {Color.CYAN}{stats['attachments']:4d}{Color.RESET} documents")
    print(f"  ├─ Annotations:   {Color.CYAN}{stats['annotations']:4d}{Color.RESET} documents")
    print(f"  ├─ Form Fields:   {Color.CYAN}{stats['forms']:4d}{Color.RESET} documents")
    print(f"  ├─ OCR Layer:     {Color.CYAN}{stats['ocr']:4d}{Color.RESET} documents")
    print(f"  └─ Incremental:   {Color.CYAN}{stats['incremental']:4d}{Color.RESET} documents")
    
    # Show top 10 highest risk files
    if results:
        sorted_results = sorted(results, key=lambda x: x['risk_score'], reverse=True)
        print(f"\n{Color.BOLD}[TOP 10 HIGHEST RISK FILES]{Color.RESET}")
        for i, r in enumerate(sorted_results[:10], 1):
            # Color code by risk level
            if r['risk_level'] == 'HIGH':
                risk_display = f"{Color.RED}{Color.BOLD}{r['risk_level']}{Color.RESET}"
            elif r['risk_level'] == 'MEDIUM':
                risk_display = f"{Color.YELLOW}{r['risk_level']}{Color.RESET}"
            else:
                risk_display = f"{Color.GREEN}{r['risk_level']}{Color.RESET}"
            
            print(f"  {Color.GRAY}{i:2d}.{Color.RESET} {Color.WHITE}{r['filename'][:50]:<50s}{Color.RESET} Risk: {Color.CYAN}{r['risk_score']:3.0f}{Color.RESET} ({risk_display})")
    
    print(f"\n{Color.BLUE}[>]{Color.RESET} Output saved to: {Color.WHITE}{output_csv}{Color.RESET}")
    print(f"\n{Color.CYAN}" + "█"*80 + f"{Color.RESET}\n")

if __name__ == "__main__":
    # Configuration
    pdf_directory = r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file"
    output_csv = r"C:\Users\vhalan\Desktop\redactedfiles\court_records_advanced_security_audit.csv"
    
    scan_directory(pdf_directory, output_csv)
    print("Scan complete!")
