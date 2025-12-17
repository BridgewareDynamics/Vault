import { describe, it, expect } from 'vitest';
import { VALID_PDF_EXTENSIONS, TOAST_DURATION, TOAST_POSITION } from './constants';

describe('constants', () => {
  it('should export VALID_PDF_EXTENSIONS as an array', () => {
    expect(Array.isArray(VALID_PDF_EXTENSIONS)).toBe(true);
    expect(VALID_PDF_EXTENSIONS).toContain('.pdf');
    expect(VALID_PDF_EXTENSIONS.length).toBeGreaterThan(0);
  });

  it('should export TOAST_DURATION as a number', () => {
    expect(typeof TOAST_DURATION).toBe('number');
    expect(TOAST_DURATION).toBe(4000);
    expect(TOAST_DURATION).toBeGreaterThan(0);
  });

  it('should export TOAST_POSITION as a string literal', () => {
    expect(typeof TOAST_POSITION).toBe('string');
    expect(TOAST_POSITION).toBe('top-right');
  });
});












