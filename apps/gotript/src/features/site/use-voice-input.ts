'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API wrapper for the agentic hero composer.
 *
 *   - Supported in Chrome / Edge / Safari (mobile + desktop). Firefox
 *     desktop does not implement SpeechRecognition; the hook returns
 *     `supported: false` and the UI hides the mic button there.
 *   - Interim transcripts stream into `transcript` so the textarea
 *     reflects the user speaking in real time.
 *   - Recognition stops automatically after a silence beat — callers
 *     can also call `stop()` explicitly.
 */

interface VoiceInput {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechResultEventLike) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechErrorEventLike) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechResultEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
}

interface SpeechErrorEventLike extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Probe SpeechRecognition support — runs in an effect after mount
 * so server-rendered HTML matches the initial client paint (no
 * hydration mismatch). The mic button stays hidden for the first
 * paint and appears on the second render if support is detected.
 */
export function useVoiceInput({
  onFinalTranscript,
}: {
  onFinalTranscript?: (text: string) => void;
} = {}): VoiceInput {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Browser-capability detection — by definition has to read window
  // after mount to avoid a hydration mismatch. The `react-hooks/
  // set-state-in-effect` rule is muted for the legitimate use here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(true);
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setError(null);
    setTranscript('');
    setListening(true);
    rec.onresult = (ev) => {
      let full = '';
      let isFinal = false;
      for (let i = 0; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result) continue;
        const alt = result[0];
        if (alt) full += alt.transcript;
        if (result.isFinal) isFinal = true;
      }
      setTranscript(full.trim());
      if (isFinal && onFinalTranscript && full.trim().length > 0) {
        onFinalTranscript(full.trim());
      }
    };
    rec.onerror = (ev) => {
      setError(ev.error);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    try {
      rec.start();
    } catch (e) {
      setError((e as Error).message);
      setListening(false);
    }
  }, [onFinalTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
