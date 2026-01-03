import csv

with open('kino_advanced_security_audit.csv', encoding='utf-8') as f:
    data = list(csv.DictReader(f))

signed = [r for r in data if r['has_signatures'] == 'YES']
with_reviewers = [r for r in data if r['reviewer_names']]
with_annotations = [r for r in data if r['has_annotations'] == 'YES']

print(f"=" * 80)
print("KINO DOCUMENTS - SIGNATURE & REVIEWER ANALYSIS")
print(f"=" * 80)
print(f"\nTotal PDFs scanned: {len(data)}")
print(f"PDFs with digital signatures: {len(signed)}")
print(f"PDFs with reviewer names: {len(with_reviewers)}")
print(f"PDFs with annotations: {len(with_annotations)}")

if signed:
    print(f"\n{'=' * 80}")
    print("DIGITALLY SIGNED PDFs")
    print(f"{'=' * 80}")
    for r in signed:
        print(f"\nFilename: {r['filename']}")
        print(f"  Signature count: {r['signature_count']}")
        print(f"  Signer names: {r['signer_names']}")
else:
    print(f"\n✓ No digitally signed PDFs found")

if with_reviewers:
    print(f"\n{'=' * 80}")
    print("PDFs WITH REVIEWER NAMES")
    print(f"{'=' * 80}")
    for r in with_reviewers[:20]:  # Show first 20
        print(f"\nFilename: {r['filename']}")
        print(f"  Reviewers: {r['reviewer_names']}")
else:
    print(f"\n✓ No reviewer names found in annotations")

if with_annotations:
    print(f"\n{'=' * 80}")
    print("PDFs WITH ANNOTATIONS (first 10)")
    print(f"{'=' * 80}")
    for r in with_annotations[:10]:
        print(f"\nFilename: {r['filename']}")
        print(f"  Annotation count: {r['annotation_count']}")
        print(f"  Annotation types: {r['annotation_types']}")
        if r['reviewer_names']:
            print(f"  Reviewers: {r['reviewer_names']}")
