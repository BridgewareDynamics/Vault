import { useState, useEffect, useCallback } from 'react';
import { Bookmark as BookmarkIcon, ArrowLeft, Folder, Search } from 'lucide-react';
import { Bookmark, BookmarkFolder, Theme } from '../../types';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkFolderCard } from './BookmarkFolderCard';
import { useToast } from '../Toast/ToastContext';
import { useSettingsContext } from '../../utils/settingsContext';

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
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

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
        <div className="text-center space-y-6">
          <div className={`inline-flex p-6 rounded-2xl border-2 ${
            isPastel
              ? 'bg-gradient-to-br from-pink-100/60 to-purple-100/60 border-pink-300/40'
              : 'bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border-cyber-cyan-400/30'
          }`}>
            <div className="relative">
              <div className={`absolute inset-0 border-4 rounded-full animate-spin ${
                isPastel ? 'border-pink-400/40' : 'border-cyber-purple-400/40'
              }`} style={{ animationDuration: '2s' }}></div>
              <div className={`absolute inset-2 border-2 rounded-full animate-spin ${
                isPastel ? 'border-purple-400/50' : 'border-cyber-cyan-400/50'
              }`} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              <div className="relative w-12 h-12">
                <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin ${
                  isPastel
                    ? 'border-t-pink-400 border-r-purple-400'
                    : 'border-t-cyber-purple-400 border-r-cyber-cyan-400'
                }`}></div>
                <div className={`absolute inset-2 rounded-full border-2 border-transparent animate-spin ${
                  isPastel
                    ? 'border-b-purple-400 border-l-pink-400'
                    : 'border-b-cyber-cyan-400 border-l-cyber-purple-400'
                }`} style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
              </div>
            </div>
          </div>
          <p className={`text-lg ${isPastel ? 'text-gray-700' : 'text-gray-300'}`}>Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
        isPastel
          ? 'border-pink-200/30 bg-gradient-to-r from-slate-50/95 via-pink-50/20 to-slate-50/95'
          : 'border-gray-700/50'
      }`}>
        <div className="flex items-center gap-2">
          {selectedFolderId && (
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`p-1 rounded transition-colors ${
                isPastel
                  ? 'hover:bg-pink-100/80'
                  : 'hover:bg-gray-800'
              }`}
              aria-label="Back to bookmarks"
            >
              <ArrowLeft size={18} className={isPastel ? 'text-gray-600' : 'text-gray-400'} />
            </button>
          )}
          <h3 className={`text-lg font-semibold ${
            isPastel ? 'text-gray-800' : 'text-white'
          }`}>
            {currentFolder ? currentFolder.name : 'Bookmark Library'}
          </h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`p-4 border-b flex items-center gap-2 flex-shrink-0 ${
        isPastel
          ? 'border-pink-200/30'
          : 'border-gray-700/50'
      } ${isDetached ? 'justify-center' : ''}`}>
        {isDetached ? (
          <>
            <div className="relative">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isPastel ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className={`w-80 pl-10 pr-4 py-2 rounded-lg focus:outline-none whitespace-nowrap ${
                  isPastel
                    ? 'bg-white/80 border border-pink-200/50 text-gray-800 placeholder-gray-500 focus:border-pink-400'
                    : 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:border-cyber-purple-500'
                }`}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none whitespace-nowrap ${
                isPastel
                  ? 'bg-white/80 border border-pink-200/50 text-gray-800 focus:border-pink-400'
                  : 'bg-gray-800/50 border border-gray-700 text-white focus:border-cyber-purple-500'
              }`}
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
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isPastel ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none ${
                  isPastel
                    ? 'bg-white/80 border border-pink-200/50 text-gray-800 placeholder-gray-500 focus:border-pink-400'
                    : 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:border-cyber-purple-500'
                }`}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none whitespace-nowrap ${
                isPastel
                  ? 'bg-white/80 border border-pink-200/50 text-gray-800 focus:border-pink-400'
                  : 'bg-gray-800/50 border border-gray-700 text-white focus:border-cyber-purple-500'
              }`}
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
            <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${
              isPastel ? 'text-gray-600' : 'text-gray-400'
            }`}>
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
            <BookmarkIcon size={48} className={isPastel ? 'text-gray-500 mb-4' : 'text-gray-600 mb-4'} />
            <p className={isPastel ? 'text-gray-600 mb-2' : 'text-gray-400 mb-2'}>
              {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
            </p>
            {!searchQuery && (
              <p className={isPastel ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>
                Create bookmarks from PDF pages to get started
              </p>
            )}
          </div>
        ) : (
          <div>
            {!selectedFolderId && rootFolders.length > 0 && (
              <h4 className={`text-sm font-medium mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Bookmarks</h4>
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

