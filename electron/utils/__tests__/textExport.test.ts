import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import {
  buildRtfContent,
  exportPlainTextToDocx,
  htmlToExportPlainText,
} from '../textExport';

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
  },
}));

describe('textExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('htmlToExportPlainText preserves line breaks from paragraphs', () => {
    const result = htmlToExportPlainText('<p>Line one</p><p>Line two</p>');
    expect(result).toContain('Line one');
    expect(result).toContain('Line two');
  });

  it('buildRtfContent escapes braces and backslashes', () => {
    const rtf = buildRtfContent('brace { test }');
    expect(rtf).toContain('\\{');
    expect(rtf).toContain('\\}');
  });

  it('exportPlainTextToDocx writes a DOCX buffer', async () => {
    await exportPlainTextToDocx('Hello\nWorld', '/tmp/test.docx');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/test.docx',
      expect.any(Buffer),
    );
    const buffer = vi.mocked(fs.writeFile).mock.calls[0][1] as Buffer;
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
