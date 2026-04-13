import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';

/**
 * First-visit demo walkthrough
 * Shows sample results to demonstrate the tool without requiring sign-up
 */

const demoResults = {
  real: {
    freshnessScore: 18,
    confidence: 'high',
    category: 'fresh_bread',
    findings: [
      {
        technical: 'Camera model found: Apple iPhone 15 Pro',
        humanReadable: 'This photo was taken with an Apple iPhone 15 Pro camera — a good sign it\'s a real photo.',
        severity: 'low',
        icon: 'camera'
      },
      {
        technical: 'EXIF timestamp and GPS data present',
        humanReadable: 'The photo has time and location data embedded — these come from real cameras automatically.',
        severity: 'low',
        icon: 'camera'
      },
      {
        technical: 'Natural skin texture variance: 24.6',
        humanReadable: 'The skin has natural texture with pores and imperfections — this looks like a real person.',
        severity: 'low',
        icon: 'sparkles'
      }
    ]
  },
  ai: {
    freshnessScore: 82,
    confidence: 'high',
    category: 'burnt_toast',
    findings: [
      {
        technical: 'No EXIF data found in the image.',
        humanReadable: 'This photo has no camera information — real photos from phones usually include this automatically.',
        severity: 'high',
        icon: 'camera-off'
      },
      {
        technical: 'Dimensions 1024x1024 match common AI output.',
        humanReadable: 'This image is exactly the size that AI tools typically output — real phone photos are usually different dimensions.',
        severity: 'medium',
        icon: 'maximize'
      },
      {
        technical: 'Excessive facial symmetry detected: 0.97',
        humanReadable: 'This face is unusually symmetrical — real faces always have small natural differences between left and right.',
        severity: 'high',
        icon: 'flip-horizontal'
      },
      {
        technical: 'Low skin texture variance: 3.2',
        humanReadable: 'The skin looks unnaturally smooth — like a video game character rather than a real person with pores and texture.',
        severity: 'high',
        icon: 'sparkles'
      }
    ]
  }
};

export default function DemoOnboarding({ onDismiss }) {
  const [step, setStep] = useState('intro'); // intro | pick | result
  const [selectedDemo, setSelectedDemo] = useState(null);

  if (step === 'result' && selectedDemo) {
    const result = demoResults[selectedDemo];
    const isReal = selectedDemo === 'real';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-toast-warmWhite rounded-2xl border border-toast-gold/15 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-toast-gold uppercase tracking-wider">Demo Result</span>
          <button onClick={onDismiss} className="p-1 hover:bg-toast-gold/10 rounded-full">
            <X className="w-4 h-4 text-toast-charcoal/30" />
          </button>
        </div>

        <div className="text-center mb-6">
          <span className="text-5xl block mb-2">{isReal ? '\u{1F35E}' : '\u{1F525}'}</span>
          <span className={`font-heading text-3xl font-bold ${isReal ? 'text-fresh' : 'text-burntRed'}`}>
            {result.freshnessScore}
          </span>
          <p className={`text-sm font-semibold ${isReal ? 'text-fresh' : 'text-burntRed'}`}>
            {isReal ? 'Fresh Bread — Looks real!' : 'Burnt Toast — Likely AI-generated'}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {result.findings.slice(0, 3).map((f, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-toast-cream/50">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${f.severity === 'high' ? 'bg-burntRed' : f.severity === 'medium' ? 'bg-crispyOrange' : 'bg-fresh'}`} />
              <p className="text-xs text-toast-charcoal/60 leading-relaxed">{f.humanReadable}</p>
            </div>
          ))}
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-toast-brown">Ready to try your own?</p>
          <button
            onClick={onDismiss}
            className="px-6 py-2.5 bg-toast-gold text-white text-sm font-bold rounded-xl hover:bg-toast-brown transition-colors"
          >
            Upload a Photo
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-toast-warmWhite rounded-2xl border border-toast-gold/15 p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-toast-gold" />
          <span className="text-xs font-bold text-toast-gold uppercase tracking-wider">Try the demo</span>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-toast-gold/10 rounded-full">
          <X className="w-4 h-4 text-toast-charcoal/30" />
        </button>
      </div>

      {step === 'intro' && (
        <>
          <h3 className="font-heading text-lg font-bold text-toast-brown mb-2">Want to see how it works?</h3>
          <p className="text-sm text-toast-charcoal/50 mb-4">Try our demo with sample images — no account needed.</p>
          <button
            onClick={() => setStep('pick')}
            className="flex items-center gap-2 text-sm font-bold text-toast-gold hover:text-toast-brown transition-colors"
          >
            Show me <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}

      {step === 'pick' && (
        <>
          <p className="text-sm text-toast-charcoal/50 mb-4">Pick a sample image to toast:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setSelectedDemo('real'); setStep('result'); }}
              className="p-4 bg-fresh/5 rounded-xl border border-fresh/20 hover:bg-fresh/10 transition-colors text-center group"
            >
              <span className="text-3xl block mb-2">📸</span>
              <span className="text-sm font-bold text-fresh group-hover:underline">Real Photo</span>
              <p className="text-[10px] text-toast-charcoal/40 mt-1">Taken with a phone</p>
            </button>
            <button
              onClick={() => { setSelectedDemo('ai'); setStep('result'); }}
              className="p-4 bg-burntRed/5 rounded-xl border border-burntRed/20 hover:bg-burntRed/10 transition-colors text-center group"
            >
              <span className="text-3xl block mb-2">🤖</span>
              <span className="text-sm font-bold text-burntRed group-hover:underline">AI Generated</span>
              <p className="text-[10px] text-toast-charcoal/40 mt-1">Made by AI</p>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
