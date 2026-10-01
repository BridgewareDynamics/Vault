import { MapBlockChronology, MapDateTier } from '../types';

export interface ChronologyInput {
  tier: MapDateTier;
  eraLabel?: string;
  phaseLabel?: string;
  year?: number;
  month?: number;
  day?: number;
}

function padYear(year?: number): string {
  return String(year ?? 0).padStart(4, '0');
}

function padMonth(month?: number): string {
  return String(month ?? 0).padStart(2, '0');
}

function padDay(day?: number): string {
  return String(day ?? 0).padStart(2, '0');
}

export function computeSortKey(input: ChronologyInput): string {
  const { tier, eraLabel, phaseLabel, year, month, day } = input;

  switch (tier) {
    case 'era': {
      const label = (eraLabel ?? '').trim().toLowerCase() || 'zzz_unset';
      return `0|era|${label}`;
    }
    case 'phase': {
      const label = (phaseLabel ?? '').trim().toLowerCase() || 'zzz_unset';
      return `1|phase|${label}`;
    }
    case 'year': {
      if (month != null && day != null) {
        return `2|${padYear(year)}|${padMonth(month)}|${padDay(day)}|2`;
      }
      if (month != null) {
        return `2|${padYear(year)}|${padMonth(month)}|00|1`;
      }
      return `2|${padYear(year)}|00|00|0`;
    }
    case 'month': {
      if (day != null) {
        return `2|${padYear(year)}|${padMonth(month)}|${padDay(day)}|2`;
      }
      return `2|${padYear(year)}|${padMonth(month)}|00|1`;
    }
    case 'day': {
      return `2|${padYear(year)}|${padMonth(month)}|${padDay(day)}|2`;
    }
    default:
      return `9|unknown`;
  }
}

export function buildChronology(input: ChronologyInput): MapBlockChronology {
  return {
    tier: input.tier,
    eraLabel: input.eraLabel,
    phaseLabel: input.phaseLabel,
    year: input.year,
    month: input.month,
    day: input.day,
    sortKey: computeSortKey(input),
  };
}

export function formatChronologyLabel(chronology: MapBlockChronology): string {
  switch (chronology.tier) {
    case 'era':
      return chronology.eraLabel?.trim() || 'Era';
    case 'phase':
      return chronology.phaseLabel?.trim() || 'Phase';
    case 'year':
    case 'month':
    case 'day': {
      const parts: string[] = [];
      if (chronology.year != null) parts.push(String(chronology.year));
      if (chronology.month != null) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        parts.push(months[chronology.month - 1] ?? String(chronology.month));
      }
      if (chronology.day != null) parts.push(String(chronology.day));
      return parts.join(' ') || 'Date';
    }
    default:
      return 'Unknown';
  }
}

export function compareSortKeys(a: string, b: string): number {
  return a.localeCompare(b);
}
