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

export type LedgerOrigin =
  | { kind: "baseline" }
  | {
      kind: "decision";
      decisionId: string;
      decisionMonth: number;
      choiceLabel: string;
    }
  | { kind: "stress"; label: string }
  | { kind: "micro"; label: string };

export type LedgerLine = {
  id: string;
  label: string;
  /** Negative = outflow, positive = inflow. */
  amount: number;
  origin?: LedgerOrigin;
};

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
  stressHit?: boolean;
  underStress?: boolean;
  /** Per-month audit trail — same math as balance, line by line. */
  ledger: LedgerLine[];
  priorBalance: number;
  balanceDelta: number;
};

export type SimulatedLife = {
  months: MonthState[];
  finalBalance: number;
  minRunway: number;
  everWentNegative: boolean;
  netMonthly: number;
};

export type Choices = Record<string, string>;

export type SimMode = "play" | "probe";

const APY = 0.04;

type ActiveInstallment = {
  monthly: number;
  remaining: number;
  decisionId: string;
  decisionMonth: number;
  choiceLabel: string;
};

type OngoingDelta = {
  amount: number;
  decisionId: string;
  decisionMonth: number;
  choiceLabel: string;
  kind: "spend" | "income";
};

function originTag(o: LedgerOrigin | undefined): string | undefined {
  if (!o) return undefined;
  switch (o.kind) {
    case "baseline":
      return undefined;
    case "decision":
      return `from month ${o.decisionMonth} · ${o.choiceLabel}`;
    case "stress":
      return o.label;
    case "micro":
      return o.label;
  }
}

export { originTag };

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
  const householdExtras = householdExtraMonthly(persona, p.currency);
  const extras = householdExtras.reduce((s, e) => s + e.amount, 0);
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
  const ongoingSpends: OngoingDelta[] = [];
  const ongoingIncomes: OngoingDelta[] = [];
  let minRunway = Infinity,
    everNegative = false;

  const decByMonth = new Map<number, Decision>();
  for (const d of deck) decByMonth.set(d.month, d);

  for (let m = 1; m <= horizon; m++) {
    const priorBalance = Math.round(balance);
    const ledger: LedgerLine[] = [];
    let lineId = 0;
    const push = (
      label: string,
      amount: number,
      origin?: LedgerOrigin,
    ) => {
      if (amount === 0) return;
      ledger.push({
        id: `${m}-${lineId++}`,
        label,
        amount: Math.round(amount),
        origin,
      });
    };

    let flash: string | undefined, pending: Decision | undefined;
    const decision = decByMonth.get(m);
    if (decision) {
      const chosenId = choices[decision.id];
      let opt = chosenId
        ? decision.options(p, persona).find((o) => o.id === chosenId)
        : undefined;
      if (!opt && stressProbe) {
        opt = decision.options(p, persona)[0];
      }
      if (opt) {
        const e: DecisionEffect = opt.effect;
        const origin: LedgerOrigin = {
          kind: "decision",
          decisionId: decision.id,
          decisionMonth: m,
          choiceLabel: opt.label,
        };
        if (e.oneTime) {
          balance += e.oneTime;
          push(
            e.oneTime < 0 ? "One-time cost (decision)" : "One-time gain (decision)",
            e.oneTime,
            origin,
          );
        }
        if (e.monthlySpendDelta) {
          spendDelta += e.monthlySpendDelta;
          ongoingSpends.push({
            amount: e.monthlySpendDelta,
            decisionId: decision.id,
            decisionMonth: m,
            choiceLabel: opt.label,
            kind: "spend",
          });
        }
        if (e.monthlyIncomeDelta) {
          incomeDelta += e.monthlyIncomeDelta;
          ongoingIncomes.push({
            amount: e.monthlyIncomeDelta,
            decisionId: decision.id,
            decisionMonth: m,
            choiceLabel: opt.label,
            kind: "income",
          });
        }
        if (e.savingsRateDelta)
          savingsRate = Math.max(
            0,
            Math.min(1, savingsRate + e.savingsRateDelta),
          );
        if (e.installment)
          installments.push({
            monthly: e.installment.monthly,
            remaining: e.installment.months,
            decisionId: decision.id,
            decisionMonth: m,
            choiceLabel: opt.label,
          });
        flash = opt.consequence;
      } else {
        pending = decision;
      }
    }

    const burnBase = baseBurn + spendDelta;
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
          push(`Stress: ${pert.label}`, -pert.amount, {
            kind: "stress",
            label: "stress test",
          });
          pertFlash = `${pert.label}.`;
        }
        break;
    }

    const burn = burnBase * pertBurnMult;
    const due = installments.reduce(
      (s, i) => s + (i.remaining > 0 ? i.monthly : 0),
      0,
    );
    const baseIncome = tax.netMonthly + incomeDelta;
    const income = Math.max(0, baseIncome * pertIncomeMult + pertIncomeAbs);

    // --- ledger: income ---
    push("Take-home income", tax.netMonthly, { kind: "baseline" });
    for (const o of ongoingIncomes) {
      push("Income adjustment", o.amount, {
        kind: "decision",
        decisionId: o.decisionId,
        decisionMonth: o.decisionMonth,
        choiceLabel: o.choiceLabel,
      });
    }
    if (pertIncomeMult !== 1 && pert.kind !== "none") {
      const cut = Math.round(baseIncome * (1 - pertIncomeMult));
      if (cut > 0)
        push("Stress: income reduction", -cut, {
          kind: "stress",
          label: pertFlash ?? "stress test",
        });
    }
    if (pertIncomeAbs < 0) {
      push("Stress: no income", pertIncomeAbs, {
        kind: "stress",
        label: pertFlash ?? "stress test",
      });
    }

    // --- ledger: living costs ---
    push("Rent", -p.rentMonthly, { kind: "baseline" });
    push("Groceries", -p.groceriesMonthly, { kind: "baseline" });
    push("Transport", -p.transportMonthly, { kind: "baseline" });
    push("Utilities", -p.utilitiesMonthly, { kind: "baseline" });
    push("Everything else", -p.otherMonthly, { kind: "baseline" });
    for (const extra of householdExtras) {
      push(extra.label, -extra.amount, { kind: "baseline" });
    }
    for (const o of ongoingSpends) {
      push("Living cost adjustment", -o.amount, {
        kind: "decision",
        decisionId: o.decisionId,
        decisionMonth: o.decisionMonth,
        choiceLabel: o.choiceLabel,
      });
    }
    if (pertBurnMult > 1) {
      const surcharge = Math.round(burnBase * (pertBurnMult - 1));
      if (surcharge > 0)
        push("Stress: higher living costs", -surcharge, {
          kind: "stress",
          label: pertFlash ?? "stress test",
        });
    }

    for (const inst of installments) {
      if (inst.remaining > 0) {
        push("Payment plan", -inst.monthly, {
          kind: "decision",
          decisionId: inst.decisionId,
          decisionMonth: inst.decisionMonth,
          choiceLabel: inst.choiceLabel,
        });
      }
    }

    const micEv = microByMonth.get(m);
    if (micEv && !flash && !pertFlash) {
      balance += micEv.amount;
      push(micEv.label, micEv.amount, {
        kind: "micro",
        label: micEv.detail,
      });
      flash = micEv.detail;
    }

    const preGrowthBalance = balance;
    const interest = Math.round(preGrowthBalance * monthlyRate);
    if (interest !== 0) {
      push("Interest on savings", interest, { kind: "baseline" });
    }

    const leftover = income - burn - due;
    const saved = Math.max(0, leftover) * savingsRate;
    const notSaved = Math.max(0, leftover - saved);
    if (notSaved > 0) {
      push("Spent (not saved)", -notSaved, { kind: "baseline" });
    }
    if (saved > 0) {
      push("Saved this month", saved, { kind: "baseline" });
    }

    balance = preGrowthBalance * (1 + monthlyRate) + saved;
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
            return (
              m >= pert.atMonth && m < pert.atMonth + pert.monthsUnemployed
            );
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

    const roundedBalance = Math.round(balance);
    months.push({
      month: m,
      balance: roundedBalance,
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
      ledger,
      priorBalance,
      balanceDelta: roundedBalance - priorBalance,
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
