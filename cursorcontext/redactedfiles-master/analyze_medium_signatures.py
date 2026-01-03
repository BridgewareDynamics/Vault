"""
Analyze digital signatures in MEDIUM RISK court records
"""

import pandas as pd
import pikepdf
from pathlib import Path

# Read MEDIUM RISK files
df = pd.read_csv('court_records_advanced_security_audit.csv')
medium = df[(df['risk_score'] >= 20) & (df['risk_score'] < 40)].copy()

# Filter to files with signatures
medium['signature_count'] = pd.to_numeric(medium['signature_count'], errors='coerce').fillna(0)
sig_files = medium[medium['signature_count'] > 0].copy()

print("="*80)
print(f"DIGITAL SIGNATURE ANALYSIS - MEDIUM RISK FILES")
print("="*80)
print(f"\nTotal MEDIUM RISK files: {len(medium)}")
print(f"Files with digital signatures: {len(sig_files)}")
print(f"Total signature fields: {int(sig_files['signature_count'].sum())}")
print()

if len(sig_files) == 0:
    print("No signature fields found in MEDIUM RISK files.")
else:
    # Top files by signature count
    print("TOP 15 FILES BY SIGNATURE COUNT:")
    print("-"*80)
    top_sig = sig_files.nlargest(15, 'signature_count')
    for idx, row in top_sig.iterrows():
        count = int(row['signature_count'])
        risk = row['risk_score']
        print(f"{count:4d} sigs | Risk: {risk:4.0f} | {row['filename'][:60]}")
    
    print("\n" + "="*80)
    print("EXTRACTING SIGNATURE DETAILS FROM TOP 10 FILES")
    print("="*80)
    
    base_path = Path(r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file")
    
    detailed_results = []
    
    for idx, row in top_sig.head(10).iterrows():
        filename = row['filename']
        pdf_path = base_path / filename
        sig_count = int(row['signature_count'])
        
        print(f"\n[{idx+1}] {filename[:70]}")
        print(f"    Signature fields: {sig_count}")
        
        if not pdf_path.exists():
            print("    ⚠️  File not found")
            continue
        
        try:
            pdf = pikepdf.open(str(pdf_path))
            
            signature_details = []
            form_details = []
            
            # Check for AcroForm with signature fields
            if '/AcroForm' in pdf.Root:
                form = pdf.Root.AcroForm
                
                if '/Fields' in form:
                    fields = form.Fields
                    total_fields = len(fields)
                    sig_fields = 0
                    
                    for field in fields:
                        try:
                            # Check field type
                            field_type = str(field.get('/FT', ''))
                            field_name = str(field.get('/T', 'Unnamed'))
                            
                            if '/Sig' in field_type:
                                sig_fields += 1
                                
                                # Get signature value if signed
                                if '/V' in field:
                                    sig_value = field.V
                                    
                                    # Extract signer info
                                    signer_info = {}
                                    if '/Name' in sig_value:
                                        signer_info['name'] = str(sig_value.Name)
                                    if '/Reason' in sig_value:
                                        signer_info['reason'] = str(sig_value.Reason)
                                    if '/Location' in sig_value:
                                        signer_info['location'] = str(sig_value.Location)
                                    if '/M' in sig_value:
                                        signer_info['date'] = str(sig_value.M)
                                    
                                    signature_details.append({
                                        'field_name': field_name,
                                        'signed': True,
                                        'info': signer_info
                                    })
                                else:
                                    signature_details.append({
                                        'field_name': field_name,
                                        'signed': False,
                                        'info': {}
                                    })
                        except Exception as e:
                            continue
                    
                    form_details.append({
                        'total_fields': total_fields,
                        'signature_fields': sig_fields
                    })
            
            pdf.close()
            
            # Print summary
            if form_details:
                print(f"    Total form fields: {form_details[0]['total_fields']}")
                print(f"    Signature fields: {form_details[0]['signature_fields']}")
            
            if signature_details:
                signed_count = sum(1 for s in signature_details if s['signed'])
                unsigned_count = sum(1 for s in signature_details if not s['signed'])
                
                print(f"    Signed: {signed_count}, Unsigned: {unsigned_count}")
                
                # Show details of signed signatures
                for sig in signature_details:
                    if sig['signed'] and sig['info']:
                        print(f"    ✍️  Signature: {sig['field_name']}")
                        for key, value in sig['info'].items():
                            print(f"        {key}: {value[:80]}")
            else:
                print("    ⚠️  No signature field details extracted")
            
            detailed_results.append({
                'filename': filename,
                'signature_count': sig_count,
                'form_fields': form_details[0]['total_fields'] if form_details else 0,
                'signature_details': len(signature_details),
                'signed_count': sum(1 for s in signature_details if s['signed']),
                'unsigned_count': sum(1 for s in signature_details if not s['signed'])
            })
            
        except Exception as e:
            print(f"    ❌ Error: {e}")
            continue
    
    # Save results
    if detailed_results:
        result_df = pd.DataFrame(detailed_results)
        result_df.to_csv('medium_risk_signature_analysis.csv', index=False)
        print("\n✓ Saved to: medium_risk_signature_analysis.csv")
    
    # Summary statistics
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    # Distribution
    print("\nSignature Count Distribution:")
    bins = [0, 10, 50, 100, 200, 300]
    labels = ['1-10', '11-50', '51-100', '101-200', '201-300']
    sig_files['sig_range'] = pd.cut(sig_files['signature_count'], bins=bins, labels=labels)
    dist = sig_files['sig_range'].value_counts().sort_index()
    for range_label, count in dist.items():
        print(f"  {range_label:10s}: {count:3d} files")
    
    # Case breakdown
    print("\nSignatures by Case:")
    sig_files['case_name'] = sig_files['filename'].str.extract(r'^([^,]+)')[0]
    case_sigs = sig_files.groupby('case_name').agg({
        'signature_count': ['count', 'sum', 'mean']
    }).round(1)
    case_sigs.columns = ['Files', 'Total Sigs', 'Avg Sigs']
    case_sigs = case_sigs.sort_values('Total Sigs', ascending=False).head(10)
    for case, row in case_sigs.iterrows():
        print(f"  {int(row['Files']):2d} files | {int(row['Total Sigs']):4d} total | {row['Avg Sigs']:5.1f} avg | {case[:45]}")

print("\n" + "="*80)
