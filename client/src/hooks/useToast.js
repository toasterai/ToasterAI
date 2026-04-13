import { useState, useCallback } from 'react';
import { scanSingle, scanUrl, scanGallery } from '../utils/api';

/**
 * Manages the scan lifecycle: idle → toasting → result/error
 */
export function useToast() {
  const [state, setState] = useState('idle'); // idle | toasting | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const toastMessages = [
    'Warming up the toaster...',
    'Analyzing the crumbs...',
    'Checking for artificial ingredients...',
    'Inspecting the crust...',
    'Looking for digital fingerprints...',
    'Almost done — getting crispy...',
  ];
  const [toastMessage, setToastMessage] = useState(toastMessages[0]);

  const startToasting = useCallback(() => {
    setState('toasting');
    setError(null);
    setResult(null);
    setProgress(0);

    // Cycle through fun messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % toastMessages.length;
      setToastMessage(toastMessages[msgIndex]);
    }, 1200);

    // Progress simulation (real analysis may finish sooner)
    let prog = 0;
    const progInterval = setInterval(() => {
      prog = Math.min(90, prog + Math.random() * 15);
      setProgress(prog);
    }, 500);

    return { msgInterval, progInterval };
  }, []);

  const finishToasting = useCallback((intervals, data) => {
    clearInterval(intervals.msgInterval);
    clearInterval(intervals.progInterval);
    setProgress(100);
    setResult(data);
    setState('result');
  }, []);

  const failToasting = useCallback((intervals, errorMsg) => {
    clearInterval(intervals.msgInterval);
    clearInterval(intervals.progInterval);
    setProgress(0);
    setError(errorMsg);
    setState('error');
  }, []);

  const toastFile = useCallback(async (file) => {
    const intervals = startToasting();
    try {
      const data = await scanSingle(file);
      // Ensure minimum animation time of 3 seconds
      await new Promise(r => setTimeout(r, 1500));
      finishToasting(intervals, data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      failToasting(intervals, msg);
      throw err;
    }
  }, [startToasting, finishToasting, failToasting]);

  const toastUrl = useCallback(async (url) => {
    const intervals = startToasting();
    try {
      const data = await scanUrl(url);
      await new Promise(r => setTimeout(r, 1500));
      finishToasting(intervals, data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      failToasting(intervals, msg);
      throw err;
    }
  }, [startToasting, finishToasting, failToasting]);

  const toastGallery = useCallback(async (files) => {
    const intervals = startToasting();
    try {
      const data = await scanGallery(files);
      await new Promise(r => setTimeout(r, 2000));
      finishToasting(intervals, data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      failToasting(intervals, msg);
      throw err;
    }
  }, [startToasting, finishToasting, failToasting]);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setProgress(0);
    setToastMessage(toastMessages[0]);
  }, []);

  return {
    state,
    result,
    error,
    progress,
    toastMessage,
    toastFile,
    toastUrl,
    toastGallery,
    reset
  };
}
