import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getMe } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile (plan, scans, etc.) from our backend
          const data = await getMe();
          setUser({ ...data.user, email: firebaseUser.email });
        } catch {
          // Backend might not have this user yet — set basic info
          setUser({ email: firebaseUser.email, plan: 'free', scansUsed: 0, scansLimit: 3 });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await getMe();
    setUser({ ...data.user, email: cred.user.email });
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data = await getMe();
    setUser({ ...data.user, email: cred.user.email });
    return data;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const data = await getMe();
    setUser({ ...data.user, email: cred.user.email });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser((prev) => ({ ...prev, ...data.user }));
    } catch {
      // If backend fails, keep current user
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
