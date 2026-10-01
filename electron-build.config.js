// This file copies all compiled .js files to .cjs and updates require() statements
// so they're treated as CommonJS even when package.json has "type": "module"
import { copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function copyJsToCjs(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      copyJsToCjs(fullPath);
    } else if (file.endsWith('.js') && !file.endsWith('.cjs')) {
      // Read the file content
      let content = readFileSync(fullPath, 'utf8');
      
      // Update require() statements to use .cjs for local .js files
      // Match require("./path/to/file") or require("./path/to/file.js")
      // This handles both direct requires and requires generated from imports
      // Match paths starting with ./ or ../ that don't already end with .cjs
      content = content.replace(/require\((["'])((?:\.\.?\/)[^"']+?)(\.js|\.cjs)?\1\)/g, (match, quote, path, ext) => {
        // Only update if it doesn't already have .cjs extension
        if (ext !== '.cjs' && !path.endsWith('.cjs')) {
          return `require(${quote}${path}.cjs${quote})`;
        }
        return match;
      });
      
      // Update import statements to use require() with .cjs for local files
      // Match: import { ... } from './path/to/file' or import { ... } from './path/to/file.js'
      // Match: import * as name from './path/to/file'
      // Match: import name from './path/to/file'
      content = content.replace(/import\s+(\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+(["'])(\.\/[^"']+)(\.js)?\2/g, (match, imports, quote, importPath, jsExt) => {
        // Only update if it's a local path (starts with ./)
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Convert named imports to require destructuring
          if (imports.startsWith('{') && imports.endsWith('}')) {
            const namedImports = imports.slice(1, -1).trim();
            return `const ${namedImports} = require(${quote}${importPath}.cjs${quote});`;
          }
          // Convert default import
          else if (!imports.includes('as')) {
            return `const ${imports.trim()} = require(${quote}${importPath}.cjs${quote});`;
          }
          // Convert namespace import (import * as name from ...)
          else {
            const namespaceMatch = imports.match(/\*\s+as\s+(\w+)/);
            if (namespaceMatch) {
              return `const ${namespaceMatch[1]} = require(${quote}${importPath}.cjs${quote});`;
            }
          }
        }
        return match;
      });
      
      // Write to .cjs file
      const cjsPath = fullPath.replace(/\.js$/, '.cjs');
      writeFileSync(cjsPath, content, 'utf8');
      console.log(`Copied and updated ${file} to ${file.replace('.js', '.cjs')}`);
    }
  }
}

const electronDir = join(process.cwd(), 'dist-electron', 'electron');

try {
  copyJsToCjs(electronDir);
  console.log('All Electron files copied to .cjs with updated requires');
} catch (error) {
  console.error('Error copying files:', error);
  process.exit(1);
}

