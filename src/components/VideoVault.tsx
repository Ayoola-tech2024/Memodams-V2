import React, { useState, useRef } from 'react';
import { 
  Video, 
  Play, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  QrCode, 
  X, 
  Link as LinkIcon, 
  Upload, 
  Film,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { VaultMediaItem } from '../types';
import { formatFileSize, readFileAsDataUrl } from '../utils/crypto';
import { QRCodeModal } from './QRCodeModal';

interface VideoVaultProps {
  onRequestUnlock: () => void;
}

export const VideoVault: React.FC<VideoVaultProps> = ({ onRequestUnlock }) => {
  const { media, addMedia, deleteMedia, toggleMediaVaultLock } = useNotes();
  const { isVaultUnlocked } = useAuth();

  const [activeVideo, setActiveVideo] = useState<VaultMediaItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrItem, setQrItem] = useState<VaultMediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videos = media.filter(m => m.type === 'video');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);
    try {
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a valid video file (MP4, WebM, etc.)');
      }
      // Read video file with size check (< 700KB for direct base64 doc storage)
      const { dataUrl } = await readFileAsDataUrl(file, 700000);
      setVideoUrl(dataUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Video file too large for direct doc storage. Please use a video stream URL.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      setUploadError('Please provide a video URL or upload a clip');
      return;
    }

    setIsUploading(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      await addMedia({
        title: title.trim() || 'Untitled Video',
        description: description.trim(),
        type: 'video',
        dataUrl: videoUrl.trim(),
        fileName: title.trim() || 'video.mp4',
        fileSize: 524288,
        mimeType: 'video/mp4',
        tags: parsedTags,
        isVaultLocked: isLocked,
      });

      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setTags('');
      setIsLocked(true);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to save video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleVideos = async () => {
    setIsUploading(true);
    try {
      const samples = [
        {
          title: 'Encrypted Security Matrix Feed',
          description: 'High-security surveillance archive recording of primary perimeter.',
          dataUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          tags: ['security', 'cctv', 'vault'],
          isVaultLocked: true,
        },
        {
          title: 'Biometric Access Protocol Demo',
          description: 'Walkthrough demonstration of multi-factor vault authentication.',
          dataUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          tags: ['biometrics', 'tutorial'],
          isVaultLocked: false,
        }
      ];

      for (const v of samples) {
        await addMedia({
          title: v.title,
          description: v.description,
          type: 'video',
          dataUrl: v.dataUrl,
          fileName: 'sample.mp4',
          fileSize: 1048576,
          mimeType: 'video/mp4',
          tags: v.tags,
          isVaultLocked: v.isVaultLocked,
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
            <Film className="w-5 h-5 text-indigo-400" />
            Encrypted Video Vault
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Store, view, and lock confidential video clips and surveillance recordings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {videos.length === 0 && (
            <button
              type="button"
              onClick={handleLoadSampleVideos}
              disabled={isUploading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Sample Vault Videos
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40">
          <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Videos in Vault</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload small confidential video clips or link MP4 stream URLs to protect them behind your Master PIN.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => {
            const isRedacted = vid.isVaultLocked && !isVaultUnlocked;

            return (
              <div
                key={vid.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg transition-all hover:border-slate-700 flex flex-col"
              >
                {/* Video Player / Poster Thumbnail */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {isRedacted ? (
                    <div 
                      onClick={onRequestUnlock}
                      className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center cursor-pointer hover:bg-slate-950 transition-colors"
                    >
                      <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 mb-2">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">Encrypted Video Vault Item</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Click to unlock with PIN</span>
                    </div>
                  ) : (
                    <>
                      <video
                        src={vid.dataUrl}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    </>
                  )}

                  {/* Vault Lock Badge */}
                  {vid.isVaultLocked && (
                    <div className="absolute top-2 left-2 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow pointer-events-none">
                      <Lock className="w-3 h-3" /> Encrypted
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 mb-1">{vid.title}</h4>
                    {vid.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{vid.description}</p>
                    )}
                    {vid.tags && vid.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {vid.tags.map(t => (
                          <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(vid.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQrItem(vid)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        title="Share as QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMediaVaultLock(vid.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          vid.isVaultLocked ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={vid.isVaultLocked ? 'Unlock in Vault' : 'Protect with Vault'}
                      >
                        {vid.isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMedia(vid.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Video"
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

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" /> Add Video to Vault
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVideo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Video Web Stream URL (MP4, WebM):
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Or small video clip upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Or Upload Small Video Clip (&lt; 700KB):
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 border border-dashed border-slate-800 hover:border-indigo-500 rounded-lg bg-slate-950/60 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <span className="text-xs text-slate-400">Click to upload video file</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Security Cam Log #04"
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
                  placeholder="Confidential notes about this footage..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="surveillance, vault, backup"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="vault-lock-video"
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="vault-lock-video" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  {isUploading ? 'Securing...' : 'Save Video'}
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
          initialText={qrItem.dataUrl}
          title={`QR Code for "${qrItem.title}"`}
        />
      )}
    </div>
  );
};
