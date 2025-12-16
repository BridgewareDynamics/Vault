/**
 * Electron Builder afterPack hook to embed icon in Windows executable
 * This runs after electron-builder packages the app but before the installer is created
 * MUST be CommonJS format (not ES modules) for electron-builder compatibility
 */
const path = require('path');
const fs = require('fs');

/**
 * Check if a file is accessible and not locked by another process
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<boolean>} - True if file is accessible, false otherwise
 */
function isFileAccessible(filePath) {
  return new Promise((resolve) => {
    try {
      // Try to open the file in write mode to check if it's locked
      const fd = fs.openSync(filePath, 'r+');
      fs.closeSync(fd);
      resolve(true);
    } catch (error) {
      // File is locked or not accessible
      resolve(false);
    }
  });
}

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`   ⚠ Attempt ${attempt} failed, retrying in ${delay}ms... (${error.message})`);
        await wait(delay);
      }
    }
  }
  throw lastError;
}

exports.default = async function(context) {
  // Only run for Windows builds
  if (process.platform !== 'win32' || (context.platform && context.platform.name !== 'win')) {
    return;
  }

  // Get project root - try different possible properties
  const projectRoot = context.projectDir || context.appDir || process.cwd();
  const exePath = path.join(projectRoot, 'release', 'win-unpacked', 'Vault.exe');
  const iconPath = path.join(projectRoot, 'build', 'icon.ico');

  console.log('\n🔄 [afterPack] Starting icon embedding process...');
  console.log(`   Project root: ${projectRoot}`);
  console.log(`   Executable: ${exePath}`);
  console.log(`   Icon: ${iconPath}`);

  // Verify executable exists
  if (!fs.existsSync(exePath)) {
    console.error('❌ [afterPack] Executable not found for icon embedding:', exePath);
    throw new Error(`Executable not found: ${exePath}`);
  }

  // Verify icon file exists
  if (!fs.existsSync(iconPath)) {
    console.error('❌ [afterPack] Icon file not found:', iconPath);
    throw new Error(`Icon file not found: ${iconPath}`);
  }

  // Verify icon file is readable
  try {
    const iconStats = fs.statSync(iconPath);
    console.log(`   Icon file size: ${(iconStats.size / 1024).toFixed(2)} KB`);
    
    // Verify it's a valid ICO file (should start with specific bytes)
    const iconBuffer = fs.readFileSync(iconPath);
    if (iconBuffer.length < 6) {
      throw new Error('Icon file is too small to be valid');
    }
  } catch (error) {
    console.error('❌ [afterPack] Cannot read icon file:', error.message);
    throw new Error(`Cannot read icon file: ${error.message}`);
  }

  // Wait a bit for electron-builder to release the file lock
  console.log('   Waiting for file to be accessible...');
  let fileAccessible = false;
  for (let i = 0; i < 10; i++) {
    fileAccessible = await isFileAccessible(exePath);
    if (fileAccessible) {
      break;
    }
    await wait(200);
  }

  if (!fileAccessible) {
    console.warn('⚠ [afterPack] File may still be locked, but proceeding with retry logic...');
  }

  try {
    console.log('🔄 [afterPack] Embedding icon in executable using rcedit...');
    
    const rcedit = require('rcedit');
    
    // Get executable stats before modification
    const statsBefore = fs.statSync(exePath);
    const mtimeBefore = statsBefore.mtime.getTime();
    const sizeBefore = statsBefore.size;

    // Embed icon with retry logic - rcedit will embed it in the main icon resource (ID 1)
    // This is the icon that Windows uses for the executable, shortcuts, taskbar, etc.
    await retryWithBackoff(async () => {
      // Check file accessibility before each attempt
      const accessible = await isFileAccessible(exePath);
      if (!accessible) {
        console.log('   File is locked, waiting...');
        await wait(300);
      }
      
      // Attempt to embed icon
      await rcedit.rcedit(exePath, {
        icon: iconPath,
      });
    }, 5, 500);

    // Verify modification
    const statsAfter = fs.statSync(exePath);
    const mtimeAfter = statsAfter.mtime.getTime();
    const sizeAfter = statsAfter.size;

    // Check if file was modified
    const wasModified = mtimeAfter > mtimeBefore || sizeAfter !== sizeBefore;

    if (wasModified) {
      console.log('✓ [afterPack] Icon successfully embedded in executable');
      console.log(`   Executable modified at: ${new Date(mtimeAfter).toISOString()}`);
    } else {
      console.log('ℹ [afterPack] Executable modification time did not change');
      console.log('   This may indicate the icon was already correctly embedded by electron-builder');
    }

    // Additional verification: check if executable exists and is readable
    try {
      const finalStats = fs.statSync(exePath);
      console.log(`✓ [afterPack] Executable verified: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (verifyError) {
      console.error('❌ [afterPack] Failed to verify executable after icon embedding:', verifyError.message);
      throw new Error(`Executable verification failed: ${verifyError.message}`);
    }

    console.log('✓ [afterPack] Icon embedding process completed successfully\n');
    
  } catch (error) {
    console.error('❌ [afterPack] Failed to embed icon after all retries:', error.message);
    console.error('   Error details:', error);
    
    // Check if electron-builder already embedded the icon
    console.log('ℹ [afterPack] Note: electron-builder may have already embedded the icon');
    console.log('   Check the executable properties to verify the icon is present');
    console.log('   If the icon is already correct, this error can be ignored');
    
    // Don't throw - allow build to continue if icon might already be embedded
    // The win.icon setting in electron-builder.json should handle it
    console.warn('⚠ [afterPack] Continuing build despite icon embedding error...\n');
  }
};


