import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Flame, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getScanHistory } from '../utils/api';
import ToastHistory from '../components/ToastHistory';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { openAuth } = useOutletContext();
  const [stats, setStats] = useState({ total: 0, burnt: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingStats(false);
      return;
    }
    getScanHistory(1, 100)
      .then((data) => {
        const total = data.pagination.total;
        const burnt = data.scans.filter(s => s.category === 'burnt_toast').length;
        setStats({ total, burnt });
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-toast-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <span className="text-6xl block mb-4">🍞</span>
          <h2 className="font-heading text-2xl font-bold text-toast-brown mb-3">Sign in to see your dashboard</h2>
          <p className="text-sm text-toast-charcoal/50 mb-6">Track your toast history, see stats, and manage your account.</p>
          <button
            onClick={openAuth}
            className="px-6 py-3 bg-toast-gold text-white font-bold rounded-xl hover:bg-toast-brown transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-toast-brown mb-8">Your Dashboard</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-toast-warmWhite rounded-2xl p-5 border border-toast-gold/10"
        >
          <BarChart3 className="w-5 h-5 text-toast-gold mb-2" />
          <p className="font-heading text-2xl font-bold text-toast-brown">
            {loadingStats ? '...' : stats.total}
          </p>
          <p className="text-xs text-toast-charcoal/40 font-semibold">Total Scans</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-toast-warmWhite rounded-2xl p-5 border border-toast-gold/10"
        >
          <Flame className="w-5 h-5 text-burntRed mb-2" />
          <p className="font-heading text-2xl font-bold text-burntRed">
            {loadingStats ? '...' : stats.burnt}
          </p>
          <p className="text-xs text-toast-charcoal/40 font-semibold">Burnt Toasts Caught</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-toast-warmWhite rounded-2xl p-5 border border-toast-gold/10"
        >
          <Shield className="w-5 h-5 text-fresh mb-2" />
          <p className="font-heading text-2xl font-bold text-toast-brown capitalize">{user.plan}</p>
          <p className="text-xs text-toast-charcoal/40 font-semibold">Current Plan</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-toast-warmWhite rounded-2xl p-5 border border-toast-gold/10"
        >
          <div className="mb-2">
            <span className="text-xl">🍞</span>
          </div>
          <p className="font-heading text-2xl font-bold text-toast-gold">
            {user.plan === 'premium' ? '∞' : `${Math.max(0, user.scansLimit - user.scansUsed)}`}
          </p>
          <p className="text-xs text-toast-charcoal/40 font-semibold">Toasts Today</p>
          {user.plan !== 'premium' && (
            <div className="mt-2 w-full bg-toast-charcoal/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-toast-gold rounded-full transition-all"
                style={{ width: `${(user.scansUsed / user.scansLimit) * 100}%` }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* History */}
      <h2 className="font-heading text-xl font-bold text-toast-brown mb-4">Toast History</h2>
      <ToastHistory />
    </div>
  );
}
