"""
Extract detailed information from top MEDIUM RISK PDFs
"""

import fitz
import pikepdf
import pandas as pd
from pathlib import Path

# Read top 20 MEDIUM RISK files
df = pd.read_csv('medium_risk_top20.csv')
base_path = Path(r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file")

print("="*80)
print(f"DETAILED ANALYSIS OF TOP 20 MEDIUM RISK FILES")
print("="*80)
print()

results = []

for idx, row in df.iterrows():
    filename = row['filename']
    risk = row['risk_score']
    pdf_path = base_path / filename
    
    print(f"\n[{idx+1}/20] Risk: {risk:.0f} | {filename[:60]}")
    print("-"*80)
    
    if not pdf_path.exists():
        print("  ⚠️  File not found")
        continue
    
    details = {
        'filename': filename,
        'risk_score': risk,
        'metadata_items': [],
        'hidden_text_sample': None,
        'signature_count': 0,
        'annotation_count': 0,
        'form_fields': 0,
        'external_urls': [],
        'page_count': 0
    }
    
    try:
        # Open with PyMuPDF for text and annotations
        doc = fitz.open(str(pdf_path))
        details['page_count'] = len(doc)
        
        # Check for annotations
        annotation_count = 0
        for page in doc:
            annots = page.annots()
            if annots:
                annotation_count += len(list(annots))
        details['annotation_count'] = annotation_count
        
        # Sample text from first page
        if len(doc) > 0:
            first_page_text = doc[0].get_text()[:200]
            details['first_page_sample'] = first_page_text.replace('\n', ' ')[:100]
        
        doc.close()
        
        # Open with pikepdf for metadata, signatures, forms
        pdf = pikepdf.open(str(pdf_path))
        
        # Metadata
        if pdf.docinfo:
            for key, value in pdf.docinfo.items():
                if key not in ['/Producer', '/Creator', '/CreationDate', '/ModDate']:
                    details['metadata_items'].append(f"{key}: {value}")
        
        # Check for signatures
        if '/AcroForm' in pdf.Root:
            form = pdf.Root.AcroForm
            if '/Fields' in form:
                fields = form.Fields
                details['form_fields'] = len(fields)
                
                # Count signature fields
                sig_count = 0
                for field in fields:
                    if '/FT' in field and field.FT == '/Sig':
                        sig_count += 1
                details['signature_count'] = sig_count
        
        # Check for external URLs in annotations
        urls = set()
        for page in pdf.pages:
            if '/Annots' in page:
                for annot in page.Annots:
                    if '/A' in annot and '/URI' in annot.A:
                        urls.add(str(annot.A.URI))
        details['external_urls'] = list(urls)
        
        pdf.close()
        
        # Print summary
        if details['metadata_items']:
            print(f"  📋 Metadata: {len(details['metadata_items'])} items")
            for item in details['metadata_items'][:3]:
                print(f"     - {item[:70]}")
        
        if details['annotation_count'] > 0:
            print(f"  📝 Annotations: {details['annotation_count']}")
        
        if details['signature_count'] > 0:
            print(f"  ✍️  Signatures: {details['signature_count']} signature fields")
        
        if details['form_fields'] > 0:
            print(f"  📄 Form Fields: {details['form_fields']}")
        
        if details['external_urls']:
            print(f"  🔗 External URLs: {len(details['external_urls'])}")
            for url in details['external_urls'][:2]:
                print(f"     - {url[:70]}")
        
        print(f"  📃 Pages: {details['page_count']}")
        
        results.append(details)
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        continue

print("\n" + "="*80)
print("SUMMARY OF FINDINGS")
print("="*80)

if results:
    total_metadata = sum(len(r['metadata_items']) for r in results)
    total_annots = sum(r['annotation_count'] for r in results)
    total_sigs = sum(r['signature_count'] for r in results)
    total_forms = sum(r['form_fields'] for r in results)
    total_urls = sum(len(r['external_urls']) for r in results)
    
    print(f"\nFiles analyzed: {len(results)}")
    print(f"Total metadata items: {total_metadata}")
    print(f"Total annotations: {total_annots}")
    print(f"Total signature fields: {total_sigs}")
    print(f"Total form fields: {total_forms}")
    print(f"Total external URLs: {total_urls}")
    
    # Files with most issues
    print("\nFiles with most signature fields:")
    sorted_sigs = sorted(results, key=lambda x: x['signature_count'], reverse=True)[:5]
    for r in sorted_sigs:
        if r['signature_count'] > 0:
            print(f"  {r['signature_count']:3d} sigs | {r['filename'][:60]}")
    
    print("\nFiles with most annotations:")
    sorted_annots = sorted(results, key=lambda x: x['annotation_count'], reverse=True)[:5]
    for r in sorted_annots:
        if r['annotation_count'] > 0:
            print(f"  {r['annotation_count']:3d} annots | {r['filename'][:60]}")
    
    print("\nFiles with external URLs:")
    for r in results:
        if r['external_urls']:
            print(f"  {len(r['external_urls']):2d} URLs | {r['filename'][:60]}")
            for url in r['external_urls']:
                print(f"      → {url}")
    
    # Save detailed results
    result_df = pd.DataFrame(results)
    result_df.to_csv('medium_risk_detailed_analysis.csv', index=False)
    print("\n✓ Detailed results saved to: medium_risk_detailed_analysis.csv")

print("\n" + "="*80)
