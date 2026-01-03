"""
Extract hidden text from court record PDFs
"""

import fitz
import pandas as pd
from pathlib import Path

def extract_hidden_text(pdf_path):
    """Extract text that might be hidden (white-on-white, off-page, etc.)"""
    try:
        doc = fitz.open(pdf_path)
        findings = {
            'total_pages': len(doc),
            'white_on_white_text': [],
            'off_page_text': [],
            'tiny_text': [],
            'all_text': []
        }
        
        for page_num, page in enumerate(doc, 1):
            page_rect = page.rect
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if not text:
                                continue
                            
                            bbox = span.get("bbox", [])
                            color = span.get("color", 0)
                            size = span.get("size", 0)
                            
                            # Check for white-on-white (color close to white = 16777215 or 1.0)
                            # In RGB, white is (255, 255, 255) = 16777215 in decimal
                            if color >= 16000000 or color == 1:
                                findings['white_on_white_text'].append({
                                    'page': page_num,
                                    'text': text,
                                    'color': color,
                                    'size': size,
                                    'bbox': bbox
                                })
                            
                            # Check for off-page text (outside visible area)
                            if bbox:
                                x0, y0, x1, y1 = bbox
                                if (x0 < page_rect.x0 or x1 > page_rect.x1 or 
                                    y0 < page_rect.y0 or y1 > page_rect.y1):
                                    findings['off_page_text'].append({
                                        'page': page_num,
                                        'text': text,
                                        'bbox': bbox,
                                        'page_size': [page_rect.width, page_rect.height]
                                    })
                            
                            # Check for tiny text (size < 1)
                            if size < 1 and size > 0:
                                findings['tiny_text'].append({
                                    'page': page_num,
                                    'text': text,
                                    'size': size
                                })
                            
                            # Store all text for reference
                            findings['all_text'].append({
                                'page': page_num,
                                'text': text,
                                'color': color,
                                'size': size
                            })
        
        doc.close()
        return findings
    except Exception as e:
        return {'error': str(e)}

# Read the hidden text files CSV
df = pd.read_csv('court_records_hidden_text_files.csv')

print("\n" + "="*80)
print("HIDDEN TEXT EXTRACTION FROM COURT RECORDS")
print("="*80)
print(f"Analyzing {len(df)} files with hidden text...")
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
    
    findings = extract_hidden_text(str(pdf_path))
    
    if 'error' in findings:
        print(f"  ERROR: {findings['error']}")
        continue
    
    white_count = len(findings['white_on_white_text'])
    off_count = len(findings['off_page_text'])
    tiny_count = len(findings['tiny_text'])
    
    print(f"  White-on-white: {white_count}, Off-page: {off_count}, Tiny: {tiny_count}")
    
    # Collect sample text
    samples = []
    if findings['white_on_white_text']:
        samples.append("WHITE-ON-WHITE: " + findings['white_on_white_text'][0]['text'][:100])
    if findings['off_page_text']:
        samples.append("OFF-PAGE: " + findings['off_page_text'][0]['text'][:100])
    if findings['tiny_text']:
        samples.append("TINY: " + findings['tiny_text'][0]['text'][:100])
    
    results.append({
        'filename': filename,
        'risk_score': row['risk_score'],
        'total_pages': findings['total_pages'],
        'white_on_white_count': white_count,
        'off_page_count': off_count,
        'tiny_text_count': tiny_count,
        'sample_hidden_text': ' | '.join(samples),
        'all_white_on_white': str(findings['white_on_white_text'][:5]),  # First 5
        'all_off_page': str(findings['off_page_text'][:5])
    })

# Save results
output_df = pd.DataFrame(results)
output_df.to_csv('hidden_text_extraction_results.csv', index=False)

print("\n" + "="*80)
print("EXTRACTION COMPLETE")
print("="*80)
print(f"Total files analyzed: {len(results)}")
print(f"Files with white-on-white text: {sum(1 for r in results if r['white_on_white_count'] > 0)}")
print(f"Files with off-page text: {sum(1 for r in results if r['off_page_count'] > 0)}")
print(f"Files with tiny text: {sum(1 for r in results if r['tiny_text_count'] > 0)}")
print("\nSaved to: hidden_text_extraction_results.csv")

# Show most concerning files
print("\n" + "="*80)
print("TOP 10 FILES WITH MOST HIDDEN TEXT:")
print("="*80)
output_df['total_hidden'] = output_df['white_on_white_count'] + output_df['off_page_count'] + output_df['tiny_text_count']
top_files = output_df.nlargest(10, 'total_hidden')
for idx, row in top_files.iterrows():
    print(f"\n{row['filename'][:70]}")
    print(f"  Risk: {row['risk_score']}, White: {row['white_on_white_count']}, Off-page: {row['off_page_count']}, Tiny: {row['tiny_text_count']}")
    if row['sample_hidden_text']:
        print(f"  Sample: {row['sample_hidden_text'][:150]}...")

print("\n" + "="*80 + "\n")
