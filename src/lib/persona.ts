/**
 * The PERSON behind the decision. This is the spine that lets every other
 * system (story, costs, synthesis) be genuinely personal rather than generic.
 *
 * A financial fork is never won on math alone - it's won on FIT: the right
 * choice for this household, at this life stage, weighing what THIS person
 * actually values. So before we model money, we model the person.
 */

import type { CurrencyCode } from "@/lib/countries/types";

export type LifeStage = "solo" | "couple" | "family";

export type ValuePriority =
  | "security" // a cushion, low risk, sleep at night
  | "lifestyle" // enjoy life now, comfort, experiences
  | "growth" // build wealth, get ahead long-term
  | "freedom" // time, flexibility, optionality
  | "family"; // proximity, stability, providing

export type CurrentSituation = {
  city: string;
  monthlyTakeHome: number; // what they bring home now
  rentMonthly: number; // what they pay now
  leftoverMonthly: number; // what's left now (their felt baseline)
};

export type Persona = {
  stage: LifeStage;
  /** Optional: where they are today, so paths read as "change from now". */
  current?: CurrentSituation;
  /** Number of kids (family stage). Drives childcare/school forks + costs. */
  kids: number;
  /** Whether a partner also earns (couple/family). Affects income + risk forks. */
  partnerEarns: boolean;
  /** Ranked values - index 0 is what matters most. Drives the synthesis. */
  values: ValuePriority[];
};

export const DEFAULT_PERSONA: Persona = {
  stage: "solo",
  kids: 0,
  partnerEarns: false,
  values: ["security", "growth", "lifestyle", "freedom", "family"],
};

export const STAGE_LABEL: Record<LifeStage, string> = {
  solo: "Just me",
  couple: "Me and a partner",
  family: "A family with kids",
};

export const STAGE_BLURB: Record<LifeStage, string> = {
  solo: "Single household, no dependents.",
  couple: "Two adults, shared finances, no kids yet.",
  family: "Partner and children - the forks get real.",
};

export const VALUE_LABEL: Record<ValuePriority, string> = {
  security: "Security & a cushion",
  lifestyle: "Enjoying life now",
  growth: "Getting ahead financially",
  freedom: "Time & flexibility",
  family: "Family & stability",
};

export const VALUE_BLURB: Record<ValuePriority, string> = {
  security: "Sleeping well, low risk, money in the bank.",
  lifestyle: "Comfort, experiences, living well today.",
  growth: "Building wealth, the long game.",
  freedom: "Owning your time, keeping options open.",
  family: "Being there, providing, stability for them.",
};

/** Household size multiplier on non-housing costs (food, transport, etc.). */
export function householdCostMultiplier(p: Persona): number {
  let m = 1;
  if (p.stage === "couple") m = 1.6;
  if (p.stage === "family") m = 1.8 + p.kids * 0.35;
  return m;
}

/** Extra dedicated monthly lines a household carries (childcare, etc.). */
export function householdExtraMonthly(
  p: Persona,
  currency: CurrencyCode,
): { label: string; amount: number }[] {
  const scale = currency === "CAD" ? 1.35 : currency === "INR" ? 85 : 1;
  const out: { label: string; amount: number }[] = [];
  if (p.stage === "family" && p.kids > 0) {
    // Childcare is THE dominant family cost and the thing generic tools miss.
    out.push({ label: "Childcare", amount: Math.round(p.kids * 1100 * scale) });
  }
  return out;
}
