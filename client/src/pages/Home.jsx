import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Eye, Zap, Upload, Flame, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-toast-cream">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-toast-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-crispyOrange/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-toast-gold/10 text-toast-brown text-xs font-bold uppercase tracking-wider mb-6">
                <Shield className="w-3 h-3" />
                AI Image Detection
              </div>
              <h1 className="font-heading text-5xl lg:text-6xl font-bold text-toast-charcoal leading-[1.15] mb-6 pt-2 pb-1">
                Is your online crush{' '}
                <span className="text-toast-gold">real?</span>
              </h1>
              <p className="text-xl text-toast-charcoal/60 leading-relaxed mb-4 max-w-lg font-body">
                Upload their photo. We'll toast it and tell you if it's a real person or AI-generated.
              </p>
              <p className="text-lg font-semibold text-toast-brown mb-8">
                Don't get burnt by a bot. 🔥
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/scan"
                  className="inline-flex items-center justify-center gap-2 bg-toast-gold text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-toast-brown transition-all shadow-xl shadow-toast-gold/20 group"
                >
                  Start Toasting — It's Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-toast-charcoal/30">
                3 free toasts per day &bull; No credit card required &bull; Photos are never stored
              </p>
            </motion.div>

            {/* Toaster illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                {/* Heat shimmer */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-16 heat-shimmer rounded-full" />
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 h-12 heat-shimmer rounded-full" style={{ animationDelay: '0.7s' }} />

                {/* Toaster body */}
                <div className="w-64 h-72 bg-gradient-to-b from-toast-brown to-[#6B4F10] rounded-3xl shadow-2xl shadow-toast-brown/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                  {/* Slot */}
                  <div className="w-44 h-28 toaster-slot flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-6xl"
                    >
                      🍞
                    </motion.div>
                  </div>

                  {/* Coils */}
                  <div className="w-full space-y-1.5 mb-4">
                    <div className="coil-glow h-1.5 rounded-full" />
                    <div className="coil-glow h-1.5 rounded-full" style={{ animationDelay: '0.3s' }} />
                    <div className="coil-glow h-1.5 rounded-full" style={{ animationDelay: '0.6s' }} />
                  </div>

                  {/* Lever */}
                  <div className="absolute right-4 top-1/3 w-3 h-12 bg-toast-cream/20 rounded-full" />
                </div>

                {/* Badge floating */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -right-4 -top-4 bg-fresh text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg"
                >
                  ✓ Real!
                </motion.div>

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className="absolute -left-6 top-16 bg-burntRed text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg"
                >
                  🔥 AI Fake
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-toast-warmWhite">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-toast-brown mb-3">How It Works</h2>
            <p className="text-toast-charcoal/50 max-w-md mx-auto">Three simple steps. No technical knowledge needed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                step: '1',
                title: 'Upload',
                desc: 'Drop a photo into the toaster. Drag & drop, paste a URL, or pick from your files.',
                emoji: '📥'
              },
              {
                icon: Flame,
                step: '2',
                title: 'Toast',
                desc: 'Our AI analyzers examine pixels, metadata, frequencies, and more in seconds.',
                emoji: '🔥'
              },
              {
                icon: Search,
                step: '3',
                title: 'Know',
                desc: 'Get a clear freshness rating with human-readable explanations of what we found.',
                emoji: '🔍'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1, margin: '0px 0px -50px 0px' }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-toast-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="text-4xl">{item.emoji}</span>
                </div>
                <div className="w-8 h-8 bg-toast-gold text-white rounded-full flex items-center justify-center font-heading font-bold text-sm mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-heading text-xl font-bold text-toast-brown mb-2">{item.title}</h3>
                <p className="text-sm text-toast-charcoal/50 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Privacy Baked In',
                desc: 'We never store your photos. Images are analyzed in memory and immediately deleted. Only a hash is kept for your history.'
              },
              {
                icon: Eye,
                title: 'Transparent Results',
                desc: 'Every result comes with plain-language explanations. Toggle "Nerd Mode" for the technical details.'
              },
              {
                icon: Zap,
                title: 'Fast & Free',
                desc: '3 free toasts per day, results in seconds. No credit card, no commitment, no catch.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1, margin: '0px 0px -50px 0px' }}
                transition={{ delay: i * 0.1 }}
                className="bg-toast-warmWhite rounded-2xl p-8 border border-toast-gold/10"
              >
                <item.icon className="w-8 h-8 text-toast-gold mb-4" />
                <h3 className="font-heading text-lg font-bold text-toast-brown mb-2">{item.title}</h3>
                <p className="text-sm text-toast-charcoal/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-toast-brown">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-6">🍞</span>
          <h2 className="font-heading text-3xl font-bold text-toast-cream mb-4">Ready to Toast?</h2>
          <p className="text-toast-cream/60 mb-8 max-w-md mx-auto">
            Upload a photo and find out in seconds whether it's the real deal or artificial.
          </p>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 bg-toast-gold text-toast-charcoal px-8 py-4 rounded-2xl text-lg font-bold hover:bg-toast-cream transition-all shadow-xl group"
          >
            Start Toasting
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
