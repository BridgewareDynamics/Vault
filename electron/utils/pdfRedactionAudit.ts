import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { isValidPDFFile, isSafePath } from './pathValidator';
import { logger } from './logger';

export interface RedactionAuditResult {
  filename: string;
  totalPages: number;
  flaggedPages: Array<{
    pageNumber: number;
    blackRectCount: number;
    overlapCount: number;
    confidenceScore: number;
  }>;
  security?: {
    has_metadata: boolean;
    metadata_keys: string[];
    has_attachments: boolean;
    attachment_count: number;
    has_annotations: boolean;
    annotation_count: number;
    has_forms: boolean;
    form_field_count: number;
    has_layers: boolean;
    layer_count: number;
    has_javascript: boolean;
    has_actions: boolean;
    has_thumbnails: boolean;
    incremental_updates_suspected: boolean;
    notes: string[];
  };
  error?: string;
}

export interface AuditOptions {
  blackThreshold?: number;
  minOverlapArea?: number;
  minHits?: number;
  includeSecurityAudit?: boolean;
  event?: Electron.IpcMainEvent; // For sending progress updates via IPC
  getProgressTarget?: () => Electron.WebContents | null; // Optional function to get current progress target
}

/**
 * Find Python executable (3.11+)
 */
async function findPython(): Promise<string | null> {
  const candidates = process.platform === 'win32' 
    ? ['python', 'py', 'python3']
    : ['python3', 'python'];
  
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} --version`);
      const match = stdout.match(/Python (\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        if (major === 3 && minor >= 11) {
          return cmd;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Check if required Python packages are installed and install them if missing
 */
async function ensurePythonDependencies(pythonPath: string): Promise<void> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const packages = [
    { name: 'pymupdf', importName: 'fitz', minVersion: '1.23.0', required: true },
    { name: 'pikepdf', importName: 'pikepdf', minVersion: '8.0.0', required: false },
  ];
  
  for (const pkg of packages) {
    try {
      // Check if package is installed
      await execAsync(`${pythonPath} -c "import ${pkg.importName}; print('OK')"`, { timeout: 5000 });
      logger.info(`${pkg.name} is already installed`);
    } catch {
      // Package not installed
      if (pkg.required) {
        logger.info(`${pkg.name} not found, installing...`);
        try {
          // Use pip to install with --user flag to avoid permission issues
          const installCommand = `${pythonPath} -m pip install --user ${pkg.name}>=${pkg.minVersion} --quiet`;
          
          await execAsync(installCommand, { timeout: 120000 }); // 2 minute timeout
          logger.info(`${pkg.name} installed successfully`);
          
          // Verify installation
          try {
            await execAsync(`${pythonPath} -c "import ${pkg.importName}; print('OK')"`, { timeout: 5000 });
          } catch {
            throw new Error(`${pkg.name} installation completed but verification failed`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Failed to install ${pkg.name}:`, errorMessage);
          
          if (errorMessage.includes('timeout')) {
            throw new Error(`${pkg.name} installation timed out. Please install manually: pip install ${pkg.name}`);
          } else if (errorMessage.includes('permission')) {
            throw new Error(`Permission denied. Please install ${pkg.name} manually: pip install ${pkg.name}`);
          } else {
            throw new Error(`Failed to install ${pkg.name} automatically. Please install manually: ${pythonPath} -m pip install ${pkg.name}`);
          }
        }
      } else {
        // Optional package - try to install but don't fail if it doesn't work
        logger.info(`${pkg.name} not found, attempting to install (optional)...`);
        try {
          const installCommand = `${pythonPath} -m pip install --user ${pkg.name}>=${pkg.minVersion} --quiet`;
          await execAsync(installCommand, { timeout: 120000 });
          logger.info(`${pkg.name} installed successfully`);
          
          // Verify installation
          try {
            await execAsync(`${pythonPath} -c "import ${pkg.importName}; print('OK')"`, { timeout: 5000 });
          } catch {
            logger.warn(`${pkg.name} installation completed but verification failed - advanced checks will be skipped`);
          }
        } catch (error) {
          // Optional package - log warning but don't fail
          logger.warn(`${pkg.name} installation failed (optional) - advanced security checks will be skipped: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }
}

/**
 * Audit PDF for redaction risks using Python tool
 */
export async function auditPDFRedaction(
  pdfPath: string,
  options: AuditOptions = {}
): Promise<RedactionAuditResult> {
  // Validate path format
  if (!isValidPDFFile(pdfPath) || !isSafePath(pdfPath)) {
    throw new Error('Invalid PDF file path');
  }

  // Normalize and resolve PDF path to absolute path
  // This ensures paths with spaces are handled correctly
  let normalizedPdfPath: string;
  try {
    // Resolve to absolute path - handles relative paths and normalizes separators
    normalizedPdfPath = path.resolve(pdfPath);
    // Normalize the path (handles .., ., double slashes, etc.)
    normalizedPdfPath = path.normalize(normalizedPdfPath);
  } catch (error) {
    throw new Error(`Failed to resolve PDF path: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Verify PDF file exists and is accessible before proceeding
  try {
    await fs.access(normalizedPdfPath);
    const stats = await fs.stat(normalizedPdfPath);
    if (!stats.isFile()) {
      throw new Error(`Path exists but is not a file: ${normalizedPdfPath}`);
    }
    if (stats.size === 0) {
      throw new Error(`PDF file is empty: ${normalizedPdfPath}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not a file')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('empty')) {
      throw error;
    }
    // File doesn't exist or can't be accessed
    throw new Error(`PDF file not found or not accessible: ${normalizedPdfPath}. Original path: ${pdfPath}`);
  }

  // Find Python
  const pythonPath = await findPython();
  if (!pythonPath) {
    throw new Error('Python 3.11+ is required for File Security Checker. Please install Python from python.org');
  }

  // Ensure required Python dependencies are installed
  try {
    await ensurePythonDependencies(pythonPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Python dependency installation failed: ${errorMessage}`);
  }

  // Locate Python script - handle both dev and production
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  let scriptPath: string;
  
  if (isDev) {
    // In development, __dirname points to dist-electron/electron/utils/
    // We need to go up to project root, then to electron/python/
    // Try multiple methods to find project root
    const possibleRoots: string[] = [];
    
    // Method 1: Use process.cwd() (most reliable in dev)
    possibleRoots.push(process.cwd());
    
    // Method 2: Go up from __dirname (dist-electron/electron/utils/ -> project root)
    possibleRoots.push(path.join(__dirname, '..', '..', '..'));
    
    // Method 3: Use app.getAppPath() if available
    try {
      const appPath = app.getAppPath();
      if (appPath.includes('dist-electron')) {
        possibleRoots.push(path.join(appPath, '..', '..'));
      } else {
        possibleRoots.push(appPath);
      }
    } catch {
      // app.getAppPath() not available, skip
    }
    
    // Try to find the script in each possible root
    scriptPath = path.join(__dirname, '../python/pdf_redaction_audit.py'); // Fallback
    for (const root of possibleRoots) {
      const testPath = path.join(root, 'electron', 'python', 'pdf_redaction_audit.py');
      try {
        await fs.access(testPath);
        scriptPath = testPath;
        break;
      } catch {
        continue;
      }
    }
  } else {
    // In production, scripts should be in resources/python/ (outside app.asar)
    // Try multiple possible locations
    const appPath = app.getAppPath();
    const possiblePaths = [
      path.join(appPath, '..', 'python', 'pdf_redaction_audit.py'), // resources/python/
      path.join(appPath, 'python', 'pdf_redaction_audit.py'), // app.asar/python/
      path.join(process.resourcesPath || appPath, 'python', 'pdf_redaction_audit.py'), // resources/python/
    ];
    
    // Fallback to __dirname-based resolution
    scriptPath = path.join(__dirname, '../python/pdf_redaction_audit.py');
    
    // Try to find the script in production locations
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        scriptPath = testPath;
        break;
      } catch {
        continue;
      }
    }
  }
  
  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`File Security Checker Python scripts not found at: ${scriptPath}. Please reinstall the application.`);
  }

  // Normalize script path as well
  const normalizedScriptPath = path.normalize(scriptPath);

  return new Promise((resolve, reject) => {
    // Build arguments array - use normalized paths
    // spawn() with array arguments handles spaces correctly on all platforms
    const args = [
      normalizedScriptPath,
      normalizedPdfPath, // Use normalized absolute path
      '--json',
      '--black-threshold', String(options.blackThreshold ?? 0.15),
      '--min-overlap-area', String(options.minOverlapArea ?? 4.0),
      '--min-hits', String(options.minHits ?? 1),
    ];

    if (options.includeSecurityAudit === false) {
      args.push('--no-security-audit');
    }

    // Log the command for debugging (but don't log full paths in production)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executing Python audit:', {
        pythonCmd: pythonPath,
        scriptPath: normalizedScriptPath,
        pdfPath: normalizedPdfPath,
        args: args.slice(2), // Skip script and pdf path for cleaner logs
      });
    }

    // Use spawn with array arguments - this properly handles paths with spaces
    // Do NOT use shell: true as it can cause path splitting issues on Windows
    // Use pythonProcess instead of process to avoid shadowing global process object
    const pythonProcess = spawn(pythonPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      // Explicitly set shell to false to prevent path splitting
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      const stderrText = data.toString();
      stderr += stderrText;
      
      // Parse progress messages (format: "PROGRESS:message")
      const lines = stderrText.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const progressMessage = line.replace('PROGRESS:', '').trim();
          if (progressMessage) {
            // Determine which window should receive the progress update
            // Use getProgressTarget if provided (allows redirecting to detached window)
            // Otherwise use the original event sender
            const target = options.getProgressTarget ? options.getProgressTarget() : (options.event?.sender || null);
            if (target && !target.isDestroyed()) {
              logger.debug(`Sending progress to target window: ${progressMessage.substring(0, 50)}...`);
              target.send('audit-progress', progressMessage);
            } else if (options.event?.sender && !options.event.sender.isDestroyed()) {
              // Fallback to original sender
              logger.debug(`Sending progress to original sender (fallback): ${progressMessage.substring(0, 50)}...`);
              options.event.sender.send('audit-progress', progressMessage);
            } else {
              logger.warn('No valid target for progress update, progress message lost:', progressMessage.substring(0, 50));
            }
          }
        }
      }
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python redaction audit failed:', { code, stderr, stdout });
        
        // Try to parse error from stderr (might be JSON)
        try {
          const errorData = JSON.parse(stderr);
          if (errorData.error) {
            reject(new Error(errorData.error));
            return;
          }
        } catch {
          // Not JSON, use raw stderr
        }
        
        // Provide more helpful error messages
        if (stderr.includes('File not found') || stderr.includes('not found')) {
          reject(new Error(`PDF file not found: ${normalizedPdfPath}`));
        } else if (stderr.includes('Permission denied')) {
          reject(new Error(`Permission denied accessing PDF file: ${normalizedPdfPath}`));
        } else if (stderr.includes('encrypted') || stderr.includes('password')) {
          reject(new Error('PDF is encrypted and requires a password'));
        } else if (stderr.includes('corrupt') || stderr.includes('Invalid')) {
          reject(new Error('PDF file is corrupted or invalid'));
        } else {
          // Include both normalized and original path in error for debugging
          const errorMsg = stderr || 'Unknown error';
          reject(new Error(`Audit failed: ${errorMsg}. PDF path: ${normalizedPdfPath}`));
        }
        return;
      }

      try {
        const result = JSON.parse(stdout);
        const report = result.reports?.[0];
        if (!report) {
          reject(new Error('Invalid audit result format'));
          return;
        }

        resolve({
          filename: report.filename,
          totalPages: report.total_pages,
          flaggedPages: (report.flagged_pages || []).map((p: any) => ({
            pageNumber: p.page_number,
            blackRectCount: p.black_rect_count,
            overlapCount: p.overlap_count,
            confidenceScore: p.confidence_score,
          })),
          security: report.security,
          error: report.error,
        });
      } catch (error) {
        logger.error('Failed to parse audit result:', error);
        reject(new Error(`Failed to parse audit result: ${error}`));
      }
    });

    pythonProcess.on('error', (error) => {
      logger.error('Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}
