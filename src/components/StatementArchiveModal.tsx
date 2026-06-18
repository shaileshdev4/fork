"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { SimulatedLife } from "@/lib/simulation";
import type { LaneTheme } from "@/lib/scenario";
import StatementView from "@/components/ledger/StatementView";
import { Logo } from "@/components/Logo";
import { yearLabel } from "@/components/ledger/format";

type Lane = "A" | "B";

/**
 * Full-life ledger — browse every month one-by-one after the sim completes.
 * Feels like paging through bank statements, stays on-brand (paper / ink / lane accents).
 */
export default function StatementArchiveModal({
  open,
  onClose,
  initialMonth,
  horizon,
  lane,
  onLaneChange,
  lifeA,
  lifeB,
  labelA,
  labelB,
  cityA,
  cityB,
  currencyA,
  currencyB,
  themeA,
  themeB,
}: {
  open: boolean;
  onClose: () => void;
  initialMonth: number;
  horizon: number;
  lane: Lane;
  onLaneChange: (l: Lane) => void;
  lifeA: SimulatedLife;
  lifeB: SimulatedLife;
  labelA: string;
  labelB: string;
  cityA: string;
  cityB: string;
  currencyA: string;
  currencyB: string;
  themeA: LaneTheme;
  themeB: LaneTheme;
}) {
  const maxMonth = Math.min(
    horizon,
    lifeA.months.length,
    lifeB.months.length,
  );
  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    if (open) setViewMonth(Math.min(initialMonth, maxMonth));
  }, [open, initialMonth, maxMonth]);

  const active =
    lane === "A"
      ? {
          life: lifeA,
          city: cityA,
          currency: currencyA,
          theme: themeA,
          label: labelA,
        }
      : {
          life: lifeB,
          city: cityB,
          currency: currencyB,
          theme: themeB,
          label: labelB,
        };

  const state = active.life.months[viewMonth - 1];

  const go = useCallback(
    (delta: number) => {
      setViewMonth((m) => Math.max(1, Math.min(maxMonth, m + delta)));
    },
    [maxMonth],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal
      aria-labelledby="ledger-title"
    >
      <div
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-line sm:border-2 sm:border-ink bg-paper shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* register perforation */}
        <div
          className="h-1.5 shrink-0"
          style={{
            background: `repeating-linear-gradient(90deg, ${themeA.accent} 0 6px, ${themeB.accent} 6px 12px)`,
            opacity: 0.35,
          }}
        />

        <header className="px-4 pt-4 pb-3 border-b border-line shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Logo variant="eyebrow" size={16} className="mb-2" />
              <h2
                id="ledger-title"
                className="font-display text-xl text-ink leading-tight"
              >
                Life ledger
              </h2>
              <p className="text-xs text-muted mt-1">
                Every month, line by line — both futures you lived.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-ink text-2xl leading-none px-1"
              aria-label="Close ledger"
            >
              ×
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <LaneTab
              label={labelA}
              accent={themeA.accent}
              active={lane === "A"}
              onClick={() => onLaneChange("A")}
            />
            <LaneTab
              label={labelB}
              accent={themeB.accent}
              active={lane === "B"}
              onClick={() => onLaneChange("B")}
            />
          </div>
        </header>

        {/* month rail */}
        <div className="shrink-0 border-b border-line bg-paper/95 px-2 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1 snap-x snap-mandatory">
            {Array.from({ length: maxMonth }, (_, i) => i + 1).map((m) => {
              const ms = active.life.months[m - 1];
              const notable = ms?.flash || ms?.stressHit || ms?.pendingDecision;
              const selected = m === viewMonth;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMonth(m)}
                  className={`snap-center shrink-0 min-w-[2.25rem] h-8 rounded-md text-xs tnum transition-colors relative ${
                    selected
                      ? "bg-ink text-paper font-medium"
                      : notable
                        ? "bg-paper border border-line text-ink hover:border-ink/40"
                        : "text-muted hover:text-ink hover:bg-ink/5"
                  }`}
                  title={ms?.flash ?? `Month ${m}`}
                  aria-label={`Month ${m}${notable ? ", notable event" : ""}`}
                  aria-current={selected ? "true" : undefined}
                >
                  {m}
                  {notable && !selected && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{
                        background: ms?.stressHit ? "#8c3f2c" : active.theme.accent,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* statement body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${lane}-${viewMonth}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <StatementView
                state={state}
                cityLabel={active.city}
                currency={active.currency}
                theme={active.theme}
                variant="archive"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* pager */}
        <footer className="shrink-0 border-t border-line px-4 py-3 flex items-center justify-between gap-3 bg-paper">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={viewMonth <= 1}
            className="text-sm text-ink disabled:text-muted disabled:cursor-not-allowed hover:opacity-80 px-2 py-1"
          >
            ← Prev
          </button>
          <div className="text-center text-xs text-muted">
            <span className="tnum text-ink font-medium">Month {viewMonth}</span>
            <span className="text-muted"> / {maxMonth}</span>
            <div className="text-[10px] mt-0.5">{yearLabel(viewMonth)}</div>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={viewMonth >= maxMonth}
            className="text-sm text-ink disabled:text-muted disabled:cursor-not-allowed hover:opacity-80 px-2 py-1"
          >
            Next →
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function LaneTab({
  label,
  accent,
  active,
  onClick,
}: {
  label: string;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        active
          ? "border-transparent text-paper"
          : "border-line text-muted hover:text-ink hover:border-ink/30"
      }`}
      style={active ? { background: accent } : undefined}
    >
      {label}
    </button>
  );
}
