"""
Unit tests for PDF Overlay Redaction Risk Checker

Tests core functionality without requiring actual PDF files.
Uses fitz.Rect objects to test geometric overlap detection.
"""

import unittest
import fitz
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pdf_overlay_audit as audit


class TestColorDetection(unittest.TestCase):
    """Test black color detection logic."""
    
    def test_black_rgb(self):
        """Test that pure black RGB is detected."""
        self.assertTrue(audit.is_color_black((0.0, 0.0, 0.0)))
    
    def test_near_black_rgb(self):
        """Test that near-black colors are detected."""
        self.assertTrue(audit.is_color_black((0.1, 0.1, 0.1), threshold=0.15))
        self.assertTrue(audit.is_color_black((0.05, 0.08, 0.12), threshold=0.15))
    
    def test_not_black_rgb(self):
        """Test that non-black colors are not detected."""
        self.assertFalse(audit.is_color_black((0.5, 0.5, 0.5), threshold=0.15))
        self.assertFalse(audit.is_color_black((1.0, 1.0, 1.0), threshold=0.15))
        self.assertFalse(audit.is_color_black((0.2, 0.0, 0.0), threshold=0.15))
    
    def test_grayscale_black(self):
        """Test grayscale black detection."""
        self.assertTrue(audit.is_color_black((0.0,)))
        self.assertTrue(audit.is_color_black((0.1,), threshold=0.15))
        self.assertFalse(audit.is_color_black((0.5,), threshold=0.15))
    
    def test_cmyk_black(self):
        """Test CMYK black detection."""
        self.assertTrue(audit.is_color_black((0.0, 0.0, 0.0, 1.0), threshold=0.15))
        self.assertFalse(audit.is_color_black((0.5, 0.5, 0.5, 1.0), threshold=0.15))
    
    def test_empty_color(self):
        """Test that empty color tuple is handled."""
        self.assertFalse(audit.is_color_black(()))
        self.assertFalse(audit.is_color_black(None))


class TestOverlapComputation(unittest.TestCase):
    """Test rectangle overlap area computation."""
    
    def test_no_overlap(self):
        """Test that non-overlapping rects return 0 area."""
        rect1 = fitz.Rect(0, 0, 10, 10)
        rect2 = fitz.Rect(20, 20, 30, 30)
        self.assertEqual(audit.compute_overlap_area(rect1, rect2), 0.0)
    
    def test_complete_overlap(self):
        """Test that identical rects return full area."""
        rect1 = fitz.Rect(0, 0, 10, 10)
        rect2 = fitz.Rect(0, 0, 10, 10)
        expected_area = 100.0  # 10 * 10
        self.assertAlmostEqual(
            audit.compute_overlap_area(rect1, rect2),
            expected_area,
            places=1
        )
    
    def test_partial_overlap(self):
        """Test partial overlap calculation."""
        rect1 = fitz.Rect(0, 0, 10, 10)
        rect2 = fitz.Rect(5, 5, 15, 15)
        expected_area = 25.0  # 5 * 5 overlap
        self.assertAlmostEqual(
            audit.compute_overlap_area(rect1, rect2),
            expected_area,
            places=1
        )
    
    def test_contained_rect(self):
        """Test when one rect is inside another."""
        rect1 = fitz.Rect(0, 0, 20, 20)  # Large rect
        rect2 = fitz.Rect(5, 5, 10, 10)   # Small rect inside
        expected_area = 25.0  # 5 * 5 (area of smaller rect)
        self.assertAlmostEqual(
            audit.compute_overlap_area(rect1, rect2),
            expected_area,
            places=1
        )
    
    def test_edge_touching(self):
        """Test rects that only touch at edges."""
        rect1 = fitz.Rect(0, 0, 10, 10)
        rect2 = fitz.Rect(10, 0, 20, 10)
        # Edge touching should have minimal/zero area
        self.assertLess(audit.compute_overlap_area(rect1, rect2), 1.0)
    
    def test_corner_overlap(self):
        """Test small corner overlap."""
        rect1 = fitz.Rect(0, 0, 10, 10)
        rect2 = fitz.Rect(9, 9, 20, 20)
        expected_area = 1.0  # 1 * 1 corner
        self.assertAlmostEqual(
            audit.compute_overlap_area(rect1, rect2),
            expected_area,
            places=1
        )


class TestOverlapDetection(unittest.TestCase):
    """Test overlap detection between black rects and text rects."""
    
    def test_no_overlaps(self):
        """Test when no text overlaps with black rects."""
        black_rects = [fitz.Rect(0, 0, 10, 10)]
        text_rects = [
            fitz.Rect(20, 20, 30, 25),
            fitz.Rect(20, 30, 30, 35)
        ]
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=4.0)
        self.assertEqual(count, 0)
    
    def test_single_overlap(self):
        """Test single text rect overlapping black rect."""
        black_rects = [fitz.Rect(0, 0, 20, 20)]
        text_rects = [
            fitz.Rect(5, 5, 15, 10),  # Overlaps
            fitz.Rect(50, 50, 60, 55)  # Doesn't overlap
        ]
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=4.0)
        self.assertEqual(count, 1)
    
    def test_multiple_overlaps(self):
        """Test multiple text rects overlapping."""
        black_rects = [fitz.Rect(0, 0, 30, 30)]
        text_rects = [
            fitz.Rect(5, 5, 10, 10),   # Overlaps
            fitz.Rect(15, 15, 20, 20),  # Overlaps
            fitz.Rect(22, 22, 27, 27)   # Overlaps
        ]
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=4.0)
        self.assertEqual(count, 3)
    
    def test_min_overlap_threshold(self):
        """Test that minimum overlap area threshold works."""
        black_rects = [fitz.Rect(0, 0, 10, 10)]
        # Small overlap (1 sq point)
        text_rects = [fitz.Rect(9, 9, 15, 15)]
        
        # With threshold = 4.0, should not count
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=4.0)
        self.assertEqual(count, 0)
        
        # With threshold = 0.5, should count
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=0.5)
        self.assertEqual(count, 1)
    
    def test_multiple_black_rects(self):
        """Test text overlapping multiple black rects."""
        black_rects = [
            fitz.Rect(0, 0, 10, 10),
            fitz.Rect(20, 0, 30, 10)
        ]
        # This text rect overlaps first black rect only
        text_rects = [fitz.Rect(5, 5, 8, 8)]
        
        count = audit.detect_overlaps(black_rects, text_rects, min_overlap_area=4.0)
        self.assertEqual(count, 1)  # Should count text rect once
    
    def test_empty_lists(self):
        """Test with empty input lists."""
        self.assertEqual(
            audit.detect_overlaps([], [], min_overlap_area=4.0),
            0
        )
        self.assertEqual(
            audit.detect_overlaps([fitz.Rect(0, 0, 10, 10)], [], min_overlap_area=4.0),
            0
        )
        self.assertEqual(
            audit.detect_overlaps([], [fitz.Rect(0, 0, 10, 10)], min_overlap_area=4.0),
            0
        )


class TestPageRiskDataclass(unittest.TestCase):
    """Test PageRisk dataclass."""
    
    def test_page_risk_creation(self):
        """Test creating PageRisk objects."""
        risk = audit.PageRisk(
            page_number=1,
            black_rect_count=5,
            overlap_count=3
        )
        self.assertEqual(risk.page_number, 1)
        self.assertEqual(risk.black_rect_count, 5)
        self.assertEqual(risk.overlap_count, 3)
        self.assertEqual(risk.heuristic, "black_fill_rect_overlap_text")


class TestPDFRiskReportDataclass(unittest.TestCase):
    """Test PDFRiskReport dataclass."""
    
    def test_report_creation(self):
        """Test creating PDFRiskReport objects."""
        risks = [
            audit.PageRisk(page_number=1, black_rect_count=2, overlap_count=1),
            audit.PageRisk(page_number=5, black_rect_count=3, overlap_count=2)
        ]
        
        report = audit.PDFRiskReport(
            filename="test.pdf",
            total_pages=10,
            flagged_pages=risks
        )
        
        self.assertEqual(report.filename, "test.pdf")
        self.assertEqual(report.total_pages, 10)
        self.assertEqual(len(report.flagged_pages), 2)
        self.assertIsNone(report.error)
    
    def test_report_with_error(self):
        """Test report with error."""
        report = audit.PDFRiskReport(
            filename="encrypted.pdf",
            total_pages=0,
            flagged_pages=[],
            error="PDF is encrypted"
        )
        
        self.assertEqual(report.error, "PDF is encrypted")
        self.assertEqual(len(report.flagged_pages), 0)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(run_tests())
