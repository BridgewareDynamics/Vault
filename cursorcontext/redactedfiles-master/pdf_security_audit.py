#!/usr/bin/env python3
"""
PDF Security Audit - Non-extractive security and privacy checks

This module provides additional security checks for PDFs without extracting
sensitive content. It detects potential privacy/security issues like:
- Metadata leakage
- Embedded attachments
- Annotations/comments
- Form fields
- Optional content groups (layers)
- Incremental updates
- JavaScript/actions
- Thumbnails

All checks are non-extractive - we report presence and counts only, not content.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List
import fitz

# Optional: pikepdf for deeper structure inspection
try:
    import pikepdf
    HAS_PIKEPDF = True
except ImportError:
    HAS_PIKEPDF = False


@dataclass
class SecurityFindings:
    """Security and privacy findings for a PDF (non-extractive)."""
    has_metadata: bool = False
    metadata_keys: List[str] = field(default_factory=list)
    has_attachments: bool = False
    attachment_count: int = 0
    has_annotations: bool = False
    annotation_count: int = 0
    has_forms: bool = False
    form_field_count: int = 0
    has_layers: bool = False
    layer_count: int = 0
    has_javascript: bool = False
    has_actions: bool = False
    has_thumbnails: bool = False
    incremental_updates_suspected: bool = False
    notes: List[str] = field(default_factory=list)


def check_metadata(doc: fitz.Document) -> tuple[bool, List[str]]:
    """
    Check for metadata presence (keys only, no values).
    
    Returns:
        (has_metadata, metadata_keys)
    """
    try:
        metadata = doc.metadata
        if not metadata:
            return False, []
        
        # Collect non-empty keys
        keys = [k for k, v in metadata.items() if v]
        return len(keys) > 0, keys
    except Exception:
        return False, []


def check_attachments(doc: fitz.Document) -> tuple[bool, int]:
    """
    Check for embedded file attachments.
    
    Returns:
        (has_attachments, count)
    """
    try:
        if hasattr(doc, 'embfile_count'):
            count = doc.embfile_count()
            return count > 0, count
        return False, 0
    except Exception:
        return False, 0


def check_annotations(doc: fitz.Document) -> tuple[bool, int]:
    """
    Check for annotations across all pages.
    
    Returns:
        (has_annotations, count)
    """
    try:
        total_count = 0
        for page in doc:
            try:
                annots = list(page.annots())
                total_count += len(annots)
            except Exception:
                continue
        
        return total_count > 0, total_count
    except Exception:
        return False, 0


def check_forms(doc: fitz.Document) -> tuple[bool, int]:
    """
    Check for form fields (AcroForm).
    
    Returns:
        (has_forms, field_count)
    """
    try:
        total_count = 0
        for page in doc:
            try:
                widgets = page.widgets()
                if widgets:
                    total_count += len(widgets)
            except Exception:
                continue
        
        return total_count > 0, total_count
    except Exception:
        return False, 0


def check_layers_pikepdf(pdf_path: Path) -> tuple[bool, int]:
    """
    Check for Optional Content Groups (layers) using pikepdf.
    
    Returns:
        (has_layers, layer_count)
    """
    if not HAS_PIKEPDF:
        return False, 0
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            catalog = pdf.Root
            
            # Check for /OCProperties
            if '/OCProperties' in catalog:
                ocprops = catalog['/OCProperties']
                
                # Check for /OCGs array
                if '/OCGs' in ocprops:
                    ocgs = ocprops['/OCGs']
                    if hasattr(ocgs, '__len__'):
                        return True, len(ocgs)
                    return True, 1
            
            return False, 0
    except Exception:
        return False, 0


def check_javascript_actions_pikepdf(pdf_path: Path) -> tuple[bool, bool]:
    """
    Check for JavaScript and actions using pikepdf.
    
    Returns:
        (has_javascript, has_actions)
    """
    if not HAS_PIKEPDF:
        return False, False
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            catalog = pdf.Root
            has_js = False
            has_actions = False
            
            # Check for /Names /JavaScript
            if '/Names' in catalog:
                names = catalog['/Names']
                if '/JavaScript' in names:
                    has_js = True
            
            # Check for /OpenAction
            if '/OpenAction' in catalog:
                has_actions = True
            
            # Check for /AA (Additional Actions)
            if '/AA' in catalog:
                has_actions = True
            
            return has_js, has_actions
    except Exception:
        return False, False


def check_thumbnails_pikepdf(pdf_path: Path) -> bool:
    """
    Check for thumbnail images using pikepdf.
    
    Returns:
        has_thumbnails
    """
    if not HAS_PIKEPDF:
        return False
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            for page in pdf.pages:
                if '/Thumb' in page:
                    return True
            return False
    except Exception:
        return False


def check_incremental_updates(pdf_path: Path) -> bool:
    """
    Check for incremental updates by counting startxref occurrences.
    
    Returns:
        incremental_updates_suspected
    """
    try:
        # Read last 65KB of file (where xref tables typically are)
        with open(pdf_path, 'rb') as f:
            f.seek(0, 2)  # Seek to end
            size = f.tell()
            
            # Read last chunk
            chunk_size = min(65536, size)
            f.seek(max(0, size - chunk_size))
            data = f.read()
        
        # Count startxref occurrences
        count = data.count(b'startxref')
        
        # More than one startxref suggests incremental updates
        return count > 1
    except Exception:
        return False


def audit_pdf_security(pdf_path: Path) -> SecurityFindings:
    """
    Perform comprehensive security audit on a PDF.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        SecurityFindings dataclass with all check results
    """
    findings = SecurityFindings()
    
    try:
        # Open with PyMuPDF for basic checks
        doc = fitz.open(str(pdf_path))
        
        if doc.is_encrypted and not doc.authenticate(""):
            findings.notes.append("PDF is encrypted - some checks may be incomplete")
        
        # Metadata check
        findings.has_metadata, findings.metadata_keys = check_metadata(doc)
        
        # Attachments check
        findings.has_attachments, findings.attachment_count = check_attachments(doc)
        
        # Annotations check
        findings.has_annotations, findings.annotation_count = check_annotations(doc)
        
        # Forms check
        findings.has_forms, findings.form_field_count = check_forms(doc)
        
        doc.close()
        
        # Pikepdf checks (if available)
        if HAS_PIKEPDF:
            findings.has_layers, findings.layer_count = check_layers_pikepdf(pdf_path)
            findings.has_javascript, findings.has_actions = check_javascript_actions_pikepdf(pdf_path)
            findings.has_thumbnails = check_thumbnails_pikepdf(pdf_path)
        else:
            findings.notes.append("pikepdf not available - some checks skipped")
        
        # Incremental updates check (works without pikepdf)
        findings.incremental_updates_suspected = check_incremental_updates(pdf_path)
        
    except Exception as e:
        findings.notes.append(f"Error during security audit: {type(e).__name__}")
    
    return findings


def format_security_report(findings: SecurityFindings, verbose: bool = True) -> str:
    """
    Format security findings as a text report.
    
    Args:
        findings: SecurityFindings dataclass
        verbose: If True, include all details
    
    Returns:
        Formatted text report
    """
    lines = []
    lines.append("SECURITY & PRIVACY AUDIT")
    lines.append("=" * 50)
    
    # Metadata
    if findings.has_metadata:
        lines.append(f"⚠ Metadata Present: {len(findings.metadata_keys)} key(s)")
        if verbose:
            lines.append(f"  Keys: {', '.join(findings.metadata_keys)}")
    else:
        lines.append("✓ No metadata detected")
    
    # Attachments
    if findings.has_attachments:
        lines.append(f"⚠ Embedded Attachments: {findings.attachment_count} file(s)")
    else:
        lines.append("✓ No attachments")
    
    # Annotations
    if findings.has_annotations:
        lines.append(f"⚠ Annotations/Comments: {findings.annotation_count} annotation(s)")
    else:
        lines.append("✓ No annotations")
    
    # Forms
    if findings.has_forms:
        lines.append(f"⚠ Form Fields: {findings.form_field_count} field(s)")
    else:
        lines.append("✓ No form fields")
    
    # Layers
    if findings.has_layers:
        lines.append(f"⚠ Optional Content Groups: {findings.layer_count} layer(s)")
    else:
        lines.append("✓ No layers detected")
    
    # JavaScript
    if findings.has_javascript:
        lines.append("⚠ JavaScript detected")
    else:
        lines.append("✓ No JavaScript")
    
    # Actions
    if findings.has_actions:
        lines.append("⚠ Document actions detected")
    else:
        lines.append("✓ No document actions")
    
    # Thumbnails
    if findings.has_thumbnails:
        lines.append("⚠ Thumbnail images present")
    else:
        lines.append("✓ No thumbnails")
    
    # Incremental updates
    if findings.incremental_updates_suspected:
        lines.append("⚠ Incremental updates suspected (multiple revisions)")
    else:
        lines.append("✓ No incremental updates detected")
    
    # Notes
    if findings.notes:
        lines.append("\nNotes:")
        for note in findings.notes:
            lines.append(f"  • {note}")
    
    return "\n".join(lines)
