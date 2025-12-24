import { useState, useEffect, useCallback } from 'react';
import { CategoryTag } from '../types';
import { useToast } from '../components/Toast/ToastContext';
import { logger } from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';

export function useCategoryTags() {
  const [tags, setTags] = useState<CategoryTag[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Load all tags
  const loadTags = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      const tagsList = await window.electronAPI.getCategoryTags();
      setTags(tagsList);
    } catch (error) {
      logger.error('Failed to load category tags:', error);
      toast.error(getUserFriendlyError(error, { operation: 'load category tags' }));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Create a new tag
  const createTag = useCallback(async (name: string, color: string): Promise<CategoryTag | null> => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return null;
    }

    if (!name.trim()) {
      toast.error('Tag name cannot be empty');
      return null;
    }

    if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      toast.error('Invalid color format');
      return null;
    }

    try {
      // Generate unique ID
      const id = `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTag: CategoryTag = { id, name: name.trim(), color };

      const createdTag = await window.electronAPI.createCategoryTag(newTag);
      await loadTags(); // Reload tags
      toast.success(`Category tag "${name}" created`);
      return createdTag;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'create category tag', fileName: name }));
      return null;
    }
  }, [toast, loadTags]);

  // Assign tag to case
  const assignTagToCase = useCallback(async (casePath: string, tagId: string | null): Promise<boolean> => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return false;
    }

    try {
      await window.electronAPI.setCaseCategoryTag(casePath, tagId);
      toast.success(tagId ? 'Category tag assigned' : 'Category tag removed');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'assign category tag' }));
      return false;
    }
  }, [toast]);

  // Assign tag to file
  const assignTagToFile = useCallback(async (filePath: string, tagId: string | null): Promise<boolean> => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return false;
    }

    try {
      await window.electronAPI.setFileCategoryTag(filePath, tagId);
      toast.success(tagId ? 'Category tag assigned to file' : 'Category tag removed from file');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'assign category tag to file' }));
      return false;
    }
  }, [toast]);

  // Get tag by ID
  const getTagById = useCallback((tagId: string | undefined): CategoryTag | undefined => {
    if (!tagId) return undefined;
    return tags.find(tag => tag.id === tagId);
  }, [tags]);

  // Delete a tag
  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return false;
    }

    if (!tagId || !tagId.trim()) {
      toast.error('Invalid tag ID');
      return false;
    }

    try {
      await window.electronAPI.deleteCategoryTag(tagId);
      await loadTags(); // Reload tags
      toast.success('Category tag deleted');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'delete category tag' }));
      return false;
    }
  }, [toast, loadTags]);

  return {
    tags,
    loading,
    loadTags,
    createTag,
    deleteTag,
    assignTagToCase,
    assignTagToFile,
    getTagById,
  };
}

