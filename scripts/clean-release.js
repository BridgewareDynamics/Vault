// path: scripts/clean-release.js
import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const releaseDir = join(rootDir, 'release');

const MAX_ATTEMPTS = 5;
const RETRY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printLockHelp() {
  console.warn('');
  console.warn('The previous build folder is still in use. Common causes:');
  console.warn('  • Vault.exe is running from release\\win-unpacked');
  console.warn('  • npm run electron:dev is still open');
  console.warn('  • File Explorer is open inside the release folder');
  console.warn('');
  console.warn('Fix: close Vault and any Explorer windows on release\\, then run:');
  if (process.platform === 'win32') {
    console.warn('  taskkill /IM Vault.exe /F');
    console.warn('  Remove-Item -Recurse -Force .\\release');
  } else {
    console.warn(`  rm -rf "${releaseDir}"`);
  }
  console.warn('');
  console.warn('The build will continue, but a locked release folder can cause installer issues.');
  console.warn('');
}

async function cleanRelease() {
  if (!existsSync(releaseDir)) {
    console.log('Release directory does not exist, skipping clean');
    return;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      rmSync(releaseDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log('✓ Cleaned release directory');
      return;
    } catch (error) {
      const isLast = attempt === MAX_ATTEMPTS;
      if (!isLast) {
        console.warn(
          `⚠ Release folder locked (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${RETRY_MS / 1000}s…`
        );
        await sleep(RETRY_MS);
        continue;
      }
      console.warn('⚠ Could not clean release directory:', error.message);
      printLockHelp();
    }
  }
}

await cleanRelease();
