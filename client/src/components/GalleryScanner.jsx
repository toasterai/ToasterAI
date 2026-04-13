import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Images, Upload, X, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ConfidenceBadge from './ConfidenceBadge';
import FindingsCard from './FindingsCard';

export default function GalleryScanner({ onRequestAuth }) {
  const { user } = useAuth();
  const { state, result, error, toastMessage, progress, toastGallery, reset } = useToast();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const isPremium = user?.plan === 'premium';

  const addFiles = (newFiles) => {
    const remaining = 6 - files.length;
    const toAdd = Array.from(newFiles).slice(0, remaining).filter(f => f.type.startsWith('image/'));

    const updatedFiles = [...files, ...toAdd];
    setFiles(updatedFiles);

    // Create previews
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return onRequestAuth?.();
    if (files.length < 2) return;
    try {
      await toastGallery(files);
    } catch {}
  };

  const handleReset = () => {
    reset();
    setFiles([]);
    setPreviews([]);
  };

  // Locked state for free users
  if (!isPremium) {
    return (
      <div className="bg-toast-warmWhite rounded-2xl border border-toast-gold/15 p-8 text-center">
        <Lock className="w-10 h-10 text-toast-gold/40 mx-auto mb-3" />
        <h3 className="font-heading text-lg font-bold text-toast-brown mb-2">Gallery Check</h3>
        <p className="text-sm text-toast-charcoal/50 mb-4 max-w-sm mx-auto">
          Upload 2-6 photos of the same person to check if they're consistent. Are they really who they say they are?
        </p>
        <p className="text-xs font-bold text-toast-gold mb-4">Premium Crispy feature</p>
        <a href="/pricing" className="inline-block px-6 py-2.5 bg-toast-gold text-white text-sm font-bold rounded-xl hover:bg-toast-brown transition-colors">
          Upgrade to Unlock
        </a>
      </div>
    );
  }

  // Result state
  if (state === 'result' && result) {
    return (
      <div className="space-y-6">
        <h3 className="font-heading text-xl font-bold text-toast-brown">Gallery Results</h3>

        {/* Individual results grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {result.individualResults?.map((r, i) => (
            <div key={i} className="bg-toast-warmWhite rounded-xl p-4 border border-toast-gold/10 text-center">
              <div className="text-3xl mb-2">
                {r.category === 'fresh_bread' ? '\u{1F35E}' : r.category === 'burnt_toast' ? '\u{1F525}' : '\u{1F35E}'}
              </div>
              <p className="font-heading text-2xl font-bold text-toast-brown">{r.freshnessScore}</p>
              <p className="text-xs text-toast-charcoal/40 mt-1">Photo {i + 1}</p>
            </div>
          ))}
        </div>

        {/* Consistency result */}
        {result.consistency && (
          <div className="bg-toast-warmWhite rounded-2xl p-6 border border-toast-gold/15">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-heading text-lg font-bold text-toast-brown">Consistency Check</h4>
              <ConfidenceBadge level={result.consistency.confidence} />
            </div>
            <div className="space-y-2">
              {result.consistency.findings?.map((f, i) => (
                <FindingsCard key={i} finding={f} />
              ))}
            </div>
          </div>
        )}

        <button onClick={handleReset} className="w-full py-3 bg-toast-gold text-white font-bold rounded-xl hover:bg-toast-brown transition-colors">
          Check Another Gallery
        </button>
      </div>
    );
  }

  // Toasting state
  if (state === 'toasting') {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 text-toast-gold animate-spin mx-auto mb-4" />
        <p className="font-heading text-lg font-bold text-toast-brown mb-2">Comparing photos...</p>
        <p className="text-sm text-toast-charcoal/50">{toastMessage}</p>
        <div className="w-48 mx-auto mt-4 bg-toast-charcoal/10 rounded-full h-2 overflow-hidden">
          <motion.div className="h-full bg-toast-gold rounded-full" animate={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Images className="w-5 h-5 text-toast-gold" />
        <h3 className="font-heading text-lg font-bold text-toast-brown">Gallery Check</h3>
      </div>
      <p className="text-sm text-toast-charcoal/50">Upload 2-6 photos claiming to be the same person.</p>

      {/* File previews */}
      <div className="grid grid-cols-3 gap-3">
        {previews.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeFile(i)}
              className="absolute top-1 right-1 p-1 bg-toast-charcoal/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {files.length < 6 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-toast-gold/30 hover:border-toast-gold/60 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Upload className="w-5 h-5 text-toast-gold/50" />
            <span className="text-[10px] font-bold text-toast-charcoal/30">Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />

      {error && <p className="text-sm text-burntRed font-semibold">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={files.length < 2}
        className="w-full py-3 bg-toast-gold text-white font-bold rounded-xl hover:bg-toast-brown transition-colors disabled:opacity-40"
      >
        Compare {files.length} Photos
      </button>
    </div>
  );
}
