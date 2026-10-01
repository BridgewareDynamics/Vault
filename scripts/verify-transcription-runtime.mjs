#!/usr/bin/env node
import { spawn, spawnSync } from 'child_process';
import { mkdir, readFile, rm, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const runtimeDirectoryCandidates = [
  process.env.VAULT_TRANSCRIPTION_RUNTIME_DIR || 'transcription-runtime-bundled',
  'transcription-runtime',
];
let runtimeRoot = path.join(projectRoot, 'build', runtimeDirectoryCandidates[0]);
const userModelsRoot = path.join(projectRoot, 'build', 'transcription-runtime-user-models');
const port = Number(process.env.VAULT_TRANSCRIPTION_VERIFY_PORT || '8876');

function getPythonExe() {
  return path.join(runtimeRoot, 'python', 'python.exe');
}

function getServerScript() {
  return path.join(runtimeRoot, 'python', 'vault_transcription_server.py');
}

function getContextRoot() {
  return path.join(runtimeRoot, 'context');
}

function getBundledModelsRoot() {
  return path.join(runtimeRoot, 'models');
}

function getDefaultNemoModelPath() {
  return path.join(
    getBundledModelsRoot(),
    'nvidia',
    'parakeet-tdt-0.6b-v2',
    'parakeet-tdt-0.6b-v2.nemo'
  );
}

function getLocalParakeetV3Directory() {
  return path.join(getBundledModelsRoot(), 'parakeet-v3');
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  throw new Error(message);
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function ensureRuntimeFiles() {
  runtimeRoot = await resolveRuntimeRoot();
  const pythonExe = getPythonExe();
  const serverScript = getServerScript();
  const contextRoot = getContextRoot();
  const bundledModelsRoot = getBundledModelsRoot();
  const defaultNemoModelPath = getDefaultNemoModelPath();
  const localParakeetV3Directory = getLocalParakeetV3Directory();
  for (const targetPath of [
    pythonExe,
    serverScript,
    contextRoot,
    bundledModelsRoot,
    path.join(runtimeRoot, 'runtime-manifest.json'),
  ]) {
    if (!(await exists(targetPath))) {
      fail(`Missing required runtime artifact: ${targetPath}`);
    }
  }

  if (
    !(await exists(defaultNemoModelPath)) &&
    !(await exists(path.join(localParakeetV3Directory, 'config.json')))
  ) {
    fail(
      `Missing bundled transcription model. Expected ${defaultNemoModelPath} or ${localParakeetV3Directory}`
    );
  }
}

async function resolveRuntimeRoot() {
  for (const directory of runtimeDirectoryCandidates) {
    const candidateRoot = path.join(projectRoot, 'build', directory);
    if (await exists(path.join(candidateRoot, 'runtime-manifest.json'))) {
      return candidateRoot;
    }
  }

  return path.join(projectRoot, 'build', runtimeDirectoryCandidates[0]);
}

function importSmokeTest() {
  log('Verifying embedded Python imports');
  const pythonExe = getPythonExe();
  const contextRoot = getContextRoot();
  const localParakeetV3Directory = getLocalParakeetV3Directory();
  run(pythonExe, [
    '-c',
    [
      `import sys; sys.path.insert(0, r"${contextRoot.replace(/\\/g, '\\\\')}")`,
      'import torch',
      'import av',
      'import fastapi',
      'from transformers import AutoProcessor',
      'from core.models.metadata import ModelMetadata',
      `import pathlib; local_dir = pathlib.Path(r"${localParakeetV3Directory.replace(/\\/g, '\\\\')}")`,
      'local_dir.joinpath("config.json").is_file() and __import__("transformers", fromlist=["AutoModelForTDT"]).AutoModelForTDT',
      "print('torch', torch.__version__)",
      "print('models', len(ModelMetadata.get_all_models_with_precisions()))",
    ].join('; '),
  ], {
    env: {
      ...process.env,
      PYTHONPATH: contextRoot,
    },
  });
}

async function waitForEndpoint(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VaultRuntimeVerify/1.0' },
      });
      if (response.ok) {
        return response;
      }
    } catch {
      // ignore until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  fail(`Timed out waiting for ${url}`);
}

async function smokeTestServer() {
  const pythonExe = getPythonExe();
  const serverScript = getServerScript();
  const contextRoot = getContextRoot();
  const bundledModelsRoot = getBundledModelsRoot();
  const localParakeetV3Directory = getLocalParakeetV3Directory();
  await rm(userModelsRoot, { recursive: true, force: true });
  await mkdir(userModelsRoot, { recursive: true });

  log('Starting bundled transcription server smoke test');
  const child = spawn(pythonExe, [serverScript], {
    cwd: runtimeRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      VAULT_TRANSCRIPTION_CONTEXT_ROOT: contextRoot,
      VAULT_TRANSCRIPTION_BUNDLED_MODELS_DIR: bundledModelsRoot,
      VAULT_TRANSCRIPTION_USER_MODELS_DIR: userModelsRoot,
      VAULT_TRANSCRIPTION_PARAKEET_V3_DIR: localParakeetV3Directory,
      VAULT_TRANSCRIPTION_RUNTIME_MODE: 'bundled',
      VAULT_TRANSCRIPTION_LOCAL_ONLY_RESOLUTION: '1',
      VAULT_TRANSCRIPTION_HOST: '127.0.0.1',
      VAULT_TRANSCRIPTION_PORT: String(port),
    },
  });

  let exited = false;
  child.on('exit', () => {
    exited = true;
  });

  try {
    const engineInfoResponse = await waitForEndpoint(
      `http://127.0.0.1:${port}/vault/engine-info`,
      45000
    );
    const engineInfo = await engineInfoResponse.json();

    if (!engineInfo.default_model_ready) {
      fail('Bundled runtime started, but the default model was not detected as locally ready.');
    }

    if (engineInfo.runtime_mode !== 'bundled') {
      fail(`Expected runtime_mode=bundled, received ${engineInfo.runtime_mode}`);
    }

    if (!engineInfo.local_only_resolution) {
      fail('Bundled runtime did not report local-only model resolution.');
    }

    log('Bundled runtime server smoke test passed');
  } finally {
    if (!exited) {
      child.kill();
      await new Promise((resolve) => child.once('exit', resolve));
    }
  }
}

async function readManifest() {
  const manifestPath = path.join(runtimeRoot, 'runtime-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const validDefaultModelPaths = new Set([
    'nvidia/parakeet-tdt-0.6b-v2/parakeet-tdt-0.6b-v2.nemo',
    'models/parakeet-v3',
  ]);
  if (!validDefaultModelPaths.has(manifest.defaultModel?.relativePath)) {
    fail('Runtime manifest does not reference a supported bundled default model.');
  }
}

async function main() {
  if (process.platform !== 'win32') {
    fail('The bundled transcription runtime verification is currently supported on Windows only.');
  }

  await ensureRuntimeFiles();
  await readManifest();
  importSmokeTest();
  await smokeTestServer();
  log(`Bundled transcription runtime verified at ${runtimeRoot}`);
}

main().catch((error) => {
  console.error(`\nBundled transcription runtime verification failed: ${error.message}`);
  process.exit(1);
});
