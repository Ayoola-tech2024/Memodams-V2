import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  QrCode, 
  LogOut, 
  LogIn, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  FolderLock, 
  Wrench, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewNote: () => void;
  onOpenQR: () => void;
  onOpenPinModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewNote,
  onOpenQR,
  onOpenPinModal
}) => {
  const { user, profile, isVaultUnlocked, lockVault, signInWithGoogle, logout, hasVaultPin } = useAuth();
  const { notes, media, trashNotes } = useNotes();

  const photoCount = media.filter(m => m.type === 'photo').length;
  const videoCount = media.filter(m => m.type === 'video').length;
  const docCount = media.filter(m => m.type === 'document' || m.type === 'audio').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Vault Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  MemoDams
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  Vault
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Personal Digital Vault & Notes</p>
            </div>
          </div>

          {/* Master Vault Lock State Button */}
          {user && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isVaultUnlocked) {
                    lockVault();
                  } else {
                    onOpenPinModal();
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all duration-200 shadow-sm ${
                  isVaultUnlocked
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title={isVaultUnlocked ? 'Vault Unlocked - Click to Lock Session' : 'Vault Locked - Click to enter Master PIN'}
              >
                {isVaultUnlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Vault Unlocked</span>
                    <span className="sm:hidden">Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Vault Locked</span>
                    <span className="sm:hidden">Locked</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onOpenQR}
                  title="QR Generator & Scanner"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onNewNote}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Note</span>
                </button>

                {/* User avatar and logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'notes'
                ? 'bg-slate-800 text-indigo-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes & Memos
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
              {notes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'photos'
                ? 'bg-slate-800 text-indigo-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo Gallery
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
              {photoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'videos'
                ? 'bg-slate-800 text-indigo-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Video Vault
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
              {videoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'documents'
                ? 'bg-slate-800 text-indigo-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            File Storage
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
              {docCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'tools'
                ? 'bg-slate-800 text-indigo-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Security Tools
          </button>

          {trashNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === 'trash'
                  ? 'bg-slate-800 text-rose-300 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/60'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash ({trashNotes.length})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
