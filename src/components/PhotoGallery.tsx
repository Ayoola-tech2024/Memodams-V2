import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  QrCode, 
  Tag, 
  Sparkles,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { VaultMediaItem } from '../types';
import { compressImageFile, formatFileSize } from '../utils/crypto';
import { QRCodeModal } from './QRCodeModal';

interface PhotoGalleryProps {
  onRequestUnlock: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onRequestUnlock }) => {
  const { media, addMedia, deleteMedia, toggleMediaVaultLock } = useNotes();
  const { isVaultUnlocked } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<VaultMediaItem | null>(null);
  const [qrItem, setQrItem] = useState<VaultMediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = media.filter(m => m.type === 'photo');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (PNG, JPG, WebP, etc.)');
      }
      const { dataUrl, size } = await compressImageFile(file, 1200, 0.75);
      setFilePreview(dataUrl);
      setFileSize(size);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDataUrl = filePreview || imageUrlInput.trim();
    if (!finalDataUrl) {
      setUploadError('Please select a photo file or provide an image URL');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const parsedTags = newTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      await addMedia({
        title: newTitle.trim() || 'Untitled Photo',
        description: newDescription.trim(),
        type: 'photo',
        dataUrl: finalDataUrl,
        fileName: newTitle.trim() || 'photo.jpg',
        fileSize: fileSize || 102400,
        mimeType: 'image/jpeg',
        tags: parsedTags,
        isVaultLocked: isLocked,
      });

      // Reset & close
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewTags('');
      setFilePreview('');
      setImageUrlInput('');
      setFileSize(0);
      setIsLocked(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSamplePhotos = async () => {
    setIsUploading(true);
    try {
      const samplePhotos = [
        {
          title: 'Cyber Vault Obsidian Key',
          description: 'Secure hardware credential storage key in obsidian finish.',
          dataUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
          tags: ['hardware', 'vault', 'keys'],
          isVaultLocked: true,
        },
        {
          title: 'Digital Workspace & Cryptography',
          description: 'Encrypted developer workstation architecture setup.',
          dataUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
          tags: ['work', 'security', 'dev'],
          isVaultLocked: false,
        },
        {
          title: 'Secure Server Matrix Node',
          description: 'Encrypted server cluster with air-gapped firewall node.',
          dataUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
          tags: ['infrastructure', 'servers'],
          isVaultLocked: false,
        }
      ];

      for (const p of samplePhotos) {
        await addMedia({
          title: p.title,
          description: p.description,
          type: 'photo',
          dataUrl: p.dataUrl,
          fileName: `${p.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          fileSize: 180000,
          mimeType: 'image/jpeg',
          tags: p.tags,
          isVaultLocked: p.isVaultLocked,
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
      {/* Header and Upload Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            Multimedia Photo Gallery
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Store, view, and encrypt private photos with client-side compression and lightbox
          </p>
        </div>

        <div className="flex items-center gap-2">
          {photos.length === 0 && (
            <button
              type="button"
              onClick={handleAddSamplePhotos}
              disabled={isUploading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Sample Gallery
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40">
          <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Photos in Vault</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload your personal photos, ID documents, or screenshots to keep them securely organized.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Your First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const isRedacted = photo.isVaultLocked && !isVaultUnlocked;

            return (
              <div
                key={photo.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg transition-all hover:border-slate-700 hover:shadow-indigo-500/5 flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div 
                  className="relative aspect-video sm:aspect-square bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => isRedacted ? onRequestUnlock() : setSelectedPhoto(photo)}
                >
                  {isRedacted ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center">
                      <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 mb-2">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">Vault Protected</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Click to unlock</span>
                    </div>
                  ) : (
                    <img
                      src={photo.dataUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Vault Lock Badge */}
                  {photo.isVaultLocked && (
                    <div className="absolute top-2 left-2 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                      <Lock className="w-3 h-3" /> Encrypted
                    </div>
                  )}

                  {/* Hover Overlay with Action Buttons */}
                  {!isRedacted && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <span className="text-xs text-white font-medium truncate drop-shadow">
                        {photo.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrItem(photo);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white transition-colors"
                          title="Share QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white transition-colors"
                          title="View Fullscreen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div className="p-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <h5 className="font-semibold text-slate-200 truncate">{photo.title}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatFileSize(photo.fileSize)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleMediaVaultLock(photo.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        photo.isVaultLocked ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={photo.isVaultLocked ? 'Unlock from Vault' : 'Protect in Vault'}
                    >
                      {photo.isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedia(photo.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Photo Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" /> Upload Photo to Vault
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="p-5 space-y-4">
              {/* File Drop / Preview */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/60 cursor-pointer text-center flex flex-col items-center justify-center transition-colors"
              >
                {filePreview ? (
                  <div className="relative w-full max-h-48 overflow-hidden rounded-lg">
                    <img src={filePreview} alt="Preview" className="w-full h-auto object-contain rounded" />
                    <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                      {formatFileSize(fileSize)}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-300">Click to choose image file</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WebP (auto-compressed)</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Or image URL */}
              {!filePreview && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Or Enter Image Web URL:
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Title & Desc */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Passport Backup, Vault Keycard"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="secret, backup, credentials"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Vault lock checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="vault-lock-photo"
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="vault-lock-photo" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
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
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  {isUploading ? 'Encrypting & Storing...' : 'Save to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.title}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            
            <div className="mt-4 flex items-center justify-between w-full max-w-xl px-4 py-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedPhoto.title}</h4>
                {selectedPhoto.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{selectedPhoto.description}</p>
                )}
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  {formatFileSize(selectedPhoto.fileSize)} • {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto.dataUrl}
                  download={selectedPhoto.fileName || 'photo.jpg'}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setQrItem(selectedPhoto)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Share as QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {qrItem && (
        <QRCodeModal
          isOpen={Boolean(qrItem)}
          onClose={() => setQrItem(null)}
          initialText={qrItem.dataUrl.length < 2000 ? qrItem.dataUrl : qrItem.title}
          title={`QR Code for "${qrItem.title}"`}
        />
      )}
    </div>
  );
};
