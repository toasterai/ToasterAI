import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Toaster from '../components/Toaster';
import ToastResult from '../components/ToastResult';
import GalleryScanner from '../components/GalleryScanner';
import DemoOnboarding from '../components/DemoOnboarding';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { AlertCircle, Images, Image } from 'lucide-react';

export default function Scanner() {
  const { user } = useAuth();
  const { openAuth } = useOutletContext();
  const { state, result, error, progress, toastMessage, toastFile, toastUrl, reset } = useToast();
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('single'); // single | gallery
  const [showDemo, setShowDemo] = useState(() => {
    return !localStorage.getItem('toasterai_demo_dismissed');
  });

  const handleFileSelect = useCallback((file) => {
    if (!user) {
      openAuth();
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    toastFile(file).catch(() => {});
  }, [user, openAuth, toastFile]);

  const handleUrlSubmit = useCallback((url) => {
    if (!user) {
      openAuth();
      return;
    }
    setPreview(null);
    toastUrl(url).catch(() => {});
  }, [user, openAuth, toastUrl]);

  const handleReset = useCallback(() => {
    reset();
    setPreview(null);
  }, [reset]);

  const dismissDemo = () => {
    setShowDemo(false);
    localStorage.setItem('toasterai_demo_dismissed', 'true');
  };

  return (
    <div className="min-h-[80vh] py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-toast-brown mb-2">
            {state === 'result' ? 'Your Results' : 'Toast a Photo'}
          </h1>
          {state === 'idle' && (
            <p className="text-toast-charcoal/50 text-sm">
              Upload a photo and we'll check if it's real or AI-generated.
            </p>
          )}
        </div>

        {/* Scans remaining */}
        {user && state === 'idle' && user.plan !== 'premium' && (
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-toast-gold/10 rounded-full text-xs font-bold text-toast-brown">
              {Math.max(0, user.scansLimit - user.scansUsed)} of {user.scansLimit} free toasts remaining today
            </span>
          </div>
        )}

        {/* Mode toggle (only in idle state) */}
        {state === 'idle' && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-toast-warmWhite rounded-xl p-1 border border-toast-gold/10">
              <button
                onClick={() => setMode('single')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'single' ? 'bg-toast-gold text-white shadow-sm' : 'text-toast-charcoal/50 hover:text-toast-brown'
                }`}
              >
                <Image className="w-4 h-4" />
                Single Photo
              </button>
              <button
                onClick={() => setMode('gallery')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'gallery' ? 'bg-toast-gold text-white shadow-sm' : 'text-toast-charcoal/50 hover:text-toast-brown'
                }`}
              >
                <Images className="w-4 h-4" />
                Gallery Check
              </button>
            </div>
          </div>
        )}

        {/* Demo onboarding (first visit) */}
        {showDemo && state === 'idle' && mode === 'single' && (
          <DemoOnboarding onDismiss={dismissDemo} />
        )}

        {/* Main content */}
        {mode === 'single' ? (
          <>
            {/* Error display */}
            {state === 'error' && error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-burntRed/10 border border-burntRed/20 text-burntRed rounded-2xl p-4 mb-6 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{error}</p>
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold mt-2 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Toaster (idle + toasting states) */}
            {(state === 'idle' || state === 'toasting' || state === 'error') && (
              <Toaster
                state={state === 'error' ? 'idle' : state}
                progress={progress}
                toastMessage={toastMessage}
                onFileSelect={handleFileSelect}
                onUrlSubmit={handleUrlSubmit}
                preview={preview}
              />
            )}

            {/* Result */}
            {state === 'result' && result && (
              <ToastResult result={result} onReset={handleReset} />
            )}
          </>
        ) : (
          <GalleryScanner onRequestAuth={openAuth} />
        )}

        {/* Bottom disclaimer */}
        {state === 'idle' && (
          <div className="mt-10">
            <DisclaimerBanner />
          </div>
        )}
      </div>
    </div>
  );
}
