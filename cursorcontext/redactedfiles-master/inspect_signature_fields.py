"""
Deep dive into signature field structure
"""

import pikepdf
from pathlib import Path

# Analyze one file in detail
test_file = r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file\Doe 17 v. Indyke, No. 119-cv-09610 (S.D.N.Y. 2019)____003.pdf"

print("="*80)
print("DETAILED SIGNATURE FIELD ANALYSIS")
print("="*80)
print(f"\nFile: {Path(test_file).name}\n")

pdf = pikepdf.open(test_file)

if '/AcroForm' in pdf.Root:
    form = pdf.Root.AcroForm
    print("✓ AcroForm found")
    
    # Print form properties
    print("\nForm Properties:")
    for key, value in form.items():
        if key != '/Fields':
            print(f"  {key}: {value}")
    
    if '/Fields' in form:
        fields = form.Fields
        print(f"\nTotal Fields: {len(fields)}")
        print("\nField Details:")
        print("-"*80)
        
        sig_count = 0
        for i, field in enumerate(fields):
            print(f"\n[Field #{i+1}]")
            
            # Get all field properties
            for key, value in field.items():
                if key == '/FT':
                    field_type = str(value)
                    print(f"  Type: {field_type}")
                    if '/Sig' in field_type:
                        sig_count += 1
                elif key == '/T':
                    print(f"  Name: {value}")
                elif key == '/V':
                    print(f"  Value: {value}")
                elif key == '/DV':
                    print(f"  Default Value: {value}")
                elif key == '/Ff':
                    print(f"  Flags: {value}")
                elif key == '/P':
                    print(f"  Page: {value}")
                elif key == '/Rect':
                    print(f"  Rectangle: {value}")
                elif key == '/AP':
                    print(f"  Appearance: <stream>")
                elif key == '/Lock':
                    print(f"  Lock: {value}")
                elif key == '/SV':
                    print(f"  Seed Value: {value}")
                else:
                    try:
                        print(f"  {key}: {str(value)[:80]}")
                    except:
                        print(f"  {key}: <complex object>")
        
        print(f"\n\nSummary: Found {sig_count} signature fields out of {len(fields)} total fields")

pdf.close()

# Now check another file with 18 signatures
print("\n" + "="*80)
test_file2 = r"C:\Users\vhalan\Desktop\redactedfiles\epstein_court_records\file\Davies v. Indyke, No. 119-cv-10788 (S.D.N.Y. 2019)____031.pdf"
print(f"\nFile: {Path(test_file2).name}\n")

pdf2 = pikepdf.open(test_file2)

if '/AcroForm' in pdf2.Root:
    form = pdf2.Root.AcroForm
    print("✓ AcroForm found")
    
    if '/Fields' in form:
        fields = form.Fields
        print(f"Total Fields: {len(fields)}")
        
        # Check first few fields
        for i, field in enumerate(fields[:3]):
            print(f"\n[Field #{i+1}]")
            for key, value in field.items():
                try:
                    print(f"  {key}: {str(value)[:100]}")
                except:
                    print(f"  {key}: <complex>")

pdf2.close()
print("\n" + "="*80)
