import type { MapDocument, TranscriptionDocument } from './index';

export type MapScreen = 'landing' | 'library' | 'editor';

export type MapWordEditorViewState = 'editor' | 'library' | 'bookmarkLibrary';

export interface MapModuleWordEditorSnapshot {
  isOpen: boolean;
  content: string;
  filePath: string | null;
  viewState: MapWordEditorViewState;
}

export interface MapModuleDetachState {
  screen: MapScreen;
  editorMapPath: string | null;
  editorDocument: MapDocument | null;
  autoEditTitleKey: number | null;
  wordEditor?: MapModuleWordEditorSnapshot;
}

export type TranscriptionScreen = 'landing' | 'library' | 'workspace';

export interface TranscriptionModuleDetachState {
  screen: TranscriptionScreen;
  workspacePath: string | null;
  workspaceDocument: TranscriptionDocument | null;
  launchSourcePath: string | null;
  launchCasePath: string | null;
}

import type { FileConverterSource, FileConverterTarget } from './index';

export type FileConverterScreen = 'landing' | 'workspace';

export interface FileConverterModuleDetachState {
  screen: FileConverterScreen;
  source: FileConverterSource | null;
  target: FileConverterTarget;
  selectedCasePath: string | null;
}

export interface FileConverterWorkspaceDetachBridge {
  collectDetachState: () => Promise<FileConverterModuleDetachState>;
  isConverting: () => boolean;
}

export type ModuleHostMode = 'embedded' | 'detached';

export interface ModuleChromeProps {
  hostMode?: ModuleHostMode;
  onPopOut?: () => void;
  onReattach?: () => void;
  popOutDisabled?: boolean;
  isPastel?: boolean;
}
