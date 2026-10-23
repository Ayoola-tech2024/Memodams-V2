import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  X, 
  KeyRound, 
  AlertCircle, 
  Clock, 
  Check, 
  Delete
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface VaultPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'unlock' | 'set' | 'change' | 'settings';
}

export const VaultPinModal: React.FC<VaultPinModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode = 'unlock'
}) => {
  const { 
    hasVaultPin, 
    unlockVault, 
    setVaultPin, 
    autoLockMinutes, 
    updateAutoLock 
  } = useAuth();

  const [mode, setMode] = useState<'unlock' | 'set' | 'change' | 'settings'>(
    !hasVaultPin ? 'set' : initialMode
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setError('');
    if (mode === 'unlock' || mode === 'set') {
      if (pin.length < 6) setPin(prev => prev + digit);
    } else if (mode === 'change') {
      if (!oldPin || oldPin.length < 4) {
        if (oldPin.length < 6) setOldPin(prev => prev + digit);
      } else {
        if (pin.length < 6) setPin(prev => prev + digit);
      }
    }
  };

  const handleBackspace = () => {
    setError('');
    if (mode === 'unlock' || mode === 'set') {
      setPin(prev => prev.slice(0, -1));
    } else if (mode === 'change') {
      if (pin.length > 0) {
        setPin(prev => prev.slice(0, -1));
      } else {
        setOldPin(prev => prev.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setConfirmPin('');
    setOldPin('');
    setError('');
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await unlockVault(pin);
      if (res.success) {
        handleClear();
        onClose();
      } else {
        setError(res.error || 'Invalid PIN code');
        setPin('');
      }
    } catch {
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (!confirmPin) {
      // Move to confirm stage
      setConfirmPin(pin);
      setPin('');
      return;
    }
    if (confirmPin !== pin) {
      setError('PINs do not match. Please re-enter.');
      setConfirmPin('');
      setPin('');
      return;
    }

    setLoading(true);
    try {
      await setVaultPin(pin);
      setSuccessMsg('Vault PIN configured and locked items unlocked!');
      setTimeout(() => {
        handleClear();
        onClose();
      }, 1200);
    } catch {
      setError('Failed to update Vault PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                {mode === 'unlock' && 'Unlock Digital Vault'}
                {mode === 'set' && (confirmPin ? 'Confirm Master PIN' : 'Set Master PIN')}
                {mode === 'change' && 'Change Master PIN'}
                {mode === 'settings' && 'Vault Security Settings'}
              </h3>
              <p className="text-[11px] text-slate-400">Hardware-grade local encryption</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleClear();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {mode === 'settings' ? (
            <div className="w-full space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Auto-Lock Inactivity Timer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updateAutoLock(mins)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        autoLockMinutes === mins
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {mins} min{mins > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('change');
                    handleClear();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Change Master PIN Passcode
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PIN Dots Indicator */}
              <div className="mb-6 text-center">
                <p className="text-xs text-slate-400 mb-3">
                  {mode === 'unlock' && 'Enter your 4-6 digit passcode to decrypt locked items'}
                  {mode === 'set' && (confirmPin ? 'Re-enter your passcode to confirm' : 'Create a 4-6 digit passcode for your vault')}
                  {mode === 'change' && (!oldPin ? 'Enter your current PIN' : 'Enter your new PIN')}
                </p>

                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const currentInput = mode === 'change' && !oldPin ? oldPin : pin;
                    const isFilled = currentInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          isFilled
                            ? 'bg-amber-400 ring-4 ring-amber-400/20 scale-110'
                            : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Status / Error alerts */}
              {error && (
                <div className="mb-4 w-full p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-300 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 w-full p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigit(digit)}
                    className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold text-lg border border-slate-800/80 active:scale-95 transition-all flex items-center justify-center shadow-inner"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 font-medium text-xs border border-slate-800/80 transition-colors flex items-center justify-center"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold text-lg border border-slate-800/80 active:scale-95 transition-all flex items-center justify-center shadow-inner"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800/80 transition-colors flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Button */}
              <div className="w-full mt-6">
                {mode === 'unlock' ? (
                  <button
                    type="button"
                    onClick={() => handleUnlock()}
                    disabled={loading || pin.length < 4}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Unlock className="w-4 h-4" />
                    {loading ? 'Decrypting...' : 'Unlock Vault'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPin()}
                    disabled={loading || pin.length < 4}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    {confirmPin ? 'Confirm & Lock' : 'Continue'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
