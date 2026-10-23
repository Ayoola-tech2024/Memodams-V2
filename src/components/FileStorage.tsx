import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  Download, 
  QrCode, 
  FileCode, 
  FileArchive, 
  FileCheck, 
  X,
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { VaultMediaItem } from '../types';
import { formatFileSize, readFileAsDataUrl } from '../utils/crypto';
import { QRCodeModal } from './QRCodeModal';

interface FileStorageProps {
  onRequestUnlock: () => void;
}

export const FileStorage: React.FC<FileStorageProps> = ({ onRequestUnlock }) => {
  const { media, addMedia, deleteMedia, toggleMediaVaultLock } = useNotes();
  const { isVaultUnlocked } = useAuth();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultMediaItem | null>(null);
  const [qrItem, setQrItem] = useState<VaultMediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [fileData, setFileData] = useState<{ dataUrl: string; size: number; fileName: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = media.filter(m => m.type === 'document' || m.type === 'audio');

  const getFileIcon = (mime: string, name: string) => {
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (mime.includes('json') || mime.includes('javascript') || name.endsWith('.ts') || name.endsWith('.json') || name.endsWith('.key')) {
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip')) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    return <FileCheck className="w-5 h-5 text-indigo-400" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);
    try {
      const { dataUrl, size } = await readFileAsDataUrl(file, 650000);
      setFileData({
        dataUrl,
        size,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      });
      if (!title) {
        setTitle(file.name);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData) {
      setUploadError('Please choose a file to store');
      return;
    }

    setIsUploading(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      await addMedia({
        title: title.trim() || fileData.fileName,
        description: description.trim(),
        type: 'document',
        dataUrl: fileData.dataUrl,
        fileName: fileData.fileName,
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
        tags: parsedTags,
        isVaultLocked: isLocked,
      });

      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setTags('');
      setFileData(null);
      setIsLocked(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to store document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleDocuments = async () => {
    setIsUploading(true);
    try {
      const samples = [
        {
          title: 'RSA 4096-bit Public Key & Certificate',
          description: 'Production SSL encryption certificate public keypair file.',
          fileName: 'vault-public-key.pem',
          dataUrl: 'data:text/plain;charset=utf-8,-----BEGIN%20PUBLIC%20KEY-----%0AMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0u12b8...%0A-----END%20PUBLIC%20KEY-----',
          mimeType: 'text/plain',
          fileSize: 450,
          tags: ['security', 'keys', 'certificates'],
          isVaultLocked: true,
        },
        {
          title: 'Emergency Recovery Kit Checklist',
          description: 'Step-by-step master restore procedures for personal accounts.',
          fileName: 'recovery-protocol.txt',
          dataUrl: 'data:text/plain;charset=utf-8,1.%20Access%20air-gapped%20backup%20drive%0A2.%20Verify%20SHA-256%20checksum%0A3.%20Input%20Master%20PIN',
          mimeType: 'text/plain',
          fileSize: 120,
          tags: ['emergency', 'recovery'],
          isVaultLocked: false,
        }
      ];

      for (const s of samples) {
        await addMedia({
          title: s.title,
          description: s.description,
          type: 'document',
          dataUrl: s.dataUrl,
          fileName: s.fileName,
          fileSize: s.fileSize,
          mimeType: s.mimeType,
          tags: s.tags,
          isVaultLocked: s.isVaultLocked,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Confidential File & Document Storage
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely store cryptographic keys, certificates, contracts, and confidential documents
          </p>
        </div>

        <div className="flex items-center gap-2">
          {documents.length === 0 && (
            <button
              type="button"
              onClick={handleLoadSampleDocuments}
              disabled={isUploading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Sample Files
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Files Stored</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload emergency backup keys, identity documents, receipts, or config files.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload First File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((docItem) => {
            const isRedacted = docItem.isVaultLocked && !isVaultUnlocked;

            return (
              <div
                key={docItem.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-slate-700 shadow-md flex items-start gap-3.5"
              >
                {/* File Icon */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  {getFileIcon(docItem.mimeType, docItem.fileName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{docItem.title}</h4>
                    {docItem.isVaultLocked && (
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Vault
                      </span>
                    )}
                  </div>

                  {docItem.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-1">{docItem.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mb-2">
                    <span className="truncate max-w-[140px] text-slate-400">{docItem.fileName}</span>
                    <span>•</span>
                    <span>{formatFileSize(docItem.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(docItem.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Tags */}
                  {docItem.tags && docItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {docItem.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {isRedacted ? (
                      <button
                        type="button"
                        onClick={onRequestUnlock}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" /> Unlock with PIN to Access
                      </button>
                    ) : (
                      <>
                        <a
                          href={docItem.dataUrl}
                          download={docItem.fileName}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" /> Download
                        </a>
                        <button
                          type="button"
                          onClick={() => setQrItem(docItem)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                          title="Share QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMediaVaultLock(docItem.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          docItem.isVaultLocked ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={docItem.isVaultLocked ? 'Unlock in Vault' : 'Protect with Vault'}
                      >
                        {docItem.isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMedia(docItem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Store Document in Vault
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/60 cursor-pointer text-center flex flex-col items-center justify-center transition-colors"
              >
                {fileData ? (
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{fileData.fileName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{formatFileSize(fileData.size)}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-300">Click to choose document</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">PDF, TXT, JSON, DOC, PEM, KEY (&lt; 650KB)</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master SSH Key, Passport Copy"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Confidential notes or details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="credentials, finance, legal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="vault-lock-doc"
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="vault-lock-doc" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Encrypt with Master Vault PIN
                </label>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !fileData}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  {isUploading ? 'Securing...' : 'Store Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {qrItem && (
        <QRCodeModal
          isOpen={Boolean(qrItem)}
          onClose={() => setQrItem(null)}
          initialText={qrItem.dataUrl.length < 2500 ? qrItem.dataUrl : `Doc: ${qrItem.title} (${qrItem.fileName})`}
          title={`QR Code for "${qrItem.title}"`}
        />
      )}
    </div>
  );
};
