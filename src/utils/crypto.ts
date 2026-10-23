// Cryptographic utilities and helpers for MemoDams Vault

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`memodams_salt_${pin}_vault`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSecurePassword(
  length: number = 16,
  options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean } = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  }
): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const num = '0123456789';
  const sym = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  let charset = '';
  if (options.uppercase) charset += upper;
  if (options.lowercase) charset += lower;
  if (options.numbers) charset += num;
  if (options.symbols) charset += sym;

  if (!charset) charset = lower + num;

  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

export function calculatePasswordEntropy(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Empty', color: 'text-slate-500' };

  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;

  const entropy = Math.round(password.length * Math.log2(pool || 1));
  if (entropy < 35) return { score: 1, label: 'Weak', color: 'text-rose-400' };
  if (entropy < 60) return { score: 2, label: 'Fair', color: 'text-amber-400' };
  if (entropy < 85) return { score: 3, label: 'Strong', color: 'text-emerald-400' };
  return { score: 4, label: 'Military Grade', color: 'text-cyan-400' };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Compress image to ensure it fits well within Firestore doc limits (< 400KB base64)
export async function compressImageFile(file: File, maxDimension: number = 1200, quality: number = 0.8): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, size: file.size });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const size = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, size });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert other files (PDF, audio, document) to dataUrl with 600KB size limit guard
export async function readFileAsDataUrl(file: File, maxSizeBytes: number = 700000): Promise<{ dataUrl: string; size: number }> {
  if (file.size > maxSizeBytes) {
    throw new Error(`File size (${formatFileSize(file.size)}) exceeds the vault document limit of ${formatFileSize(maxSizeBytes)}. Please choose a smaller file.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({ dataUrl, size: file.size });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
