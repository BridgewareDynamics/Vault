// path: scripts/clean-release.js
import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const releaseDir = join(rootDir, 'release');

if (existsSync(releaseDir)) {
  try {
    rmSync(releaseDir, { recursive: true, force: true });
    console.log('✓ Cleaned release directory');
  } catch (error) {
    console.warn('⚠ Could not clean release directory:', error.message);
    console.warn('⚠ You may need to manually delete the release folder');
  }
} else {
  console.log('Release directory does not exist, skipping clean');
}


