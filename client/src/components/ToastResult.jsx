import { motion } from 'framer-motion';
import ConfidenceBadge from './ConfidenceBadge';
import FindingsCard from './FindingsCard';
import FeedbackButton from './FeedbackButton';
import DisclaimerBanner from './DisclaimerBanner';
import { useState } from 'react';
import { RotateCcw, Eye } from 'lucide-react';

const categoryConfig = {
  fresh_bread: {
    emoji: '\u{1F35E}',
    label: 'Fresh Bread',
    subtitle: 'Looks like a real human!',
    color: 'text-fresh',
    bg: 'bg-fresh/10',
    ring: 'ring-fresh/30',
    gradient: 'from-fresh/20 to-fresh/5',
  },
  lightly_toasted: {
    emoji: '\u{1F35E}',
    label: 'Lightly Toasted',
    subtitle: 'Probably real, minor flags',
    color: 'text-lightAmber',
    bg: 'bg-lightAmber/10',
    ring: 'ring-lightAmber/30',
    gradient: 'from-lightAmber/20 to-lightAmber/5',
  },
  getting_crispy: {
    emoji: '\u{1F35E}',
    label: 'Getting Crispy',
    subtitle: 'Some suspicious signs detected',
    color: 'text-crispyOrange',
    bg: 'bg-crispyOrange/10',
    ring: 'ring-crispyOrange/30',
    gradient: 'from-crispyOrange/20 to-crispyOrange/5',
  },
  burnt_toast: {
    emoji: '\u{1F525}',
    label: 'Burnt Toast',
    subtitle: 'High probability of AI generation',
    color: 'text-burntRed',
    bg: 'bg-burntRed/10',
    ring: 'ring-burntRed/30',
    gradient: 'from-burntRed/20 to-burntRed/5',
  },
};

export default function ToastResult({ result, onReset }) {
  const [nerdMode, setNerdMode] = useState(false);
  const cat = categoryConfig[result.category] || categoryConfig.lightly_toasted;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Score card */}
      <div className={`bg-gradient-to-b ${cat.gradient} rounded-3xl p-8 ring-1 ${cat.ring} shadow-lg mb-6`}>
        <div className="text-center">
          {/* Animated emoji */}
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.2 }}
            className="text-6xl block mb-4"
          >
            {cat.emoji}
          </motion.span>

          {/* Score number */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full ring-4 ${cat.ring} ${cat.bg} mb-4`}
          >
            <span className={`font-heading text-4xl font-bold ${cat.color}`}>
              {result.freshnessScore}
            </span>
          </motion.div>

          {/* Category label */}
          <h2 className={`font-heading text-2xl font-bold ${cat.color} mb-1`}>{cat.label}</h2>
          <p className="text-sm text-toast-charcoal/50">{cat.subtitle}</p>

          {/* Confidence badge */}
          <div className="mt-4 flex justify-center">
            <ConfidenceBadge level={result.confidence} />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerBanner className="mb-6" />

      {/* Findings */}
      {result.findings && result.findings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-bold text-toast-brown">What We Found</h3>
            <button
              onClick={() => setNerdMode(!nerdMode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-toast-charcoal/40 hover:text-toast-gold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {nerdMode ? 'Simple Mode' : 'Nerd Mode'}
            </button>
          </div>
          <div className="space-y-2">
            {result.findings.map((finding, i) => (
              <FindingsCard key={i} finding={finding} showTechnical={nerdMode} />
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="flex items-center justify-between mb-6">
        <FeedbackButton scanId={result.id} />
      </div>

      {/* Toast another */}
      <button
        onClick={onReset}
        className="w-full py-4 bg-toast-gold text-white font-bold rounded-xl hover:bg-toast-brown transition-all shadow-md flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Toast Another Photo
      </button>
    </motion.div>
  );
}
