import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  QrCode, 
  Sparkles, 
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const WelcomeHero: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="py-8 sm:py-16 max-w-4xl mx-auto text-center px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        Zero-Trust Personal Digital Vault & Notes
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mb-4">
        Your Secure Digital Sanctuary for <br />
        <span className="bg-gradient-to-r from-indigo-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
          Notes, Media & Private Credentials
        </span>
      </h1>

      <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
        MemoDams safeguards your private knowledge with client-side Master PIN protection, 
        rich Markdown support, media photo and video vaults, encrypted file storage, and air-gapped QR code sharing.
      </p>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google to Open Vault</span>
        </button>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Markdown Notes & Tags</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Split-screen editor, checklists, syntax code blocks, tag filtering, and color-coded categorizations.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Hardware PIN Vault</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lock sensitive notes, credentials, and files behind a custom Master PIN with auto-lock inactivity timers.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Air-Gapped QR Sharing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instantly encode any note or secret into high-density QR codes to transfer across devices without the internet.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-3">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Photo Gallery & Lightbox</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Client-side image optimization, confidential photo encryption, tag search, and fullscreen view.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-3">
            <Film className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Encrypted Video Vault</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secure video playback for surveillance recordings, evidence, private tutorials, and screen clips.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">Password Generator</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate high-entropy cryptographic passkeys with entropy scores, and save them straight to your vault.
          </p>
        </div>
      </div>
    </div>
  );
};
