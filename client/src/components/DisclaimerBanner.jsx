import { Info } from 'lucide-react';

export default function DisclaimerBanner({ className = '' }) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 bg-toast-gold/8 rounded-xl ${className}`}>
      <Info className="w-4 h-4 text-toast-gold/60 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-toast-charcoal/40 leading-relaxed">
        ToasterAI provides signals, not certainty. AI detection is an evolving field — no tool is 100% accurate. Always trust your instincts and verify through conversation.
      </p>
    </div>
  );
}
