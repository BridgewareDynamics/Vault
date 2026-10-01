import { describe, expect, it } from 'vitest';
import {
  deriveSegmentSettingsFromDuration,
  formatMediaTimestamp,
} from './transcriptionSegmentDefaults';

describe('deriveSegmentSettingsFromDuration', () => {
  it('uses the full clip as chunk length for short media', () => {
    expect(deriveSegmentSettingsFromDuration(45)).toEqual({
      segmentLength: 45,
      segmentDuration: 5,
    });
  });

  it('caps chunk length at 90 seconds for long media', () => {
    expect(deriveSegmentSettingsFromDuration(600)).toEqual({
      segmentLength: 90,
      segmentDuration: 10,
    });
  });

  it('tightens subtitle grouping for very short clips', () => {
    expect(deriveSegmentSettingsFromDuration(12)).toEqual({
      segmentLength: 12,
      segmentDuration: 3,
    });
  });
});

describe('formatMediaTimestamp', () => {
  it('formats minutes and seconds', () => {
    expect(formatMediaTimestamp(125)).toBe('2:05');
  });

  it('formats hours when needed', () => {
    expect(formatMediaTimestamp(3661)).toBe('1:01:01');
  });
});
