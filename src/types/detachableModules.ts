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

export type ModuleHostMode = 'embedded' | 'detached';

export interface ModuleChromeProps {
  hostMode?: ModuleHostMode;
  onPopOut?: () => void;
  onReattach?: () => void;
  popOutDisabled?: boolean;
  isPastel?: boolean;
}
