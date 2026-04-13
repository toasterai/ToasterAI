import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Link as LinkIcon, Image, Loader2 } from 'lucide-react';

export default function Toaster({ state, progress, toastMessage, onFileSelect, onUrlSubmit, preview }) {
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) onFileSelect(file);
        break;
      }
    }
  }, [onFileSelect]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlSubmit(urlInput.trim());
      setUrlInput('');
    }
  };

  // --- Toasting animation state ---
  if (state === 'toasting') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          {/* Heat shimmer above toaster */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-12 heat-shimmer rounded-full" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-10 heat-shimmer rounded-full" style={{ animationDelay: '0.5s' }} />

          {/* Toaster body */}
          <div className="bg-gradient-to-b from-toast-brown to-[#6B4F10] rounded-2xl p-6 shadow-2xl shadow-toast-brown/30">
            {/* Slot with image */}
            <div className="toaster-slot p-3 mb-4">
              <div className="relative aspect-square max-h-48 mx-auto overflow-hidden rounded-lg">
                {preview ? (
                  <img
                    src={preview}
                    alt="Toasting..."
                    className="w-full h-full object-cover transition-all duration-1000"
                    style={{
                      filter: `sepia(${progress}%) saturate(${100 + progress}%) brightness(${100 - progress * 0.15}%)`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-toast-charcoal/30 flex items-center justify-center">
                    <Image className="w-12 h-12 text-toast-cream/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Glowing coils */}
            <div className="space-y-1.5 mb-4">
              <div className="coil-glow h-1.5 rounded-full" />
              <div className="coil-glow h-1.5 rounded-full" style={{ animationDelay: '0.3s' }} />
              <div className="coil-glow h-1.5 rounded-full" style={{ animationDelay: '0.6s' }} />
            </div>

            {/* Progress bar */}
            <div className="bg-toast-charcoal/30 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-toast-gold to-crispyOrange rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Message below */}
          <motion.p
            key={toastMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-semibold text-toast-brown/70 mt-4"
          >
            {toastMessage}
          </motion.p>
        </div>
      </div>
    );
  }

  // --- Idle upload state ---
  return (
    <div className="w-full max-w-md mx-auto space-y-4" onPaste={handlePaste} tabIndex={0}>
      {/* Upload zone styled as toaster slot */}
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          dragOver
            ? 'drag-over border-toast-gold bg-toast-gold/10'
            : 'border-toast-gold/30 hover:border-toast-gold/60 hover:bg-toast-gold/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
      >
        <div className="p-10 flex flex-col items-center gap-4">
          <motion.div
            animate={dragOver ? { y: [0, -8, 0], scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 bg-toast-gold/10 rounded-2xl flex items-center justify-center"
          >
            <Upload className="w-8 h-8 text-toast-gold" />
          </motion.div>
          <div className="text-center">
            <p className="font-heading text-lg font-bold text-toast-brown">Drop a photo in the toaster</p>
            <p className="text-sm text-toast-charcoal/40 mt-1">or click to browse &bull; JPG, PNG, WEBP up to 10MB</p>
          </div>
          <p className="text-xs text-toast-charcoal/30">You can also paste from clipboard (Ctrl+V)</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* URL input toggle */}
      <div className="text-center">
        <button
          onClick={() => setUrlMode(!urlMode)}
          className="text-sm font-semibold text-toast-gold hover:text-toast-brown transition-colors inline-flex items-center gap-1.5"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {urlMode ? 'Hide URL input' : 'Or paste a URL'}
        </button>
      </div>

      {urlMode && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleUrlSubmit}
          className="flex gap-2"
        >
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 px-4 py-3 bg-toast-warmWhite border border-toast-gold/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-toast-gold/30"
          />
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-5 py-3 bg-toast-gold text-white font-bold text-sm rounded-xl hover:bg-toast-brown transition-colors disabled:opacity-40"
          >
            Toast It
          </button>
        </motion.form>
      )}
    </div>
  );
}
