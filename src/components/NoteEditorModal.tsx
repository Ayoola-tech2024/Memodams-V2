import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Lock, 
  Unlock, 
  Pin, 
  Tag, 
  Palette, 
  Eye, 
  Edit3, 
  Columns, 
  Bold, 
  Italic, 
  Code, 
  List, 
  CheckSquare, 
  Quote, 
  Heading1, 
  Heading2, 
  QrCode, 
  Share2, 
  Download,
  ShieldAlert
} from 'lucide-react';
import { NoteItem, NoteCategory } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QRCodeModal } from './QRCodeModal';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: NoteItem | null;
  onSave: (noteData: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrash'>) => Promise<void>;
  existingTags?: string[];
}

const CATEGORIES: NoteCategory[] = [
  'Personal', 
  'Work', 
  'Ideas', 
  'Finance', 
  'Secret Vault', 
  'Journal', 
  'Project', 
  'Passwords'
];

const COLORS = [
  { id: 'slate', name: 'Charcoal', bg: 'bg-slate-900', border: 'border-slate-700' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-950/60', border: 'border-indigo-500/40' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-950/60', border: 'border-amber-500/40' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-950/60', border: 'border-rose-500/40' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-950/60', border: 'border-purple-500/40' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-950/60', border: 'border-cyan-500/40' },
];

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSave,
  existingTags = []
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Personal');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [color, setColor] = useState('slate');
  const [isPinned, setIsPinned] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content || '');
      setCategory(noteToEdit.category || 'Personal');
      setTags(noteToEdit.tags || []);
      setColor(noteToEdit.color || 'slate');
      setIsPinned(noteToEdit.isPinned || false);
      setIsVaultLocked(noteToEdit.isVaultLocked || false);
    } else {
      setTitle('');
      setContent('');
      setCategory('Personal');
      setTags([]);
      setColor('slate');
      setIsPinned(false);
      setIsVaultLocked(false);
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content,
        category,
        tags,
        color,
        isPinned,
        isVaultLocked
      });
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const exportAsMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([`# ${title}\nCategory: ${category}\nTags: ${tags.join(', ')}\n\n${content}`], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '-').toLowerCase() || 'note'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[850px] shadow-2xl overflow-hidden flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Edit3 className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {noteToEdit ? 'Edit Note' : 'Create Secure Note'}
              </span>
              {isVaultLocked && (
                <span className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                  <Lock className="w-3 h-3" /> Vault Protected
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Unpin' : 'Pin to top'}
                className={`p-1.5 rounded-lg transition-colors border ${
                  isPinned 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
                }`}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsVaultLocked(!isVaultLocked)}
                title={isVaultLocked ? 'Locked inside Vault' : 'Standard note (click to lock)'}
                className={`p-1.5 rounded-lg transition-colors border ${
                  isVaultLocked 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
                }`}
              >
                {isVaultLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                title="Generate QR Code"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={exportAsMarkdown}
                title="Export as Markdown (.md)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Meta bar: Title, Category, Color */}
            <div className="p-4 sm:px-6 bg-slate-900/60 border-b border-slate-800/80 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title..."
                required
                className="w-full bg-transparent text-lg sm:text-xl font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Category select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Category:</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Color swatch picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" /> Accent:
                  </span>
                  <div className="flex items-center gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`w-5 h-5 rounded-full border transition-all ${c.bg} ${
                          color === c.id ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-slate-700 hover:scale-105'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="ml-auto flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                      viewMode === 'edit' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`hidden sm:flex px-2.5 py-1 rounded text-xs items-center gap-1 transition-colors ${
                      viewMode === 'split' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Columns className="w-3 h-3" /> Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                      viewMode === 'preview' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Markdown Quick Toolbar */}
            {viewMode !== 'preview' && (
              <div className="px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('# ', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('## ', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown('- [ ] ', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1"
                  title="Checklist Task"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('> ', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('```\n', '\n```')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors font-mono text-[11px]"
                  title="Code Block"
                >
                  {'{ }'}
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('---\n', '')}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors text-[11px]"
                  title="Divider"
                >
                  —
                </button>
              </div>
            )}

            {/* Editor & Preview Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Textarea */}
              {viewMode !== 'preview' && (
                <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${viewMode === 'split' ? 'border-r border-slate-800 w-1/2' : 'w-full'}`}>
                  <textarea
                    id="note-content-editor"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note with full markdown, code snippets, checkboxes..."
                    className="w-full h-full bg-transparent text-slate-200 placeholder:text-slate-600 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              )}

              {/* Live Preview */}
              {viewMode !== 'edit' && (
                <div className={`flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-950/40 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  <div className="mb-4 pb-2 border-b border-slate-800">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Live Markdown Preview</span>
                  </div>
                  <MarkdownRenderer
                    content={content}
                    onCheckboxToggle={(newContent) => setContent(newContent)}
                  />
                </div>
              )}
            </div>

            {/* Tags bar */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (Enter)..."
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-28"
                />
              </div>

              {/* Tag suggestions */}
              {existingTags.length > 0 && tags.length < 5 && (
                <div className="hidden sm:flex items-center gap-1 ml-2 text-[11px] text-slate-500">
                  <span>Suggestions:</span>
                  {existingTags
                    .filter(t => !tags.includes(t))
                    .slice(0, 3)
                    .map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags(prev => [...prev, t])}
                        className="hover:text-indigo-300 underline underline-offset-1"
                      >
                        #{t}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Encrypting & Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded QR Code Modal */}
      {showQRModal && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          initialText={`${title}\n\n${content}`}
          title={`QR Code for "${title || 'Untitled'}"`}
        />
      )}
    </>
  );
};
