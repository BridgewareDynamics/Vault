import { useState, useEffect } from 'react';
import { FileText, Plus, ArrowLeft } from 'lucide-react';
import { TextLibraryItem } from './TextLibraryItem';
import { useToast } from '../Toast/ToastContext';
import { NewFileNameDialog } from './NewFileNameDialog';
import { DeleteTextFileConfirmDialog } from './DeleteTextFileConfirmDialog';

interface TextFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  preview?: string;
}

interface TextLibraryProps {
  onOpenFile: (filePath: string) => void;
  onNewFile: (fileName: string) => void;
  onClose: () => void;
  isDetached?: boolean;
  onFileDeleted?: (filePath: string) => void;
}

export function TextLibrary({ onOpenFile, onNewFile, onClose, isDetached = false, onFileDeleted }: TextLibraryProps) {
  const [files, setFiles] = useState<TextFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ path: string; name: string } | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fileList = await window.electronAPI.listTextFiles();
      setFiles(fileList);
    } catch (error) {
      toast.error('Failed to load text files');
      console.error('Load files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (filePath: string, fileName: string) => {
    setFileToDelete({ path: filePath, name: fileName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!window.electronAPI || !fileToDelete) return;

    try {
      await window.electronAPI.deleteTextFile(fileToDelete.path);
      await loadFiles();
      toast.success('File deleted');
      // Notify parent that a file was deleted (in case it's the currently open file)
      if (onFileDeleted) {
        onFileDeleted(fileToDelete.path);
      }
      setFileToDelete(null);
    } catch (error) {
      toast.error('Failed to delete file');
      console.error('Delete error:', error);
    }
  };

  const handleSaveAs = async (filePath: string) => {
    // This will be handled by opening the file and showing save dialog
    onOpenFile(filePath);
  };

  const handleNewFileClick = () => {
    setShowNewFileDialog(true);
  };

  const handleNewFileConfirm = (fileName: string) => {
    onNewFile(fileName);
    setShowNewFileDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Back to editor"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-white">Text Library</h3>
        </div>
        <button
          onClick={handleNewFileClick}
          className="px-3 py-1.5 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          <span>New</span>
        </button>
      </div>

      {/* Files Grid - Larger items when attached, smaller when detached */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No text files yet</p>
            <button
              onClick={handleNewFileClick}
              className="px-4 py-2 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <div className={isDetached 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 gap-4"
          }>
            {files.map((file) => (
              <TextLibraryItem
                key={file.path}
                file={file}
                onOpen={() => onOpenFile(file.path)}
                onEdit={() => onOpenFile(file.path)}
                onSaveAs={() => handleSaveAs(file.path)}
                onDelete={() => handleDeleteClick(file.path, file.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New File Name Dialog */}
      <NewFileNameDialog
        isOpen={showNewFileDialog}
        onClose={() => setShowNewFileDialog(false)}
        onConfirm={handleNewFileConfirm}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTextFileConfirmDialog
        isOpen={showDeleteDialog}
        fileName={fileToDelete?.name || ''}
        onClose={() => {
          setShowDeleteDialog(false);
          setFileToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

