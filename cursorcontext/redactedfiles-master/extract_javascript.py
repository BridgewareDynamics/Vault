"""
Extract and analyze JavaScript from court record PDFs
"""

import fitz
import pandas as pd
from pathlib import Path
import json

def extract_javascript_from_pdf(pdf_path):
    """Extract all JavaScript from a PDF"""
    try:
        doc = fitz.open(pdf_path)
        js_code = []
        
        # Check document-level JavaScript
        if hasattr(doc, 'embfile_names'):
            for name in doc.embfile_names():
                if 'javascript' in name.lower() or '.js' in name.lower():
                    js_code.append({
                        'type': 'embedded_file',
                        'name': name,
                        'code': 'Embedded JavaScript file detected'
                    })
        
        # Extract JavaScript from each page
        for page_num, page in enumerate(doc, 1):
            # Get annotations
            for annot in page.annots():
                if annot:
                    # Check for JavaScript actions
                    try:
                        annot_dict = annot.info
                        if 'A' in annot_dict:
                            action = annot_dict['A']
                            if isinstance(action, dict) and action.get('/S') == '/JavaScript':
                                js = action.get('/JS', '')
                                if js:
                                    js_code.append({
                                        'type': 'annotation',
                                        'page': page_num,
                                        'annot_type': annot.type[1] if annot.type else 'Unknown',
                                        'code': js
                                    })
                    except:
                        pass
        
        doc.close()
        return js_code
    except Exception as e:
        return [{'type': 'error', 'code': str(e)}]

# Read the JavaScript files CSV
df = pd.read_csv('court_records_javascript_files.csv')

print("\n" + "="*80)
print("JAVASCRIPT EXTRACTION FROM COURT RECORDS")
print("="*80)
print(f"Analyzing {len(df)} files with JavaScript...")
print("="*80 + "\n")

base_path = Path(r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file")

results = []

for idx, row in df.iterrows():
    filename = row['filename']
    pdf_path = base_path / filename
    
    print(f"[{idx+1}/{len(df)}] Extracting from: {filename[:60]}...")
    
    if not pdf_path.exists():
        print(f"  ERROR: File not found")
        results.append({
            'filename': filename,
            'status': 'FILE_NOT_FOUND',
            'javascript_count': 0,
            'javascript_details': 'File not found'
        })
        continue
    
    js_code = extract_javascript_from_pdf(str(pdf_path))
    
    if js_code:
        print(f"  Found {len(js_code)} JavaScript instance(s)")
        
        # Format JavaScript details
        js_details = []
        for js in js_code:
            if js['type'] == 'annotation':
                js_details.append(f"Page {js['page']} ({js['annot_type']}): {js['code'][:100]}")
            else:
                js_details.append(f"{js['type']}: {js['code'][:100]}")
        
        results.append({
            'filename': filename,
            'status': 'EXTRACTED',
            'javascript_count': len(js_code),
            'javascript_details': ' | '.join(js_details),
            'full_code': json.dumps(js_code, indent=2)
        })
    else:
        print(f"  WARNING: No JavaScript found (false positive?)")
        results.append({
            'filename': filename,
            'status': 'NO_JS_FOUND',
            'javascript_count': 0,
            'javascript_details': 'pikepdf detected JS but PyMuPDF could not extract it',
            'full_code': ''
        })

# Save results
output_df = pd.DataFrame(results)
output_df.to_csv('javascript_extraction_results.csv', index=False)

print("\n" + "="*80)
print("EXTRACTION COMPLETE")
print("="*80)
print(f"Total files analyzed: {len(results)}")
print(f"JavaScript extracted: {sum(1 for r in results if r['status'] == 'EXTRACTED')}")
print(f"No JS found: {sum(1 for r in results if r['status'] == 'NO_JS_FOUND')}")
print(f"File errors: {sum(1 for r in results if r['status'] == 'FILE_NOT_FOUND')}")
print("\nSaved to: javascript_extraction_results.csv")

# Show samples
print("\n" + "="*80)
print("JAVASCRIPT CODE SAMPLES:")
print("="*80)
for r in results[:5]:
    if r['javascript_details'] and r['status'] == 'EXTRACTED':
        print(f"\nFile: {r['filename']}")
        print(f"Details: {r['javascript_details'][:200]}...")
        if r['full_code']:
            code_obj = json.loads(r['full_code'])
            if code_obj:
                print(f"Full code preview:\n{code_obj[0].get('code', '')[:300]}")

print("\n" + "="*80 + "\n")
