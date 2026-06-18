"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Persona, LifeStage, ValuePriority } from "@/lib/persona";
import {
  STAGE_LABEL,
  STAGE_BLURB,
  VALUE_LABEL,
  VALUE_BLURB,
} from "@/lib/persona";
import { Logo } from "@/components/Logo";

/**
 * After the sentence, two light taps that make the whole story theirs:
 * (1) who's deciding (life stage) and (2) what matters most (values).
 * Kept to taps, not typing - elite-simple, but it's what makes the forks and
 * the verdict genuinely personal.
 */
export default function PersonaSetup({
  onDone,
}: {
  onDone: (persona: Persona) => void;
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [stage, setStage] = useState<LifeStage>("solo");
  const [kids, setKids] = useState(2);
  const [partnerEarns, setPartnerEarns] = useState(true);
  const [ranked, setRanked] = useState<ValuePriority[]>([]);
  const [curCity, setCurCity] = useState("");
  const [curRent, setCurRent] = useState("");

  const allValues: ValuePriority[] = [
    "security",
    "lifestyle",
    "growth",
    "freedom",
    "family",
  ];

  const toggleValue = (v: ValuePriority) => {
    setRanked((r) =>
      r.includes(v) ? r.filter((x) => x !== v) : r.length < 3 ? [...r, v] : r,
    );
  };

  const finish = () => {
    const rest = allValues.filter((v) => !ranked.includes(v));
    const rent = Number(curRent.replace(/[^0-9]/g, "")) || 0;
    const current =
      curCity.trim() && rent
        ? {
            city: curCity.trim(),
            rentMonthly: rent,
            monthlyTakeHome: 0,
            leftoverMonthly: 0,
          }
        : undefined;
    onDone({
      stage,
      kids: stage === "family" ? kids : 0,
      partnerEarns: stage !== "solo" && partnerEarns,
      values: [...ranked, ...rest],
      current,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
      <Logo variant="eyebrow" className="mb-6" />

      {step === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">
            Who&apos;s making this move?
          </h1>
          <p className="text-muted mt-3">
            The forks you&apos;ll face depend on your household. This shapes the
            whole story.
          </p>
          <div className="mt-7 space-y-3">
            {(Object.keys(STAGE_LABEL) as LifeStage[]).map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className="w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors"
                style={{
                  borderColor: stage === s ? "#1a1d29" : "#d9d2c5",
                  background: stage === s ? "#1a1d2908" : "transparent",
                }}
              >
                <div className="font-medium text-ink">{STAGE_LABEL[s]}</div>
                <div className="text-sm text-muted mt-0.5">
                  {STAGE_BLURB[s]}
                </div>
              </button>
            ))}
          </div>

          {stage !== "solo" && (
            <div className="mt-5 space-y-4 rounded-xl bg-paper border border-line p-4">
              {stage === "family" && (
                <label className="flex items-center justify-between">
                  <span className="text-sm text-ink">How many kids?</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setKids(n)}
                        className="w-9 h-9 rounded-lg border text-sm transition-colors"
                        style={{
                          borderColor: kids === n ? "#1a1d29" : "#d9d2c5",
                          background: kids === n ? "#1a1d29" : "transparent",
                          color: kids === n ? "#f7f4ee" : "#1a1d29",
                        }}
                      >
                        {n}
                        {n === 4 ? "+" : ""}
                      </button>
                    ))}
                  </div>
                </label>
              )}
              <label className="flex items-center justify-between">
                <span className="text-sm text-ink">
                  Does your partner earn an income?
                </span>
                <button
                  onClick={() => setPartnerEarns((x) => !x)}
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  style={{ borderColor: "#d9d2c5" }}
                >
                  {partnerEarns ? "Yes" : "No / not yet"}
                </button>
              </label>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            className="mt-7 rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90"
          >
            Next →
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">
            What matters most to you?
          </h1>
          <p className="text-muted mt-3">
            Pick your top 3, most important first. The verdict will weigh the
            paths against <em>these</em> - not just the dollars.
          </p>
          <div className="mt-7 space-y-3">
            {allValues.map((v) => {
              const rank = ranked.indexOf(v);
              const picked = rank >= 0;
              return (
                <button
                  key={v}
                  onClick={() => toggleValue(v)}
                  className="w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors flex items-center gap-3"
                  style={{
                    borderColor: picked ? "#1a1d29" : "#d9d2c5",
                    background: picked ? "#1a1d2908" : "transparent",
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{
                      background: picked ? "#1a1d29" : "#e8e2d6",
                      color: picked ? "#f7f4ee" : "#6b6557",
                    }}
                  >
                    {picked ? rank + 1 : ""}
                  </span>
                  <span>
                    <span className="font-medium text-ink">
                      {VALUE_LABEL[v]}
                    </span>
                    <span className="block text-sm text-muted">
                      {VALUE_BLURB[v]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={() => setStep(0)}
              className="text-sm text-muted hover:text-ink underline underline-offset-4"
            >
              ← Back
            </button>
            <button
              onClick={finish}
              disabled={ranked.length < 1}
              className="rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90 disabled:opacity-40"
            >
              See both futures →
            </button>
            <span className="text-xs text-muted">{ranked.length}/3 picked</span>
          </div>

          <div className="mt-8 pt-5 border-t border-line">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">
              Optional - where are you now?
            </p>
            <p className="text-sm text-muted mb-3">
              If you tell us your current city and rent, we&apos;ll show each
              path as a change from the life you have today.
            </p>
            <div className="flex gap-2">
              <input
                value={curCity}
                onChange={(e) => setCurCity(e.target.value)}
                placeholder="Current city"
                className="flex-1 bg-paper border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
              <input
                value={curRent}
                onChange={(e) => setCurRent(e.target.value)}
                placeholder="Rent / mo"
                inputMode="numeric"
                className="w-28 bg-paper border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
