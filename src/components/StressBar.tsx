"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Perturbation } from "@/lib/stress";
import { STRESS_PRESETS, describePerturbation } from "@/lib/stress";
import { track } from "@/lib/analytics";

/**
 * Stress-test (#7) + natural-language what-if (#6). Real decisions are made on
 * the downside, not the expected path. One tap or one sentence injects a shock
 * and the whole simulation re-runs - you watch which life survives it.
 */
export default function StressBar({
  active,
  onApply,
  onClear,
  askWhatIf,
}: {
  active: Perturbation;
  onApply: (p: Perturbation) => void;
  onClear: () => void;
  askWhatIf: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const isActive = active.kind !== "none";

  const submit = async () => {
    const query = text.trim();
    if (query.length < 3) return;
    track("what_if_query_submitted", { query, source: "natural_language" });
    setThinking(true);
    await askWhatIf(query);
    setThinking(false);
  };

  return (
    <div className="mt-4 rounded-xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted">
          Stress-test it - what if life goes wrong?
        </span>
        {isActive && (
          <button
            onClick={onClear}
            className="text-xs text-muted hover:text-ink underline underline-offset-4"
          >
            clear
          </button>
        )}
      </div>

      {isActive ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg px-3 py-2.5 text-sm flex items-center gap-2"
          style={{ background: "#b0593f18", color: "#8c3f2c" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="shrink-0"
          >
            <path
              d="M8 1L1 14h14L8 1zm0 4v4m0 2v1"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <span>
            Testing: {describePerturbation(active)}. Watch how each life holds
            up.
          </span>
        </motion.div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {STRESS_PRESETS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  track("stress_test_applied", {
                    kind: s.id,
                    label: s.label,
                    source: "preset",
                  });
                  onApply(s.make());
                }}
                className="rounded-full border border-line hover:border-ink px-3 py-1.5 text-sm transition-colors"
                title={s.blurb}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="or ask: what if I lose my job in year 2?"
              className="flex-1 bg-paper border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-ink placeholder:text-muted/60"
            />
            <button
              onClick={submit}
              disabled={thinking || text.trim().length < 3}
              className="rounded-lg bg-ink text-paper px-4 py-2 text-sm hover:opacity-90 disabled:opacity-40 shrink-0"
            >
              {thinking ? "…" : "Test"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
