import { useState } from 'react';
import { Shield, ShieldAlert, ShieldQuestion } from 'lucide-react';

const config = {
  high: {
    icon: Shield,
    label: 'High Confidence',
    color: 'text-confidenceHigh',
    bg: 'bg-confidenceHigh/10',
    tooltip: 'Multiple analysis methods agree on this result. We\'re fairly sure about this one.'
  },
  medium: {
    icon: ShieldAlert,
    label: 'Medium Confidence',
    color: 'text-confidenceMedium',
    bg: 'bg-confidenceMedium/10',
    tooltip: 'Some analysis methods found signals, but there\'s room for uncertainty.'
  },
  low: {
    icon: ShieldQuestion,
    label: 'Low Confidence',
    color: 'text-confidenceLow',
    bg: 'bg-confidenceLow/10',
    tooltip: 'Our analyzers couldn\'t reach a strong consensus. Take this result with a grain of salt.'
  }
};

export default function ConfidenceBadge({ level }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { icon: Icon, label, color, bg, tooltip } = config[level] || config.low;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${color} ${bg} transition-all`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-toast-charcoal text-toast-cream text-xs rounded-xl shadow-lg z-50 leading-relaxed">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-toast-charcoal" />
        </div>
      )}
    </div>
  );
}
