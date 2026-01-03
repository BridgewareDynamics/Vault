# Contributing to The Vault

Thank you for your interest in contributing to The Vault! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Conventions](#commit-message-conventions)

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control

### Installation

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/BridgewareDynamics/Vault.git
   cd Vault
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Verify installation**
   ```bash
   npm run lint
   npm run test
   ```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Or for bug fixes:
   ```bash
   git checkout -b fix/your-bug-fix
   ```

2. **Run the development server**
   ```bash
   npm run electron:dev
   ```
   This will:
   - Build the Electron main process
   - Start the Vite dev server
   - Launch the Electron application

3. **Make your changes**
   - Edit files in `src/` for React components
   - Edit files in `electron/` for main process code
   - The app will hot-reload automatically

4. **Run tests**
   ```bash
   # Run all tests
   npm run test

   # Run tests in watch mode
   npm run test:watch

   # Run tests with UI
   npm run test:ui

   # Run tests with coverage
   npm run test:coverage
   ```

5. **Check code quality**
   ```bash
   npm run lint
   ```

6. **Build for production** (optional, to verify build works)
   ```bash
   npm run build:all
   ```

### Branch Structure

The repository uses a three-tier branch structure to manage development, staging, and production releases:

- **main**: Production/stable releases - contains the latest stable code
- **prerelease**: Pre-production staging and testing - contains code ready for release testing
- **dev**: Development branch - contains the latest development work and where feature branches are merged

**Workflow:**
1. Feature branches are created from and merged into `dev` via pull requests
2. When ready for testing, `dev` is merged into `prerelease` via pull request (PR required by branch protection rules)
3. When ready for production, `prerelease` is merged into `main` via pull request (PR required by branch protection rules)

**For contributors:**
- Create feature branches from `dev`
- Submit pull requests targeting the `dev` branch
- Keep your feature branch up to date with `dev` (not `main`)

**Note**: Branch protection rules require pull requests for all merges between branches (`dev` → `prerelease` and `prerelease` → `main`). Direct pushes to these branches are not permitted.

## Code Style Guidelines

### TypeScript

- **Strict Mode**: All code must pass TypeScript strict mode checks
- **No `any` types**: Avoid using `any` unless absolutely necessary. Use `unknown` or proper types instead
- **Type Definitions**: Define types in `src/types/` for shared types
- **Path Aliases**: Use path aliases (`@/` for `src/`, `@electron/` for `electron/`)

Example:
```typescript
// Good
import { ArchiveFile } from '@/types';
import { logger } from '@electron/utils/logger';

// Avoid
import { ArchiveFile } from '../../types';
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Component Structure**: 
  ```typescript
  // Component props interface
  interface ComponentProps {
    prop1: string;
    prop2?: number;
  }

  // Component with proper typing
  export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
    // Component logic
    return <div>{prop1}</div>;
  };
  ```

- **Hooks**: 
  - Use custom hooks for complex logic (`src/hooks/`)
  - Follow React hooks rules (only call at top level)
  - Extract reusable logic into custom hooks

- **File Naming**: 
  - Components: `PascalCase.tsx` (e.g., `Gallery.tsx`)
  - Hooks: `camelCase.ts` with `use` prefix (e.g., `useArchive.ts`)
  - Utils: `camelCase.ts` (e.g., `pathValidator.ts`)

### Code Organization

- **Component Files**: One component per file
- **Test Files**: Co-locate test files with source files (e.g., `Component.test.tsx` next to `Component.tsx`)
- **Utils**: Place utility functions in appropriate `utils/` directories
- **Imports**: Group imports in this order:
  1. External dependencies
  2. Internal modules (using path aliases)
  3. Relative imports
  4. Types

Example:
```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useArchive } from '@/hooks/useArchive';
import { logger } from '@electron/utils/logger';

import { ArchiveFile } from '@/types';
```

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for constants, `camelCase` for exported constants
- **Types/Interfaces**: `PascalCase`
- **Files**: Match the export (component files use `PascalCase.tsx`, others use `camelCase.ts`)

### Code Comments

- **Document complex logic**: Add comments explaining why, not what
- **JSDoc for functions**: Document public functions with JSDoc comments
- **Avoid obvious comments**: Code should be self-documenting

Example:
```typescript
/**
 * Validates a file path to ensure it's within the vault directory.
 * Prevents directory traversal attacks.
 * 
 * @param filePath - The path to validate
 * @param vaultRoot - The root directory of the vault
 * @returns True if the path is valid, false otherwise
 */
export function validatePath(filePath: string, vaultRoot: string): boolean {
  // Implementation
}
```

### Electron Main Process

- **IPC Handlers**: Define handlers in `electron/main.ts`
- **Error Handling**: Always handle errors and log them using the logger utility
- **Path Validation**: Always validate paths before file operations
- **Async Operations**: Use async/await for file operations

Example:
```typescript
ipcMain.handle('operation-name', async (_event, param: string) => {
  try {
    // Validate input
    if (!param || typeof param !== 'string') {
      throw new Error('Invalid parameter');
    }

    // Perform operation
    const result = await performOperation(param);
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('Operation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});
```

## Testing Requirements

### Test Coverage

- **Minimum Coverage**: Aim for 80% code coverage
- **CI Requirements**: CI enforces 80% coverage thresholds
- **Critical Paths**: 100% coverage for security-critical code (path validation, file operations)

### Writing Tests

- **Test Files**: Co-locate with source files (`.test.ts` or `.test.tsx`)
- **Test Structure**: Use `describe` blocks for grouping, `it` or `test` for individual tests
- **Test Utilities**: Use utilities from `src/test-utils/` for common setup

Example:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<Component prop1="test" />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByText('clicked')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests with CI coverage thresholds
npm run test:coverage:ci
```

### Test Types

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components and hooks
- **E2E Tests**: Test complete user workflows (when applicable)

### Mocking

- **Electron APIs**: Mock Electron APIs in tests (see `src/test-utils/mocks.ts`)
- **File System**: Mock file system operations for tests
- **External Dependencies**: Mock external services and APIs

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout your-branch
   git rebase dev
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run test
   npm run build:all
   ```

3. **Ensure tests pass**: All tests must pass before submitting

4. **Update documentation**: If adding features, update relevant documentation

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin your-branch
   ```

2. **Create PR on GitHub**
   - Target the `dev` branch (not `main` or `prerelease`)
   - Use a descriptive title
   - Fill out the PR template (if available)
   - Reference any related issues

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Added tests for new functionality
   - [ ] Updated existing tests

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   - [ ] All tests pass
   ```

### Branch Naming

- **Features**: `feature/feature-name` (e.g., `feature/add-search`)
- **Bug Fixes**: `fix/bug-description` (e.g., `fix/pdf-extraction-error`)
- **Documentation**: `docs/update-readme`
- **Refactoring**: `refactor/component-name`
- **Chores**: `chore/update-dependencies`

### Review Process

- **Automated Checks**: PR must pass all CI checks (linting, tests, build)
- **Code Review**: At least one maintainer must approve
- **Address Feedback**: Respond to review comments and make requested changes
- **Keep PRs Focused**: One feature/fix per PR when possible

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build config, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Scope (Optional)

Scope indicates the area of the codebase affected:
- `pdf`: PDF extraction functionality
- `archive`: Vault/archive system
- `ui`: User interface components
- `electron`: Electron main process
- `build`: Build configuration
- `deps`: Dependencies

### Examples

```bash
# Feature
feat(archive): add search functionality to vault

# Bug fix
fix(pdf): handle corrupted PDF files gracefully

# Documentation
docs: update installation instructions

# Refactoring
refactor(ui): extract Gallery component logic into hook

# Test
test(archive): add tests for case folder creation

# Chore
chore(deps): update electron to 28.1.0

# Breaking change
feat(archive)!: change vault directory structure

BREAKING CHANGE: Vault directory structure has changed. Existing vaults need migration.
```

### Commit Body (Optional)

Use the body to explain:
- **What**: What changed
- **Why**: Why the change was made
- **How**: How the change was implemented (if relevant)

### Commit Footer (Optional)

Use footer for:
- Breaking changes: `BREAKING CHANGE: <description>`
- Issue references: `Closes #123`, `Fixes #456`

### Best Practices

- **Keep commits atomic**: One logical change per commit
- **Write clear subjects**: Use imperative mood ("add feature" not "added feature")
- **Limit subject length**: Keep under 72 characters
- **Use body for details**: If more explanation needed, use the body
- **Reference issues**: Link to related issues in footer

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Vitest Documentation](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Questions?

If you have questions about contributing, please:
- Open an issue with the `question` label
- Check existing issues and discussions
- Review the codebase for examples

Thank you for contributing to The Vault!





