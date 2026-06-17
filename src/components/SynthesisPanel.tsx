"use client";

import type { Synthesis } from "@/lib/synthesis";
import type { ValuePriority } from "@/lib/persona";
import { VALUE_LABEL } from "@/lib/persona";
import type { LaneTheme } from "@/lib/scenario";

/**
 * The decision answer (need #3 + #4). Not "X wins by $Y" - a read of each path
 * against what the player said they value, ordered by their ranking, honest
 * about closeness. This is what turns a visualizer into a decision tool.
 */
export default function SynthesisPanel({
  synthesis,
  aLabel,
  bLabel,
  themeA,
  themeB,
  orderedValues,
  narration,
}: {
  synthesis: Synthesis;
  aLabel: string;
  bLabel: string;
  themeA: LaneTheme;
  themeB: LaneTheme;
  orderedValues: ValuePriority[];
  narration?: string;
}) {
  const { valueLean, recommendation } = synthesis;
  const recLabel =
    recommendation === "A"
      ? aLabel
      : recommendation === "B"
        ? bLabel
        : "Too close to call";
  const recAccent =
    recommendation === "A"
      ? themeA.accent
      : recommendation === "B"
        ? themeB.accent
        : "#6b6557";

  return (
    <div className="rounded-xl border border-ink bg-ink text-paper p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-paper/60 mb-2">
        For what you value
      </div>
      <p className="font-display text-xl md:text-2xl leading-tight">
        {recommendation === "close" ? (
          <>
            This one&apos;s{" "}
            <span style={{ color: "#e0b96a" }}>genuinely close</span>.
          </>
        ) : (
          <>
            Leaning{" "}
            <span
              style={{
                color: recAccent === themeA.accent ? "#e0a96a" : "#6aa9a3",
              }}
            >
              {recLabel}
            </span>
            .
          </>
        )}
      </p>
      <p className="text-paper/85 mt-2 text-sm leading-relaxed">
        {narration || synthesis.line}
      </p>

      {/* Per-value lean - top 3 values the player chose, in their order */}
      <div className="mt-4 pt-4 border-t border-paper/20 space-y-2.5">
        {orderedValues.slice(0, 3).map((v) => {
          const lean = valueLean[v]; // + favors A
          const mag = Math.min(100, Math.abs(lean));
          const favorsA = lean >= 0;
          return (
            <div key={v} className="flex items-center gap-3">
              <span className="text-xs text-paper/70 w-32 shrink-0">
                {VALUE_LABEL[v]}
              </span>
              <div className="flex-1 flex items-center">
                <div className="flex-1 flex justify-end">
                  {!favorsA && (
                    <div
                      className="h-2 rounded-l-full"
                      style={{ width: `${mag}%`, background: themeB.accent }}
                    />
                  )}
                </div>
                <div className="w-px h-4 bg-paper/30" />
                <div className="flex-1">
                  {favorsA && (
                    <div
                      className="h-2 rounded-r-full"
                      style={{ width: `${mag}%`, background: themeA.accent }}
                    />
                  )}
                </div>
              </div>
              <span className="text-[10px] text-paper/50 w-16 shrink-0 text-right">
                {mag < 12
                  ? "even"
                  : favorsA
                    ? aLabel.slice(0, 8)
                    : bLabel.slice(0, 8)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-paper/40 mt-2">
        <span>← {bLabel}</span>
        <span>{aLabel} →</span>
      </div>
    </div>
  );
}
