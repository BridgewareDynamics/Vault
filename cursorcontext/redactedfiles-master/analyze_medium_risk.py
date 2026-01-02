"""
Deep dive analysis of MEDIUM RISK court record PDFs
"""

import pandas as pd
from pathlib import Path

# Read the full audit results
df = pd.read_csv('court_records_advanced_security_audit.csv')

# Filter to only MEDIUM RISK (20-39)
medium = df[(df['risk_score'] >= 20) & (df['risk_score'] < 40)].copy()

print("="*80)
print(f"MEDIUM RISK FILES ANALYSIS ({len(medium)} files)")
print("="*80)
print()

# Risk score distribution
print("RISK SCORE DISTRIBUTION:")
print(f"  Range: {medium['risk_score'].min():.1f} - {medium['risk_score'].max():.1f}")
print(f"  Mean: {medium['risk_score'].mean():.1f}")
print(f"  Median: {medium['risk_score'].median():.1f}")
print()

# Top 15 highest MEDIUM risk files
print("TOP 15 HIGHEST MEDIUM RISK FILES:")
print("-"*80)
top15 = medium.nlargest(15, 'risk_score')
for idx, row in top15.iterrows():
    print(f"{row['risk_score']:5.1f} | {row['filename'][:70]}")
print()

# Issue breakdown
print("SECURITY ISSUES IN MEDIUM RISK FILES:")
print("-"*80)
issues = {
    'Hidden Text': (medium['has_hidden_text'] == True).sum(),
    'Metadata': (medium['has_metadata'] == True).sum(),
    'Annotations': (medium['has_annotations'] == True).sum(),
    'Digital Signatures': (medium['has_signatures'] == True).sum(),
    'Form Fields': (medium['has_forms'] == True).sum(),
    'External Links': (medium['has_external_links'] == True).sum(),
    'Attachments': (medium['has_attachments'] == True).sum(),
    'JavaScript': (medium['has_javascript'] == True).sum(),
    'OCR Layer': (medium['has_ocr_layer'] == True).sum(),
}

for issue, count in sorted(issues.items(), key=lambda x: x[1], reverse=True):
    pct = (count/len(medium))*100
    print(f"  {issue:20s}: {count:3d} files ({pct:5.1f}%)")
print()

# Hidden text breakdown for MEDIUM RISK files
print("HIDDEN TEXT DETAILS (MEDIUM RISK):")
print("-"*80)
hidden = medium[medium['has_hidden_text'] == True]
if len(hidden) > 0:
    print(f"Total with hidden text: {len(hidden)} files")
    
    # Parse hidden text types
    white_count = sum(1 for x in hidden['hidden_text_types'].fillna('') if 'white' in str(x).lower())
    offpage_count = sum(1 for x in hidden['hidden_text_types'].fillna('') if 'off' in str(x).lower())
    
    print(f"  White-on-white text: {white_count} files")
    print(f"  Off-page text: {offpage_count} files")
    
    # Top files by hidden text pages
    print("\n  Top 10 by white-on-white pages:")
    for idx, row in hidden.nlargest(10, 'white_on_white_pages').iterrows():
        pages = int(row['white_on_white_pages']) if pd.notna(row['white_on_white_pages']) else 0
        if pages > 0:
            print(f"    {pages:3d} pages | {row['filename'][:60]}")
    
    print("\n  Top 10 by off-page text pages:")
    for idx, row in hidden.nlargest(10, 'offpage_text_pages').iterrows():
        pages = int(row['offpage_text_pages']) if pd.notna(row['offpage_text_pages']) else 0
        if pages > 0:
            print(f"    {pages:3d} pages | {row['filename'][:60]}")
else:
    print("  No hidden text found in MEDIUM RISK files")
print()

# Signature analysis
print("DIGITAL SIGNATURE DETAILS (MEDIUM RISK):")
print("-"*80)
signed = medium[medium['has_signatures'] == True]
if len(signed) > 0:
    print(f"Total with signatures: {len(signed)} files")
    print(f"Total signature fields: {int(signed['signature_count'].sum())} across all files")
    print(f"Average per file: {signed['signature_count'].mean():.1f}")
    
    print("\n  Top 10 by signature count:")
    for idx, row in signed.nlargest(10, 'signature_count').iterrows():
        count = int(row['signature_count']) if pd.notna(row['signature_count']) else 0
        print(f"    {count:3d} sigs | {row['filename'][:60]}")
else:
    print("  No signatures in MEDIUM RISK files")
print()

# Metadata analysis
print("METADATA ANALYSIS (MEDIUM RISK):")
print("-"*80)
meta = medium[medium['has_metadata'] == True]
if len(meta) > 0:
    print(f"Total with metadata: {len(meta)} files")
    print(f"Average metadata fields: {meta['metadata_count'].mean():.1f}")
    
    # Check for common sensitive metadata
    print("\n  Checking for potentially sensitive metadata:")
    author_count = sum(1 for x in meta['metadata_details'].fillna('') if 'author' in str(x).lower())
    creator_count = sum(1 for x in meta['metadata_details'].fillna('') if 'creator' in str(x).lower())
    producer_count = sum(1 for x in meta['metadata_details'].fillna('') if 'producer' in str(x).lower())
    
    print(f"    Files with Author: {author_count}")
    print(f"    Files with Creator: {creator_count}")
    print(f"    Files with Producer: {producer_count}")
else:
    print("  No metadata in MEDIUM RISK files")
print()

# External links analysis
print("EXTERNAL LINKS ANALYSIS (MEDIUM RISK):")
print("-"*80)
links = medium[medium['has_external_links'] == True]
if len(links) > 0:
    print(f"Total with external links: {len(links)} files")
    
    print("\n  Top 10 by link count:")
    for idx, row in links.nlargest(10, 'external_url_count').iterrows():
        count = int(row['external_url_count']) if pd.notna(row['external_url_count']) else 0
        print(f"    {count:3d} links | {row['filename'][:60]}")
else:
    print("  No external links in MEDIUM RISK files")
print()

# Case breakdown
print("MEDIUM RISK FILES BY CASE:")
print("-"*80)
medium['case_name'] = medium['filename'].str.extract(r'^([^,]+)')[0]
case_counts = medium['case_name'].value_counts().head(10)
for case, count in case_counts.items():
    avg_risk = medium[medium['case_name'] == case]['risk_score'].mean()
    print(f"  {count:3d} files | Avg Risk: {avg_risk:5.1f} | {case[:55]}")
print()

# Create focused exports
print("="*80)
print("CREATING FOCUSED EXPORTS")
print("="*80)

# Export top 20 MEDIUM RISK files
top20 = medium.nlargest(20, 'risk_score')
top20.to_csv('medium_risk_top20.csv', index=False)
print(f"✓ Top 20 MEDIUM RISK files -> medium_risk_top20.csv")

# Export MEDIUM RISK with hidden text
medium_hidden = medium[medium['has_hidden_text'] == True]
if len(medium_hidden) > 0:
    medium_hidden.to_csv('medium_risk_hidden_text.csv', index=False)
    print(f"✓ {len(medium_hidden)} MEDIUM RISK files with hidden text -> medium_risk_hidden_text.csv")

# Export MEDIUM RISK with signatures
medium_sigs = medium[medium['has_signatures'] == True]
if len(medium_sigs) > 0:
    medium_sigs.to_csv('medium_risk_signatures.csv', index=False)
    print(f"✓ {len(medium_sigs)} MEDIUM RISK files with signatures -> medium_risk_signatures.csv")

# Export files with score >= 30 (upper MEDIUM range)
high_medium = medium[medium['risk_score'] >= 30]
if len(high_medium) > 0:
    high_medium.to_csv('medium_risk_score_30plus.csv', index=False)
    print(f"✓ {len(high_medium)} files with risk score >= 30 -> medium_risk_score_30plus.csv")

print()
print("="*80)
print("ANALYSIS COMPLETE")
print("="*80)
