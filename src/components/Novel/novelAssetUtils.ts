export async function loadNovelAssetPreviewUrl(vaultPath: string): Promise<string | null> {
  if (!vaultPath) return null;
  if (window.electronAPI?.getFileThumbnail) {
    try {
      return await window.electronAPI.getFileThumbnail(vaultPath);
    } catch {
      // fall through
    }
  }
  if (window.electronAPI?.readFileData) {
    try {
      const data = await window.electronAPI.readFileData(vaultPath);
      if (typeof data === 'string' && data.startsWith('data:')) {
        return data;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function buildNovelAssetVaultPath(novelFolderPath: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.startsWith('assets/')) {
    return `${novelFolderPath}/${normalized}`.replace(/\\/g, '/');
  }
  return `${novelFolderPath}/assets/${normalized}`.replace(/\\/g, '/');
}
