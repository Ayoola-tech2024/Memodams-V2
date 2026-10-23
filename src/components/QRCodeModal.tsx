import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Scan, 
  Upload, 
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  title?: string;
  onImportScannedText?: (scannedText: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  title = 'Share via QR Code',
  onImportScannedText
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  const [qrText, setQrText] = useState(initialText);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialText) {
      setQrText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (!qrText.trim()) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(qrText, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url: string) => {
        setQrDataUrl(url);
      })
      .catch((err: Error) => {
        console.error('Error generating QR:', err);
      });
  }, [qrText]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `memodams-qr-${Date.now()}.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scan QR code from uploaded image using native BarcodeDetector if available
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError('');
    setScanResult('');
    setIsScanning(true);

    try {
      // Check if native BarcodeDetector API is supported
      if ('BarcodeDetector' in window) {
        // @ts-expect-error BarcodeDetector is supported in Chromium browsers
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => (img.onload = resolve));
        const barcodes = await barcodeDetector.detect(img);
        if (barcodes.length > 0) {
          setScanResult(barcodes[0].rawValue);
        } else {
          setScanError('No QR code detected in this image. Ensure clear lighting and contrast.');
        }
      } else {
        // Fallback for browsers without BarcodeDetector
        // In browser environments without BarcodeDetector, we notify user and offer fallback
        setScanError('Direct QR image decoding requires BarcodeDetector API (supported in Chrome/Edge). You can also scan on your mobile device to view!');
      }
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Failed to scan image');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">{title}</h3>
              <p className="text-xs text-slate-400">Secure air-gapped data transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'generate'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Generate QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'scan'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Scan / Decode QR
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'generate' ? (
            <>
              {/* QR Image Preview */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800">
                {qrDataUrl ? (
                  <div className="relative p-3 bg-white rounded-xl shadow-lg group">
                    <img
                      src={qrDataUrl}
                      alt="MemoDams QR Code"
                      className="w-52 h-52 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <QrCode className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
                    Enter text or note content below
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    <Sparkles className="w-3 h-3" /> Encoded & Ready
                  </span>
                  <span className="text-[11px] text-slate-500">{qrText.length} chars</span>
                </div>
              </div>

              {/* Text editor for QR content */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Content to Encode:
                </label>
                <textarea
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  rows={3}
                  placeholder="Type or paste any note, password, or confidential text..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save PNG
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!qrText}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Content
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-700 text-center flex flex-col items-center justify-center">
                <Scan className="w-10 h-10 text-indigo-400 mb-3" />
                <h4 className="text-sm font-semibold text-slate-200 mb-1">Scan QR Code Image</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Upload an image, screenshot, or photo of any QR code to instantly decode and import its contents.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  {isScanning ? 'Analyzing QR...' : 'Upload Image to Scan'}
                </button>
              </div>

              {scanError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{scanError}</span>
                </div>
              )}

              {scanResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Decoded Successfully:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(scanResult);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 break-words max-h-40 overflow-y-auto">
                    {scanResult}
                  </div>
                  {onImportScannedText && (
                    <button
                      type="button"
                      onClick={() => {
                        onImportScannedText(scanResult);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Create New Note from Scanned Text
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
