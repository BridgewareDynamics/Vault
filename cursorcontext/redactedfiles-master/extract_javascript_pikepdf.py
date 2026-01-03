"""
Extract JavaScript using pikepdf (more thorough than PyMuPDF)
"""

import pikepdf
import pandas as pd
from pathlib import Path
import json

def extract_javascript_pikepdf(pdf_path):
    """Extract JavaScript using pikepdf"""
    try:
        pdf = pikepdf.open(pdf_path)
        js_found = []
        
        # Check catalog for JavaScript
        if '/Names' in pdf.Root:
            names = pdf.Root.Names
            if '/JavaScript' in names:
                js_names = names.JavaScript
                if '/Names' in js_names:
                    js_array = js_names.Names
                    # JavaScript is stored as pairs: [name, script]
                    for i in range(0, len(js_array), 2):
                        name = str(js_array[i])
                        script_obj = js_array[i+1]
                        if '/JS' in script_obj:
                            js_code = str(script_obj.JS)
                            js_found.append({
                                'type': 'document_javascript',
                                'name': name,
                                'code': js_code
                            })
        
        # Check each page for annotations with JavaScript
        for page_num, page in enumerate(pdf.pages, 1):
            if '/Annots' in page:
                for annot in page.Annots:
                    annot_obj = pdf.pages[page_num-1].Annots[0]
                    if '/A' in annot_obj:
                        action = annot_obj.A
                        if '/S' in action and str(action.S) == '/JavaScript':
                            if '/JS' in action:
                                js_code = str(action.JS)
                                js_found.append({
                                    'type': 'annotation_javascript',
                                    'page': page_num,
                                    'code': js_code
                                })
            
            # Check for AA (Additional Actions)
            if '/AA' in page:
                aa = page.AA
                for key in aa.keys():
                    action = aa[key]
                    if '/S' in action and str(action.S) == '/JavaScript':
                        if '/JS' in action:
                            js_code = str(action.JS)
                            js_found.append({
                                'type': f'page_action_{key}',
                                'page': page_num,
                                'code': js_code
                            })
        
        # Check form fields for JavaScript
        if '/AcroForm' in pdf.Root:
            acroform = pdf.Root.AcroForm
            if '/Fields' in acroform:
                for field in acroform.Fields:
                    if '/AA' in field:
                        aa = field.AA
                        for key in aa.keys():
                            action = aa[key]
                            if '/S' in action and str(action.S) == '/JavaScript':
                                if '/JS' in action:
                                    js_code = str(action.JS)
                                    field_name = str(field.get('/T', 'Unknown'))
                                    js_found.append({
                                        'type': f'form_field_{key}',
                                        'field': field_name,
                                        'code': js_code
                                    })
        
        pdf.close()
        return js_found
    except Exception as e:
        return [{'type': 'error', 'code': str(e)}]

# Read the JavaScript files CSV
df = pd.read_csv('court_records_javascript_files.csv')

print("\n" + "="*80)
print("JAVASCRIPT EXTRACTION USING PIKEPDF")
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
        continue
    
    js_code = extract_javascript_pikepdf(str(pdf_path))
    
    if js_code and js_code[0].get('type') != 'error':
        print(f"  ✓ Found {len(js_code)} JavaScript instance(s)")
        
        # Show preview
        for js in js_code[:2]:  # Show first 2
            print(f"    Type: {js['type']}")
            code_preview = js['code'][:150].replace('\n', ' ')
            print(f"    Code: {code_preview}...")
        
        results.append({
            'filename': filename,
            'status': 'EXTRACTED',
            'javascript_count': len(js_code),
            'javascript_summary': '; '.join([f"{js['type']}: {js['code'][:50]}" for js in js_code]),
            'full_details': json.dumps(js_code, indent=2)
        })
    else:
        error_msg = js_code[0].get('code', 'Unknown error') if js_code else 'No JavaScript found'
        print(f"  ⚠️  {error_msg}")
        results.append({
            'filename': filename,
            'status': 'ERROR' if 'error' in error_msg.lower() else 'NO_JS',
            'javascript_count': 0,
            'javascript_summary': error_msg,
            'full_details': ''
        })

# Save results
output_df = pd.DataFrame(results)
output_df.to_csv('javascript_extraction_pikepdf.csv', index=False)

print("\n" + "="*80)
print("EXTRACTION COMPLETE")
print("="*80)
print(f"Total files analyzed: {len(results)}")
print(f"JavaScript extracted: {sum(1 for r in results if r['status'] == 'EXTRACTED')}")
print(f"No JS found: {sum(1 for r in results if r['status'] == 'NO_JS')}")
print(f"Errors: {sum(1 for r in results if r['status'] == 'ERROR')}")
print("\nSaved to: javascript_extraction_pikepdf.csv")

# Show detailed analysis
if results:
    print("\n" + "="*80)
    print("JAVASCRIPT ANALYSIS:")
    print("="*80)
    for r in results:
        if r['status'] == 'EXTRACTED' and r['full_details']:
            print(f"\n📄 FILE: {r['filename']}")
            print(f"   Count: {r['javascript_count']} JavaScript snippets")
            details = json.loads(r['full_details'])
            for i, js in enumerate(details, 1):
                print(f"\n   [{i}] Type: {js['type']}")
                print(f"       Code length: {len(js['code'])} characters")
                # Show full code if not too long
                if len(js['code']) < 500:
                    print(f"       Full code:\n{js['code']}")
                else:
                    print(f"       Code preview (first 300 chars):\n{js['code'][:300]}...")

print("\n" + "="*80 + "\n")
