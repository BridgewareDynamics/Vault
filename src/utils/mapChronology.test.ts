import { describe, it, expect } from 'vitest';
import { buildChronology, computeSortKey, compareSortKeys, formatChronologyLabel } from './mapChronology';

describe('mapChronology', () => {
  it('computes year sort key', () => {
    expect(computeSortKey({ tier: 'year', year: 2020 })).toBe('2|2020|00|00|0');
  });

  it('computes year-month sort key', () => {
    expect(computeSortKey({ tier: 'year', year: 2020, month: 3 })).toBe('2|2020|03|00|1');
  });

  it('computes day sort key', () => {
    expect(computeSortKey({ tier: 'day', year: 2020, month: 3, day: 15 })).toBe('2|2020|03|15|2');
  });

  it('sorts chronologically', () => {
    const a = computeSortKey({ tier: 'year', year: 1990 });
    const b = computeSortKey({ tier: 'year', year: 2000 });
    expect(compareSortKeys(a, b)).toBeLessThan(0);
  });

  it('sorts mixed year month and day values in actual timeline order', () => {
    const yearOnly = computeSortKey({ tier: 'year', year: 2020 });
    const march = computeSortKey({ tier: 'month', year: 2020, month: 3 });
    const marchDay = computeSortKey({ tier: 'day', year: 2020, month: 3, day: 15 });
    const nextYear = computeSortKey({ tier: 'year', year: 2021 });

    expect(compareSortKeys(yearOnly, march)).toBeLessThan(0);
    expect(compareSortKeys(march, marchDay)).toBeLessThan(0);
    expect(compareSortKeys(marchDay, nextYear)).toBeLessThan(0);
  });

  it('keeps later months in earlier years before a new year', () => {
    const december2020 = computeSortKey({ tier: 'month', year: 2020, month: 12 });
    const year2021 = computeSortKey({ tier: 'year', year: 2021 });

    expect(compareSortKeys(december2020, year2021)).toBeLessThan(0);
  });

  it('builds chronology with sortKey', () => {
    const c = buildChronology({ tier: 'era', eraLabel: 'Modern' });
    expect(c.tier).toBe('era');
    expect(c.sortKey).toContain('modern');
  });

  it('formats labels', () => {
    const label = formatChronologyLabel(
      buildChronology({ tier: 'year', year: 2024, month: 1 })
    );
    expect(label).toContain('2024');
    expect(label).toContain('Jan');
  });
});
