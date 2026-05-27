import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { app } from 'electron';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import { logger } from '../utils/logger';

interface PythonCommandCandidate {
  command: string;
  argsPrefix: string[];
  displayName: string;
}

export interface TranscriptionEngineStatus {
  available: boolean;
  running: boolean;
  port?: number;
  serverUrl?: string;
  pythonCommand?: string;
  pythonExecutable?: string;
  scriptPath?: string;
  contextRoot?: string;
  bundledModelsDirectory?: string;
  deviceDefault?: 'cpu' | 'cuda';
  cudaBuilt?: boolean;
  cudaAvailable?: boolean;
  runtimeMode?: 'source' | 'bundled' | 'packaged';
  localOnlyResolution?: boolean;
  defaultModelKey?: string;
  defaultModelReady?: boolean;
  error?: string;
}

export interface TranscriptionEngineModel {
  key: string;
  name: string;
  modelId: string;
  precision: string;
  modelType: string;
  averageVramUsage?: string;
  defaultSegmentLength: number;
  supportsTimestamps: boolean;
  bundled?: boolean;
  bundledPath?: string;
  cached?: boolean;
  cachePath?: string;
}

export interface TranscribeMediaOptions {
  sourcePath: string;
  model?: string;
  precision?: string;
  device?: 'cpu' | 'cuda';
  outputFormat?: 'txt' | 'srt' | 'vtt' | 'json';
  includeTimestamps?: boolean;
  segmentLength?: number;
  segmentDuration?: number;
}

interface RawEngineModel {
  name: string;
  model_id: string;
  precision: string;
  model_type: string;
  avg_vram_usage?: string;
  default_segment_length: number;
  supports_timestamps: boolean;
  bundled?: boolean;
  bundled_path?: string;
  cached?: boolean;
  cache_path?: string;
}

interface RawTranscribeResponse {
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  processing_time_seconds: number;
  model_used: string;
  audio_duration_seconds: number;
}

interface RawStatusResponse {
  server_running: boolean;
  queue_depth: number;
  transcription_active: boolean;
}

interface RawEngineInfoResponse {
  context_root: string;
  python_executable: string;
  device_default: string;
  cuda_built: boolean;
  cuda_available: boolean;
  model_default: string;
  bundled_models_dir: string;
  local_only_resolution: boolean;
  runtime_mode: string;
  default_model_ready: boolean;
}

interface RuntimePaths {
  scriptPath: string;
  contextRoot: string;
  pythonExecutable: string | null;
  bundledModelsDirectory: string;
  userModelsDirectory: string;
  parakeetV3Directory: string | null;
  runtimeMode: 'source' | 'bundled' | 'packaged';
  localOnlyResolution: boolean;
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function onceServerPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('Failed to allocate transcription port'));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

export class TranscriptionEngineManager {
  private child: ChildProcessWithoutNullStreams | null = null;

  private startPromise: Promise<void> | null = null;

  private port: number | null = null;

  private serverUrl: string | null = null;

  private pythonCommand: string | null = null;

  private lastError: string | null = null;

  private resolvedRuntime: RuntimePaths | null = null;

  async getStatus(): Promise<TranscriptionEngineStatus> {
    const runtime = this.resolveRuntimePaths();
    if (this.child && this.serverUrl) {
      try {
        const [status, engineInfo] = await Promise.all([
          this.fetchJson<RawStatusResponse>('/status'),
          this.fetchJson<RawEngineInfoResponse>('/vault/engine-info'),
        ]);
        return {
          available: true,
          running: status.server_running,
          port: this.port ?? undefined,
          serverUrl: this.serverUrl,
          pythonCommand: this.pythonCommand ?? undefined,
          pythonExecutable: engineInfo.python_executable,
          scriptPath: runtime.scriptPath,
          contextRoot: engineInfo.context_root,
          bundledModelsDirectory: engineInfo.bundled_models_dir,
          deviceDefault:
            engineInfo.device_default === 'cuda' ? 'cuda' : 'cpu',
          cudaBuilt: engineInfo.cuda_built,
          cudaAvailable: engineInfo.cuda_available,
          runtimeMode:
            engineInfo.runtime_mode === 'packaged' ||
            engineInfo.runtime_mode === 'bundled'
              ? engineInfo.runtime_mode
              : 'source',
          localOnlyResolution: engineInfo.local_only_resolution,
          defaultModelKey: engineInfo.model_default,
          defaultModelReady: engineInfo.default_model_ready,
        };
      } catch (error) {
        this.lastError =
          error instanceof Error ? error.message : 'Unknown transcription engine error';
      }
    }

    return {
      available:
        fileExists(runtime.scriptPath) &&
        fileExists(runtime.contextRoot) &&
        (runtime.runtimeMode === 'source' || !!runtime.pythonExecutable),
      running: false,
      port: this.port ?? undefined,
      serverUrl: this.serverUrl ?? undefined,
      pythonCommand: this.pythonCommand ?? undefined,
      pythonExecutable: runtime.pythonExecutable ?? undefined,
      scriptPath: runtime.scriptPath,
      contextRoot: runtime.contextRoot,
      bundledModelsDirectory: runtime.bundledModelsDirectory,
      runtimeMode: runtime.runtimeMode,
      localOnlyResolution: runtime.localOnlyResolution,
      error: this.lastError ?? undefined,
    };
  }

  async listModels(): Promise<TranscriptionEngineModel[]> {
    await this.ensureStarted();
    const raw = await this.fetchJson<Record<string, RawEngineModel>>('/vault/models');
    return Object.entries(raw).map(([key, value]) => ({
      key,
      name: value.name,
      modelId: value.model_id,
      precision: value.precision,
      modelType: value.model_type,
      averageVramUsage: value.avg_vram_usage,
      defaultSegmentLength: value.default_segment_length,
      supportsTimestamps: value.supports_timestamps,
      bundled: value.bundled,
      bundledPath: value.bundled_path,
      cached: value.cached,
      cachePath: value.cache_path,
    }));
  }

  async transcribeMedia(
    options: TranscribeMediaOptions
  ): Promise<RawTranscribeResponse> {
    await this.ensureStarted();

    return this.fetchJson<RawTranscribeResponse>('/vault/transcribe-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_path: options.sourcePath,
        model: options.model,
        precision: options.precision,
        device: options.device,
        output_format: options.outputFormat,
        word_timestamps: options.includeTimestamps,
        segment_length: options.segmentLength,
        segment_duration: options.segmentDuration,
      }),
    });
  }

  async cancelTranscription(): Promise<void> {
    await this.ensureStarted();
    await this.fetchJson<{ cancelled: boolean }>('/vault/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  }

  async stop(): Promise<void> {
    if (!this.child) {
      return;
    }

    const child = this.child;
    this.child = null;
    this.startPromise = null;
    this.serverUrl = null;
    this.port = null;
    this.pythonCommand = null;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        resolve();
      }, 3000);

      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      child.kill('SIGTERM');
    });
  }

  async ensureStarted(): Promise<void> {
    if (this.child && this.serverUrl) {
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = this.startInternal();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  private async startInternal(): Promise<void> {
    const runtime = this.resolveRuntimePaths();
    if (!fileExists(runtime.scriptPath)) {
      throw new Error(`Vault transcription server script not found at ${runtime.scriptPath}`);
    }
    if (!fileExists(runtime.contextRoot)) {
      throw new Error(`Vault transcription context not found at ${runtime.contextRoot}`);
    }

    const candidates = this.getPythonCandidates();
    let lastError: Error | null = null;

    for (const candidate of candidates) {
      try {
        await this.launchCandidate(candidate);
        this.lastError = null;
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.lastError = lastError.message;
        logger.warn(
          `Failed to start transcription engine with ${candidate.displayName}:`,
          lastError
        );
        await this.stop();
      }
    }

    throw lastError ?? new Error('Unable to start Vault transcription engine');
  }

  private getPythonCandidates(): PythonCommandCandidate[] {
    const runtime = this.resolveRuntimePaths();
    const envPython = process.env.VAULT_TRANSCRIPTION_PYTHON;
    const candidates: PythonCommandCandidate[] = [];

    if (envPython && !app.isPackaged) {
      candidates.push({
        command: envPython,
        argsPrefix: [],
        displayName: envPython,
      });
    }

    if (runtime.pythonExecutable && fileExists(runtime.pythonExecutable)) {
      candidates.push({
        command: runtime.pythonExecutable,
        argsPrefix: [],
        displayName: runtime.pythonExecutable,
      });
    }

    if (!app.isPackaged && runtime.runtimeMode === 'source') {
      candidates.push(
        {
          command: 'py',
          argsPrefix: ['-3'],
          displayName: 'py -3',
        },
        {
          command: 'python',
          argsPrefix: [],
          displayName: 'python',
        }
      );
    }

    return candidates;
  }

  private async launchCandidate(
    candidate: PythonCommandCandidate
  ): Promise<void> {
    const runtime = this.resolveRuntimePaths();
    const port = await onceServerPort();
    const serverUrl = `http://127.0.0.1:${port}`;

    await new Promise<void>((resolve, reject) => {
      const args = [...candidate.argsPrefix, runtime.scriptPath];
      const child = spawn(candidate.command, args, {
        cwd: runtime.contextRoot,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          VAULT_TRANSCRIPTION_CONTEXT_ROOT: runtime.contextRoot,
          VAULT_TRANSCRIPTION_BUNDLED_MODELS_DIR: runtime.bundledModelsDirectory,
          VAULT_TRANSCRIPTION_USER_MODELS_DIR: runtime.userModelsDirectory,
          ...(runtime.parakeetV3Directory
            ? {
                VAULT_TRANSCRIPTION_PARAKEET_V3_DIR: runtime.parakeetV3Directory,
              }
            : {}),
          VAULT_TRANSCRIPTION_RUNTIME_MODE: runtime.runtimeMode,
          VAULT_TRANSCRIPTION_LOCAL_ONLY_RESOLUTION: runtime.localOnlyResolution
            ? '1'
            : '0',
          VAULT_TRANSCRIPTION_HOST: '127.0.0.1',
          VAULT_TRANSCRIPTION_PORT: String(port),
        },
        stdio: 'pipe',
      });

      let settled = false;
      let errorBuffer = '';

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        try {
          child.kill('SIGTERM');
        } catch {
          // Ignore teardown errors during failed launches.
        }
        reject(error);
      };

      child.once('error', (error) => {
        fail(error);
      });

      child.stdout.on('data', (data) => {
        logger.debug(`[TranscriptionEngine] ${String(data).trim()}`);
      });

      child.stderr.on('data', (data) => {
        const next = String(data).trim();
        if (next) {
          errorBuffer = `${errorBuffer}\n${next}`.trim();
          logger.warn(`[TranscriptionEngine] ${next}`);
        }
      });

      child.once('exit', (code) => {
        if (!settled) {
          fail(
            new Error(
              errorBuffer ||
                `Transcription engine exited before becoming healthy (code ${code ?? 'unknown'})`
            )
          );
        }
      });

      this.waitForHealth(serverUrl)
        .then(() => {
          if (settled) return;
          settled = true;
          this.child = child;
          this.port = port;
          this.serverUrl = serverUrl;
          this.pythonCommand = candidate.displayName;
          resolve();
        })
        .catch((error) => {
          fail(
            new Error(
              error instanceof Error
                ? error.message
                : 'Timed out waiting for transcription engine health'
            )
          );
        });
    });
  }

  private async waitForHealth(serverUrl: string): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < 30000) {
      try {
        const response = await fetch(`${serverUrl}/health`);
        if (response.ok) {
          return;
        }
      } catch {
        // Poll until the timeout window expires.
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Timed out waiting for Vault transcription engine to boot');
  }

  private async fetchJson<T>(pathname: string, init?: RequestInit): Promise<T> {
    if (!this.serverUrl) {
      throw new Error('Transcription engine is not running');
    }

    const response = await fetch(`${this.serverUrl}${pathname}`, init);
    if (!response.ok) {
      const payload = await response.text();
      throw new Error(
        payload || `Transcription engine request failed with ${response.status}`
      );
    }

    return (await response.json()) as T;
  }

  private resolveRuntimePaths(): RuntimePaths {
    const userModelsDirectory = path.join(
      app.getPath('userData'),
      'transcription',
      'models'
    );
    const buildRuntimeRoots = [
      path.join(process.cwd(), 'build', 'transcription-runtime-bundled'),
      path.join(process.cwd(), 'build', 'transcription-runtime'),
    ];
    const packagedRuntimeRoot = path.join(
      process.resourcesPath,
      'transcription-runtime'
    );
    const sourceContextRoot = path.join(process.cwd(), 'context', 'Elegant-Transcriber-main');
    const sourceParakeetV3Directory = path.join(
      process.cwd(),
      'electron',
      'transcription',
      'models',
      'parakeet-v3'
    );

    const bundledCandidates: RuntimePaths[] = [
      ...buildRuntimeRoots.map((runtimeRoot) => ({
        scriptPath: path.join(
          runtimeRoot,
          'python',
          'vault_transcription_server.py'
        ),
        contextRoot: path.join(runtimeRoot, 'context'),
        pythonExecutable: path.join(runtimeRoot, 'python', 'python.exe'),
        bundledModelsDirectory: path.join(runtimeRoot, 'models'),
        userModelsDirectory,
        parakeetV3Directory: path.join(runtimeRoot, 'models', 'parakeet-v3'),
        runtimeMode: 'bundled' as const,
        localOnlyResolution: true,
      })),
      {
        scriptPath: path.join(
          packagedRuntimeRoot,
          'python',
          'vault_transcription_server.py'
        ),
        contextRoot: path.join(packagedRuntimeRoot, 'context'),
        pythonExecutable: path.join(packagedRuntimeRoot, 'python', 'python.exe'),
        bundledModelsDirectory: path.join(packagedRuntimeRoot, 'models'),
        userModelsDirectory,
        parakeetV3Directory: path.join(packagedRuntimeRoot, 'models', 'parakeet-v3'),
        runtimeMode: 'packaged',
        localOnlyResolution: true,
      },
    ];

    const sourceCandidate: RuntimePaths = {
      scriptPath: path.join(
        process.cwd(),
        'electron',
        'transcription',
        'python',
        'vault_transcription_server.py'
      ),
      contextRoot: sourceContextRoot,
      pythonExecutable: process.env.VAULT_TRANSCRIPTION_PYTHON || null,
      bundledModelsDirectory: path.join(sourceContextRoot, 'models'),
      userModelsDirectory,
      parakeetV3Directory: sourceParakeetV3Directory,
      runtimeMode: 'source',
      localOnlyResolution: true,
    };

    const candidates = app.isPackaged
      ? [bundledCandidates[bundledCandidates.length - 1], ...bundledCandidates.slice(0, -1)]
      : [...bundledCandidates, sourceCandidate];

    this.resolvedRuntime =
      candidates.find(
        (candidate) =>
          fileExists(candidate.scriptPath) &&
          fileExists(candidate.contextRoot) &&
          (candidate.runtimeMode === 'source' ||
            (candidate.pythonExecutable !== null &&
              fileExists(candidate.pythonExecutable)))
      ) ?? (app.isPackaged ? bundledCandidates[1] : sourceCandidate);

    return this.resolvedRuntime;
  }
}

export const transcriptionEngine = new TranscriptionEngineManager();
