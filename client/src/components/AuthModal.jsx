import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup — no error shown
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      const code = err.code;
      const messages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(messages[code] || err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-toast-charcoal/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-toast-warmWhite rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-toast-gold/10 transition-colors"
            >
              <X className="w-5 h-5 text-toast-charcoal/40" />
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <span className="text-5xl block mb-3">🍞</span>
                <h2 className="font-heading text-2xl font-bold text-toast-brown">
                  {mode === 'login' ? 'Welcome Back!' : 'Join ToasterAI'}
                </h2>
                <p className="text-sm text-toast-charcoal/50 mt-1">
                  {mode === 'login'
                    ? 'Sign in to keep toasting'
                    : 'Create your free account — 3 toasts per day!'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-burntRed/10 text-burntRed text-sm font-semibold px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3.5 bg-white border border-toast-gold/20 text-toast-charcoal font-semibold rounded-xl hover:bg-toast-cream transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-3 mb-5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center mb-5">
                <div className="flex-grow border-t border-toast-gold/20"></div>
                <span className="flex-shrink mx-3 text-xs text-toast-charcoal/40 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-toast-gold/20"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-toast-charcoal/50 uppercase tracking-wider ml-1 block mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-toast-gold/60" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toast@example.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-toast-cream border border-toast-gold/20 rounded-xl focus:ring-2 focus:ring-toast-gold/40 outline-none font-body text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-toast-charcoal/50 uppercase tracking-wider ml-1 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-toast-gold/60" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-4 py-3.5 bg-toast-cream border border-toast-gold/20 rounded-xl focus:ring-2 focus:ring-toast-gold/40 outline-none font-body text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-toast-gold text-white font-bold rounded-xl hover:bg-toast-brown transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Switch mode */}
              <p className="text-center text-sm text-toast-charcoal/50 mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  className="text-toast-gold font-bold hover:underline"
                >
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
