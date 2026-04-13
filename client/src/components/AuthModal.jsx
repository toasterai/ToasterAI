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
  const { login, register } = useAuth();

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
