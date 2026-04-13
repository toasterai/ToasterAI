import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronDown, Loader2 } from 'lucide-react';
import { getScanHistory } from '../utils/api';
import ConfidenceBadge from './ConfidenceBadge';
import FindingsCard from './FindingsCard';

const categoryLabels = {
  fresh_bread: { emoji: '\u{1F35E}', label: 'Fresh', color: 'text-fresh', bg: 'bg-fresh/10' },
  lightly_toasted: { emoji: '\u{1F35E}', label: 'Light Toast', color: 'text-lightAmber', bg: 'bg-lightAmber/10' },
  getting_crispy: { emoji: '\u{1F35E}', label: 'Crispy', color: 'text-crispyOrange', bg: 'bg-crispyOrange/10' },
  burnt_toast: { emoji: '\u{1F525}', label: 'Burnt', color: 'text-burntRed', bg: 'bg-burntRed/10' },
};

export default function ToastHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadScans();
  }, [page]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const data = await getScanHistory(page, 12);
      setScans(data.scans);
      setTotal(data.pagination.total);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-toast-gold animate-spin" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl block mb-4">🍞</span>
        <h3 className="font-heading text-xl font-bold text-toast-brown mb-2">No toasts yet!</h3>
        <p className="text-sm text-toast-charcoal/50">Go toast your first photo to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scans.map((scan) => {
          const cat = categoryLabels[scan.category] || categoryLabels.lightly_toasted;
          const isExpanded = expanded === scan.id;

          return (
            <motion.div
              key={scan.id}
              layout
              className="bg-toast-warmWhite rounded-2xl border border-toast-gold/10 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : scan.id)}
                className="w-full p-4 text-left hover:bg-toast-gold/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center text-xl`}>
                      {cat.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-heading text-xl font-bold ${cat.color}`}>{scan.freshness_score}</span>
                        <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-toast-charcoal/30">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px]">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-toast-charcoal/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4 border-t border-toast-gold/10"
                >
                  <div className="mt-3 mb-2">
                    <ConfidenceBadge level={scan.confidence} />
                  </div>
                  <div className="space-y-2 mt-3">
                    {scan.findings?.slice(0, 3).map((f, i) => (
                      <FindingsCard key={i} finding={f} />
                    ))}
                  </div>
                  <p className="text-[10px] text-toast-charcoal/20 mt-3 font-mono truncate">
                    Hash: {scan.image_hash?.slice(0, 16)}...
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-toast-gold/10 text-toast-brown disabled:opacity-30 hover:bg-toast-gold/20 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-toast-charcoal/40">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={scans.length < 12}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-toast-gold/10 text-toast-brown disabled:opacity-30 hover:bg-toast-gold/20 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
