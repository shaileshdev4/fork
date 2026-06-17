"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import type { LaneTheme } from "@/lib/scenario";
import type { MonthState } from "@/lib/simulation";
import { moodAsset } from "@/lib/simulation";

function fmt(n: number, currency: string) {
  return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
}

function useAnimatedNumber(value: number, currency: string, duration = 500) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    prev.current = value;
    if (from === to || !ref.current) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(from + (to - from) * eased);
      if (ref.current) ref.current.textContent = fmt(cur, currency);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, currency, duration]);
  return ref;
}

export default function Lane({
  theme, label, cityLabel, currency, state, comfortable, isWinner,
}: {
  theme: LaneTheme; label: string; cityLabel: string; currency: string;
  state: MonthState; comfortable: boolean; isWinner: boolean;
}) {
  const balRef = useAnimatedNumber(state.balance, currency);
  const apt = comfortable ? theme.aptComfortableAsset : theme.aptModestAsset;
  const runwayPct = Math.min(100, (state.runwayMonths / 12) * 100);
  const alarm = state.month > 6 && state.runwayMonths < 3;
  const caution = state.month > 6 && state.runwayMonths < 6;
  const runwayColor = alarm ? "#c0492f" : caution ? "#c77b30" : theme.accent;

  return (
    <div className="relative rounded-2xl overflow-hidden border"
      style={{ borderColor: `${theme.accent}40`, background: `linear-gradient(160deg, ${theme.accentSoft}55, transparent 70%)` }}>
      <motion.img src={`/assets/${theme.cityAsset}.png`} alt="" aria-hidden
        className="absolute right-1 top-1 w-24 sm:w-44 md:w-52 opacity-40 sm:opacity-90 pointer-events-none select-none"
        animate={{ y: [0, -4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative flex items-end gap-4 p-4 md:p-5 min-h-[220px]">
        <div className="relative shrink-0 w-48 md:w-60">
          <img src={`/assets/${apt}.png`} alt={`${cityLabel} home`} className="w-full select-none" draggable={false} />
          <AnimatePresence mode="wait">
            <motion.img key={state.mood} src={`/assets/${moodAsset[state.mood]}.png`} alt={`You, feeling ${state.mood}`}
              className="absolute left-[46%] bottom-3 h-28 md:h-36 -translate-x-1/2 select-none"
              style={{ filter: "drop-shadow(0 6px 6px rgba(26,29,41,0.25))" }} draggable={false}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }} />
          </AnimatePresence>
        </div>
        <div className="relative flex-1 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: theme.accent }} />
            <h3 className="font-display text-lg md:text-xl text-ink">{label}</h3>
            {isWinner && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-paper" style={{ background: theme.accent }}>ahead</span>
            )}
          </div>
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wider text-muted">Saved so far</div>
            <span ref={balRef} className="tnum text-2xl md:text-3xl font-bold" style={{ color: theme.accent }}>
              {fmt(state.balance, currency)}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted mb-1">
              <span className="uppercase tracking-wider">Runway</span>
              <span className="tnum">{state.month <= 6 ? "building…" : `${state.runwayMonths.toFixed(1)} mo`}</span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: runwayColor }}
                animate={{ width: `${runwayPct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted tnum">+{fmt(state.savedThisMonth, currency)}/mo saved</div>
        </div>
      </div>
    </div>
  );
}
