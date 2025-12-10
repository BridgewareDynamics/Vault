import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_FILE_NAME = 'archive-config.json';

interface ArchiveConfig {
  archiveDrive: string | null;
}

let cachedConfig: ArchiveConfig | null = null;

/**
 * Get the path to the config file
 */
function getConfigPath(): string {
  // Ensure app is ready before getting path
  if (!app.isReady()) {
    throw new Error('App is not ready yet');
  }
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, CONFIG_FILE_NAME);
}

/**
 * Load archive configuration from disk
 */
export async function loadArchiveConfig(): Promise<ArchiveConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    cachedConfig = JSON.parse(data) as ArchiveConfig;
    return cachedConfig;
  } catch (error) {
    // Config doesn't exist or is invalid, return default
    cachedConfig = { archiveDrive: null };
    return cachedConfig;
  }
}

/**
 * Save archive configuration to disk
 */
export async function saveArchiveConfig(config: ArchiveConfig): Promise<void> {
  try {
    const configPath = getConfigPath();
    cachedConfig = config;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save archive config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get archive drive path
 */
export async function getArchiveDrive(): Promise<string | null> {
  const config = await loadArchiveConfig();
  return config.archiveDrive;
}

/**
 * Set archive drive path
 */
export async function setArchiveDrive(drivePath: string | null): Promise<void> {
  const config = await loadArchiveConfig();
  config.archiveDrive = drivePath;
  await saveArchiveConfig(config);
}

