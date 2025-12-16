#!/usr/bin/env node
/**
 * Build script that disables code signing to avoid symlink permission issues
 * Based on VidCap's working build configuration
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Clear winCodeSign cache to prevent symlink issues
const cacheDir = join(
  process.env.LOCALAPPDATA || process.env.APPDATA || '',
  'electron-builder',
  'Cache',
  'winCodeSign'
);

if (existsSync(cacheDir)) {
  try {
    rmSync(cacheDir, { recursive: true, force: true });
    console.log('✓ Cleared winCodeSign cache');
  } catch (error) {
    console.warn('⚠ Could not clear winCodeSign cache:', error.message);
    console.warn('⚠ You may need to run as administrator or manually delete:');
    console.warn(`   ${cacheDir}`);
  }
} else {
  console.log('ℹ winCodeSign cache does not exist (this is fine)');
}

// Set environment variable to disable code signing
// Only set CSC_IDENTITY_AUTO_DISCOVERY - don't set empty strings for other vars
// as electron-builder will try to resolve them as paths
const env = { ...process.env };

// Set to disable auto-discovery of code signing certificates
env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

// Explicitly remove code signing related variables if they exist
// (don't set them to empty strings as electron-builder treats empty strings as paths)
delete env.WIN_CSC_LINK;
delete env.WIN_CSC_KEY_PASSWORD;
delete env.CSC_LINK;
delete env.CSC_KEY_PASSWORD;
delete env.CSC_NAME;
delete env.CSC_IDENTITY_NAME;

// Also set SKIP_NOTARIZATION for macOS (if building for Mac)
env.SKIP_NOTARIZATION = 'true';

console.log('✓ Code signing disabled via environment variables');
console.log('🔄 Starting electron-builder...\n');

// Spawn electron-builder
const builder = spawn('electron-builder', {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env
});

builder.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Build completed successfully!');
  } else {
    console.error(`\n❌ Build failed with exit code ${code}`);
  }
  process.exit(code || 0);
});

builder.on('error', (error) => {
  console.error('❌ Failed to start electron-builder:', error);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure electron-builder is installed: npm install --save-dev electron-builder');
  console.error('2. Try running PowerShell as Administrator if you see symlink errors');
  console.error('3. Check that electron-builder.json exists in the project root');
  process.exit(1);
});


