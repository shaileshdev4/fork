"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Decision, DecisionOption } from "@/lib/decisions";
import { TAG_LABEL, TAG_COLOR } from "@/lib/decisions";
import type { LifeProfile } from "@/lib/profile";
import type { Persona } from "@/lib/persona";
import type { LaneTheme } from "@/lib/scenario";

/**
 * A fork in the road. Not a quiz - a moment. Framed in the player's actual
 * situation, with options that trade money against time, comfort, security.
 */
export default function DecisionModal({
  decision,
  profile,
  persona,
  theme,
  laneLabel,
  onChoose,
}: {
  decision: Decision;
  profile: LifeProfile;
  persona: Persona;
  theme: LaneTheme;
  laneLabel: string;
  onChoose: (optionId: string) => void;
}) {
  const options = decision.options(profile, persona);
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="relative w-full max-w-lg rounded-2xl bg-paper border-2 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ borderColor: theme.accent }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: theme.accent }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ color: theme.accent }}
            >
              {laneLabel} · month {decision.month}
            </span>
          </div>
          <h2 className="font-display text-2xl text-ink leading-tight">
            {decision.title}
          </h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            {decision.setup(profile, persona)}
          </p>

          <div className="mt-5 space-y-2.5">
            {options.map((opt) => (
              <OptionButton
                key={opt.id}
                opt={opt}
                accent={theme.accent}
                onClick={() => onChoose(opt.id)}
              />
            ))}
          </div>

          <p className="text-[11px] text-muted/70 mt-4 text-center">
            There&apos;s no wrong answer - only what fits the life you want.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OptionButton({
  opt,
  accent,
  onClick,
}: {
  opt: DecisionOption;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-line bg-paper hover:bg-pathAsoft/20 px-4 py-3 transition-colors group"
      style={{ borderColor: "#d9d2c5" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d9d2c5")}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-ink">{opt.label}</span>
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5"
          style={{
            background: `${TAG_COLOR[opt.tag]}22`,
            color: TAG_COLOR[opt.tag],
          }}
        >
          {TAG_LABEL[opt.tag]}
        </span>
      </div>
      <p className="text-sm text-muted mt-1 leading-snug">{opt.blurb}</p>
    </button>
  );
}
