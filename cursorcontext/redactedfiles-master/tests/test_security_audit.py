#!/usr/bin/env python3
"""
Unit tests for PDF Security Audit module
"""

import unittest
from pathlib import Path
from pdf_security_audit import SecurityFindings, format_security_report


class TestSecurityFindings(unittest.TestCase):
    """Test SecurityFindings dataclass."""
    
    def test_default_findings(self):
        """Test default SecurityFindings initialization."""
        findings = SecurityFindings()
        
        self.assertFalse(findings.has_metadata)
        self.assertEqual(findings.metadata_keys, [])
        self.assertFalse(findings.has_attachments)
        self.assertEqual(findings.attachment_count, 0)
        self.assertFalse(findings.has_annotations)
        self.assertEqual(findings.annotation_count, 0)
        self.assertFalse(findings.has_forms)
        self.assertEqual(findings.form_field_count, 0)
        self.assertFalse(findings.has_layers)
        self.assertEqual(findings.layer_count, 0)
        self.assertFalse(findings.has_javascript)
        self.assertFalse(findings.has_actions)
        self.assertFalse(findings.has_thumbnails)
        self.assertFalse(findings.incremental_updates_suspected)
        self.assertEqual(findings.notes, [])
    
    def test_findings_with_issues(self):
        """Test SecurityFindings with security issues."""
        findings = SecurityFindings(
            has_metadata=True,
            metadata_keys=["author", "producer"],
            has_attachments=True,
            attachment_count=2,
            has_javascript=True,
            notes=["Test note"]
        )
        
        self.assertTrue(findings.has_metadata)
        self.assertEqual(len(findings.metadata_keys), 2)
        self.assertTrue(findings.has_attachments)
        self.assertEqual(findings.attachment_count, 2)
        self.assertTrue(findings.has_javascript)
        self.assertEqual(len(findings.notes), 1)


class TestFormatSecurityReport(unittest.TestCase):
    """Test security report formatting."""
    
    def test_format_clean_report(self):
        """Test formatting report with no issues."""
        findings = SecurityFindings()
        report = format_security_report(findings, verbose=False)
        
        self.assertIn("SECURITY & PRIVACY AUDIT", report)
        self.assertIn("✓ No metadata detected", report)
        self.assertIn("✓ No attachments", report)
        self.assertIn("✓ No annotations", report)
    
    def test_format_report_with_issues(self):
        """Test formatting report with security issues."""
        findings = SecurityFindings(
            has_metadata=True,
            metadata_keys=["author", "title"],
            has_javascript=True,
            has_actions=True,
            incremental_updates_suspected=True
        )
        report = format_security_report(findings, verbose=True)
        
        self.assertIn("⚠ Metadata Present", report)
        self.assertIn("Keys: author, title", report)
        self.assertIn("⚠ JavaScript detected", report)
        self.assertIn("⚠ Document actions detected", report)
        self.assertIn("⚠ Incremental updates suspected", report)
    
    def test_format_report_with_notes(self):
        """Test formatting report with notes."""
        findings = SecurityFindings(
            notes=["PDF is encrypted", "pikepdf not available"]
        )
        report = format_security_report(findings, verbose=True)
        
        self.assertIn("Notes:", report)
        self.assertIn("PDF is encrypted", report)
        self.assertIn("pikepdf not available", report)


if __name__ == "__main__":
    unittest.main()
