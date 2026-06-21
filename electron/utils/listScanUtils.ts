export const LIST_SCAN_CONCURRENCY = 12;

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R | null>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const output: (R | null)[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  async function worker() {
    let index = nextIndex;
    nextIndex += 1;
    while (index < items.length) {
      output[index] = await mapper(items[index]);
      index = nextIndex;
      nextIndex += 1;
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return output.filter((item): item is R => item !== null);
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

export function extractJsonStringField(raw: string, field: string): string | undefined {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  if (!match?.[1]) {
    return undefined;
  }
  return decodeJsonString(match[1]);
}

export function extractJsonNullableStringField(raw: string, field: string): string | null {
  const nullMatch = raw.match(new RegExp(`"${field}"\\s*:\\s*null`));
  if (nullMatch) {
    return null;
  }
  return extractJsonStringField(raw, field) ?? null;
}

export function countTopLevelArrayObjects(raw: string, arrayField: string): number {
  const fieldIndex = raw.indexOf(`"${arrayField}"`);
  if (fieldIndex === -1) {
    return 0;
  }

  const arrayStart = raw.indexOf('[', fieldIndex);
  if (arrayStart === -1) {
    return 0;
  }

  let depth = 0;
  let count = 0;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart + 1; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      if (depth === 0) {
        break;
      }
      depth -= 1;
      continue;
    }

    if (char === '{' && depth === 0) {
      count += 1;
    }
  }

  return count;
}
