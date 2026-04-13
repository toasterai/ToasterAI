import { Check, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingCard({ name, price, period, features, highlighted, cta, onCta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl p-8 ${
        highlighted
          ? 'bg-toast-brown text-toast-cream shadow-2xl shadow-toast-brown/20 ring-2 ring-toast-gold'
          : 'bg-toast-warmWhite text-toast-charcoal border border-toast-gold/15'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-toast-gold text-toast-charcoal px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
          <Flame className="w-3 h-3" /> Most Popular
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className={`font-heading text-xl font-bold mb-2 ${highlighted ? 'text-toast-cream' : 'text-toast-brown'}`}>
          {name}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-heading font-bold ${highlighted ? 'text-toast-gold' : 'text-toast-brown'}`}>
            {price}
          </span>
          {period && (
            <span className={`text-sm ${highlighted ? 'text-toast-cream/60' : 'text-toast-charcoal/40'}`}>
              /{period}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? 'text-toast-gold' : 'text-fresh'}`} />
            <span className={`text-sm ${highlighted ? 'text-toast-cream/80' : 'text-toast-charcoal/60'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
          highlighted
            ? 'bg-toast-gold text-toast-charcoal hover:bg-toast-cream shadow-lg'
            : 'bg-toast-gold/10 text-toast-brown hover:bg-toast-gold/20'
        }`}
      >
        {cta}
      </button>
    </motion.div>
  );
}
