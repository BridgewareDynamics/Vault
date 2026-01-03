"""
Extract and decode JavaScript from PDFs using pikepdf
"""

import pikepdf
import pandas as pd
from pathlib import Path
import zlib

def extract_and_decode_javascript(pdf_path):
    """Extract JavaScript and decode compressed streams"""
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
                            js_stream = script_obj.JS
                            
                            # Check if it's a stream object
                            if isinstance(js_stream, pikepdf.Stream):
                                # Read the decoded stream data
                                try:
                                    decoded = js_stream.read_bytes()
                                    js_code = decoded.decode('utf-8', errors='replace')
                                except:
                                    js_code = str(js_stream)
                            else:
                                js_code = str(js_stream)
                            
                            js_found.append({
                                'type': 'document_javascript',
                                'name': name,
                                'code': js_code
                            })
        
        pdf.close()
        return js_found
    except Exception as e:
        return [{'type': 'error', 'code': str(e)}]

# Read one file as test
test_file = r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file\Davies v. Indyke, No. 119-cv-10788 (S.D.N.Y. 2019)____044.pdf"

print("="*80)
print("TESTING JAVASCRIPT EXTRACTION WITH DECODING")
print("="*80)
print(f"Test file: {Path(test_file).name}\n")

js_code = extract_and_decode_javascript(test_file)

if js_code:
    print(f"Found {len(js_code)} JavaScript snippet(s)\n")
    for i, js in enumerate(js_code, 1):
        print(f"--- JavaScript #{i} ---")
        print(f"Type: {js['type']}")
        if 'name' in js:
            print(f"Name: {js['name']}")
        print(f"Code ({len(js['code'])} characters):")
        print("-" * 80)
        print(js['code'])
        print("-" * 80)
        print()
else:
    print("No JavaScript found")

# Now extract from all files
print("\n" + "="*80)
print("EXTRACTING FROM ALL JAVASCRIPT FILES")
print("="*80 + "\n")

df = pd.read_csv('court_records_javascript_files.csv')
base_path = Path(r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file")

results = []

for idx, row in df.iterrows():
    filename = row['filename']
    pdf_path = base_path / filename
    
    print(f"[{idx+1}/{len(df)}] {filename[:60]}...")
    
    if not pdf_path.exists():
        print(f"  ERROR: File not found")
        continue
    
    js_code = extract_and_decode_javascript(str(pdf_path))
    
    if js_code and js_code[0].get('type') != 'error':
        print(f"  ✓ Found {len(js_code)} JavaScript snippet(s)")
        
        results.append({
            'filename': filename,
            'javascript_count': len(js_code),
            'javascript_names': ', '.join([js.get('name', 'Unknown') for js in js_code]),
            'javascript_preview': js_code[0]['code'][:200] if js_code else '',
            'all_javascript': '\n\n'.join([f"=== {js.get('name', 'Unnamed')} ===\n{js['code']}" for js in js_code])
        })
    else:
        error_msg = js_code[0].get('code', 'No JavaScript') if js_code else 'No JavaScript'
        print(f"  ⚠️  {error_msg}")
        results.append({
            'filename': filename,
            'javascript_count': 0,
            'javascript_names': '',
            'javascript_preview': error_msg,
            'all_javascript': ''
        })

# Save results
output_df = pd.DataFrame(results)
output_df.to_csv('javascript_decoded.csv', index=False)

# Also save as text file for easier reading
with open('javascript_full_code.txt', 'w', encoding='utf-8') as f:
    f.write("="*80 + "\n")
    f.write("EXTRACTED JAVASCRIPT CODE FROM COURT RECORDS\n")
    f.write("="*80 + "\n\n")
    
    for r in results:
        if r['javascript_count'] > 0:
            f.write(f"\n{'='*80}\n")
            f.write(f"FILE: {r['filename']}\n")
            f.write(f"COUNT: {r['javascript_count']} JavaScript snippets\n")
            f.write(f"{'='*80}\n\n")
            f.write(r['all_javascript'])
            f.write("\n\n")

print("\n" + "="*80)
print("EXTRACTION COMPLETE")
print("="*80)
print(f"Files analyzed: {len(results)}")
print(f"Files with JavaScript: {sum(1 for r in results if r['javascript_count'] > 0)}")
print("\nSaved to:")
print("  • javascript_decoded.csv - Summary with preview")
print("  • javascript_full_code.txt - Full JavaScript code")
print("="*80 + "\n")
