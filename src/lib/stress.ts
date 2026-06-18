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

const HORIZON = 36;

function clampMonth(n: unknown, fallback = 14): number {
  const m = Number(n);
  if (!Number.isFinite(m)) return fallback;
  return Math.max(1, Math.min(HORIZON, Math.round(m)));
}

/** Validate API / LLM output before applying to the sim. */
export function normalizePerturbation(raw: unknown): Perturbation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  switch (o.kind) {
    case "layoff":
      return {
        kind: "layoff",
        atMonth: clampMonth(o.atMonth),
        monthsUnemployed: Math.max(1, Math.round(Number(o.monthsUnemployed) || 4)),
      };
    case "rent_spike": {
      const pct = Number(o.pct);
      return {
        kind: "rent_spike",
        atMonth: clampMonth(o.atMonth),
        pct: Number.isFinite(pct) ? Math.min(1, Math.max(0.01, pct)) : 0.2,
      };
    }
    case "recession": {
      const cut = Number(o.incomeCutPct);
      return {
        kind: "recession",
        atMonth: clampMonth(o.atMonth),
        incomeCutPct: Number.isFinite(cut) ? Math.min(0.9, Math.max(0.01, cut)) : 0.15,
        months: Math.max(1, Math.round(Number(o.months) || 12)),
      };
    }
    case "income_drop": {
      const pct = Number(o.pct);
      return {
        kind: "income_drop",
        atMonth: clampMonth(o.atMonth),
        pct: Number.isFinite(pct) ? Math.min(0.9, Math.max(0.01, pct)) : 0.2,
        permanent: Boolean(o.permanent),
      };
    }
    case "big_expense": {
      const amount = Number(o.amount);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return {
        kind: "big_expense",
        atMonth: clampMonth(o.atMonth),
        amount,
        label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : "Unexpected expense",
      };
    }
    case "none":
      return null;
    default:
      return null;
  }
}

export function isStressActive(p: Perturbation): boolean {
  return p.kind !== "none";
}

export function stressAtMonth(p: Perturbation): number | null {
  if (p.kind === "none") return null;
  return p.atMonth;
}

/** One-line flash shown when the shock first lands (matches simulation). */
export function stressOnsetMessage(p: Perturbation): string | null {
  switch (p.kind) {
    case "layoff":
      return "Laid off - no income until you find work.";
    case "rent_spike":
      return `Rent jumped ${Math.round(p.pct * 100)}%.`;
    case "recession":
      return `Recession - income down ${Math.round(p.incomeCutPct * 100)}%.`;
    case "income_drop":
      return `Income down ${Math.round(p.pct * 100)}%.`;
    case "big_expense":
      return p.label;
    case "none":
      return null;
  }
}

export function isStressOnsetMonth(p: Perturbation, month: number): boolean {
  return p.kind !== "none" && p.atMonth === month;
}

/** True when the perturbation is still affecting income or costs this month. */
export function isUnderOngoingStress(p: Perturbation, month: number): boolean {
  switch (p.kind) {
    case "layoff":
      return month >= p.atMonth && month < p.atMonth + p.monthsUnemployed;
    case "rent_spike":
      return month >= p.atMonth;
    case "recession":
      return month >= p.atMonth && month < p.atMonth + p.months;
    case "income_drop":
      return month >= p.atMonth && (p.permanent || month < p.atMonth + 12);
    case "big_expense":
      return month === p.atMonth;
    case "none":
      return false;
  }
}
