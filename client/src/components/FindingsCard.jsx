import { useState } from 'react';
import {
  CameraOff, Camera, FlipHorizontal, Sparkles, Grid3X3,
  Radio, Maximize, Users, Wind, HardDrive, Stamp,
  Cpu, Eye, Waves, SlidersHorizontal, Copy, AlertCircle, ChevronDown
} from 'lucide-react';

const iconMap = {
  'camera-off': CameraOff,
  'camera': Camera,
  'flip-horizontal': FlipHorizontal,
  'sparkles': Sparkles,
  'grid': Grid3X3,
  'grid-3x3': Grid3X3,
  'radio': Radio,
  'maximize': Maximize,
  'users': Users,
  'wind': Wind,
  'hard-drive': HardDrive,
  'stamp': Stamp,
  'cpu': Cpu,
  'eye': Eye,
  'waves': Waves,
  'sliders': SlidersHorizontal,
  'copy': Copy,
  'alert-circle': AlertCircle,
};

const severityColors = {
  high: { dot: 'bg-burntRed', text: 'text-burntRed', bg: 'bg-burntRed/5' },
  medium: { dot: 'bg-crispyOrange', text: 'text-crispyOrange', bg: 'bg-crispyOrange/5' },
  low: { dot: 'bg-fresh', text: 'text-fresh', bg: 'bg-fresh/5' },
};

export default function FindingsCard({ finding, showTechnical = false }) {
  const [expanded, setExpanded] = useState(false);

  const Icon = iconMap[finding.icon] || AlertCircle;
  const severity = severityColors[finding.severity] || severityColors.low;

  return (
    <div className={`rounded-xl border border-toast-gold/10 overflow-hidden ${severity.bg}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-toast-gold/5 transition-colors"
      >
        <div className={`p-2 rounded-lg ${severity.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${severity.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-toast-charcoal leading-relaxed">
            {finding.humanReadable}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
          {showTechnical && (
            <ChevronDown className={`w-4 h-4 text-toast-charcoal/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Technical details (nerd mode) */}
      {showTechnical && expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-toast-charcoal/5 rounded-lg px-3 py-2">
            <p className="text-xs text-toast-charcoal/50 font-mono leading-relaxed">
              {finding.technical}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
