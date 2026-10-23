import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  ArrowUpDown, 
  Pin, 
  Lock, 
  Tag as TagIcon,
  RotateCcw
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { NoteCategory, SortOption } from '../types';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Personal', value: 'Personal' },
  { label: 'Work', value: 'Work' },
  { label: 'Ideas', value: 'Ideas' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Secret Vault', value: 'Secret Vault' },
  { label: 'Journal', value: 'Journal' },
  { label: 'Passwords', value: 'Passwords' },
  { label: 'Project', value: 'Project' },
];

export const SearchAndFilters: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    setSortBy,
    setShowOnlyPinned,
    setShowOnlyLocked,
    resetFilters,
    allTags,
    notes
  } = useNotes();

  const hasActiveFilters = 
    Boolean(filters.searchQuery) || 
    filters.selectedCategory !== 'all' || 
    filters.selectedTag !== null || 
    filters.showOnlyPinned || 
    filters.showOnlyLocked || 
    filters.sortBy !== 'updated_desc';

  return (
    <div className="space-y-3 mb-6">
      {/* Search Bar & Quick Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, markdown content, #tags..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={filters.sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="updated_asc">Oldest Updated</option>
              <option value="created_desc">Date Created</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>

          {/* Pinned filter toggle */}
          <button
            type="button"
            onClick={() => setShowOnlyPinned(prev => !prev)}
            className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              filters.showOnlyPinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${filters.showOnlyPinned ? 'fill-amber-400' : ''}`} />
            Pinned
          </button>

          {/* Locked filter toggle */}
          <button
            type="button"
            onClick={() => setShowOnlyLocked(prev => !prev)}
            className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              filters.showOnlyLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Vault Only
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset all filters"
              className="px-2.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = filters.selectedCategory.toLowerCase() === cat.value.toLowerCase();
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tags Cloud if tags exist */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <span className="text-slate-500 flex items-center gap-1 text-[11px] shrink-0 font-mono">
            <TagIcon className="w-3 h-3" /> Tags:
          </span>
          {allTags.map((tag) => {
            const isTagSelected = filters.selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isTagSelected ? null : tag)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md transition-colors border ${
                  isTagSelected
                    ? 'bg-indigo-500 text-white border-indigo-400 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-indigo-300 hover:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
