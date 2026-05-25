import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapBlockNode } from './MapBlockNode';
import { buildChronology } from '../../utils/mapChronology';
import { MAP_BLOCK_DEFAULT_SIZE, MAP_BRANCH_BLOCK_DEFAULT_SIZE } from '../../utils/mapLayout';
import type { MapBlock, MapCanvasSide } from '../../types';
import type { MapHandleSide } from '../../utils/mapEdgeRouting';

vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <div data-testid={id} />,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
}));

function makeTimelineBlock(): MapBlock {
  return {
    id: 'timeline-1',
    kind: 'timeline',
    title: 'Timeline Block',
    chronology: buildChronology({ tier: 'year', year: 2024 }),
    notesHtml: '<p>Timeline note</p>',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BLOCK_DEFAULT_SIZE },
  };
}

function makeBranchBlock(): MapBlock {
  return {
    id: 'branch-1',
    kind: 'branch',
    title: 'Branch Note',
    notesHtml: '<p>Branch note</p>',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BRANCH_BLOCK_DEFAULT_SIZE },
    branchParentBlockId: 'timeline-1',
    branchSide: 'left',
    branchOrder: 0,
  };
}

function buildProps(
  block: MapBlock,
  options?: {
    branchButtons?: Array<{ branchSide: 'left' | 'right'; buttonSide: MapCanvasSide }>;
    occupiedSides?: MapHandleSide[];
  }
): ComponentProps<typeof MapBlockNode> {
  return {
    id: block.id,
    data: {
      block,
      theme: 'pastel',
      onExpand: vi.fn(),
      onPreview: vi.fn(),
      onDelete: vi.fn(),
      onEdit: vi.fn(),
      onCreateBranch: vi.fn(),
      branchButtons: options?.branchButtons ?? [
        { branchSide: 'left', buttonSide: 'left' },
        { branchSide: 'right', buttonSide: 'right' },
      ],
      occupiedSides: options?.occupiedSides ?? ['top', 'bottom'],
    },
    selected: false,
    dragging: false,
    zIndex: 1,
    isConnectable: false,
    type: 'mapBlock',
    xPos: 0,
    yPos: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as unknown as ComponentProps<typeof MapBlockNode>;
}

describe('MapBlockNode', () => {
  it('fires left and right branch callbacks from the plus buttons', async () => {
    const user = userEvent.setup();
    const props = buildProps(makeTimelineBlock());

    render(<MapBlockNode {...props} />);

    await user.click(screen.getByRole('button', { name: 'Create left branch' }));
    await user.click(screen.getByRole('button', { name: 'Create right branch' }));

    expect(props.data.onCreateBranch).toHaveBeenNthCalledWith(1, 'timeline-1', 'left', 'left');
    expect(props.data.onCreateBranch).toHaveBeenNthCalledWith(2, 'timeline-1', 'right', 'right');
  });

  it('moves branch buttons to the open sides on turnaround blocks', async () => {
    const user = userEvent.setup();
    const props = buildProps(makeTimelineBlock(), {
      branchButtons: [
        { branchSide: 'left', buttonSide: 'bottom' },
        { branchSide: 'right', buttonSide: 'right' },
      ],
      occupiedSides: ['top', 'left'],
    });

    render(<MapBlockNode {...props} />);

    const leftBranchButton = screen.getByRole('button', { name: 'Create left branch' });
    const rightBranchButton = screen.getByRole('button', { name: 'Create right branch' });

    expect(leftBranchButton).toHaveAttribute('data-branch-button-side', 'bottom');
    expect(rightBranchButton).toHaveAttribute('data-branch-button-side', 'right');

    await user.click(leftBranchButton);
    expect(props.data.onCreateBranch).toHaveBeenCalledWith('timeline-1', 'left', 'bottom');
  });

  it('shows branch-specific labeling for note cards', () => {
    render(<MapBlockNode {...buildProps(makeBranchBlock())} />);

    expect(screen.getByText('Left branch note')).toBeInTheDocument();
    expect(screen.getByText('Branch Note')).toBeInTheDocument();
  });
});
