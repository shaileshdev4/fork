"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/Logo";

/**
 * "Say it" - the single-sentence entry. Voice (Web Speech API, native, free) or
 * type. One open prompt collapses a 12-field form into a sentence. The parsed
 * result is confirmed/corrected downstream, so this never has to be perfect.
 */

const EXAMPLES = [
  "I might move from Toronto to Austin for a job paying $140k",
  "Offer in SF for 200k vs staying in Denver at 150k",
  "Bangalore at 25 lakh vs Hyderabad at 18 lakh - which fork?",
  "Mumbai 30L offer vs Pune 22L, should I move?",
  "Should I take the Seattle role at 165k or the NYC one at 185k?",
];

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export default function Onboarding({
  onSubmit,
  loading,
  resumable,
  onResume,
  onDismissResume,
}: {
  onSubmit: (text: string) => void;
  loading: boolean;
  resumable?: { a: { city: string }; b: { city: string }; savedAt: number } | null;
  onResume?: () => void;
  onDismissResume?: () => void;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const r = new SR();
      r.continuous = false;
      r.interimResults = true;
      r.lang = "en-US";
      r.onresult = (e) => {
        const t = Array.from(e.results)
          .map((res) => res[0].transcript)
          .join("");
        setText(t);
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      recogRef.current = r;
    }
  }, []);

  // rotate placeholder examples
  useEffect(() => {
    const id = setInterval(
      () => setExampleIdx((i) => (i + 1) % EXAMPLES.length),
      3200,
    );
    return () => clearInterval(id);
  }, []);

  const toggleVoice = useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
    } else {
      setText("");
      try {
        r.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }, [listening]);

  const submit = () => {
    if (text.trim().length > 2) onSubmit(text.trim());
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-16 md:py-24">
      <Logo variant="eyebrow" className="mb-6" />

      {resumable && (
        <div className="mb-6 rounded-xl border border-line bg-paper p-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-ink font-medium">Pick up where you left off?</span>
            <span className="text-muted block">
              {resumable.a.city} vs {resumable.b.city} · saved {timeAgoSafe(resumable.savedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onResume}
              className="rounded-full bg-ink text-paper px-4 py-2 text-sm hover:opacity-90"
            >
              Resume
            </button>
            <button
              onClick={onDismissResume}
              aria-label="Dismiss"
              className="text-muted hover:text-ink text-sm px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-ink">
        What are you deciding?
      </h1>
      <p className="text-muted mt-4 text-base md:text-lg leading-relaxed">
        Say it in a sentence - a move, an offer, a fork in the road. We&apos;ll
        build both futures with your real numbers and let you live them before
        you choose.
      </p>

      <div className="mt-8 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={3}
          placeholder={EXAMPLES[exampleIdx]}
          className="w-full resize-none rounded-2xl border-2 border-line bg-paper px-5 py-4 text-lg text-ink outline-none focus:border-ink transition-colors placeholder:text-muted/60"
        />

        <div className="flex items-center gap-3 mt-4">
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className="relative flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm transition-colors"
              style={{
                borderColor: listening ? "#c0492f" : "#d9d2c5",
                color: listening ? "#c0492f" : "#1a1d29",
              }}
            >
              {listening && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ border: "2px solid #c0492f" }}
                  animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 10a2.5 2.5 0 0 0 2.5-2.5v-3a2.5 2.5 0 0 0-5 0v3A2.5 2.5 0 0 0 8 10z" />
                <path d="M4 7a.5.5 0 0 0-1 0 5 5 0 0 0 4.5 4.975V13.5a.5.5 0 0 0 1 0v-1.525A5 5 0 0 0 13 7a.5.5 0 0 0-1 0 4 4 0 0 1-8 0z" />
              </svg>
              {listening ? "Listening… tap to stop" : "Speak it"}
            </button>
          )}

          <button
            onClick={submit}
            disabled={loading || text.trim().length < 3}
            className="rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Building your worlds…" : "See both futures →"}
          </button>
        </div>

        <button
          onClick={() => onSubmit("Compare an Austin job at $130k with a San Francisco job at $200k")}
          className="mt-4 text-sm text-muted hover:text-ink underline underline-offset-4"
        >
          Or just show me a sample decision →
        </button>
      </div>

      <div className="mt-10 text-sm text-muted">
        <span className="opacity-70">Try: </span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setText(ex)}
            className="block mt-1.5 text-left hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            &ldquo;{ex}&rdquo;
          </button>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted/70">
        US, Canada &amp; India · real 2025 tax + market rent · a simulator, not
        financial advice
      </p>
    </div>
  );
}

function timeAgoSafe(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
