"use client";

import type { MonthState } from "@/lib/simulation";
import { originTag } from "@/lib/simulation";
import type { LaneTheme } from "@/lib/scenario";
import { fmtBalance, fmtDelta, fmtSigned, yearLabel } from "@/components/ledger/format";

/** Single-month bank register — reusable inline or in archive modal. */
export default function StatementView({
  state,
  cityLabel,
  currency,
  theme,
  variant = "inline",
}: {
  state: MonthState | undefined;
  cityLabel: string;
  currency: string;
  theme: LaneTheme;
  variant?: "inline" | "archive";
}) {
  if (!state) {
    return (
      <p className="text-xs text-muted py-2">
        No statement for this month yet.
      </p>
    );
  }

  const pad = variant === "archive" ? "p-4" : "p-3";
  const hasEvent = !!state.flash || state.stressHit;

  return (
    <div
      className={`rounded-lg border border-line bg-paper/90 ${pad}`}
      style={{ borderTopColor: theme.accent, borderTopWidth: 2 }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
            Statement · {yearLabel(state.month)}
          </div>
          <div className="font-display text-lg text-ink mt-0.5">
            Month {state.month}
          </div>
          <div className="text-xs text-muted mt-0.5">{cityLabel}</div>
        </div>
        {hasEvent && (
          <span
            className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0 max-w-[48%] text-right leading-snug"
            style={{
              background: `${theme.accent}18`,
              color: theme.accent,
            }}
          >
            {state.stressHit ? "Stress" : "Event"}
          </span>
        )}
      </div>

      {state.flash && (
        <p
          className="text-xs text-ink/75 mb-3 px-3 py-2 rounded-lg border border-line/80 italic"
          style={{ background: `${theme.accent}08` }}
        >
          {state.flash}
        </p>
      )}

      <div
        className={`grid gap-0 text-[10px] uppercase tracking-wider text-muted border-b border-line pb-1.5 mb-1 ${
          variant === "archive"
            ? "grid-cols-[1fr_auto]"
            : "grid-cols-[1fr_auto]"
        }`}
      >
        <span>Description</span>
        <span className="text-right">Amount</span>
      </div>

      <ul className="divide-y divide-line/60">
        {state.ledger.map((line) => {
          const tag = originTag(line.origin);
          const isDecision = line.origin?.kind === "decision";
          const isStress = line.origin?.kind === "stress";
          return (
            <li
              key={line.id}
              className="grid grid-cols-[1fr_auto] gap-3 py-2.5 text-sm items-start"
              style={
                isDecision
                  ? { borderLeft: `2px solid ${theme.accent}55`, paddingLeft: 10 }
                  : isStress
                    ? { borderLeft: "2px solid #8c3f2c44", paddingLeft: 10 }
                    : undefined
              }
            >
              <div className="min-w-0">
                <span className="text-ink/90">{line.label}</span>
                {tag && (
                  <span
                    className={`block text-[10px] mt-0.5 leading-snug ${
                      isDecision ? "" : "text-muted"
                    }`}
                    style={
                      isDecision ? { color: `${theme.accent}bb` } : undefined
                    }
                  >
                    {tag}
                  </span>
                )}
              </div>
              <span
                className={`tnum shrink-0 tabular-nums text-right ${
                  line.amount >= 0 ? "text-ink" : "text-ink/70"
                }`}
              >
                {fmtSigned(line.amount, currency)}
              </span>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-4 pt-3 border-t border-line flex items-baseline justify-between gap-2"
        style={{ borderTopStyle: "dashed" }}
      >
        <span className="font-display text-ink">Ending balance</span>
        <div className="text-right">
          <div
            className="tnum text-xl font-semibold"
            style={{ color: theme.accent }}
          >
            {fmtBalance(state.balance, currency)}
          </div>
          <div className="text-[11px] text-muted tnum">
            {fmtDelta(state.balanceDelta, currency)} vs prior month
          </div>
        </div>
      </div>
    </div>
  );
}
