"""
Analysis of Epstein Court Records Security Scan
"""

import pandas as pd

# Read the CSV
df = pd.read_csv('court_records_advanced_security_audit.csv')

print("\n" + "="*80)
print("EPSTEIN COURT RECORDS - ADVANCED SECURITY ANALYSIS")
print("="*80)
print(f"Total PDFs scanned: {len(df)}")
print("="*80)

# Risk Distribution
print("\n1. RISK DISTRIBUTION:")
high = len(df[df['risk_score'] >= 40])
medium = len(df[(df['risk_score'] >= 20) & (df['risk_score'] < 40)])
low = len(df[df['risk_score'] < 20])
print(f"   HIGH RISK (>=40):     {high:4d} ({high/len(df)*100:.1f}%)")
print(f"   MEDIUM RISK (20-39):  {medium:4d} ({medium/len(df)*100:.1f}%)")
print(f"   LOW RISK (<20):       {low:4d} ({low/len(df)*100:.1f}%)")

# Top Security Issues
print("\n2. TOP SECURITY FINDINGS:")
print(f"   Metadata:             {(df['has_metadata']=='YES').sum():4d} files")
print(f"   Hidden Text:          {(df['has_hidden_text']=='YES').sum():4d} files ⚠️")
print(f"   JavaScript:           {(df['has_javascript']=='YES').sum():4d} files ⚠️⚠️")
print(f"   Digital Signatures:   {(df['has_signatures']=='YES').sum():4d} files")
print(f"   Annotations:          {(df['has_annotations']=='YES').sum():4d} files")
print(f"   External Links:       {(df['has_external_links']=='YES').sum():4d} files")
print(f"   OCR Layer:            {(df['has_ocr_layer']=='YES').sum():4d} files")
print(f"   Incremental Updates:  {(pd.to_numeric(df['incremental_updates'], errors='coerce')>0).sum():4d} files")

# HIGH RISK FILE
print("\n3. HIGH RISK FILE (score >= 40):")
high_risk = df[df['risk_score'] >= 40]
if not high_risk.empty:
    for _, row in high_risk.iterrows():
        print(f"   File: {row['filename']}")
        print(f"   Risk Score: {row['risk_score']}")
        print(f"   Hidden Text: {row['has_hidden_text']}")
        print(f"   Signatures: {row['has_signatures']} (count: {row['signature_count']})")
        print(f"   JavaScript: {row['has_javascript']}")

# JAVASCRIPT FILES (Critical!)
print("\n4. JAVASCRIPT FILES (11 files - CRITICAL SECURITY RISK):")
js_files = df[df['has_javascript'] == 'YES']
print("   JavaScript in court PDFs is highly unusual and potentially malicious!")
for i, (_, row) in enumerate(js_files.iterrows(), 1):
    print(f"   {i:2d}. {row['filename'][:70]:<70s} Risk: {row['risk_score']}")

# HIDDEN TEXT FILES
print("\n5. HIDDEN TEXT FILES (66 files):")
hidden = df[df['has_hidden_text'] == 'YES']
white_on_white = (hidden['hidden_text_types'] == 'white-on-white text').sum()
off_page = (hidden['hidden_text_types'] == 'off-page text').sum()
print(f"   White-on-white text:  {white_on_white} files")
print(f"   Off-page text:        {off_page} files")
print("\n   Top 10 files with hidden text:")
for i, (_, row) in enumerate(hidden.nlargest(10, 'risk_score').iterrows(), 1):
    print(f"   {i:2d}. {row['filename'][:60]:<60s} Risk: {row['risk_score']:2d} Type: {row['hidden_text_types']}")

# DIGITAL SIGNATURES
print("\n6. DIGITAL SIGNATURES (32 files):")
sigs = df[df['has_signatures'] == 'YES']
print(f"   Total signature fields: {sigs['signature_count'].sum()}")
print(f"   Average per file: {sigs['signature_count'].mean():.1f}")
print("\n   Most signature fields:")
for i, (_, row) in enumerate(sigs.nlargest(5, 'signature_count').iterrows(), 1):
    print(f"   {i}. {row['filename'][:60]:<60s} Sigs: {row['signature_count']}")

# CASE BREAKDOWN
print("\n7. CASE BREAKDOWN:")
cases = df['filename'].str.extract(r'(.*?), No\.')[0].value_counts()
print(f"   Total unique cases: {len(cases)}")
print("\n   Top 10 cases by document count:")
for case, count in cases.head(10).items():
    print(f"   {count:3d} files: {case}")

# RECOMMENDATIONS
print("\n" + "="*80)
print("8. SECURITY RECOMMENDATIONS:")
print("="*80)
print("   ⚠️  HIGH PRIORITY:")
print("      • Investigate 11 files with JavaScript - unusual for court docs")
print("      • Review 66 files with hidden text (white-on-white, off-page)")
print("      • Examine 1 high-risk file with signatures + hidden text")
print("\n   📋 MEDIUM PRIORITY:")
print("      • Review 90 medium-risk files (scores 20-39)")
print("      • Verify 32 files with digital signatures")
print("      • Check 45 files with external links")
print("\n   ℹ️  INFORMATION:")
print("      • 628 files have OCR layer (scanned documents)")
print("      • 209 files have incremental updates (normal PDF workflow)")
print("      • All 1441 files have metadata (expected for legal docs)")
print("="*80)

# Export filtered lists
print("\n9. EXPORTING FILTERED LISTS...")

# JavaScript files
js_files.to_csv('court_records_javascript_files.csv', index=False)
print("   ✓ JavaScript files → court_records_javascript_files.csv")

# Hidden text files
hidden.to_csv('court_records_hidden_text_files.csv', index=False)
print("   ✓ Hidden text files → court_records_hidden_text_files.csv")

# High + Medium risk
risky = df[df['risk_score'] >= 20]
risky.to_csv('court_records_high_medium_risk.csv', index=False)
print(f"   ✓ High+Medium risk ({len(risky)} files) → court_records_high_medium_risk.csv")

print("\n" + "="*80)
print("Analysis complete!")
print("="*80 + "\n")
