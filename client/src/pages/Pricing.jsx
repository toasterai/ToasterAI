import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import PricingCard from '../components/PricingCard';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function Pricing() {
  const { user } = useAuth();
  const { openAuth } = useOutletContext();

  return (
    <div className="min-h-[80vh] py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl font-bold text-toast-brown mb-3"
          >
            Simple, Honest Pricing
          </motion.h1>
          <p className="text-toast-charcoal/50 max-w-md mx-auto">
            Start free. Upgrade when you need more toasts.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            name="Free Toast"
            price="$0"
            period=""
            features={[
              '3 scans per day',
              'Single photo analysis',
              'Basic findings',
              'Feedback participation',
              'Privacy guaranteed',
            ]}
            cta={user ? 'Current Plan' : 'Get Started Free'}
            onCta={() => { if (!user) openAuth(); }}
          />

          <PricingCard
            name="Premium Crispy"
            price="$4.99"
            period="month"
            highlighted
            features={[
              'Unlimited scans',
              'Gallery consistency check (2-6 photos)',
              'All analyzers active',
              'Deep findings with full detail',
              'Unlimited scan history',
              'Priority processing',
            ]}
            cta="Coming Soon"
            onCta={() => {}}
          />
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-toast-brown text-center mb-8">Frequently Asked</h2>

          <div className="space-y-4">
            {[
              {
                q: 'Do you store my photos?',
                a: 'Never. Photos are analyzed in memory and immediately deleted. We only keep a cryptographic hash (a fingerprint) for your scan history — the original image cannot be reconstructed from it.'
              },
              {
                q: 'How accurate is it?',
                a: 'ToasterAI uses multiple analysis techniques to detect AI-generated images. It\'s good at catching common AI generators, but no tool is 100% accurate. Think of it as a helpful signal, not a definitive answer.'
              },
              {
                q: 'What counts as a "scan"?',
                a: 'Each individual photo analyzed counts as one scan. In gallery mode (Premium), analyzing multiple photos together counts as one scan.'
              },
              {
                q: 'When do free scans reset?',
                a: 'Your 3 free scans reset every day at midnight UTC.'
              },
              {
                q: 'Can I cancel Premium anytime?',
                a: 'Absolutely. No contracts, no commitments. Cancel anytime and keep access until the end of your billing period.'
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-toast-warmWhite rounded-2xl p-6 border border-toast-gold/10"
              >
                <h3 className="font-heading text-base font-bold text-toast-brown mb-2">{faq.q}</h3>
                <p className="text-sm text-toast-charcoal/50 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <DisclaimerBanner />
        </div>
      </div>
    </div>
  );
}
