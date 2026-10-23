import React, { useState } from 'react';
import { 
  Pin, 
  Lock, 
  Unlock, 
  Trash2, 
  QrCode, 
  Edit3, 
  MoreVertical, 
  Calendar,
  Share2,
  KeyRound,
  Eye,
  Tag
} from 'lucide-react';
import { NoteItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QRCodeModal } from './QRCodeModal';

interface NoteCardProps {
  note: NoteItem;
  isVaultUnlocked: boolean;
  onEdit: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleVaultLock: (id: string) => void;
  onRequestUnlock: () => void;
  onTagClick?: (tag: string) => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; accent: string }> = {
  slate: { bg: 'bg-slate-900/90', border: 'border-slate-800 hover:border-slate-700', accent: 'bg-slate-700' },
  indigo: { bg: 'bg-indigo-950/40', border: 'border-indigo-900/60 hover:border-indigo-600/50', accent: 'bg-indigo-500' },
  emerald: { bg: 'bg-emerald-950/40', border: 'border-emerald-900/60 hover:border-emerald-600/50', accent: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-950/40', border: 'border-amber-900/60 hover:border-amber-600/50', accent: 'bg-amber-500' },
  rose: { bg: 'bg-rose-950/40', border: 'border-rose-900/60 hover:border-rose-600/50', accent: 'bg-rose-500' },
  purple: { bg: 'bg-purple-950/40', border: 'border-purple-900/60 hover:border-purple-600/50', accent: 'bg-purple-500' },
  cyan: { bg: 'bg-cyan-950/40', border: 'border-cyan-900/60 hover:border-cyan-600/50', accent: 'bg-cyan-500' },
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isVaultUnlocked,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleVaultLock,
  onRequestUnlock,
  onTagClick
}) => {
  const [showQR, setShowQR] = useState(false);
  const isRedacted = note.isVaultLocked && !isVaultUnlocked;
  const colorStyle = COLOR_MAP[note.color] || COLOR_MAP.slate;

  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <div 
        className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-lg ${colorStyle.bg} ${colorStyle.border} hover:shadow-indigo-500/5`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {note.category}
                </span>

                {note.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                  </span>
                )}

                {note.isVaultLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                    <Lock className="w-3 h-3" /> Vault
                  </span>
                )}
              </div>

              <h4 
                onClick={() => isRedacted ? onRequestUnlock() : onEdit(note)}
                className="text-base font-bold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer truncate"
              >
                {note.title}
              </h4>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onTogglePin(note.id)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                  note.isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
              >
                <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onToggleVaultLock(note.id)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                  note.isVaultLocked ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={note.isVaultLocked ? 'Remove Vault Lock' : 'Lock in Vault'}
              >
                {note.isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                title="Share via QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Move to Trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          {isRedacted ? (
            <div 
              onClick={onRequestUnlock}
              className="my-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/40 transition-colors group/vault"
            >
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-400 mb-2 group-hover/vault:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-0.5">Confidential Vault Note</p>
              <p className="text-[11px] text-slate-500">Click to enter Master PIN & unlock</p>
            </div>
          ) : (
            <div 
              onClick={() => onEdit(note)}
              className="my-3 text-xs text-slate-300 max-h-36 overflow-hidden relative cursor-pointer mask-fade-bottom"
            >
              <MarkdownRenderer content={note.content.substring(0, 400)} />
              {note.content.length > 400 && (
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
              )}
            </div>
          )}
        </div>

        {/* Footer: Tags & Date */}
        <div className="pt-3 border-t border-slate-800/80 mt-2 flex flex-col gap-2">
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-indigo-300 hover:bg-indigo-950/60 hover:text-indigo-200 transition-colors border border-slate-700/50"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-600" /> {formattedDate}
            </span>
            <button
              type="button"
              onClick={() => isRedacted ? onRequestUnlock() : onEdit(note)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              {isRedacted ? 'Unlock' : 'Open'} →
            </button>
          </div>
        </div>
      </div>

      {showQR && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          initialText={`Title: ${note.title}\nCategory: ${note.category}\n\n${note.content}`}
          title={`QR for "${note.title}"`}
        />
      )}
    </>
  );
};
