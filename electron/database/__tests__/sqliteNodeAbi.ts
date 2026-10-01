/**
 * Vitest global setup: provide a Node-ABI build of `better-sqlite3`.
 *
 * The app's `better-sqlite3` is compiled for Electron's ABI (via the
 * `electron-rebuild` postinstall step), so it cannot be `require`d by the
 * Node.js process that runs Vitest. To exercise the REAL database layer
 * (no mocks) we maintain a second, Node-ABI copy of the addon under
 * `node_modules/.cache/better-sqlite3-node` and alias `better-sqlite3` to it in
 * `vitest.config.ts`. The Electron build at `node_modules/better-sqlite3` is
 * never touched, so `npm run electron:dev` keeps working after tests run.
 *
 * The cache is rebuilt only when missing or when the Node ABI changes, so the
 * cost (a fast prebuilt download, or a one-time compile fallback) is paid once.
 *
 * NOTE: this is global-setup infrastructure, not a test file (no `.test.ts`
 * suffix), so Vitest does not collect it as a suite.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE_PKG = path.join(REPO_ROOT, 'node_modules', 'better-sqlite3');
export const NODE_ABI_CACHE_DIR = path.join(
  REPO_ROOT,
  'node_modules',
  '.cache',
  'better-sqlite3-node',
);

const MARKER_FILE = path.join(NODE_ABI_CACHE_DIR, '.node-abi');
const BINARY_FILE = path.join(NODE_ABI_CACHE_DIR, 'build', 'Release', 'better_sqlite3.node');

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[sqlite-node-abi] ${message}`);
}

function cacheIsFresh(targetAbi: string): boolean {
  try {
    return (
      fs.existsSync(BINARY_FILE) &&
      fs.readFileSync(MARKER_FILE, 'utf-8').trim() === targetAbi
    );
  } catch {
    return false;
  }
}

function buildNodeAbiCache(targetAbi: string): void {
  log(`Building Node-ABI better-sqlite3 (module version ${targetAbi})...`);

  fs.rmSync(NODE_ABI_CACHE_DIR, { recursive: true, force: true });
  fs.mkdirSync(NODE_ABI_CACHE_DIR, { recursive: true });

  // Pure-JS loader + package manifest are all we need alongside a Node-ABI
  // native binary; `bindings`/`prebuild-install` resolve from the repo's
  // node_modules via normal upward module resolution.
  fs.copyFileSync(
    path.join(SOURCE_PKG, 'package.json'),
    path.join(NODE_ABI_CACHE_DIR, 'package.json'),
  );
  fs.cpSync(path.join(SOURCE_PKG, 'lib'), path.join(NODE_ABI_CACHE_DIR, 'lib'), {
    recursive: true,
  });

  const prebuildInstall = path.join(
    REPO_ROOT,
    'node_modules',
    'prebuild-install',
    'bin.js',
  );

  let downloaded = false;
  try {
    execFileSync(process.execPath, [prebuildInstall, '--runtime=node'], {
      cwd: NODE_ABI_CACHE_DIR,
      stdio: 'inherit',
    });
    downloaded = fs.existsSync(BINARY_FILE);
  } catch {
    downloaded = false;
  }

  if (!downloaded) {
    // No matching prebuilt binary for this platform/ABI: compile from source in
    // the Electron package (which has the C sources), copy the Node-ABI
    // artifact into the cache, then restore the Electron-ABI binary so the app
    // keeps working.
    log('Prebuilt download unavailable; falling back to node-gyp rebuild...');
    execFileSync('npx', ['--yes', 'node-gyp', 'rebuild', '--release'], {
      cwd: SOURCE_PKG,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    fs.mkdirSync(path.dirname(BINARY_FILE), { recursive: true });
    fs.copyFileSync(
      path.join(SOURCE_PKG, 'build', 'Release', 'better_sqlite3.node'),
      BINARY_FILE,
    );
    execFileSync('npx', ['--yes', 'electron-rebuild', '-f', '-w', 'better-sqlite3'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  }

  fs.writeFileSync(MARKER_FILE, targetAbi, 'utf-8');
  log('Node-ABI better-sqlite3 ready.');
}

export default function setup(): void {
  const targetAbi = process.versions.modules;
  if (cacheIsFresh(targetAbi)) {
    return;
  }
  buildNodeAbiCache(targetAbi);
}
