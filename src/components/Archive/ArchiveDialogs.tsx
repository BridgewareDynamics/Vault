import { ArchiveFile, ArchiveCase, CategoryTag } from '../../types';
import { ArchiveDriveDialog } from './ArchiveDriveDialog';
import { CaseNameDialog } from './CaseNameDialog';
import { CaseDescriptionDialog } from './CaseDescriptionDialog';
import { ExtractionFolderDialog } from './ExtractionFolderDialog';
import { SaveParentDialog } from './SaveParentDialog';
import { FolderSelectionDialog } from './FolderSelectionDialog';
import { DeleteFolderConfirmDialog } from './DeleteFolderConfirmDialog';
import { DeletePDFConfirmDialog } from './DeletePDFConfirmDialog';
import { RenameFileDialog } from './RenameFileDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { CategoryTagSelector } from './CategoryTagSelector';

interface ArchiveDialogsProps {
  // Vault drive
  showDriveDialog: boolean;
  onCloseDriveDialog: () => void;
  onConfirmDrive: () => void;
  // Create case
  showCaseDialog: boolean;
  onCloseCaseDialog: () => void;
  onConfirmCase: (caseName: string, description: string, categoryTagId?: string) => void;
  // Case description
  showDescriptionDialog: boolean;
  caseForDescription: ArchiveCase | null;
  onCloseDescriptionDialog: () => void;
  onConfirmDescription: (description: string) => void | Promise<void>;
  // Create folder
  showCreateFolderDialog: boolean;
  onCloseCreateFolderDialog: () => void;
  onConfirmCreateFolder: (folderName: string) => void;
  // Folder selection (for extraction)
  showFolderSelectionDialog: boolean;
  onCloseFolderSelectionDialog: () => void;
  onSelectDirectory: () => void;
  onMakeNewFolder: () => void;
  // Extraction folder name
  showExtractionDialog: boolean;
  onCloseExtractionDialog: () => void;
  onConfirmExtraction: (folderName: string) => void;
  // Save parent
  showSaveParentDialog: boolean;
  onCloseSaveParentDialog: () => void;
  onConfirmSaveParent: (saveParent: boolean) => void;
  // Delete folder
  showDeleteFolderDialog: boolean;
  folderToDelete: ArchiveFile | null;
  onCloseDeleteFolderDialog: () => void;
  onConfirmDeleteFolder: () => void | Promise<void>;
  // Delete PDF
  showDeletePDFDialog: boolean;
  pdfToDelete: ArchiveFile | null;
  deletePDFHasExistingFolder: boolean;
  onCloseDeletePDFDialog: () => void;
  onConfirmDeletePDF: (deleteImageFolder: boolean) => void | Promise<void>;
  // Rename
  showRenameDialog: boolean;
  fileToRename: ArchiveFile | null;
  onCloseRenameDialog: () => void;
  onConfirmRename: (newName: string) => void | Promise<void>;
  // Tag selector
  showTagSelector: boolean;
  onCloseTagSelector: () => void;
  onSelectTag: (tagId: string | null) => void;
  tags: CategoryTag[];
  onCreateTag: (name: string, color: string) => Promise<CategoryTag | null>;
  onDeleteTag: (tagId: string) => Promise<boolean>;
  tagSelectorSelectedTagId: string | null;
}

/**
 * Renders the cluster of Archive dialogs (vault drive, case/folder creation,
 * extraction flow, delete/rename confirmations and the tag selector). Purely
 * presentational: all state and confirm logic live in the parent ArchivePage.
 */
export function ArchiveDialogs({
  showDriveDialog,
  onCloseDriveDialog,
  onConfirmDrive,
  showCaseDialog,
  onCloseCaseDialog,
  onConfirmCase,
  showDescriptionDialog,
  caseForDescription,
  onCloseDescriptionDialog,
  onConfirmDescription,
  showCreateFolderDialog,
  onCloseCreateFolderDialog,
  onConfirmCreateFolder,
  showFolderSelectionDialog,
  onCloseFolderSelectionDialog,
  onSelectDirectory,
  onMakeNewFolder,
  showExtractionDialog,
  onCloseExtractionDialog,
  onConfirmExtraction,
  showSaveParentDialog,
  onCloseSaveParentDialog,
  onConfirmSaveParent,
  showDeleteFolderDialog,
  folderToDelete,
  onCloseDeleteFolderDialog,
  onConfirmDeleteFolder,
  showDeletePDFDialog,
  pdfToDelete,
  deletePDFHasExistingFolder,
  onCloseDeletePDFDialog,
  onConfirmDeletePDF,
  showRenameDialog,
  fileToRename,
  onCloseRenameDialog,
  onConfirmRename,
  showTagSelector,
  onCloseTagSelector,
  onSelectTag,
  tags,
  onCreateTag,
  onDeleteTag,
  tagSelectorSelectedTagId,
}: ArchiveDialogsProps) {
  return (
    <>
      <ArchiveDriveDialog
        isOpen={showDriveDialog}
        onClose={onCloseDriveDialog}
        onConfirm={onConfirmDrive}
      />

      <CaseNameDialog
        isOpen={showCaseDialog}
        onClose={onCloseCaseDialog}
        onConfirm={onConfirmCase}
      />

      <CaseDescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={onCloseDescriptionDialog}
        onConfirm={onConfirmDescription}
        initialDescription={caseForDescription?.description || ''}
      />

      <CreateFolderDialog
        isOpen={showCreateFolderDialog}
        onClose={onCloseCreateFolderDialog}
        onConfirm={onConfirmCreateFolder}
      />

      <FolderSelectionDialog
        isOpen={showFolderSelectionDialog}
        onClose={onCloseFolderSelectionDialog}
        onSelectDirectory={onSelectDirectory}
        onMakeNewFolder={onMakeNewFolder}
      />

      <ExtractionFolderDialog
        isOpen={showExtractionDialog}
        onClose={onCloseExtractionDialog}
        onConfirm={onConfirmExtraction}
      />

      <SaveParentDialog
        isOpen={showSaveParentDialog}
        onClose={onCloseSaveParentDialog}
        onConfirm={onConfirmSaveParent}
      />

      <DeleteFolderConfirmDialog
        isOpen={showDeleteFolderDialog}
        folderName={folderToDelete?.name || ''}
        onClose={onCloseDeleteFolderDialog}
        onConfirm={onConfirmDeleteFolder}
      />

      <DeletePDFConfirmDialog
        isOpen={showDeletePDFDialog}
        fileName={pdfToDelete?.name || ''}
        hasExistingFolder={deletePDFHasExistingFolder}
        onClose={onCloseDeletePDFDialog}
        onConfirm={onConfirmDeletePDF}
      />

      <RenameFileDialog
        isOpen={showRenameDialog}
        currentName={fileToRename?.name || ''}
        onClose={onCloseRenameDialog}
        onConfirm={onConfirmRename}
      />

      <CategoryTagSelector
        isOpen={showTagSelector}
        onClose={onCloseTagSelector}
        onSelect={onSelectTag}
        tags={tags}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        selectedTagId={tagSelectorSelectedTagId}
      />
    </>
  );
}
