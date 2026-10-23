import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirebaseConnection } from '../firebase/config';
import { UserProfile } from '../types';
import { hashPin } from '../utils/crypto';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isVaultUnlocked: boolean;
  hasVaultPin: boolean;
  autoLockMinutes: number;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  unlockVault: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lockVault: () => void;
  setVaultPin: (newPin: string) => Promise<void>;
  updateAutoLock: (minutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connectivity check on boot
  useEffect(() => {
    testFirebaseConnection().catch(console.error);
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }

          if (userSnap && userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            // First time login - initialize user profile
            const now = new Date().toISOString();
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Vault Member',
              photoURL: currentUser.photoURL || '',
              autoLockMinutes: 5,
              createdAt: now,
              updatedAt: now,
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
            }
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching or initializing user profile:', error);
        }
      } else {
        setProfile(null);
        setIsVaultUnlocked(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset auto-lock timer when unlocked
  const resetAutoLockTimer = () => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
    const minutes = profile?.autoLockMinutes || 5;
    if (minutes > 0 && isVaultUnlocked) {
      autoLockTimerRef.current = setTimeout(() => {
        lockVault();
      }, minutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (isVaultUnlocked) {
      resetAutoLockTimer();
      const handleUserActivity = () => resetAutoLockTimer();
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('click', handleUserActivity);

      return () => {
        if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
      };
    }
  }, [isVaultUnlocked, profile?.autoLockMinutes]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsVaultUnlocked(false);
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const unlockVault = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.vaultPinHash) {
      // If no PIN set, setting it now
      const hashed = await hashPin(pin);
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            vaultPinHash: hashed,
            updatedAt: new Date().toISOString()
          });
          setProfile(prev => prev ? { ...prev, vaultPinHash: hashed } : null);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
      setIsVaultUnlocked(true);
      return { success: true };
    }

    const hashed = await hashPin(pin);
    if (hashed === profile.vaultPinHash) {
      setIsVaultUnlocked(true);
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect Vault Security PIN' };
    }
  };

  const lockVault = () => {
    setIsVaultUnlocked(false);
  };

  const setVaultPin = async (newPin: string) => {
    if (!user) return;
    const hashed = await hashPin(newPin);
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        vaultPinHash: hashed,
        updatedAt: now
      });
      setProfile(prev => prev ? { ...prev, vaultPinHash: hashed, updatedAt: now } : null);
      setIsVaultUnlocked(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateAutoLock = async (minutes: number) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        autoLockMinutes: minutes,
        updatedAt: now
      });
      setProfile(prev => prev ? { ...prev, autoLockMinutes: minutes, updatedAt: now } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isVaultUnlocked,
        hasVaultPin: Boolean(profile?.vaultPinHash),
        autoLockMinutes: profile?.autoLockMinutes || 5,
        signInWithGoogle,
        logout,
        unlockVault,
        lockVault,
        setVaultPin,
        updateAutoLock
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
