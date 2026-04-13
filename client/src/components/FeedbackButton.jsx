import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, Loader2 } from 'lucide-react';
import { submitFeedback } from '../utils/api';

export default function FeedbackButton({ scanId }) {
  const [state, setState] = useState('idle'); // idle | thumbsDown | submitting | done
  const [actualStatus, setActualStatus] = useState('');
  const [comment, setComment] = useState('');

  const handleThumbsUp = async () => {
    setState('submitting');
    try {
      await submitFeedback(scanId, { wasCorrect: true });
      setState('done');
    } catch {
      setState('idle');
    }
  };

  const handleThumbsDown = () => {
    setState('thumbsDown');
  };

  const handleSubmitDetailed = async () => {
    if (!actualStatus) return;
    setState('submitting');
    try {
      await submitFeedback(scanId, {
        wasCorrect: false,
        actualStatus,
        comment: comment || undefined
      });
      setState('done');
    } catch {
      setState('thumbsDown');
    }
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-fresh/10 rounded-xl">
        <span className="text-fresh text-sm font-semibold">Thanks for the feedback!</span>
      </div>
    );
  }

  if (state === 'submitting') {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-toast-gold" />
        <span className="text-sm text-toast-charcoal/50">Sending...</span>
      </div>
    );
  }

  if (state === 'thumbsDown') {
    return (
      <div className="bg-toast-cream rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-toast-charcoal">What was the actual situation?</p>
        <div className="flex gap-2">
          {[
            { value: 'real', label: 'Real person' },
            { value: 'fake', label: 'AI generated' },
            { value: 'unsure', label: 'Not sure' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setActualStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                actualStatus === opt.value
                  ? 'bg-toast-gold text-white'
                  : 'bg-toast-warmWhite text-toast-charcoal/60 hover:bg-toast-gold/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any details? (optional)"
          rows={2}
          className="w-full px-3 py-2 bg-toast-warmWhite border border-toast-gold/15 rounded-lg text-sm outline-none focus:ring-2 focus:ring-toast-gold/30 resize-none"
        />
        <button
          onClick={handleSubmitDetailed}
          disabled={!actualStatus}
          className="flex items-center gap-1.5 px-4 py-2 bg-toast-gold text-white text-sm font-bold rounded-lg disabled:opacity-40 hover:bg-toast-brown transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Send Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-toast-charcoal/40">Was this helpful?</span>
      <button
        onClick={handleThumbsUp}
        className="p-2 rounded-lg hover:bg-fresh/10 text-toast-charcoal/30 hover:text-fresh transition-all"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={handleThumbsDown}
        className="p-2 rounded-lg hover:bg-burntRed/10 text-toast-charcoal/30 hover:text-burntRed transition-all"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
