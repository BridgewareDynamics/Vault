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
      content = content.replace(/require\((["'])(\.\/[^"']+)(\.js)?\1\)/g, (match, quote, path, jsExt) => {
        // Only update if it's a local path (starts with ./)
        if (path.startsWith('./') || path.startsWith('../')) {
          return `require(${quote}${path}.cjs${quote})`;
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

