#!/usr/bin/env python3
"""
Advanced PDF Security Audit - Comprehensive privacy and security analysis

This module provides deep security checks for PDFs, detecting:

1. Hidden Metadata (author, organization, software, dates)
2. Invisible/Hidden Text (white-on-white, off-page, hidden layers, OCR)
3. Broken/Fake Redaction (overlay redactions)
4. Embedded Files & Attachments
5. Form Fields & Comments (including reviewer info)
6. OCR & Scanned Documents (text layers)
7. JavaScript (potentially malicious)
8. External Resources & Links (tracking, phoning home)
9. Digital Signatures & Certificates
10. File History & Version Leakage
11. Accessibility Data (structured tags, alt text)
12. Watermarks & Printer Traces

All checks are non-extractive where possible.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List, Dict, Tuple
import fitz
import re

# Optional: pikepdf for deeper structure inspection
try:
    import pikepdf
    HAS_PIKEPDF = True
except ImportError:
    HAS_PIKEPDF = False


@dataclass
class AdvancedSecurityFindings:
    """Comprehensive security and privacy findings for a PDF."""
    
    # 1. Metadata
    has_metadata: bool = False
    metadata_keys: List[str] = field(default_factory=list)
    metadata_details: Dict[str, str] = field(default_factory=dict)
    
    # 2. Hidden/Invisible Text
    has_hidden_text: bool = False
    hidden_text_types: List[str] = field(default_factory=list)
    white_on_white_pages: List[int] = field(default_factory=list)
    offpage_text_pages: List[int] = field(default_factory=list)
    
    # 3. Overlay Redactions (from existing overlay checker)
    overlay_risk: str = "NO"
    
    # 4. Attachments
    has_attachments: bool = False
    attachment_count: int = 0
    attachment_names: List[str] = field(default_factory=list)
    
    # 5. Forms & Comments
    has_annotations: bool = False
    annotation_count: int = 0
    annotation_types: List[str] = field(default_factory=list)
    has_forms: bool = False
    form_field_count: int = 0
    reviewer_names: List[str] = field(default_factory=list)
    
    # 6. OCR & Scanned Documents
    has_ocr_layer: bool = False
    ocr_pages: List[int] = field(default_factory=list)
    is_scanned: bool = False
    
    # 7. JavaScript
    has_javascript: bool = False
    javascript_count: int = 0
    
    # 8. External Resources
    has_external_links: bool = False
    external_urls: List[str] = field(default_factory=list)
    has_remote_resources: bool = False
    
    # 9. Digital Signatures
    has_signatures: bool = False
    signature_count: int = 0
    signer_names: List[str] = field(default_factory=list)
    
    # 10. Version History
    has_layers: bool = False
    layer_count: int = 0
    incremental_updates: bool = False
    version_count: int = 0
    
    # 11. Accessibility Data
    has_structure_tags: bool = False
    has_alt_text: bool = False
    
    # 12. Watermarks
    has_watermarks: bool = False
    has_actions: bool = False
    has_thumbnails: bool = False
    
    # Notes and warnings
    notes: List[str] = field(default_factory=list)
    risk_score: int = 0  # 0-100 based on findings


# ==================== ADVANCED CHECK FUNCTIONS ====================

def check_metadata_detailed(doc: fitz.Document) -> Tuple[bool, List[str], Dict[str, str]]:
    """Extract detailed metadata including sensitive info."""
    try:
        metadata = doc.metadata
        if not metadata:
            return False, [], {}
        
        keys = []
        details = {}
        
        for k, v in metadata.items():
            if v:
                keys.append(k)
                # Store actual values for analysis (but marked as sensitive)
                details[k] = str(v)[:100]  # Truncate long values
        
        return len(keys) > 0, keys, details
    except Exception:
        return False, [], {}


def check_hidden_text(doc: fitz.Document) -> Tuple[bool, List[str], List[int], List[int]]:
    """
    Detect hidden or invisible text:
    - White-on-white text
    - Off-page text
    - Text with zero opacity
    """
    import sys
    hidden_types = []
    white_on_white_pages = []
    offpage_pages = []
    total_pages = len(doc)
    
    try:
        print(f"PROGRESS:Scanning {total_pages} page(s) for hidden and invisible text...", file=sys.stderr, flush=True)
        
        for page_num, page in enumerate(doc, 1):
            # Progress update every 10 pages or on last page
            if page_num % 10 == 0 or page_num == total_pages:
                print(f"PROGRESS:Analyzing page {page_num}/{total_pages} for hidden text patterns...", file=sys.stderr, flush=True)
            
            page_rect = page.rect
            
            # Get all text with detailed info
            text_dict = page.get_text("dict")
            
            white_on_white_found = False
            offpage_found = False
            
            for block in text_dict.get("blocks", []):
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            # Check for white or near-white text color
                            color = span.get("color", 0)
                            
                            # Color close to white (RGB close to 16777215 = 0xFFFFFF)
                            if color > 16710886:  # ~99% white
                                if not white_on_white_found:
                                    white_on_white_pages.append(page_num)
                                    white_on_white_found = True
                                if "white-on-white text" not in hidden_types:
                                    hidden_types.append("white-on-white text")
                            
                            # Check for text outside visible page bounds
                            bbox = span.get("bbox", [0, 0, 0, 0])
                            if bbox[0] < page_rect.x0 - 100 or bbox[1] < page_rect.y0 - 100 or \
                               bbox[2] > page_rect.x1 + 100 or bbox[3] > page_rect.y1 + 100:
                                if not offpage_found:
                                    offpage_pages.append(page_num)
                                    offpage_found = True
                                if "off-page text" not in hidden_types:
                                    hidden_types.append("off-page text")
            
            # Report findings on current page
            if white_on_white_found or offpage_found:
                findings = []
                if white_on_white_found:
                    findings.append("white-on-white text")
                if offpage_found:
                    findings.append("off-page text")
                print(f"PROGRESS:Page {page_num}: Found {', '.join(findings)}", file=sys.stderr, flush=True)
        
        has_hidden = len(hidden_types) > 0
        if has_hidden:
            print(f"PROGRESS:Hidden text scan complete. Found {len(white_on_white_pages)} page(s) with white-on-white text, {len(offpage_pages)} page(s) with off-page text.", file=sys.stderr, flush=True)
        else:
            print(f"PROGRESS:Hidden text scan complete. No hidden text detected.", file=sys.stderr, flush=True)
        
        return has_hidden, hidden_types, white_on_white_pages, offpage_pages
        
    except Exception:
        return False, [], [], []


def check_ocr_layer(doc: fitz.Document) -> Tuple[bool, List[int], bool]:
    """
    Detect OCR text layers and scanned documents.
    
    OCR indicators:
    - Text + Image combination on same page
    - Very large images with text overlay
    - Specific PDF structure from OCR software
    """
    ocr_pages = []
    is_scanned = False
    
    try:
        total_image_pages = 0
        total_text_pages = 0
        
        for page_num, page in enumerate(doc, 1):
            images = page.get_images()
            text = page.get_text().strip()
            
            has_images = len(images) > 0
            has_text = len(text) > 0
            
            if has_images:
                total_image_pages += 1
                
                # Check if image is large (likely scanned page)
                if images:
                    # Get first image info
                    img_info = images[0]
                    xref = img_info[0]
                    
                    try:
                        img = doc.extract_image(xref)
                        width = img.get("width", 0)
                        height = img.get("height", 0)
                        
                        # Large image (likely full page scan) with text = OCR
                        if width > 1000 and height > 1000 and has_text:
                            ocr_pages.append(page_num)
                    except:
                        pass
            
            if has_text:
                total_text_pages += 1
        
        # If most pages have both large images and text, it's likely OCR'd
        if len(ocr_pages) > len(doc) * 0.3:  # 30% threshold
            is_scanned = True
        
        # If all pages have images but also text, likely scanned+OCR
        if total_image_pages == len(doc) and total_text_pages == len(doc):
            is_scanned = True
        
        has_ocr = len(ocr_pages) > 0
        return has_ocr, ocr_pages, is_scanned
        
    except Exception:
        return False, [], False


def check_external_links(doc: fitz.Document) -> Tuple[bool, List[str]]:
    """Extract external URLs and links."""
    urls = set()
    
    try:
        for page in doc:
            links = page.get_links()
            
            for link in links:
                uri = link.get("uri", "")
                if uri and (uri.startswith("http://") or uri.startswith("https://")):
                    urls.add(uri)
        
        url_list = sorted(list(urls))
        return len(url_list) > 0, url_list
        
    except Exception:
        return False, []


def check_signatures(doc: fitz.Document) -> Tuple[bool, int, List[str]]:
    """Check for digital signatures."""
    try:
        # PyMuPDF doesn't have full signature support, but we can check widgets
        signature_count = 0
        signer_names = []
        
        for page in doc:
            widgets = page.widgets()
            if widgets:
                for widget in widgets:
                    # Signature fields have specific field type
                    field_type = widget.field_type
                    if field_type == 7:  # Signature field type
                        signature_count += 1
                        
                        # Try to get field name
                        field_name = widget.field_name
                        if field_name:
                            signer_names.append(field_name)
        
        has_sigs = signature_count > 0
        return has_sigs, signature_count, signer_names
        
    except Exception:
        return False, 0, []


def check_structure_tags(pdf_path: Path) -> Tuple[bool, bool]:
    """Check for PDF structure tags and alt text (accessibility)."""
    if not HAS_PIKEPDF:
        return False, False
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            catalog = pdf.Root
            
            # Check for /StructTreeRoot (structure tags)
            has_structure = '/StructTreeRoot' in catalog
            
            # Check for /MarkInfo
            has_alt = False
            if '/MarkInfo' in catalog:
                mark_info = catalog['/MarkInfo']
                if '/Marked' in mark_info:
                    has_alt = bool(mark_info['/Marked'])
            
            return has_structure, has_alt
            
    except Exception:
        return False, False


def check_watermarks_advanced(doc: fitz.Document) -> bool:
    """
    Detect potential watermarks:
    - Repeated text/images across pages
    - Semi-transparent overlays
    - Fixed position elements
    """
    try:
        # Simple heuristic: check for repeated text at same position
        position_text = {}
        
        for page in doc:
            text_instances = page.get_text("blocks")
            
            for block in text_instances:
                if len(block) >= 5:
                    x0, y0, x1, y1, text, block_no, block_type = block[:7]
                    
                    # Create position key (rounded to avoid floating point issues)
                    pos_key = (round(x0), round(y0), round(x1 - x0), round(y1 - y0))
                    
                    if pos_key not in position_text:
                        position_text[pos_key] = []
                    position_text[pos_key].append(text.strip())
        
        # Check if any position has same text on multiple pages
        for pos, texts in position_text.items():
            if len(texts) > 3 and len(set(texts)) == 1:  # Same text, 3+ times
                return True
        
        return False
        
    except Exception:
        return False


def check_reviewer_info(doc: fitz.Document) -> List[str]:
    """Extract reviewer/author names from annotations."""
    reviewers = set()
    
    try:
        for page in doc:
            annots = page.annots()
            if annots:
                for annot in annots:
                    try:
                        info = annot.info
                        
                        # Get author/title
                        author = info.get("title", "").strip()
                        if author and author not in ["", "None"]:
                            reviewers.add(author)
                        
                        subject = info.get("subject", "").strip()
                        if subject and subject not in ["", "None"]:
                            reviewers.add(subject)
                            
                    except:
                        continue
        
        return sorted(list(reviewers))
        
    except Exception:
        return []


def check_annotation_types(doc: fitz.Document) -> List[str]:
    """Get unique annotation types present in PDF."""
    types = set()
    
    try:
        for page in doc:
            annots = page.annots()
            if annots:
                for annot in annots:
                    try:
                        annot_type = annot.type[1]  # Get type name
                        types.add(annot_type)
                    except:
                        continue
        
        return sorted(list(types))
        
    except Exception:
        return []


def check_attachment_names(doc: fitz.Document) -> List[str]:
    """Get names of all embedded attachments."""
    names = []
    
    try:
        if hasattr(doc, 'embfile_names'):
            names = doc.embfile_names()
            if names is None:
                names = []
        
        return names
        
    except Exception:
        return []


def check_remote_resources(pdf_path: Path) -> bool:
    """Check for external/remote resource references."""
    if not HAS_PIKEPDF:
        return False
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            # Check for /URI or /URL in various locations
            for page in pdf.pages:
                if '/Annots' in page:
                    annots = page['/Annots']
                    for annot in annots:
                        try:
                            if '/A' in annot:
                                action = annot['/A']
                                if '/URI' in action or '/URL' in action:
                                    return True
                        except:
                            continue
            
            return False
            
    except Exception:
        return False


def calculate_risk_score(findings: AdvancedSecurityFindings) -> int:
    """
    Calculate risk score (0-100) based on findings.
    
    High risk:
    - Hidden text (15 pts)
    - Overlay redactions (20 pts)
    - Digital signatures with PII (10 pts)
    - JavaScript (15 pts)
    - External links/tracking (10 pts)
    
    Medium risk:
    - Metadata (5 pts)
    - Attachments (5 pts)
    - Annotations with reviewer names (5 pts)
    - OCR layers (3 pts)
    - Incremental updates (5 pts)
    
    Low risk:
    - Forms (2 pts)
    - Thumbnails (2 pts)
    - Structure tags (1 pt)
    """
    score = 0
    
    # High risk items
    if findings.has_hidden_text:
        score += 15
    if findings.overlay_risk in ["YES", "MAYBE"]:
        score += 20 if findings.overlay_risk == "YES" else 10
    if findings.has_signatures:
        score += 10
    if findings.has_javascript:
        score += 15
    if findings.has_external_links or findings.has_remote_resources:
        score += 10
    
    # Medium risk items
    if findings.has_metadata:
        score += 5
    if findings.has_attachments:
        score += 5
    if findings.reviewer_names:
        score += 5
    if findings.has_ocr_layer:
        score += 3
    if findings.incremental_updates:
        score += 5
    
    # Low risk items
    if findings.has_forms:
        score += 2
    if findings.has_thumbnails:
        score += 2
    if findings.has_structure_tags:
        score += 1
    
    return min(score, 100)


# ==================== MAIN AUDIT FUNCTION ====================

def audit_pdf_advanced(pdf_path: Path) -> AdvancedSecurityFindings:
    """
    Perform comprehensive advanced security audit on a PDF.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        AdvancedSecurityFindings dataclass with all check results
    """
    findings = AdvancedSecurityFindings()
    
    try:
        import sys
        print("PROGRESS:Opening PDF for advanced security analysis...", file=sys.stderr, flush=True)
        # Open with PyMuPDF
        doc = fitz.open(str(pdf_path))
        
        if doc.is_encrypted and not doc.authenticate(""):
            findings.notes.append("PDF is encrypted - some checks incomplete")
        
        print("PROGRESS:Analyzing detailed metadata...", file=sys.stderr, flush=True)
        # 1. Detailed Metadata
        findings.has_metadata, findings.metadata_keys, findings.metadata_details = \
            check_metadata_detailed(doc)
        
        # 2. Hidden Text (progress messages are handled inside the function)
        findings.has_hidden_text, findings.hidden_text_types, \
        findings.white_on_white_pages, findings.offpage_text_pages = \
            check_hidden_text(doc)
        
        print("PROGRESS:Checking embedded attachments...", file=sys.stderr, flush=True)
        # 4. Attachments with names
        from pdf_security_audit import check_attachments
        findings.has_attachments, findings.attachment_count = check_attachments(doc)
        findings.attachment_names = check_attachment_names(doc)
        
        print("PROGRESS:Analyzing annotations, forms, and reviewer information...", file=sys.stderr, flush=True)
        # 5. Annotations with types and reviewers
        from pdf_security_audit import check_annotations, check_forms
        findings.has_annotations, findings.annotation_count = check_annotations(doc)
        findings.annotation_types = check_annotation_types(doc)
        findings.reviewer_names = check_reviewer_info(doc)
        findings.has_forms, findings.form_field_count = check_forms(doc)
        
        print("PROGRESS:Detecting OCR layers and scanned content...", file=sys.stderr, flush=True)
        # 6. OCR Detection
        findings.has_ocr_layer, findings.ocr_pages, findings.is_scanned = \
            check_ocr_layer(doc)
        
        print("PROGRESS:Scanning for external links and URLs...", file=sys.stderr, flush=True)
        # 8. External Links
        findings.has_external_links, findings.external_urls = \
            check_external_links(doc)
        
        print("PROGRESS:Checking for digital signatures...", file=sys.stderr, flush=True)
        # 9. Digital Signatures
        findings.has_signatures, findings.signature_count, findings.signer_names = \
            check_signatures(doc)
        
        print("PROGRESS:Detecting watermarks...", file=sys.stderr, flush=True)
        # 12. Watermarks
        findings.has_watermarks = check_watermarks_advanced(doc)
        
        doc.close()
        
        # Pikepdf-based checks
        if HAS_PIKEPDF:
            print("PROGRESS:Running deep structure analysis (JavaScript, layers, accessibility)...", file=sys.stderr, flush=True)
            from pdf_security_audit import (check_layers_pikepdf, 
                                           check_javascript_actions_pikepdf,
                                           check_thumbnails_pikepdf)
            
            # 7. JavaScript
            findings.has_javascript, findings.has_actions = \
                check_javascript_actions_pikepdf(pdf_path)
            
            # Count JavaScript instances
            if findings.has_javascript:
                findings.javascript_count = 1  # Simplified
            
            # 8. Remote Resources
            findings.has_remote_resources = check_remote_resources(pdf_path)
            
            # 10. Version History
            findings.has_layers, findings.layer_count = check_layers_pikepdf(pdf_path)
            
            # 11. Accessibility
            findings.has_structure_tags, findings.has_alt_text = \
                check_structure_tags(pdf_path)
            
            # 12. Thumbnails
            findings.has_thumbnails = check_thumbnails_pikepdf(pdf_path)
            
        else:
            findings.notes.append("pikepdf not available - advanced checks skipped")
        
        print("PROGRESS:Checking for incremental updates and version history...", file=sys.stderr, flush=True)
        # 10. Incremental Updates (no pikepdf needed)
        from pdf_security_audit import check_incremental_updates
        findings.incremental_updates = check_incremental_updates(pdf_path)
        
        # Count versions (simplified)
        if findings.incremental_updates:
            findings.version_count = 2  # At least 2 if incremental
        
        print("PROGRESS:Calculating overall risk score...", file=sys.stderr, flush=True)
        # Calculate risk score
        findings.risk_score = calculate_risk_score(findings)
        
    except Exception as e:
        findings.notes.append(f"Error during audit: {type(e).__name__}: {str(e)}")
    
    return findings
