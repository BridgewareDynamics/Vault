import { describe, expect, it } from 'vitest';
import {
  createCapturedError,
  formatAllErrors,
  formatErrorRecord,
  normalizeErrorReason,
  redactSensitiveText,
} from './sanitizeError';

describe('redactSensitiveText', () => {
  it('redacts Windows file paths to basename only', () => {
    const input = 'Failed at C:\\Users\\matth\\secret\\docs\\report.pdf';
    expect(redactSensitiveText(input)).toBe('Failed at [path]/report.pdf');
  });

  it('redacts Unix file paths to basename only', () => {
    const input = 'Failed at /home/user/docs/report.pdf';
    expect(redactSensitiveText(input)).toBe('Failed at [path]/report.pdf');
  });

  it('redacts bearer tokens and API keys', () => {
    const input = 'Auth failed Bearer abc.def.ghi api_key=supersecret sk-abcdefghijklmnopqrstuv';
    const result = redactSensitiveText(input);
    expect(result).toContain('Bearer [redacted]');
    expect(result).toContain('[api-key redacted]');
    expect(result).not.toContain('supersecret');
    expect(result).not.toContain('sk-abcdefghijklmnopqrstuv');
  });

  it('redacts env-like assignments', () => {
    const input = 'process.env.SECRET_KEY=abc123 VITE_API_TOKEN=xyz789';
    const result = redactSensitiveText(input);
    expect(result).not.toContain('abc123');
    expect(result).not.toContain('xyz789');
    expect(result).toContain('[env redacted]');
  });

  it('redacts storage references', () => {
    const input = 'localStorage.getItem("token") document.cookie=session=abc';
    const result = redactSensitiveText(input);
    expect(result).toContain('[storage redacted]');
  });

  it('redacts dev-server URLs to basename only', () => {
    const source = 'http://localhost:5173/src/debug/errorConsole.ts';
    expect(redactSensitiveText(source)).toBe('[source]/errorConsole.ts');
  });

  it('redacts dev-server URLs in stack traces with line numbers', () => {
    const stack =
      'Error: App Error Console test error\n    at http://localhost:5173/src/debug/errorConsole.ts:296:11';
    const result = redactSensitiveText(stack);
    expect(result).toContain('[source]/errorConsole.ts:296:11');
    expect(result).not.toContain('localhost');
    expect(result).not.toContain('5173');
  });
});

describe('normalizeErrorReason', () => {
  it('normalizes Error instances', () => {
    const err = new Error('boom');
    expect(normalizeErrorReason(err)).toEqual({
      message: 'boom',
      stack: err.stack,
    });
  });

  it('normalizes string reasons', () => {
    expect(normalizeErrorReason('async fail')).toEqual({ message: 'async fail' });
  });
});

describe('formatErrorRecord', () => {
  it('formats sanitized records for clipboard', () => {
    const record = createCapturedError({
      id: 'test-id',
      message: 'Failed at C:\\Users\\matth\\file.ts',
      source: 'C:\\Users\\matth\\src\\file.ts',
      line: 12,
      column: 4,
      stack: 'Error: x\n    at C:\\Users\\matth\\src\\file.ts:12:4',
      timestamp: '2026-06-15T12:00:00.000Z',
    });

    const formatted = formatErrorRecord(record);
    expect(formatted).toContain('test-id');
    expect(formatted).toContain('[path]/file.ts');
    expect(formatted).not.toContain('C:\\Users\\matth');
  });

  it('formats empty list message', () => {
    expect(formatAllErrors([])).toBe('No errors captured.');
  });
});
