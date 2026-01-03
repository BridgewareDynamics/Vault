"""
Find PDFs with actual cryptographic digital signatures (not just form fields)
"""

import pikepdf
import pandas as pd
from pathlib import Path

# Read the full audit
df = pd.read_csv('court_records_advanced_security_audit.csv')

# Convert signature_count to numeric
df['signature_count'] = pd.to_numeric(df['signature_count'], errors='coerce').fillna(0)

# Get files that report having signatures
sig_files = df[df['signature_count'] > 0].copy()

print("="*80)
print(f"SEARCHING FOR CRYPTOGRAPHICALLY SIGNED PDFs")
print("="*80)
print(f"\nFiles reporting signature fields: {len(sig_files)}")
print("Checking which files have ACTUAL digital signatures...\n")

base_path = Path(r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file")

signed_files = []
unsigned_files = []

for idx, row in sig_files.iterrows():
    filename = row['filename']
    pdf_path = base_path / filename
    
    if not pdf_path.exists():
        continue
    
    try:
        pdf = pikepdf.open(str(pdf_path))
        
        has_actual_signature = False
        signature_info = []
        
        # Check for actual signatures
        if '/AcroForm' in pdf.Root:
            form = pdf.Root.AcroForm
            
            if '/Fields' in form:
                fields = form.Fields
                
                for field in fields:
                    try:
                        # Check if it's a signature field with a value
                        if '/FT' in field and str(field.FT) == '/Sig':
                            field_name = str(field.get('/T', 'Unnamed'))
                            
                            # Check if it has a signature value (actual signature)
                            if '/V' in field:
                                has_actual_signature = True
                                sig_dict = field.V
                                
                                # Extract signature details
                                sig_info = {
                                    'field_name': field_name,
                                    'type': str(sig_dict.get('/Type', '')),
                                    'filter': str(sig_dict.get('/Filter', '')),
                                    'sub_filter': str(sig_dict.get('/SubFilter', '')),
                                }
                                
                                # Get signer information if available
                                if '/Name' in sig_dict:
                                    sig_info['signer_name'] = str(sig_dict.Name)
                                if '/Reason' in sig_dict:
                                    sig_info['reason'] = str(sig_dict.Reason)
                                if '/Location' in sig_dict:
                                    sig_info['location'] = str(sig_dict.Location)
                                if '/M' in sig_dict:
                                    sig_info['date'] = str(sig_dict.M)
                                if '/ContactInfo' in sig_dict:
                                    sig_info['contact'] = str(sig_dict.ContactInfo)
                                
                                # Check for ByteRange (indicates cryptographic signature)
                                if '/ByteRange' in sig_dict:
                                    sig_info['has_byterange'] = True
                                    sig_info['byterange'] = str(sig_dict.ByteRange)[:100]
                                
                                # Check for Contents (the actual signature data)
                                if '/Contents' in sig_dict:
                                    sig_info['has_signature_data'] = True
                                    sig_info['signature_length'] = len(sig_dict.Contents)
                                
                                signature_info.append(sig_info)
                    except Exception as e:
                        continue
        
        pdf.close()
        
        if has_actual_signature:
            signed_files.append({
                'filename': filename,
                'risk_score': row['risk_score'],
                'signature_count': int(row['signature_count']),
                'actual_signatures': len(signature_info),
                'signature_details': signature_info
            })
            
            print(f"✓ SIGNED: {filename[:70]}")
            for sig in signature_info:
                print(f"  Field: {sig['field_name']}")
                print(f"  Filter: {sig.get('filter', 'N/A')}")
                if 'signer_name' in sig:
                    print(f"  Signer: {sig['signer_name']}")
                if 'reason' in sig:
                    print(f"  Reason: {sig['reason']}")
                if 'date' in sig:
                    print(f"  Date: {sig['date']}")
                if 'has_signature_data' in sig:
                    print(f"  Signature Data: {sig['signature_length']} bytes")
                print()
        else:
            unsigned_files.append({
                'filename': filename,
                'signature_fields': int(row['signature_count'])
            })
            
    except Exception as e:
        print(f"✗ Error reading {filename[:60]}: {e}")
        continue

print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"\nFiles with signature FIELDS: {len(sig_files)}")
print(f"Files with ACTUAL cryptographic signatures: {len(signed_files)}")
print(f"Files with empty signature fields only: {len(unsigned_files)}")

if signed_files:
    print("\n" + "-"*80)
    print("CRYPTOGRAPHICALLY SIGNED FILES:")
    print("-"*80)
    for f in signed_files:
        print(f"\n{f['filename']}")
        print(f"  Risk Score: {f['risk_score']}")
        print(f"  Signature fields: {f['signature_count']}")
        print(f"  Actual signatures: {f['actual_signatures']}")
        for sig in f['signature_details']:
            print(f"\n  Signature Details:")
            for key, value in sig.items():
                if key not in ['has_byterange', 'has_signature_data']:
                    print(f"    {key}: {str(value)[:80]}")
    
    # Save detailed results
    result_df = pd.DataFrame([{
        'filename': f['filename'],
        'risk_score': f['risk_score'],
        'signature_fields': f['signature_count'],
        'actual_signatures': f['actual_signatures'],
        'signer_names': ', '.join([s.get('signer_name', 'Unknown') for s in f['signature_details']]),
        'signature_filters': ', '.join([s.get('filter', 'Unknown') for s in f['signature_details']]),
        'signature_dates': ', '.join([s.get('date', 'Unknown') for s in f['signature_details']])
    } for f in signed_files])
    
    result_df.to_csv('cryptographically_signed_files.csv', index=False)
    print("\n\n✓ Saved detailed results to: cryptographically_signed_files.csv")
else:
    print("\n⚠️  NO FILES WITH ACTUAL CRYPTOGRAPHIC SIGNATURES FOUND")
    print("All signature fields appear to be empty form fields without actual signatures.")

print("\n" + "="*80)
