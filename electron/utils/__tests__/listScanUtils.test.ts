import { describe, expect, it } from 'vitest';
import {
  countTopLevelArrayObjects,
  extractJsonNullableStringField,
  extractJsonStringField,
} from '../listScanUtils';

describe('listScanUtils', () => {
  it('extracts lightweight list metadata without parsing full documents', () => {
    const raw = JSON.stringify({
      id: 'map-1',
      title: 'Incident timeline',
      casePath: null,
      blocks: [{ id: 'b1' }, { id: 'b2' }],
      edges: [{ id: 'e1' }],
    });

    expect(extractJsonStringField(raw, 'id')).toBe('map-1');
    expect(extractJsonStringField(raw, 'title')).toBe('Incident timeline');
    expect(extractJsonNullableStringField(raw, 'casePath')).toBeNull();
    expect(countTopLevelArrayObjects(raw, 'blocks')).toBe(2);
    expect(countTopLevelArrayObjects(raw, 'sources')).toBe(0);
  });
});
