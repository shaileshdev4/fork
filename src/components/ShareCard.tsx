"use client";

import { motion } from "motion/react";
import type { LifeProfile } from "@/lib/profile";
import type { Persona } from "@/lib/persona";
import { VALUE_LABEL } from "@/lib/persona";
import type { Synthesis } from "@/lib/synthesis";
import type { SimulatedLife } from "@/lib/simulation";
import type { LaneTheme } from "@/lib/scenario";
import { Logo } from "@/components/Logo";

function fmt(n: number, c: string) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  });
}

/**
 * The shareable decision artifact (#10). A clean summary the user screenshots
 * for a partner - "here's why I'm leaning Austin" - and that carries a link
 * back. This is also the cold-start growth engine the hackathon rewards.
 */
export default function ShareCard({
  a,
  b,
  persona,
  synthesis,
  lifeA,
  lifeB,
  themeA,
  themeB,
  narration,
  onClose,
}: {
  a: LifeProfile;
  b: LifeProfile;
  persona: Persona;
  synthesis: Synthesis;
  lifeA: SimulatedLife;
  lifeB: SimulatedLife;
  themeA: LaneTheme;
  themeB: LaneTheme;
  narration: string;
  onClose: () => void;
}) {
  const rec = synthesis.recommendation;
  const recLabel =
    rec === "A" ? a.label : rec === "B" ? b.label : "Too close to call";
  const recAccent =
    rec === "A" ? themeA.accent : rec === "B" ? themeB.accent : "#6b6557";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* The card itself - designed to look good as a screenshot */}
        <div className="rounded-2xl bg-paper border-2 border-ink overflow-hidden shadow-2xl">
          <div
            className="px-6 pt-5 pb-4"
            style={{
              background: `linear-gradient(135deg, ${themeA.accentSoft}, ${themeB.accentSoft})`,
            }}
          >
            <Logo
              variant="eyebrow"
              size={16}
              accentA={themeA.accent}
              accentB={themeB.accent}
              className="text-ink/60"
            />
            <h2 className="font-display text-2xl text-ink mt-2 leading-tight">
              {a.city} vs {b.city}
            </h2>
            <p className="text-sm text-ink/70 mt-0.5">
              A{" "}
              {persona.stage === "family"
                ? "family"
                : persona.stage === "couple"
                  ? "couple's"
                  : "solo"}{" "}
              decision, lived out over 3 years.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="text-[11px] uppercase tracking-wider text-muted">
              The lean
            </div>
            <p className="font-display text-xl text-ink mt-1">
              {rec === "close" ? (
                "Genuinely close"
              ) : (
                <>
                  Leaning <span style={{ color: recAccent }}>{recLabel}</span>
                </>
              )}
            </p>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {narration || synthesis.line}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat
                label={`${a.label} · saved`}
                value={fmt(lifeA.finalBalance, a.currency)}
                accent={themeA.accent}
              />
              <Stat
                label={`${b.label} · saved`}
                value={fmt(lifeB.finalBalance, b.currency)}
                accent={themeB.accent}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-line">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1.5">
                What mattered to them
              </div>
              <div className="flex flex-wrap gap-1.5">
                {persona.values.slice(0, 3).map((v) => (
                  <span
                    key={v}
                    className="text-xs px-2 py-1 rounded-full bg-ink/5 text-ink"
                  >
                    {VALUE_LABEL[v]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-ink text-paper/80 text-xs flex items-center justify-between">
            <span>fork · live the decision before you make it</span>
            <span className="text-paper/50">a simulator, not advice</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={onClose}
            className="text-paper/90 text-sm underline underline-offset-4 hover:text-paper"
          >
            Close
          </button>
          <span className="text-paper/60 text-xs">
            Screenshot this to share your decision
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="tnum text-lg font-bold mt-0.5" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
