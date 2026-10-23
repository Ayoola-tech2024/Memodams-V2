import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Navbar } from './components/Navbar';
import { SearchAndFilters } from './components/SearchAndFilters';
import { NoteCard } from './components/NoteCard';
import { NoteEditorModal } from './components/NoteEditorModal';
import { PhotoGallery } from './components/PhotoGallery';
import { VideoVault } from './components/VideoVault';
import { FileStorage } from './components/FileStorage';
import { SecurityTools } from './components/SecurityTools';
import { TrashView } from './components/TrashView';
import { VaultPinModal } from './components/VaultPinModal';
import { QRCodeModal } from './components/QRCodeModal';
import { WelcomeHero } from './components/WelcomeHero';
import { ActiveTab, NoteItem } from './types';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  FolderLock, 
  Loader2 
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading: authLoading, isVaultUnlocked, hasVaultPin } = useAuth();
  const { 
    notes, 
    loading: notesLoading, 
    addNote, 
    updateNote, 
    moveToTrash, 
    togglePin, 
    toggleVaultLock, 
    allTags,
    setSelectedTag
  } = useNotes();

  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'set' | 'change' | 'settings'>('unlock');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrInitialText, setQrInitialText] = useState('');

  // Handle Note Save (create or update)
  const handleSaveNote = async (
    noteData: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrash'>
  ) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
      setEditingNote(null);
    } else {
      await addNote(noteData);
    }
  };

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: NoteItem) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleRequestUnlock = () => {
    setPinModalMode(hasVaultPin ? 'unlock' : 'set');
    setIsPinModalOpen(true);
  };

  const handleSeedStarterNotes = async () => {
    const starterNotes = [
      {
        title: 'Welcome to MemoDams Digital Vault 🛡️',
        content: `### Your Encrypted Personal Sanctuary\n\nMemoDams is built for sovereign, secure data storage with Firestore database persistence.\n\n#### Key Features:\n- [x] Full Markdown with live split-screen editor\n- [x] Master PIN hardware-style vault encryption\n- [x] Air-gapped QR code generator and scanner\n- [x] Multimedia Photo Gallery & Video Vault\n- [ ] Store your master recovery credentials\n\n\`\`\`javascript\n// Zero-Knowledge Client Hash\nconst pinHash = await crypto.subtle.digest('SHA-256', salt + pin);\n\`\`\`\n\n> "Security is not a product, but a continuous discipline."\n`,
        category: 'Personal' as const,
        tags: ['guide', 'welcome', 'security'],
        color: 'indigo',
        isPinned: true,
        isVaultLocked: false,
      },
      {
        title: 'Emergency Master Seed & API Credentials 🔑',
        content: `### High Security Vault Credentials\n\n*Note: This note is encrypted and locked in your vault.*\n\n- **Vault Recovery Key:** \`8F92-41BA-99E1-C340-D882\`\n- **Primary Cold Storage Address:** \`0x71C...9A34\`\n- **PGP Fingerprint:** \`4B72 E901 3328 110A\`\n\nTo lock or unlock this note, click the Vault lock badge at the top!`,
        category: 'Secret Vault' as const,
        tags: ['credentials', 'seed', 'crypto', 'vault'],
        color: 'rose',
        isPinned: true,
        isVaultLocked: true,
      },
      {
        title: 'Air-Gapped QR Code Data Transfer 📱',
        content: `QR code sharing allows you to transfer passwords, secret notes, or verification hashes from your computer screen directly to your mobile phone camera without sending any data over the internet or public Wi-Fi.\n\nClick the **QR icon** in the top bar or on any note card to generate or scan instantly!`,
        category: 'Ideas' as const,
        tags: ['qr', 'privacy', 'transfer'],
        color: 'cyan',
        isPinned: false,
        isVaultLocked: false,
      }
    ];

    for (const note of starterNotes) {
      await addNote(note);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <span className="text-xs font-mono">Connecting to Secure Vault...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewNote={handleOpenNewNote}
        onOpenQR={() => {
          setQrInitialText('');
          setIsQRModalOpen(true);
        }}
        onOpenPinModal={() => {
          setPinModalMode(hasVaultPin ? (isVaultUnlocked ? 'settings' : 'unlock') : 'set');
          setIsPinModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <WelcomeHero />
        ) : (
          <>
            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <SearchAndFilters />

                {notesLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                    <span className="text-xs font-mono">Syncing Firestore vault notes...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-900/40 my-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3 border border-indigo-500/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-200 mb-1">Your Note Vault is Empty</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                      Create your first encrypted markdown note or load the starter vault template to explore features.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleOpenNewNote}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Note
                      </button>
                      <button
                        type="button"
                        onClick={handleSeedStarterNotes}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Load Starter Vault Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isVaultUnlocked={isVaultUnlocked}
                        onEdit={handleEditNote}
                        onDelete={moveToTrash}
                        onTogglePin={togglePin}
                        onToggleVaultLock={toggleVaultLock}
                        onRequestUnlock={handleRequestUnlock}
                        onTagClick={(tag) => setSelectedTag(tag)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Photo Gallery Tab */}
            {activeTab === 'photos' && (
              <PhotoGallery onRequestUnlock={handleRequestUnlock} />
            )}

            {/* Video Vault Tab */}
            {activeTab === 'videos' && (
              <VideoVault onRequestUnlock={handleRequestUnlock} />
            )}

            {/* File Storage Tab */}
            {activeTab === 'documents' && (
              <FileStorage onRequestUnlock={handleRequestUnlock} />
            )}

            {/* Security Tools Tab */}
            {activeTab === 'tools' && (
              <SecurityTools
                onOpenPinModal={() => {
                  setPinModalMode(hasVaultPin ? 'settings' : 'set');
                  setIsPinModalOpen(true);
                }}
              />
            )}

            {/* Trash View Tab */}
            {activeTab === 'trash' && (
              <TrashView onBackToNotes={() => setActiveTab('notes')} />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for New Note on mobile */}
      {user && activeTab === 'notes' && (
        <button
          type="button"
          onClick={handleOpenNewNote}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/50 flex items-center justify-center z-30 transition-transform active:scale-90"
          title="New Note"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <NoteEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          noteToEdit={editingNote}
          onSave={handleSaveNote}
          existingTags={allTags}
        />
      )}

      {/* Vault Master PIN Modal */}
      {isPinModalOpen && (
        <VaultPinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          mode={pinModalMode}
        />
      )}

      {/* QR Code Modal (Standalone / Scanner) */}
      {isQRModalOpen && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          initialText={qrInitialText}
          title="QR Vault & Scanner"
          onImportScannedText={(scannedText) => {
            setEditingNote(null);
            setIsEditorOpen(true);
            setTimeout(() => {
              const el = document.getElementById('note-content-editor') as HTMLTextAreaElement;
              if (el) el.value = scannedText;
            }, 100);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <MainContent />
      </NotesProvider>
    </AuthProvider>
  );
}
