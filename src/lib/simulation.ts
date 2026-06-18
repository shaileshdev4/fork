/**
 * Simulation engine - steps a personalized life forward, shaped by the player's
 * persona (life stage + household) AND their decisions. Outcome is driven by who
 * they are and how they respond, not salary alone.
 */
import type { LifeProfile } from "./profile";
import { essentialsMonthly } from "./profile";
import type { Persona } from "./persona";
import { householdExtraMonthly } from "./persona";
import { getCountry } from "./countries";
import { deckFor, type Decision, type DecisionEffect } from "./decisions";
import type { Perturbation } from "./stress";
import { varietyEvents, type MicroEvent } from "./variety";

export type Mood = "relaxed" | "stressed" | "celebrating";

export type MonthState = {
  month: number;
  balance: number;
  savedThisMonth: number;
  income: number;
  essentials: number;
  leftover: number;
  runwayMonths: number;
  mood: Mood;
  pendingDecision?: Decision;
  flash?: string;
  /** True the month the stress shock first lands (banner + sound). */
  stressHit?: boolean;
  /** True while stress is still affecting this month's math. */
  underStress?: boolean;
};

export type SimulatedLife = {
  months: MonthState[];
  finalBalance: number;
  minRunway: number;
  everWentNegative: boolean;
  netMonthly: number;
};

export type Choices = Record<string, string>;

/** play = stop at forks for the user; probe = fill defaults for stress synthesis */
export type SimMode = "play" | "probe";

const APY = 0.04;
type ActiveInstallment = { monthly: number; remaining: number };

export function simulate(
  p: LifeProfile,
  persona: Persona,
  choices: Choices,
  horizon: number,
  perturbation?: Perturbation,
  mode: SimMode = "play",
): SimulatedLife {
  const country = getCountry(p.country);
  const tax = country.compute(p.salary, p.region);
  // Household-aware baseline: a family's essentials are higher (more food, etc.)
  // and carry dedicated lines like childcare that generic tools miss.
  const extras = householdExtraMonthly(persona, p.currency).reduce(
    (s, e) => s + e.amount,
    0,
  );
  const baseBurn = essentialsMonthly(p) + extras;
  const monthlyRate = APY / 12;
  const deck = deckFor(persona.stage);
  const pert = perturbation ?? { kind: "none" as const };
  const stressProbe = mode === "probe";
  const forkMonths = deck.map((d) => d.month);
  const micro = varietyEvents(p, persona, forkMonths, horizon);
  const microByMonth = new Map<number, MicroEvent>();
  for (const e of micro) microByMonth.set(e.month, e);

  const months: MonthState[] = [];
  let balance = 0,
    spendDelta = 0,
    incomeDelta = 0,
    savingsRate = p.savingsRate;
  const installments: ActiveInstallment[] = [];
  let minRunway = Infinity,
    everNegative = false;

  const decByMonth = new Map<number, Decision>();
  for (const d of deck) decByMonth.set(d.month, d);

  for (let m = 1; m <= horizon; m++) {
    let flash: string | undefined, pending: Decision | undefined;
    const decision = decByMonth.get(m);
    if (decision) {
      const chosenId = choices[decision.id];
      let opt = chosenId
        ? decision.options(p, persona).find((o) => o.id === chosenId)
        : undefined;
      // Stress-test runs the full horizon: unresolved forks use the first option
      // as a neutral projection so shocks at month 12+ still apply.
      if (!opt && stressProbe) {
        opt = decision.options(p, persona)[0];
      }
      if (opt) {
        const e: DecisionEffect = opt.effect;
        if (e.oneTime) balance += e.oneTime;
        if (e.monthlySpendDelta) spendDelta += e.monthlySpendDelta;
        if (e.monthlyIncomeDelta) incomeDelta += e.monthlyIncomeDelta;
        if (e.savingsRateDelta)
          savingsRate = Math.max(
            0,
            Math.min(1, savingsRate + e.savingsRateDelta),
          );
        if (e.installment)
          installments.push({
            monthly: e.installment.monthly,
            remaining: e.installment.months,
          });
        flash = opt.consequence;
      } else {
        pending = decision;
      }
    }

    const burnBase = baseBurn + spendDelta;
    // --- apply stress perturbation for this month ---
    let pertIncomeMult = 1;
    let pertIncomeAbs = 0;
    let pertBurnMult = 1;
    let pertFlash: string | undefined;
    switch (pert.kind) {
      case "layoff":
        if (m >= pert.atMonth && m < pert.atMonth + pert.monthsUnemployed) {
          pertIncomeAbs = -tax.netMonthly;
          if (m === pert.atMonth)
            pertFlash = "Laid off - no income until you find work.";
        }
        break;
      case "rent_spike":
        if (m >= pert.atMonth) {
          pertBurnMult = 1 + pert.pct * (p.rentMonthly / Math.max(1, burnBase));
          if (m === pert.atMonth)
            pertFlash = `Rent jumped ${Math.round(pert.pct * 100)}%.`;
        }
        break;
      case "recession":
        if (m >= pert.atMonth && m < pert.atMonth + pert.months) {
          pertIncomeMult = 1 - pert.incomeCutPct;
          if (m === pert.atMonth)
            pertFlash = `Recession - income down ${Math.round(pert.incomeCutPct * 100)}%.`;
        }
        break;
      case "income_drop":
        if (m >= pert.atMonth && (pert.permanent || m < pert.atMonth + 12)) {
          pertIncomeMult = 1 - pert.pct;
          if (m === pert.atMonth)
            pertFlash = `Income down ${Math.round(pert.pct * 100)}%.`;
        }
        break;
      case "big_expense":
        if (m === pert.atMonth) {
          balance -= pert.amount;
          pertFlash = `${pert.label}.`;
        }
        break;
    }

    const burn = burnBase * pertBurnMult;
    const due = installments.reduce(
      (s, i) => s + (i.remaining > 0 ? i.monthly : 0),
      0,
    );
    const income = Math.max(
      0,
      (tax.netMonthly + incomeDelta) * pertIncomeMult + pertIncomeAbs,
    );
    const micEv = microByMonth.get(m);
    if (micEv && !flash && !pertFlash) {
      balance += micEv.amount;
      flash = micEv.detail;
    }
    const leftover = income - burn - due;
    const saved = Math.max(0, leftover) * savingsRate;
    balance = balance * (1 + monthlyRate) + saved;
    if (balance < 0) everNegative = true;
    for (const i of installments) if (i.remaining > 0) i.remaining -= 1;

    const totalBurn = burn + due;
    const runway = totalBurn > 0 ? balance / totalBurn : 0;
    if (m > 6) minRunway = Math.min(minRunway, runway);

    let mood: Mood = "relaxed";
    if (flash && incomeDelta > 0 && decision?.chapter === "opportunity")
      mood = "celebrating";
    else if (
      pertFlash ||
      (m > 6 && runway < 2.5) ||
      (flash && balance >= 0 && m > 6 && runway < 3)
    )
      mood = "stressed";

    const underStress =
      pert.kind !== "none" &&
      (() => {
        switch (pert.kind) {
          case "layoff":
            return m >= pert.atMonth && m < pert.atMonth + pert.monthsUnemployed;
          case "rent_spike":
            return m >= pert.atMonth;
          case "recession":
            return m >= pert.atMonth && m < pert.atMonth + pert.months;
          case "income_drop":
            return (
              m >= pert.atMonth && (pert.permanent || m < pert.atMonth + 12)
            );
          case "big_expense":
            return m === pert.atMonth;
          default:
            return false;
        }
      })();

    months.push({
      month: m,
      balance: Math.round(balance),
      savedThisMonth: Math.round(saved),
      income: Math.round(income),
      essentials: Math.round(totalBurn),
      leftover: Math.round(leftover),
      runwayMonths: Math.max(0, runway),
      mood,
      pendingDecision: pending,
      flash: pertFlash ?? flash,
      stressHit: !!pertFlash,
      underStress,
    });
    if (pending && !stressProbe) break;
  }

  return {
    months,
    finalBalance: months.length ? months[months.length - 1].balance : 0,
    minRunway: minRunway === Infinity ? 0 : minRunway,
    everWentNegative: everNegative,
    netMonthly: tax.netMonthly,
  };
}

export const moodAsset: Record<Mood, string> = {
  relaxed: "char-relaxed",
  stressed: "char-stressed",
  celebrating: "char-celebrating",
};
