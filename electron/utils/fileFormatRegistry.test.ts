import { describe, it, expect } from 'vitest';
import {
  detectFileConverterCategory,
  getOutputFormatsForPath,
  isConversionSupported,
  outputFormatToExtension,
  isConvertibleFile,
} from '@electron/utils/fileFormatRegistry';

describe('fileFormatRegistry', () => {
  it('detects image category', () => {
    expect(detectFileConverterCategory('/vault/photo.png')).toBe('image');
  });

  it('detects pdf category', () => {
    expect(detectFileConverterCategory('/vault/report.pdf')).toBe('pdf');
  });

  it('detects video category', () => {
    expect(detectFileConverterCategory('/vault/clip.mp4')).toBe('video');
  });

  it('returns output formats for png source', () => {
    const formats = getOutputFormatsForPath('/vault/photo.png');
    expect(formats).toContain('jpeg');
    expect(formats).toContain('pdf');
  });

  it('validates supported conversion pairs', () => {
    expect(isConversionSupported('/vault/photo.png', 'webp')).toBe(true);
    expect(isConversionSupported('/vault/photo.png', 'mp4')).toBe(true);
    expect(isConversionSupported('/vault/report.pdf', 'png')).toBe(true);
  });

  it('maps output format to extension', () => {
    expect(outputFormatToExtension('jpeg')).toBe('.jpg');
    expect(outputFormatToExtension('png')).toBe('.png');
  });

  it('checks convertible files', () => {
    expect(isConvertibleFile('/vault/x.webp')).toBe(true);
    expect(isConvertibleFile('/vault/x.docx')).toBe(false);
  });
});
