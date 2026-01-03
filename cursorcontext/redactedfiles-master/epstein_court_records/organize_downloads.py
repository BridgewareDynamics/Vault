#!/usr/bin/env python3
"""
Organize Downloaded PDFs
Moves PDFs from Downloads folder into case-based subdirectories
Looks for files downloaded with case____filename.pdf pattern
"""

import shutil
import sys
from pathlib import Path

def find_downloads_folder() -> Path:
    """Find the user's Downloads folder."""
    # Common Windows Downloads locations
    possible_paths = [
        Path.home() / "Downloads",
        Path.home() / "Download",
        Path("C:/Users") / Path.home().name / "Downloads"
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    return None

def organize_pdfs(downloads_folder: Path, output_folder: Path):
    """Organize PDFs from Downloads into case folders."""
    
    # Find all PDFs with case prefix pattern (case____filename.pdf)
    pdf_files = list(downloads_folder.glob("*____*.pdf"))
    
    if not pdf_files:
        print("❌ No PDFs with case prefixes found in Downloads folder.")
        print(f"   Looking in: {downloads_folder}")
        print("\n💡 Make sure files are named like: CaseName____filename.pdf")
        return 0
    
    print(f"✅ Found {len(pdf_files)} PDF(s) with case prefixes\n")
    
    # Organize by case
    cases = {}
    for pdf_file in pdf_files:
        # Extract case name from filename (before ____)
        parts = pdf_file.stem.split('____', 1)
        if len(parts) == 2:
            case_name, original_name = parts
            if case_name not in cases:
                cases[case_name] = []
            cases[case_name].append((pdf_file, original_name + '.pdf'))
    
    print(f"📁 Organizing into {len(cases)} case folder(s):\n")
    for case_name in sorted(cases.keys()):
        print(f"  • {case_name}: {len(cases[case_name])} PDF(s)")
    
    # Confirm
    response = input(f"\nMove {len(pdf_files)} files into case folders? (y/n): ").strip().lower()
    if response != 'y':
        print("Cancelled.")
        return 0
    
    # Create case folders and move files
    moved = 0
    failed = 0
    
    for case_name, files in sorted(cases.items()):
        case_folder = output_folder / case_name
        case_folder.mkdir(exist_ok=True, parents=True)
        
        print(f"\n[{case_name}]")
        for source_file, target_name in files:
            target_file = case_folder / target_name
            
            try:
                if target_file.exists():
                    print(f"  ⊙ Skipped (exists): {target_name}")
                else:
                    shutil.move(str(source_file), str(target_file))
                    print(f"  ✓ Moved: {target_name}")
                moved += 1
            except Exception as e:
                print(f"  ✗ Failed: {target_name} - {e}")
                failed += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Moved: {moved} PDF(s)")
    if failed > 0:
        print(f"⚠️  Failed: {failed} PDF(s)")
    print(f"{'='*60}")
    
    print(f"\n📂 Case folders created in: {output_folder}")
    for case_name in sorted(cases.keys()):
        pdf_count = len(list((output_folder / case_name).glob('*.pdf')))
        print(f"  • {case_name}/ ({pdf_count} PDFs)")
    
    return moved

def main():
    print("\n=== PDF Organizer (from Downloads) ===\n")
    
    # Find Downloads folder
    downloads_folder = find_downloads_folder()
    
    if not downloads_folder:
        print("❌ Could not find Downloads folder.")
        downloads_path = input("Enter path to Downloads folder: ").strip()
        downloads_folder = Path(downloads_path)
        
        if not downloads_folder.exists():
            print(f"❌ Folder not found: {downloads_folder}")
            return 1
    
    print(f"📥 Downloads folder: {downloads_folder}")
    
    # Output folder (current directory)
    output_folder = Path.cwd()
    print(f"📂 Output folder: {output_folder}\n")
    
    # Organize PDFs
    moved = organize_pdfs(downloads_folder, output_folder)
    
    if moved > 0:
        print("\n✅ Organization complete!")
        print("\n💡 Tip: You can now run the redaction checker on these folders:")
        print("   cd ..")
        print("   python annotate_overlaps.py --interactive")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(130)
