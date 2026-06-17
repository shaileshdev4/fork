/**
 * Stress-test / "what-if" engine (needs #6 + #7).
 *
 * Real decisions aren't made on the expected path - they're made on "what if it
 * goes wrong?" A Perturbation is a shock injected into a life: a layoff, a rent
 * spike, a recession. Both the one-tap stress buttons (#7) and the natural-
 * language "what if I lose my job in year 2" (#6) compile down to one of these.
 */

export type Perturbation =
  | { kind: "layoff"; atMonth: number; monthsUnemployed: number }
  | { kind: "rent_spike"; atMonth: number; pct: number }
  | { kind: "recession"; atMonth: number; incomeCutPct: number; months: number }
  | { kind: "income_drop"; atMonth: number; pct: number; permanent: boolean }
  | { kind: "big_expense"; atMonth: number; amount: number; label: string }
  | { kind: "none" };

export const STRESS_PRESETS: {
  id: string;
  label: string;
  blurb: string;
  make: () => Perturbation;
}[] = [
  {
    id: "layoff",
    label: "Job loss",
    blurb: "Laid off mid-way, 4 months to rehire",
    make: () => ({ kind: "layoff", atMonth: 14, monthsUnemployed: 4 }),
  },
  {
    id: "rent",
    label: "Rent spikes",
    blurb: "Rent jumps 20% at renewal",
    make: () => ({ kind: "rent_spike", atMonth: 13, pct: 0.2 }),
  },
  {
    id: "recession",
    label: "Recession hits",
    blurb: "Income down 15% for a year",
    make: () => ({
      kind: "recession",
      atMonth: 12,
      incomeCutPct: 0.15,
      months: 12,
    }),
  },
];

export function describePerturbation(p: Perturbation): string {
  switch (p.kind) {
    case "layoff":
      return `Laid off at month ${p.atMonth}, ${p.monthsUnemployed} months to find work`;
    case "rent_spike":
      return `Rent jumps ${Math.round(p.pct * 100)}% at month ${p.atMonth}`;
    case "recession":
      return `Income drops ${Math.round(p.incomeCutPct * 100)}% for ${p.months} months from month ${p.atMonth}`;
    case "income_drop":
      return `Income ${p.permanent ? "permanently " : ""}down ${Math.round(p.pct * 100)}% at month ${p.atMonth}`;
    case "big_expense":
      return `${p.label}: a hit at month ${p.atMonth}`;
    case "none":
      return "";
  }
}
