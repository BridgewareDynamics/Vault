import { describe, expect, it } from 'vitest';
import {
  appendEvidenceAttachmentsToBlocks,
  assignEvidenceAttachmentsToBlocks,
  getEffectiveBlockAttachments,
  getEvidenceOwnerBlockId,
  isMapAttachmentDrag,
  isOsFileDrag,
  mergeMapAttachments,
  parseDropPendingAttachments,
  removeEvidenceAttachmentFromBlocks,
} from './mapAttachmentUtils';
import { MapBlock } from '../../types';

const timelineBlock: MapBlock = {
  id: 'timeline-1',
  kind: 'timeline',
  title: 'Main event',
  notesHtml: '',
  attachments: [
    {
      id: 'att-1',
      fileName: 'report.pdf',
      relativePath: '/vault/report.pdf',
      vaultPath: '/vault/report.pdf',
      type: 'pdf',
    },
  ],
  position: { x: 0, y: 0 },
  size: { width: 240, height: 180 },
};

const branchBlock: MapBlock = {
  id: 'branch-1',
  kind: 'branch',
  title: 'Side note',
  notesHtml: '',
  attachments: [],
  position: { x: 100, y: 0 },
  size: { width: 200, height: 160 },
  branchParentBlockId: 'timeline-1',
  branchSide: 'right',
};

describe('mapAttachmentUtils', () => {
  it('routes branch evidence to the timeline owner block', () => {
    expect(getEvidenceOwnerBlockId(branchBlock, [timelineBlock, branchBlock])).toBe('timeline-1');
  });

  it('shows parent evidence on branch cards', () => {
    expect(getEffectiveBlockAttachments(branchBlock, [timelineBlock, branchBlock])).toEqual(
      timelineBlock.attachments
    );
  });

  it('assigns branch editor attachments to the timeline owner', () => {
    const nextAttachment = {
      id: 'att-2',
      fileName: 'photo.jpg',
      relativePath: 'assets/photo.jpg',
      vaultPath: '/maps/demo/assets/photo.jpg',
      type: 'image' as const,
    };

    const blocks = assignEvidenceAttachmentsToBlocks(
      [timelineBlock, branchBlock],
      branchBlock.id,
      [...timelineBlock.attachments, nextAttachment]
    );

    expect(blocks.find((block) => block.id === 'timeline-1')?.attachments).toEqual([
      ...timelineBlock.attachments,
      nextAttachment,
    ]);
    expect(blocks.find((block) => block.id === 'branch-1')?.attachments).toEqual([]);
  });

  it('appends dropped attachments without duplicates', () => {
    const duplicate = timelineBlock.attachments[0];
    const blocks = appendEvidenceAttachmentsToBlocks(
      [timelineBlock, branchBlock],
      branchBlock.id,
      [duplicate, {
        id: 'att-3',
        fileName: 'notes.txt',
        relativePath: 'assets/notes.txt',
        vaultPath: '/maps/demo/assets/notes.txt',
        type: 'other',
      }]
    );

    expect(blocks.find((block) => block.id === 'timeline-1')?.attachments).toHaveLength(2);
  });

  it('parses local file drops from Electron file paths', () => {
    const file = { path: 'C:/Users/test/Desktop/evidence.pdf', name: 'evidence.pdf' } as File & {
      path: string;
    };
    const dataTransfer = {
      types: ['Files'],
      files: [file],
      getData: () => '',
    } as unknown as DataTransfer;

    expect(parseDropPendingAttachments(dataTransfer)).toEqual([
      expect.objectContaining({
        sourcePath: 'C:/Users/test/Desktop/evidence.pdf',
        origin: 'local',
        type: 'pdf',
      }),
    ]);
  });

  it('detects OS file drags during dragover via Files mime type', () => {
    const dataTransfer = {
      types: ['Files'],
      files: [],
      getData: () => '',
    } as unknown as DataTransfer;

    expect(isOsFileDrag(dataTransfer)).toBe(true);
    expect(isMapAttachmentDrag(dataTransfer)).toBe(true);
  });

  it('merges map attachments by vault path and file name', () => {
    const merged = mergeMapAttachments(timelineBlock.attachments, timelineBlock.attachments);
    expect(merged).toHaveLength(1);
  });

  it('removes evidence from the timeline owner when deleting from a branch view', () => {
    const blocks = removeEvidenceAttachmentFromBlocks(
      [timelineBlock, branchBlock],
      branchBlock.id,
      'att-1'
    );

    expect(blocks.find((block) => block.id === 'timeline-1')?.attachments).toEqual([]);
    expect(blocks.find((block) => block.id === 'branch-1')?.attachments).toEqual([]);
  });
});
