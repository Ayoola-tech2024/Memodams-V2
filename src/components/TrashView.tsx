import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  X, 
  FileText 
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';

interface TrashViewProps {
  onBackToNotes: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onBackToNotes }) => {
  const { trashNotes, restoreFromTrash, deletePermanently, emptyTrash } = useNotes();
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmpty = async () => {
    setIsDeleting(true);
    try {
      await emptyTrash();
      setShowConfirmEmpty(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            Vault Trash Bin
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recover deleted notes or permanently purge them from your database
          </p>
        </div>

        <div className="flex items-center gap-2">
          {trashNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmEmpty(true)}
              className="px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty Trash ({trashNotes.length})
            </button>
          )}

          <button
            type="button"
            onClick={onBackToNotes}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            Back to Active Notes
          </button>
        </div>
      </div>

      {/* Trash list */}
      {trashNotes.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40">
          <Trash2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">Trash is Empty</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Deleted notes will appear here before being permanently destroyed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trashNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-mono text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded">
                    {note.category}
                  </span>
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm mb-2">{note.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-3 mb-4 font-mono">
                  {note.content || 'No content...'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => restoreFromTrash(note.id)}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Note
                </button>
                <button
                  type="button"
                  onClick={() => deletePermanently(note.id)}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                  title="Purge forever"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Destroy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Empty Modal */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Permanently Empty Trash?</h4>
              <p className="text-xs text-slate-400 mt-1">
                This will irretrievably delete {trashNotes.length} notes from the database. This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmEmpty(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmpty}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/25"
              >
                {isDeleting ? 'Purging...' : 'Yes, Destroy All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
