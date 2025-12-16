# Code Signing Fix - Applied VidCap Build Configuration

## Summary

Applied the working code signing configuration from the VidCap app to fix code signing issues in PDFtract. The solution disables code signing completely and prevents electron-builder from attempting to download/extract the winCodeSign archive that causes symlink permission errors on Windows.

## Changes Made

### 1. Created `electron-builder.json`
- **Location**: Root directory
- **Purpose**: Standalone configuration file (preferred over package.json build section)
- **Key Settings**:
  - `sign: null` - Explicitly disables code signing
  - `signingHashAlgorithms: null` - Disables hash algorithm signing (not empty array)
  - `verifyUpdateCodeSignature: false` - Skips signature verification
  - `signDlls: false` - Doesn't sign DLLs
  - `signAndEditExecutable: false` - Doesn't modify executables for signing
  - `certificateFile: null` and `certificatePassword: null` - No certificate files

### 2. Created `scripts/electron-build.mjs`
- **Purpose**: Dedicated build script that handles code signing disable logic
- **Features**:
  - Clears `winCodeSign` cache before building (prevents symlink errors)
  - Sets `CSC_IDENTITY_AUTO_DISCOVERY=false` environment variable
  - Explicitly removes all code signing environment variables
  - Provides better error messages and troubleshooting tips

### 3. Updated `package.json`
- **Removed**: `build` section (moved to `electron-builder.json`)
- **Updated**: `electron:build` script to use new `electron-build.mjs` script
- **Result**: Cleaner package.json, configuration in dedicated file

### 4. Removed `electron-builder.config.js`
- **Reason**: Replaced by `electron-builder.json` (electron-builder prefers JSON format)
- **Note**: electron-builder will use `electron-builder.json` automatically

## Key Differences from Previous Configuration

### Before (Problematic)
```json
// package.json build section
"win": {
  "sign": null,
  "signingHashAlgorithms": [],  // Empty array - electron-builder may still try to process
  "verifyUpdateCodeSignature": false
}
```
- Build script used `cross-env` inline
- No cache clearing
- Configuration in package.json (less explicit)

### After (Working - Based on VidCap)
```json
// electron-builder.json
"win": {
  "sign": null,
  "signingHashAlgorithms": null,  // null - explicitly disabled
  "verifyUpdateCodeSignature": false,
  "signDlls": false,
  "signAndEditExecutable": false,
  "certificateFile": null,
  "certificatePassword": null
}
```
- Dedicated build script with cache clearing
- More explicit disable settings
- Standalone configuration file

## How It Works

1. **Cache Clearing**: The build script removes the `winCodeSign` cache directory before building. This prevents electron-builder from trying to extract archives with macOS symlinks (which require admin privileges on Windows).

2. **Environment Variables**: The script sets `CSC_IDENTITY_AUTO_DISCOVERY=false` and removes all code signing related environment variables. This prevents electron-builder from auto-discovering certificates.

3. **Explicit Configuration**: `electron-builder.json` has explicit `null` values for all signing-related options, making it clear that signing is disabled.

## Usage

### Build the Application
```bash
npm run electron:build
```

This will:
1. Clean the release directory
2. Build the React app and Electron main process
3. Clear winCodeSign cache
4. Run electron-builder with code signing disabled

### If You Still See Symlink Errors

If you encounter symlink errors despite these changes:

1. **Run PowerShell as Administrator** (recommended):
   - Right-click PowerShell
   - Select "Run as administrator"
   - Navigate to project and run `npm run electron:build`

2. **Manually Clear Cache**:
   ```powershell
   Remove-Item "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -Recurse -Force
   ```

3. **Check electron-builder.json exists**: The build script expects this file in the project root.

## Why This Works (Technical Details)

### The Problem
Electron-builder downloads the `winCodeSign` archive which contains tools for Windows, macOS, and Linux. The macOS files use symbolic links, which Windows requires administrator privileges to create. Even when building only for Windows, electron-builder extracts the entire archive, causing permission errors.

### The Solution
1. **Cache Clearing**: By removing the cache before building, we prevent electron-builder from trying to extract the problematic archive.

2. **Explicit Disable**: Setting all signing options to `null` (not empty arrays or false) tells electron-builder to completely skip signing operations.

3. **Environment Variables**: `CSC_IDENTITY_AUTO_DISCOVERY=false` prevents electron-builder from searching for certificates, which would trigger the winCodeSign download.

## Files Changed

- ✅ Created: `electron-builder.json`
- ✅ Created: `scripts/electron-build.mjs`
- ✅ Modified: `package.json` (removed build section, updated electron:build script)
- ✅ Deleted: `electron-builder.config.js` (replaced by JSON version)

## Verification

After applying these changes, you should be able to build without code signing errors:

```bash
npm run electron:build
```

Expected output:
- ✓ Cleared winCodeSign cache (or cache doesn't exist message)
- ✓ Code signing disabled via environment variables
- 🔄 Starting electron-builder...
- Build completes successfully

The installer will be created in `release/` directory without any code signing attempts.

## Future: Enabling Code Signing

If you need to enable code signing in the future:

1. Remove or comment out the cache clearing in `electron-build.mjs`
2. Set `sign: "your-certificate-name"` in `electron-builder.json`
3. Provide certificate file and password via environment variables:
   ```powershell
   $env:WIN_CSC_LINK="path/to/certificate.pfx"
   $env:WIN_CSC_KEY_PASSWORD="your-password"
   ```
4. Remove `CSC_IDENTITY_AUTO_DISCOVERY=false` from the build script

## References

- Based on working configuration from `context/VidCap/VidCap/`
- VidCap build documentation: `context/VidCap/VidCap/docs/BUILD-FIX.md`
- Electron Builder documentation: https://www.electron.build/


