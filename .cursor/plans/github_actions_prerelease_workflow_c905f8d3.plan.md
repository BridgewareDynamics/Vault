---
name: GitHub Actions Prerelease Workflow
overview: Create a GitHub Actions workflow that triggers on merge to a branch, builds the Electron Windows installer without code signing, auto-versions using git commit hash, and creates a GitHub Release with the installer artifact.
todos:
  - id: create-workflow-dir
    content: Create .github/workflows directory structure
    status: completed
  - id: create-version-script
    content: Create scripts/update-version.py to handle automatic versioning with git commit hash
    status: completed
  - id: create-workflow-file
    content: Create .github/workflows/prerelease-build.yml with build steps, version update, and release creation
    status: completed
    dependencies:
      - create-version-script
  - id: test-workflow
    content: Test workflow on current branch to verify build and release creation works
    status: completed
    dependencies:
      - create-workflow-file
---

# GitHub

Actions Prerelease Build Workflow

## Overview

Create a GitHub Actions workflow that automatically builds the Electron Windows installer and creates a prerelease when code is merged into a branch. The workflow will use automatic versioning based on git commit hash and skip code signing.

## Implementation Details

### 1. Workflow File Structure

- Create `.github/workflows/prerelease-build.yml`
- Trigger on `push` to the current branch (for testing)
- Later can be changed to trigger on merge to `prerelease` branch

### 2. Workflow Steps

The workflow will:

1. **Checkout code** - Get the latest code from the repository
2. **Setup Node.js** - Install Node.js 20.x (matching package.json requirements)
3. **Install dependencies** - Run `npm ci` for reproducible builds
4. **Auto-version** - Update `package.json` version with git commit hash suffix

- Format: `1.0.0-prerelease.X-{short-commit-hash}`
- Use Python script or Node.js to update version

5. **Build Electron app** - Run `npm run electron:build`

- This already handles code signing disable via `scripts/electron-build.mjs`
- Builds Windows NSIS installer to `release/` directory

6. **Create GitHub Release** - Use GitHub API to create a prerelease

- Tag format: `v{version}` (e.g., `v1.0.0-prerelease.4-abc1234`)
- Release name: `Prerelease {version}`
- Upload installer artifact: `Vault Setup {version}.exe`

7. **Upload artifacts** - Also upload build artifacts as workflow artifacts

### 3. Version Management Script

Create a Python script `scripts/update-version.py` to:

- Read current version from `package.json`
- Extract base version (e.g., `1.0.0-prerelease.4`)
- Get short git commit hash
- Append commit hash: `1.0.0-prerelease.4-abc1234`
- Update `package.json` with new version
- Return new version for use in workflow

### 4. Code Signing Configuration

The existing configuration already disables signing:

- `electron-builder.json` has `"sign": null` for Windows
- `scripts/electron-build.mjs` sets `CSC_IDENTITY_AUTO_DISCOVERY=false`
- Workflow will ensure these settings are respected

### 5. Files to Create/Modify

**New Files:**

- `.github/workflows/prerelease-build.yml` - Main workflow file
- `scripts/update-version.py` - Version update script

**Existing Files (no changes needed):**

- `package.json` - Already has build scripts
- `electron-builder.json` - Already configured for no signing
- `scripts/electron-build.mjs` - Already handles signing disable

### 6. Workflow Configuration

**Triggers:**

- Initially: `on: push: branches: [current-branch]` (for testing)
- Later: Change to `on: push: branches: [prerelease]`

**Environment Variables:**

- `CSC_IDENTITY_AUTO_DISCOVERY=false` - Disable code signing
- `SKIP_NOTARIZATION=true` - Skip macOS notarization (if needed)

**Permissions:**

- `contents: write` - To create releases and tags
- `actions: read` - Standard permissions

### 7. Build Process

The workflow will execute:

````bash
npm ci
python scripts/update-version.py
npm run electron:build
```

The `electron:build` script already:

- Cleans release directory
- Builds frontend and Electron main process
- Runs electron-builder with signing disabled

### 8. Release Creation

- Use `gh` CLI or GitHub API to create release
- Tag: `v{version}`
- Prerelease: `true`
- Upload: `release/Vault Setup {version}.exe`
- Release notes: Auto-generated from commit messages or simple template

## Testing Strategy

1. Test workflow on current branch first
2. Verify installer is created correctly
3. Verify version includes commit hash
4. Verify GitHub Release is created
5. Once confirmed, change trigger to `prerelease` branch

## Notes

- No code signing certificates needed (already configured)


````