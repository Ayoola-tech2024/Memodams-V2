export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  vaultPinHash?: string;
  autoLockMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory = 
  | 'Personal' 
  | 'Work' 
  | 'Ideas' 
  | 'Finance' 
  | 'Secret Vault' 
  | 'Journal'
  | 'Project'
  | 'Passwords';

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  color: string;
  isPinned: boolean;
  isVaultLocked: boolean;
  isArchived: boolean;
  isTrash: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface VaultMediaItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: MediaType;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tags: string[];
  isVaultLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'notes' | 'photos' | 'videos' | 'documents' | 'trash' | 'tools';

export type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc' | 'title_asc';

export interface NoteFilterState {
  searchQuery: string;
  selectedCategory: string | 'all';
  selectedTag: string | null;
  sortBy: SortOption;
  showOnlyPinned: boolean;
  showOnlyLocked: boolean;
}
