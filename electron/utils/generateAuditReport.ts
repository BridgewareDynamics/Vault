import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import { logger } from './logger';

/**
 * Find Python executable (3.11+)
 */
async function findPython(): Promise<string | null> {
  const candidates = process.platform === 'win32' 
    ? ['python', 'py', 'python3']
    : ['python3', 'python3.11', 'python3.12', 'python'];
  
  for (const cmd of candidates) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`${cmd} --version`);
      const versionMatch = stdout.match(/Python (\d+)\.(\d+)/);
      
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10);
        const minor = parseInt(versionMatch[2], 10);
        
        if (major > 3 || (major === 3 && minor >= 11)) {
          // Verify it's actually executable
          await execAsync(`"${cmd}" -c "import sys; sys.exit(0)"`);
          return cmd;
        }
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

export interface GenerateReportOptions {
  auditResult: any; // The full audit result object
  outputPath: string; // Where to save the PDF
}

/**
 * Generate a PDF report from audit results.
 */
export async function generateAuditReport(
  options: GenerateReportOptions
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  const { auditResult, outputPath } = options;

  // Find Python executable
  const pythonPath = await findPython();
  if (!pythonPath) {
    throw new Error('Python 3.11+ is required but not found. Please install Python from python.org');
  }

  // Locate Python script - handle both dev and production
  // More robust dev detection - prioritize !app.isPackaged
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  let scriptPath: string;

  if (isDev) {
    // In development, scripts are in electron/python/ relative to project root
    let projectRoot = process.cwd();
    if (!existsSync(path.join(projectRoot, 'electron', 'python', 'generate_audit_report.py'))) {
      // Fallback if cwd is not project root (e.g., running from dist-electron)
      projectRoot = path.join(__dirname, '..', '..');
    }
    scriptPath = path.join(projectRoot, 'electron', 'python', 'generate_audit_report.py');
  } else {
    // In production, scripts should be in resources/python/ (outside app.asar)
    const appPath = app.getAppPath();
    const possiblePaths = [
      path.join(appPath, '..', 'python', 'generate_audit_report.py'), // resources/python/
      path.join(process.resourcesPath || appPath, 'python', 'generate_audit_report.py'), // resources/python/
    ];

    scriptPath = path.join(__dirname, '../python/generate_audit_report.py'); // Fallback

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
    throw new Error(`Report generator script not found at: ${scriptPath}. Please reinstall the application.`);
  }

  // Create temporary JSON file with audit data
  const tempJsonPath = path.join(path.dirname(outputPath), `audit_temp_${Date.now()}.json`);
  
  try {
    // Write audit result to temp JSON file
    await fs.writeFile(tempJsonPath, JSON.stringify(auditResult), 'utf-8');

    // Normalize all paths before passing to Python
    const normalizedScriptPath = path.normalize(scriptPath);
    const normalizedTempJsonPath = path.normalize(tempJsonPath);
    const normalizedOutputPath = path.normalize(outputPath);

    return new Promise((resolve, reject) => {
      // Build arguments array with normalized paths
      // spawn() with array arguments handles spaces correctly on all platforms
      const args = [normalizedScriptPath, normalizedTempJsonPath, normalizedOutputPath];

      // Use spawn with array arguments - this properly handles paths with spaces
      // Do NOT use shell: true as it can cause path splitting issues on Windows
      // Use pythonProcess instead of process to avoid shadowing global process object
      const pythonProcess = spawn(pythonPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false, // Explicitly set to false to prevent path splitting
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        // Clean up temp file
        try {
          await fs.unlink(tempJsonPath);
        } catch {
          // Ignore cleanup errors
        }

        if (code !== 0) {
          logger.error('PDF report generation failed:', { code, stderr, stdout });
          
          // Try to parse error from stderr (might be JSON)
          try {
            const errorData = JSON.parse(stderr);
            reject(new Error(errorData.error || 'Report generation failed'));
          } catch {
            reject(new Error(`Report generation failed: ${stderr || stdout || 'Unknown error'}`));
          }
          return;
        }

        // Try to parse success response
        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve({ success: true, outputPath: result.output_path || outputPath });
          }
        } catch {
          // If not JSON, assume success if file was created
          if (existsSync(outputPath)) {
            resolve({ success: true, outputPath });
          } else {
            reject(new Error('Report generation completed but output file not found'));
          }
        }
      });

      pythonProcess.on('error', async (error) => {
        // Clean up temp file
        try {
          await fs.unlink(tempJsonPath);
        } catch {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start report generation: ${error.message}`));
      });
    });
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempJsonPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
