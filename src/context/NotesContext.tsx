import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { NoteItem, VaultMediaItem, NoteFilterState, SortOption } from '../types';
import { useAuth } from './AuthContext';

interface NotesContextType {
  notes: NoteItem[];
  trashNotes: NoteItem[];
  media: VaultMediaItem[];
  allTags: string[];
  loading: boolean;
  filters: NoteFilterState;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSortBy: (sort: SortOption) => void;
  setShowOnlyPinned: (val: boolean | ((prev: boolean) => boolean)) => void;
  setShowOnlyLocked: (val: boolean | ((prev: boolean) => boolean)) => void;
  resetFilters: () => void;
  
  // Note actions
  addNote: (note: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrash'>) => Promise<string>;
  updateNote: (id: string, updates: Partial<NoteItem>) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleVaultLock: (id: string) => Promise<void>;
  
  // Media actions
  addMedia: (media: Omit<VaultMediaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteMedia: (id: string) => Promise<void>;
  toggleMediaVaultLock: (id: string) => Promise<void>;

  // Backup & Import
  exportVaultData: () => string;
  importVaultData: (jsonData: string) => Promise<{ importedNotes: number; importedMedia: number }>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allUserNotes, setAllUserNotes] = useState<NoteItem[]>([]);
  const [mediaList, setMediaList] = useState<VaultMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<NoteFilterState>({
    searchQuery: '',
    selectedCategory: 'all',
    selectedTag: null,
    sortBy: 'updated_desc',
    showOnlyPinned: false,
    showOnlyLocked: false,
  });

  // Listen to Firestore notes
  useEffect(() => {
    if (!user) {
      setAllUserNotes([]);
      setMediaList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notesColRef = collection(db, 'notes');
    const notesQuery = query(notesColRef, where('userId', '==', user.uid));

    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const fetchedNotes: NoteItem[] = [];
        snapshot.forEach((docSnap) => {
          fetchedNotes.push(docSnap.data() as NoteItem);
        });
        setAllUserNotes(fetchedNotes);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notes');
      }
    );

    const mediaColRef = collection(db, 'vaultMedia');
    const mediaQuery = query(mediaColRef, where('userId', '==', user.uid));

    const unsubscribeMedia = onSnapshot(
      mediaQuery,
      (snapshot) => {
        const fetchedMedia: VaultMediaItem[] = [];
        snapshot.forEach((docSnap) => {
          fetchedMedia.push(docSnap.data() as VaultMediaItem);
        });
        setMediaList(fetchedMedia);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'vaultMedia');
      }
    );

    return () => {
      unsubscribeNotes();
      unsubscribeMedia();
    };
  }, [user]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allUserNotes.forEach(note => {
      if (!note.isTrash && Array.isArray(note.tags)) {
        note.tags.forEach(t => tagSet.add(t.toLowerCase().trim()));
      }
    });
    mediaList.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(t => tagSet.add(t.toLowerCase().trim()));
      }
    });
    return Array.from(tagSet).filter(Boolean).sort();
  }, [allUserNotes, mediaList]);

  // Filter and Sort Active Notes
  const notes = useMemo(() => {
    let result = allUserNotes.filter(n => !n.isTrash);

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q)
      );
    }

    if (filters.selectedCategory !== 'all') {
      result = result.filter(n => n.category.toLowerCase() === filters.selectedCategory.toLowerCase());
    }

    if (filters.selectedTag) {
      result = result.filter(n => n.tags.some(t => t.toLowerCase() === filters.selectedTag?.toLowerCase()));
    }

    if (filters.showOnlyPinned) {
      result = result.filter(n => n.isPinned);
    }

    if (filters.showOnlyLocked) {
      result = result.filter(n => n.isVaultLocked);
    }

    // Sort
    result.sort((a, b) => {
      // Pinned notes always surface to top unless sorting alphabetically
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (filters.sortBy === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filters.sortBy === 'updated_asc') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (filters.sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [allUserNotes, filters]);

  // Trash Notes
  const trashNotes = useMemo(() => {
    return allUserNotes
      .filter(n => n.isTrash)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allUserNotes]);

  // Filter controls
  const setSearchQuery = (searchQuery: string) => setFilters(prev => ({ ...prev, searchQuery }));
  const setSelectedCategory = (selectedCategory: string) => setFilters(prev => ({ ...prev, selectedCategory }));
  const setSelectedTag = (selectedTag: string | null) => setFilters(prev => ({ ...prev, selectedTag }));
  const setSortBy = (sortBy: SortOption) => setFilters(prev => ({ ...prev, sortBy }));
  const setShowOnlyPinned = (val: boolean | ((prev: boolean) => boolean)) => {
    setFilters(prev => ({ ...prev, showOnlyPinned: typeof val === 'function' ? val(prev.showOnlyPinned) : val }));
  };
  const setShowOnlyLocked = (val: boolean | ((prev: boolean) => boolean)) => {
    setFilters(prev => ({ ...prev, showOnlyLocked: typeof val === 'function' ? val(prev.showOnlyLocked) : val }));
  };
  const resetFilters = () => setFilters({
    searchQuery: '',
    selectedCategory: 'all',
    selectedTag: null,
    sortBy: 'updated_desc',
    showOnlyPinned: false,
    showOnlyLocked: false,
  });

  // Actions - Note
  const addNote = async (noteData: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrash'>): Promise<string> => {
    if (!user) throw new Error('User must be signed in to create notes');
    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const newNote: NoteItem = {
      ...noteData,
      id: noteId,
      userId: user.uid,
      isArchived: false,
      isTrash: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'notes', noteId), newNote);
      return noteId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notes/${noteId}`);
    }
  };

  const updateNote = async (id: string, updates: Partial<NoteItem>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const sanitizedUpdates = {
      ...updates,
      updatedAt: now,
    };
    try {
      await updateDoc(doc(db, 'notes', id), sanitizedUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
    }
  };

  const moveToTrash = async (id: string) => {
    await updateNote(id, { isTrash: true });
  };

  const restoreFromTrash = async (id: string) => {
    await updateNote(id, { isTrash: false });
  };

  const deletePermanently = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  const emptyTrash = async () => {
    if (!user || trashNotes.length === 0) return;
    try {
      const batch = writeBatch(db);
      trashNotes.forEach(n => {
        batch.delete(doc(db, 'notes', n.id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notes');
    }
  };

  const togglePin = async (id: string) => {
    const note = allUserNotes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isPinned: !note.isPinned });
    }
  };

  const toggleVaultLock = async (id: string) => {
    const note = allUserNotes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isVaultLocked: !note.isVaultLocked });
    }
  };

  // Actions - Media
  const addMedia = async (mediaData: Omit<VaultMediaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User must be signed in to add media');
    const mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const newMedia: VaultMediaItem = {
      ...mediaData,
      id: mediaId,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'vaultMedia', mediaId), newMedia);
      return mediaId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vaultMedia/${mediaId}`);
    }
  };

  const deleteMedia = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'vaultMedia', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vaultMedia/${id}`);
    }
  };

  const toggleMediaVaultLock = async (id: string) => {
    const item = mediaList.find(m => m.id === id);
    if (!item || !user) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'vaultMedia', id), {
        isVaultLocked: !item.isVaultLocked,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vaultMedia/${id}`);
    }
  };

  // Export JSON Backup
  const exportVaultData = () => {
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userEmail: user?.email,
      notes: allUserNotes,
      mediaMetadata: mediaList.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        fileName: m.fileName,
        fileSize: m.fileSize,
        tags: m.tags,
        isVaultLocked: m.isVaultLocked,
        createdAt: m.createdAt,
      }))
    };
    return JSON.stringify(exportPayload, null, 2);
  };

  // Import JSON Backup
  const importVaultData = async (jsonData: string): Promise<{ importedNotes: number; importedMedia: number }> => {
    if (!user) throw new Error('Sign in required for import');
    const parsed = JSON.parse(jsonData);
    let importedNotes = 0;
    let importedMedia = 0;

    if (Array.isArray(parsed.notes)) {
      for (const n of parsed.notes) {
        if (n.title) {
          await addNote({
            title: n.title,
            content: n.content || '',
            category: n.category || 'Personal',
            tags: Array.isArray(n.tags) ? n.tags : [],
            color: n.color || 'slate',
            isPinned: Boolean(n.isPinned),
            isVaultLocked: Boolean(n.isVaultLocked),
          });
          importedNotes++;
        }
      }
    }

    return { importedNotes, importedMedia };
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        trashNotes,
        media: mediaList,
        allTags,
        loading,
        filters,
        setSearchQuery,
        setSelectedCategory,
        setSelectedTag,
        setSortBy,
        setShowOnlyPinned,
        setShowOnlyLocked,
        resetFilters,
        addNote,
        updateNote,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
        emptyTrash,
        togglePin,
        toggleVaultLock,
        addMedia,
        deleteMedia,
        toggleMediaVaultLock,
        exportVaultData,
        importVaultData
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
