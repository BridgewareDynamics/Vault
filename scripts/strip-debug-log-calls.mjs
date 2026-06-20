import fs from 'fs';

function removeDebugLogCalls(source) {
  let result = '';
  let i = 0;
  const marker = 'debugLog(';

  while (i < source.length) {
    const idx = source.indexOf(marker, i);
    if (idx === -1) {
      result += source.slice(i);
      break;
    }

    // Drop leading whitespace on the same line as debugLog (keep prior newline)
    let lineStart = idx;
    while (lineStart > 0 && source[lineStart - 1] !== '\n') {
      lineStart--;
    }
    result += source.slice(i, lineStart);

    let j = idx + marker.length;
    if (source[j] !== '{') {
      while (j < source.length && source[j] !== ';') j++;
      if (source[j] === ';') j++;
      while (j < source.length && (source[j] === ' ' || source[j] === '\t')) j++;
      if (source[j] === '\n') j++;
      i = j;
      continue;
    }

    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escape = false;

    for (; j < source.length; j++) {
      const c = source[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (inString) {
        if (c === '\\') escape = true;
        else if (c === stringChar) inString = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
        continue;
      }
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          j++;
          while (j < source.length && /\s/.test(source[j])) j++;
          if (source[j] === ')') j++;
          if (source[j] === ';') j++;
          while (j < source.length && (source[j] === ' ' || source[j] === '\t')) j++;
          if (source[j] === '\n') j++;
          break;
        }
      }
    }

    i = j;
  }

  return result.replace(/\n{3,}/g, '\n\n');
}

const files = process.argv.slice(2);
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = removeDebugLogCalls(before);
  fs.writeFileSync(f, after);
  const countBefore = (before.match(/debugLog\(/g) || []).length;
  const countAfter = (after.match(/debugLog\(/g) || []).length;
  console.log(`${f}: ${countBefore} -> ${countAfter}`);
}
