"use client";

import { motion, AnimatePresence } from "motion/react";
import type { MonthState } from "@/lib/simulation";
import type { LaneTheme } from "@/lib/scenario";
import StatementView from "@/components/ledger/StatementView";

type Lane = "A" | "B";

/** Dual-lane month statement — collapsed by default, tabs when open. */
export default function MonthLedgerPanel({
  open,
  onToggle,
  month,
  lane,
  onLaneChange,
  stateA,
  stateB,
  labelA,
  labelB,
  cityA,
  cityB,
  currencyA,
  currencyB,
  themeA,
  themeB,
  onBrowseAll,
  showBrowseAll,
}: {
  open: boolean;
  onToggle: () => void;
  month: number;
  lane: Lane;
  onLaneChange: (l: Lane) => void;
  stateA: MonthState | undefined;
  stateB: MonthState | undefined;
  labelA: string;
  labelB: string;
  cityA: string;
  cityB: string;
  currencyA: string;
  currencyB: string;
  themeA: LaneTheme;
  themeB: LaneTheme;
  onBrowseAll?: () => void;
  showBrowseAll?: boolean;
}) {
  const active =
    lane === "A"
      ? { state: stateA, city: cityA, currency: currencyA, theme: themeA }
      : { state: stateB, city: cityB, currency: currencyB, theme: themeB };

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center justify-between gap-2 text-left text-xs text-muted hover:text-ink transition-colors"
          aria-expanded={open}
        >
          <span>
            {open ? "Hide" : "See"} month breakdown
            {!open && (
              <span className="text-muted/70"> · month {month}</span>
            )}
          </span>
          <span
            className="shrink-0 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
            aria-hidden
          >
            ▾
          </span>
        </button>
        {showBrowseAll && onBrowseAll && (
          <button
            type="button"
            onClick={onBrowseAll}
            className="text-xs text-ink underline underline-offset-4 shrink-0 hover:opacity-80"
          >
            All months
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-3 mb-2">
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

            <StatementView
              state={active.state}
              cityLabel={active.city}
              currency={active.currency}
              theme={active.theme}
              variant="inline"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
