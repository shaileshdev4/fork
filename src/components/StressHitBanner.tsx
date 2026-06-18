"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Perturbation } from "@/lib/stress";
import {
  describePerturbation,
  isStressOnsetMonth,
  isUnderOngoingStress,
  stressOnsetMessage,
} from "@/lib/stress";

/**
 * Prominent alert when the stress shock lands (onset) or while it is still active.
 */
export default function StressHitBanner({
  stress,
  month,
}: {
  stress: Perturbation;
  month: number;
}) {
  if (stress.kind === "none") return null;

  const onset = isStressOnsetMonth(stress, month);
  const ongoing = isUnderOngoingStress(stress, month) && !onset;
  const message = stressOnsetMessage(stress);

  return (
    <AnimatePresence mode="wait">
      {onset && message ? (
        <motion.div
          key="onset"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mb-3 rounded-xl border-2 px-4 py-3 flex items-start gap-3"
          style={{
            borderColor: "#8c3f2c",
            background: "linear-gradient(135deg, #b0593f22, #b0593f08)",
          }}
          role="alert"
        >
          <span
            className="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-paper text-sm font-bold"
            style={{ background: "#8c3f2c" }}
            aria-hidden
          >
            !
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-[#8c3f2c]">
              Stress shock - month {month}
            </div>
            <p className="text-sm text-ink font-medium mt-0.5">{message}</p>
            <p className="text-xs text-muted mt-1">{describePerturbation(stress)}</p>
          </div>
        </motion.div>
      ) : ongoing ? (
        <motion.div
          key="ongoing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mb-3 rounded-lg px-3 py-2 text-xs flex items-center gap-2"
          style={{ background: "#b0593f12", color: "#8c3f2c" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
            style={{ background: "#8c3f2c" }}
          />
          Still under this stress test ({describePerturbation(stress)})
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
