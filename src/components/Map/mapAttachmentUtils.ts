import { MapAttachment, MapBlock } from '../../types';
import { randomUUID } from '../../utils/uuid';

export interface PendingMapAttachment {
  sourcePath: string;
  fileName: string;
  origin: 'local' | 'vault';
  type: MapAttachment['type'];
}

export const MAP_VAULT_DRAG_MIME = 'application/x-vault-map-attachment';

export function detectMapAttachmentType(filePath: string): MapAttachment['type'] {
  const lower = filePath.toLowerCase();

  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.wmv') ||
    lower.endsWith('.flv') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mkv')
  ) {
    return 'video';
  }

  return 'other';
}

export function getMapAttachmentFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

export function createPendingMapAttachment(input: {
  sourcePath: string;
  origin: PendingMapAttachment['origin'];
  fileName?: string;
  type?: MapAttachment['type'];
}): PendingMapAttachment {
  return {
    sourcePath: input.sourcePath,
    fileName: input.fileName || getMapAttachmentFileName(input.sourcePath),
    origin: input.origin,
    type: input.type || detectMapAttachmentType(input.sourcePath),
  };
}

export function mergePendingMapAttachments(
  current: PendingMapAttachment[],
  additions: PendingMapAttachment[]
): PendingMapAttachment[] {
  const seen = new Set(current.map((item) => `${item.origin}:${item.sourcePath}`));
  const merged = [...current];

  additions.forEach((item) => {
    const key = `${item.origin}:${item.sourcePath}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(item);
  });

  return merged;
}

export function isSavedMapAttachmentCopy(attachment: MapAttachment): boolean {
  return /^assets[\\/]/i.test(attachment.relativePath);
}

/** Walk branch parents until the timeline block that owns shared evidence. */
export function resolveTimelineEvidenceBlock(block: MapBlock, blocks: MapBlock[]): MapBlock {
  const byId = new Map(blocks.map((candidate) => [candidate.id, candidate]));
  let current: MapBlock = block;

  while (current.kind === 'branch' && current.branchParentBlockId) {
    const parent = byId.get(current.branchParentBlockId);
    if (!parent) {
      break;
    }
    if (parent.kind !== 'branch') {
      return parent;
    }
    current = parent;
  }

  return current;
}

export function getEvidenceOwnerBlockId(block: MapBlock, blocks: MapBlock[]): string {
  if (block.kind === 'branch') {
    return resolveTimelineEvidenceBlock(block, blocks).id;
  }
  return block.id;
}

/** Branch cards display evidence from their timeline owner (plus any legacy branch-only files). */
export function getEffectiveBlockAttachments(block: MapBlock, blocks: MapBlock[]): MapAttachment[] {
  if (block.kind !== 'branch') {
    return block.attachments;
  }

  const owner = resolveTimelineEvidenceBlock(block, blocks);
  const ownerAttachments = owner.attachments;
  const legacyBranchAttachments = block.attachments.filter(
    (attachment) => !ownerAttachments.some((ownerAttachment) => ownerAttachment.id === attachment.id)
  );

  return [...ownerAttachments, ...legacyBranchAttachments];
}

export function mergeMapAttachments(
  current: MapAttachment[],
  additions: MapAttachment[]
): MapAttachment[] {
  const seen = new Set(current.map((attachment) => `${attachment.vaultPath}:${attachment.fileName}`));
  const merged = [...current];

  additions.forEach((attachment) => {
    const key = `${attachment.vaultPath}:${attachment.fileName}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(attachment);
  });

  return merged;
}

export function assignEvidenceAttachmentsToBlocks(
  blocks: MapBlock[],
  targetBlockId: string,
  attachments: MapAttachment[]
): MapBlock[] {
  const target = blocks.find((block) => block.id === targetBlockId);
  if (!target) {
    return blocks;
  }

  const ownerId = getEvidenceOwnerBlockId(target, blocks);

  return blocks.map((block) => {
    if (block.id === ownerId) {
      return { ...block, attachments };
    }
    if (block.id === targetBlockId && block.kind === 'branch') {
      return { ...block, attachments: [] };
    }
    return block;
  });
}

export function appendEvidenceAttachmentsToBlocks(
  blocks: MapBlock[],
  targetBlockId: string,
  additions: MapAttachment[]
): MapBlock[] {
  const target = blocks.find((block) => block.id === targetBlockId);
  if (!target || additions.length === 0) {
    return blocks;
  }

  const ownerId = getEvidenceOwnerBlockId(target, blocks);

  return blocks.map((block) => {
    if (block.id !== ownerId) {
      return block;
    }
    return { ...block, attachments: mergeMapAttachments(block.attachments, additions) };
  });
}

export function removeEvidenceAttachmentFromBlocks(
  blocks: MapBlock[],
  targetBlockId: string,
  attachmentId: string
): MapBlock[] {
  const target = blocks.find((block) => block.id === targetBlockId);
  if (!target) {
    return blocks;
  }

  const ownerId = getEvidenceOwnerBlockId(target, blocks);

  return blocks.map((block) => {
    if (block.id === ownerId || block.id === targetBlockId) {
      return {
        ...block,
        attachments: block.attachments.filter((attachment) => attachment.id !== attachmentId),
      };
    }
    return block;
  });
}

export function getDragTransferTypes(dataTransfer: DataTransfer): string[] {
  return Array.from(dataTransfer.types ?? []);
}

export function isOsFileDrag(dataTransfer: DataTransfer): boolean {
  const types = getDragTransferTypes(dataTransfer);
  if (types.includes('Files')) {
    return true;
  }
  return (dataTransfer.files?.length ?? 0) > 0;
}

export function isMapAttachmentDrag(dataTransfer: DataTransfer): boolean {
  const types = getDragTransferTypes(dataTransfer);
  if (types.includes(MAP_VAULT_DRAG_MIME)) {
    return true;
  }
  if (isOsFileDrag(dataTransfer)) {
    return true;
  }
  if (types.includes('text/plain')) {
    return true;
  }
  return false;
}

export function getDroppedLocalFilePaths(dataTransfer: DataTransfer): string[] {
  if (!dataTransfer.files?.length) {
    return [];
  }

  return Array.from(dataTransfer.files)
    .map((file) => {
      if ('path' in file && typeof (file as File & { path?: string }).path === 'string') {
        return (file as File & { path: string }).path;
      }
      return null;
    })
    .filter((filePath): filePath is string => Boolean(filePath));
}

export function parseDropPendingAttachments(dataTransfer: DataTransfer): PendingMapAttachment[] {
  const additions: PendingMapAttachment[] = [];

  const vaultPayload = dataTransfer.getData(MAP_VAULT_DRAG_MIME);
  if (vaultPayload) {
    try {
      additions.push(JSON.parse(vaultPayload) as PendingMapAttachment);
    } catch {
      // Ignore malformed vault payloads.
    }
  }

  if (dataTransfer.files?.length) {
    getDroppedLocalFilePaths(dataTransfer).forEach((filePath) => {
      additions.push(
        createPendingMapAttachment({
          sourcePath: filePath,
          origin: 'local',
        })
      );
    });
  }

  const plainPath = dataTransfer.getData('text/plain')?.trim();
  if (
    plainPath &&
    (plainPath.includes('/') || plainPath.includes('\\')) &&
    !additions.some((item) => item.sourcePath === plainPath)
  ) {
    additions.push(
      createPendingMapAttachment({
        sourcePath: plainPath,
        origin: 'vault',
      })
    );
  }

  return additions;
}

export function findMapBlockIdFromDropPoint(clientX: number, clientY: number): string | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  const nodeElement = elements.find((element) => element.closest('.react-flow__node'));
  const node = nodeElement?.closest('.react-flow__node');
  return node?.getAttribute('data-id') ?? null;
}

export async function resolvePendingAttachmentsToMapAttachments(
  pendingFiles: PendingMapAttachment[],
  mapFolderPath: string
): Promise<MapAttachment[]> {
  const attachments: MapAttachment[] = [];

  for (const pendingFile of pendingFiles) {
    const attachmentId = randomUUID();

    if (pendingFile.origin === 'vault') {
      attachments.push({
        id: attachmentId,
        fileName: pendingFile.fileName,
        relativePath: pendingFile.sourcePath,
        vaultPath: pendingFile.sourcePath,
        type: pendingFile.type,
      });
      continue;
    }

    if (window.electronAPI?.copyMapAttachmentToAssets) {
      const copied = await window.electronAPI.copyMapAttachmentToAssets(
        mapFolderPath,
        pendingFile.sourcePath,
        attachmentId
      );
      attachments.push({
        id: attachmentId,
        fileName: copied.fileName,
        relativePath: copied.relativePath,
        vaultPath: copied.vaultPath,
        type: copied.type,
      });
    }
  }

  return attachments;
}
