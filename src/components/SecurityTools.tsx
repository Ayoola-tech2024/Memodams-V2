import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Upload, 
  FileText, 
  ShieldAlert, 
  Sliders, 
  Lock, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateSecurePassword, calculatePasswordEntropy } from '../utils/crypto';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

interface SecurityToolsProps {
  onOpenPinModal: () => void;
}

export const SecurityTools: React.FC<SecurityToolsProps> = ({ onOpenPinModal }) => {
  const { notes, media, exportVaultData, importVaultData, addNote } = useNotes();
  const { isVaultUnlocked, hasVaultPin } = useAuth();

  // Password Generator State
  const [passLength, setPassLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPass, setGeneratedPass] = useState(() => 
    generateSecurePassword(20, { uppercase: true, lowercase: true, numbers: true, symbols: true })
  );
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [passAccountLabel, setPassAccountLabel] = useState('');

  // Backup / Import State
  const [importStatus, setImportStatus] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const handleRegeneratePassword = () => {
    const newPass = generateSecurePassword(passLength, {
      uppercase: useUpper,
      lowercase: useLower,
      numbers: useNumbers,
      symbols: useSymbols
    });
    setGeneratedPass(newPass);
    setCopied(false);
    setSavedToNotes(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!generatedPass) return;
    try {
      const label = passAccountLabel.trim() || 'Generated Credential';
      await addNote({
        title: label,
        content: `**Service/Account:** ${label}\n**Password:** \`${generatedPass}\`\n**Length:** ${generatedPass.length}\n**Generated:** ${new Date().toLocaleString()}\n\n*Stored securely in MemoDams Digital Vault.*`,
        category: 'Passwords',
        tags: ['password', 'credentials', 'vault'],
        color: 'indigo',
        isPinned: false,
        isVaultLocked: true, // Automatically lock password notes for security!
      });
      setSavedToNotes(true);
      setPassAccountLabel('');
      setTimeout(() => setSavedToNotes(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = exportVaultData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memodams-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportStatus('');
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await importVaultData(text);
        setImportStatus(`Successfully restored ${res.importedNotes} notes to your vault.`);
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON backup format');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const entropy = calculatePasswordEntropy(generatedPass);

  // Security audit stats
  const totalNotes = notes.length;
  const lockedNotes = notes.filter(n => n.isVaultLocked).length;
  const lockedMedia = media.filter(m => m.isVaultLocked).length;
  const passwordNotes = notes.filter(n => n.category === 'Passwords').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Vault Security Suite & Cryptographic Tools
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate military-grade passwords, export encrypted vault archives, and review security health
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Password Generator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Cryptographic Password Generator
            </h4>
            <span className={`text-xs font-mono font-semibold ${entropy.color}`}>
              {entropy.label} ({entropy.score}/4)
            </span>
          </div>

          {/* Password Display Box */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-inner">
            <span className="font-mono text-sm sm:text-base text-emerald-400 break-all select-all">
              {generatedPass}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Copy Password"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Length: {passLength} characters</span>
              <span className="font-mono text-[11px] text-slate-500">8 - 64</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={passLength}
              onChange={(e) => {
                const len = parseInt(e.target.value);
                setPassLength(len);
                setGeneratedPass(generateSecurePassword(len, {
                  uppercase: useUpper,
                  lowercase: useLower,
                  numbers: useNumbers,
                  symbols: useSymbols
                }));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => { setUseUpper(e.target.checked); handleRegeneratePassword(); }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              Uppercase (A-Z)
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => { setUseLower(e.target.checked); handleRegeneratePassword(); }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              Lowercase (a-z)
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => { setUseNumbers(e.target.checked); handleRegeneratePassword(); }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              Numbers (0-9)
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => { setUseSymbols(e.target.checked); handleRegeneratePassword(); }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              Special Symbols (!@#$)
            </label>
          </div>

          {/* Quick Save as Vault Note */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={passAccountLabel}
                onChange={(e) => setPassAccountLabel(e.target.value)}
                placeholder="Account name (e.g. GitHub, AWS, Bank)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSaveAsNote}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                {savedToNotes ? 'Saved!' : 'Save to Vault'}
              </button>
            </div>
          </div>
        </div>

        {/* Tool 2: Backup, Export & Restore */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Download className="w-4 h-4 text-cyan-400" />
              Vault Backup & Portability
            </h4>

            <p className="text-xs text-slate-400">
              Export your notes and media catalog to an offline, air-gapped JSON archive. You can restore this archive anytime.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-2 text-cyan-400 mb-1 font-semibold text-xs">
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  Export Vault (JSON)
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {totalNotes} notes, {media.length} media items
                </span>
              </button>

              <label className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold text-xs">
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Restore / Import
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Import previously saved JSON
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {importError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Tool 3: Vault Security Health & PIN Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                Vault Security Health
              </h4>
              <button
                type="button"
                onClick={onOpenPinModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {hasVaultPin ? 'Manage Master PIN' : 'Set Master PIN'} →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xl font-bold text-amber-400">{lockedNotes}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Encrypted Notes</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xl font-bold text-rose-400">{lockedMedia}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Encrypted Media</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xl font-bold text-emerald-400">{passwordNotes}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Password Records</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>Master Passcode Status:</span>
              <span className={`font-semibold flex items-center gap-1 ${hasVaultPin ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasVaultPin ? 'Protected by PIN' : 'No PIN Configured'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
