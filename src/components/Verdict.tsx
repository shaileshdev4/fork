"use client";

import type { MonthState, SimulatedLife } from "@/lib/simulation";
import type { LaneTheme } from "@/lib/scenario";

function fmt(n: number, c: string) {
  return n.toLocaleString("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 });
}

export default function Verdict({
  aLabel, bLabel, currency, stateA, stateB, lifeA, lifeB, month, themeA, themeB, narration,
}: {
  aLabel: string; bLabel: string; currency: string;
  stateA: MonthState; stateB: MonthState; lifeA: SimulatedLife; lifeB: SimulatedLife;
  month: number; themeA: LaneTheme; themeB: LaneTheme; narration?: string;
}) {
  if (!stateA || !stateB) return null;
  const diff = stateA.balance - stateB.balance;
  const winnerAhead = diff >= 0;
  const winLabel = winnerAhead ? aLabel : bLabel;
  const absDiff = Math.abs(diff);
  const atEnd = month >= lifeA.months.length;

  return (
    <div className="rounded-xl border border-ink bg-ink text-paper p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-paper/60 mb-2">
        {atEnd ? "After the full run" : `At month ${month}`}
      </div>
      <p className="font-display text-xl md:text-2xl leading-tight">
        <span style={{ color: winnerAhead ? "#e0a96a" : "#6aa9a3" }}>{winLabel}</span> is ahead by{" "}
        <span className="tnum">{fmt(absDiff, currency)}</span>.
      </p>
      {narration && <p className="text-paper/85 mt-3 text-sm leading-relaxed">{narration}</p>}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-paper/20">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-paper/50">Lowest runway hit</div>
          <div className="tnum text-sm mt-1">{aLabel}: {lifeA.minRunway.toFixed(1)}mo · {bLabel}: {lifeB.minRunway.toFixed(1)}mo</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-paper/50">Leftover / mo now</div>
          <div className="tnum text-sm mt-1">{fmt(stateA.leftover, currency)} · {fmt(stateB.leftover, currency)}</div>
        </div>
      </div>
    </div>
  );
}
