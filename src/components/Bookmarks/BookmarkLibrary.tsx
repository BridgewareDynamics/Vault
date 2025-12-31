import { useState, useEffect, useCallback } from 'react';
import { Bookmark as BookmarkIcon, ArrowLeft, Folder, Search } from 'lucide-react';
import { Bookmark, BookmarkFolder } from '../../types';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkFolderCard } from './BookmarkFolderCard';
import { useToast } from '../Toast/ToastContext';

interface BookmarkLibraryProps {
  onClose: () => void;
  isDetached?: boolean;
}

export function BookmarkLibrary({ isDetached = false }: BookmarkLibraryProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'pdf' | 'page'>('date');
  const toast = useToast();

  const loadBookmarks = useCallback(async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [bookmarksList, foldersList] = await Promise.all([
        window.electronAPI.getBookmarksByFolder(selectedFolderId),
        window.electronAPI.getBookmarkFolders(),
      ]);
      setBookmarks(bookmarksList);
      setFolders(foldersList);
    } catch (error) {
      toast.error('Failed to load bookmarks');
      console.error('Load bookmarks error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId, toast]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Listen for bookmark creation/update events to refresh the list
  useEffect(() => {
    const handleBookmarkChange = () => {
      // Use a small delay to ensure the bookmark is fully saved
      setTimeout(() => {
        loadBookmarks();
      }, 100);
    };

    window.addEventListener('bookmark-created', handleBookmarkChange);
    window.addEventListener('bookmark-updated', handleBookmarkChange);
    window.addEventListener('bookmark-deleted', handleBookmarkChange);
    window.addEventListener('bookmark-folder-created', handleBookmarkChange);
    window.addEventListener('bookmark-folder-deleted', handleBookmarkChange);

    return () => {
      window.removeEventListener('bookmark-created', handleBookmarkChange);
      window.removeEventListener('bookmark-updated', handleBookmarkChange);
      window.removeEventListener('bookmark-deleted', handleBookmarkChange);
      window.removeEventListener('bookmark-folder-created', handleBookmarkChange);
      window.removeEventListener('bookmark-folder-deleted', handleBookmarkChange);
    };
  }, [loadBookmarks]); // Re-setup listener when loadBookmarks changes

  const handleDeleteBookmark = async (id: string) => {
    if (!window.electronAPI) return;

    try {
      await window.electronAPI.deleteBookmark(id);
      await loadBookmarks();
      toast.success('Bookmark deleted');
      
      // Dispatch event to notify other components
      const deleteEvent = new CustomEvent('bookmark-deleted', { detail: { bookmarkId: id } });
      window.dispatchEvent(deleteEvent);
    } catch (error) {
      toast.error('Failed to delete bookmark');
      console.error('Delete bookmark error:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.electronAPI) return;

    try {
      await window.electronAPI.deleteBookmarkFolder(id);
      await loadBookmarks();
      toast.success('Folder deleted');
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      
      // Dispatch event to notify other components
      const deleteEvent = new CustomEvent('bookmark-folder-deleted', { detail: { folderId: id } });
      window.dispatchEvent(deleteEvent);
    } catch (error) {
      toast.error('Failed to delete folder');
      console.error('Delete folder error:', error);
    }
  };

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        bookmark.name.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.note?.toLowerCase().includes(query) ||
        bookmark.pdfPath.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'pdf':
          return a.pdfPath.localeCompare(b.pdfPath);
        case 'page':
          return a.pageNumber - b.pageNumber;
        case 'date':
        default:
          return b.createdAt - a.createdAt;
      }
    });

  const currentFolder = selectedFolderId ? folders.find(folder => folder.id === selectedFolderId) : null;
  const rootFolders = folders.filter(() => !selectedFolderId); // For now, all folders are root level

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedFolderId && (
            <button
              onClick={() => setSelectedFolderId(null)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              aria-label="Back to bookmarks"
            >
              <ArrowLeft size={18} className="text-gray-400" />
            </button>
          )}
          <h3 className="text-lg font-semibold text-white">
            {currentFolder ? currentFolder.name : 'Bookmark Library'}
          </h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`p-4 border-b border-gray-700/50 flex items-center gap-2 flex-shrink-0 ${isDetached ? 'justify-center' : ''}`}>
        {isDetached ? (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-80 pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-purple-500 whitespace-nowrap"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="pdf">Sort by PDF</option>
              <option value="page">Sort by Page</option>
            </select>
          </>
        ) : (
          <>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-purple-500 whitespace-nowrap"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="pdf">Sort by PDF</option>
              <option value="page">Sort by Page</option>
            </select>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!selectedFolderId && rootFolders.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Folder size={16} />
              Folders
            </h4>
            <div className={isDetached 
              ? "grid gap-4 mb-6 justify-items-start"
              : "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            }
            style={isDetached ? {
              gridTemplateColumns: 'repeat(auto-fill, 226px)',
              justifyContent: 'start'
            } : undefined}>
              {rootFolders.map((folder) => (
                <BookmarkFolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={() => setSelectedFolderId(folder.id)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                  isDetached={isDetached}
                />
              ))}
            </div>
          </div>
        )}

        {filteredAndSortedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookmarkIcon size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">
              {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
            </p>
            {!searchQuery && (
              <p className="text-gray-500 text-sm">
                Create bookmarks from PDF pages to get started
              </p>
            )}
          </div>
        ) : (
          <div>
            {!selectedFolderId && rootFolders.length > 0 && (
              <h4 className="text-sm font-medium text-gray-400 mb-3">Bookmarks</h4>
            )}
            <div className={isDetached 
              ? "grid gap-4 justify-items-start"
              : "grid grid-cols-1 sm:grid-cols-2 gap-4"
            }
            style={isDetached ? {
              gridTemplateColumns: 'repeat(auto-fill, 226px)',
              justifyContent: 'start'
            } : undefined}>
              {filteredAndSortedBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={() => handleDeleteBookmark(bookmark.id)}
                  isDetached={isDetached}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

