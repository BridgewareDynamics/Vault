#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultRuntimeDirectory = 'transcription-runtime-bundled';
const runtimeRoot = path.join(
  projectRoot,
  'build',
  process.env.VAULT_TRANSCRIPTION_RUNTIME_DIR || defaultRuntimeDirectory
);
const pythonRoot = path.join(runtimeRoot, 'python');
const pythonScriptsRoot = path.join(pythonRoot, 'Scripts');
const contextRoot = path.join(runtimeRoot, 'context');
const bundledModelsRoot = path.join(runtimeRoot, 'models');
const tempRoot = path.join(projectRoot, 'build', 'transcription-runtime-temp');
const sourceContextRoot = path.join(
  projectRoot,
  'context',
  'Elegant-Transcriber-main'
);
const sourceServerScript = path.join(
  projectRoot,
  'electron',
  'transcription',
  'python',
  'vault_transcription_server.py'
);
const sourcePatchScript = path.join(sourceContextRoot, 'patch_nemo.py');
const sourceBundledParakeetV3Directory = path.join(
  projectRoot,
  'electron',
  'transcription',
  'models',
  'parakeet-v3'
);
const sourceLegacyParakeetV3Directory = path.join(projectRoot, 'context', 'parakeet');

const pythonVersion = process.env.VAULT_TRANSCRIPTION_PYTHON_VERSION || '3.11.9';
const pythonEmbedUrl =
  process.env.VAULT_TRANSCRIPTION_PYTHON_EMBED_URL ||
  `https://www.python.org/ftp/python/${pythonVersion}/python-${pythonVersion}-embed-amd64.zip`;
const getPipUrl =
  process.env.VAULT_TRANSCRIPTION_GET_PIP_URL ||
  'https://bootstrap.pypa.io/get-pip.py';
const torchVariant = (
  process.env.VAULT_TRANSCRIPTION_TORCH_VARIANT || 'gpu'
).toLowerCase();
const useCudaRuntime = torchVariant !== 'cpu';
const defaultNemoModelId = 'nvidia/parakeet-tdt-0.6b-v2';
const defaultNemoModelRelativePath = path.join(
  'nvidia',
  'parakeet-tdt-0.6b-v2',
  'parakeet-tdt-0.6b-v2.nemo'
);
const defaultNemoModelPath =
  process.env.VAULT_TRANSCRIPTION_DEFAULT_MODEL_PATH ||
  path.join(sourceContextRoot, 'models', defaultNemoModelRelativePath);
const defaultNemoModelUrl =
  process.env.VAULT_TRANSCRIPTION_DEFAULT_MODEL_URL ||
  'https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2/resolve/main/parakeet-tdt-0.6b-v2.nemo';

const torchWheelUrl = useCudaRuntime
  ? 'https://download.pytorch.org/whl/cu128/torch-2.9.0%2Bcu128-cp311-cp311-win_amd64.whl#sha256=dc6f6c6e7d7eed20c687fc189754a6ea6bf2da9c64eff59fd6753b80ed4bca05'
  : 'https://download.pytorch.org/whl/cpu/torch-2.9.0%2Bcpu-cp311-cp311-win_amd64.whl#sha256=389e1e0b8083fd355f7caf5ba82356b5e01c318998bd575dbf2285a0d8137089';
const torchaudioWheelUrl = useCudaRuntime
  ? 'https://download.pytorch.org/whl/cu128/torchaudio-2.9.0%2Bcu128-cp311-cp311-win_amd64.whl'
  : 'https://download.pytorch.org/whl/cpu/torchaudio-2.9.0%2Bcpu-cp311-cp311-win_amd64.whl';
const cudaRuntimeDependencies = [
  'nvidia-cuda-runtime-cu12==12.8.90',
  'nvidia-cublas-cu12==12.8.4.1',
  'nvidia-cudnn-cu12==9.10.2.21',
  'nvidia-ml-py',
];
const nemoDependency = 'nemo_toolkit[asr]>=2.7.0,<2.8.0';
const runtimeOverrideDependencies = [
  'git+https://github.com/huggingface/transformers',
  'huggingface-hub>=1.3.0',
  'fsspec>=2024.12.0',
  'protobuf>=6.33,<7',
  'datasets>=3.2.0',
];
const runtimeAppDependencies = [
  'av',
  'psutil',
  'PySide6',
  'peft>=0.18.0',
  'soundfile',
  'nltk',
  'fastapi',
  'uvicorn[standard]',
  'python-multipart',
  'requests',
];

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

async function ensureWindows() {
  if (process.platform !== 'win32') {
    fail('The bundled transcription runtime build is currently supported on Windows only.');
  }
}

async function ensureSourceFiles() {
  if (!(await exists(sourceContextRoot))) {
    fail(`Missing transcription source context at ${sourceContextRoot}`);
  }
  if (!(await exists(sourceServerScript))) {
    fail(`Missing Vault transcription server script at ${sourceServerScript}`);
  }
  if (!(await exists(sourcePatchScript))) {
    fail(`Missing NeMo patch script at ${sourcePatchScript}`);
  }
}

async function cleanOutput() {
  await rm(runtimeRoot, { recursive: true, force: true });
  await rm(tempRoot, { recursive: true, force: true });
  await mkdir(runtimeRoot, { recursive: true });
  await mkdir(tempRoot, { recursive: true });
}

async function downloadFile(url, destination) {
  log(`Downloading ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'VaultRuntimeBuilder/1.0',
    },
  });

  if (!response.ok || !response.body) {
    fail(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

function run(command, args, options = {}) {
  const pathDelimiter = process.platform === 'win32' ? ';' : ':';
  const baseEnv = options.env ?? process.env;
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    env: {
      ...baseEnv,
      PATH: `${pythonScriptsRoot}${pathDelimiter}${baseEnv.PATH || ''}`,
      PIP_DISABLE_PIP_VERSION_CHECK: '1',
    },
    ...options,
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function extractZip(zipPath, destination) {
  await mkdir(destination, { recursive: true });
  run('powershell', [
    '-NoProfile',
    '-Command',
    `Expand-Archive -Force -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}'`,
  ]);
}

async function configureEmbeddedPython() {
  const entries = await readdir(pythonRoot);
  const pthFile = entries.find((entry) => /^python\d+._pth$/i.test(entry));
  if (!pthFile) {
    fail(`Unable to find embedded Python ._pth file in ${pythonRoot}`);
  }

  const pthPath = path.join(pythonRoot, pthFile);
  const original = await readFile(pthPath, 'utf8');
  const lines = original.split(/\r?\n/);
  const next = [];
  let hasLib = false;
  let hasSitePackages = false;
  let hasImportSite = false;

  for (const line of lines) {
    if (line.trim() === 'Lib') hasLib = true;
    if (line.trim() === 'Lib/site-packages') hasSitePackages = true;
    if (line.trim() === 'import site') hasImportSite = true;

    if (line.trim() === '#import site') {
      next.push('import site');
      hasImportSite = true;
      continue;
    }

    next.push(line);
  }

  if (!hasLib) next.splice(Math.max(next.length - 1, 0), 0, 'Lib');
  if (!hasSitePackages) next.splice(Math.max(next.length - 1, 0), 0, 'Lib/site-packages');
  if (!hasImportSite) next.push('import site');

  await mkdir(path.join(pythonRoot, 'Lib', 'site-packages'), { recursive: true });
  await writeFile(pthPath, `${next.filter(Boolean).join('\r\n')}\r\n`);
}

async function bootstrapPip(pythonExe) {
  const getPipPath = path.join(tempRoot, 'get-pip.py');
  await downloadFile(getPipUrl, getPipPath);
  run(pythonExe, [getPipPath, '--no-warn-script-location']);
  run(pythonExe, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--no-warn-script-location',
    'pip',
    'setuptools',
    'wheel',
  ]);
}

async function installDependencies(pythonExe) {
  run(pythonExe, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--no-warn-script-location',
    torchWheelUrl,
    torchaudioWheelUrl,
  ]);
  if (useCudaRuntime) {
    run(pythonExe, [
      '-m',
      'pip',
      'install',
      '--upgrade',
      '--no-warn-script-location',
      ...cudaRuntimeDependencies,
    ]);
  }
  run(pythonExe, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--no-warn-script-location',
    nemoDependency,
  ]);
  run(pythonExe, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--no-warn-script-location',
    '--no-deps',
    ...runtimeOverrideDependencies,
  ]);
  run(pythonExe, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--no-warn-script-location',
    ...runtimeAppDependencies,
  ]);
}

async function copyContextSources() {
  const sourceContextRootNormalized = sourceContextRoot.replace(/\\/g, '/');
  await cp(sourceContextRoot, contextRoot, {
    recursive: true,
    filter(source) {
      const normalized = source.replace(/\\/g, '/');
      if (normalized.includes('/__pycache__/')) return false;
      if (normalized.endsWith('.pyc')) return false;
      if (normalized.endsWith('.zip')) return false;
      if (normalized.includes('/.venv/')) return false;
      if (normalized.includes('/.pytest_cache/')) return false;
      if (normalized === `${sourceContextRootNormalized}/models`) return false;
      if (normalized.startsWith(`${sourceContextRootNormalized}/models/`)) return false;
      return true;
    },
  });
}

async function patchNemo(pythonExe) {
  run(pythonExe, [sourcePatchScript], {
    env: {
      ...process.env,
      PYTHONPATH: contextRoot,
    },
  });
}

async function copyVaultServer() {
  await cp(sourceServerScript, path.join(pythonRoot, 'vault_transcription_server.py'));
}

async function copyDefaultModel() {
  const bundledModelPath = path.join(bundledModelsRoot, defaultNemoModelRelativePath);
  if (await exists(defaultNemoModelPath)) {
    await mkdir(path.dirname(bundledModelPath), { recursive: true });
    await cp(defaultNemoModelPath, bundledModelPath);
    return bundledModelPath;
  }

  await downloadFile(defaultNemoModelUrl, bundledModelPath);
  return bundledModelPath;
}

async function copyLocalParakeetV3Model() {
  const sourceParakeetV3Directory =
    (await exists(sourceBundledParakeetV3Directory))
      ? sourceBundledParakeetV3Directory
      : sourceLegacyParakeetV3Directory;

  if (!(await exists(sourceParakeetV3Directory))) {
    return false;
  }

  const targetDirectory = path.join(bundledModelsRoot, 'parakeet-v3');
  await cp(sourceParakeetV3Directory, targetDirectory, {
    recursive: true,
    filter(source) {
      const normalized = source.replace(/\\/g, '/');
      if (normalized.includes('/__pycache__/')) return false;
      if (normalized.endsWith('.pyc')) return false;
      return true;
    },
  });
  return true;
}

async function writeManifest() {
  const manifestPath = path.join(runtimeRoot, 'runtime-manifest.json');
  const usingLocalParakeetV3 = await exists(
    path.join(bundledModelsRoot, 'parakeet-v3', 'config.json')
  );
  const manifest = {
    runtimeVersion: 1,
    builtAt: new Date().toISOString(),
    platform: 'win32',
    pythonVersion,
    torchVariant: useCudaRuntime ? 'gpu' : 'cpu',
    pythonExecutable: 'python/python.exe',
    serverScript: 'python/vault_transcription_server.py',
    contextRoot: 'context',
    bundledModelsRoot: 'models',
    defaultModel: usingLocalParakeetV3
      ? {
          id: 'nvidia/parakeet-tdt-0.6b-v3',
          relativePath: 'models/parakeet-v3',
          format: 'transformers-directory',
        }
      : {
          id: defaultNemoModelId,
          relativePath: defaultNemoModelRelativePath.replace(/\\/g, '/'),
          format: 'nemo-file',
        },
    localOnlyResolution: true,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function main() {
  await ensureWindows();
  await ensureSourceFiles();
  await cleanOutput();

  const pythonZipPath = path.join(tempRoot, `python-${pythonVersion}-embed-amd64.zip`);
  await downloadFile(pythonEmbedUrl, pythonZipPath);
  await extractZip(pythonZipPath, pythonRoot);
  await configureEmbeddedPython();

  const pythonExe = path.join(pythonRoot, 'python.exe');
  if (!(await exists(pythonExe))) {
    fail(`Embedded python executable not found at ${pythonExe}`);
  }

  log('Bootstrapping embedded Python');
  await bootstrapPip(pythonExe);

  log('Installing transcription runtime dependencies');
  await installDependencies(pythonExe);

  log('Copying transcription backend context');
  await copyContextSources();

  log('Patching NeMo for bundled runtime compatibility');
  await patchNemo(pythonExe);

  log('Copying Vault transcription server entry point');
  await copyVaultServer();

  log('Copying local Parakeet v3 folder when present');
  const copiedLocalParakeetV3 = await copyLocalParakeetV3Model();

  if (!copiedLocalParakeetV3) {
    log('Bundling default transcription model');
    await copyDefaultModel();
  }

  log('Writing runtime manifest');
  await writeManifest();

  await rm(tempRoot, { recursive: true, force: true });

  log(`Bundled transcription runtime staged at ${runtimeRoot}`);
}

main().catch((error) => {
  console.error(`\nFailed to build bundled transcription runtime: ${error.message}`);
  process.exit(1);
});
