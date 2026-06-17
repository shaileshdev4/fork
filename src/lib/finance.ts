/**
 * Financial Fork Simulator - calculation engine
 * Single filer, 2025 tax year. All figures sourced & validated (see DATA_SOURCES).
 *
 * Design rule that earns trust where NerdWallet loses it:
 * housing is its OWN line and state tax is computed properly per state -
 * never folded into one opaque cost-of-living multiplier.
 */

export type Bracket = { upTo: number; rate: number };

// ---- 2025 Federal brackets, single filer (IRS / Tax Foundation) ----
export const FED_BRACKETS: Bracket[] = [
  { upTo: 11925, rate: 0.1 },
  { upTo: 48475, rate: 0.12 },
  { upTo: 103350, rate: 0.22 },
  { upTo: 197300, rate: 0.24 },
  { upTo: 250525, rate: 0.32 },
  { upTo: 626350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];
export const FED_STD_DEDUCTION = 15750;

// ---- 2025 California brackets, single filer (CA FTB) ----
export const CA_BRACKETS: Bracket[] = [
  { upTo: 11079, rate: 0.01 },
  { upTo: 26264, rate: 0.02 },
  { upTo: 41452, rate: 0.04 },
  { upTo: 57542, rate: 0.06 },
  { upTo: 72724, rate: 0.08 },
  { upTo: 371479, rate: 0.093 },
  { upTo: 445771, rate: 0.103 },
  { upTo: 742953, rate: 0.113 },
  { upTo: Infinity, rate: 0.123 },
];
export const CA_STD_DEDUCTION = 5540;
// CA State Disability Insurance - wage cap removed as of 2024, so it applies to all wage income.
export const CA_SDI_RATE = 0.011;

// ---- FICA 2025 ----
export const SS_RATE = 0.062;
export const SS_WAGE_BASE = 176100;
export const MEDICARE_RATE = 0.0145;
export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD = 200000; // single filer

export type StateCode = "TX" | "CA" | "WA" | "NY" | "FL" | "CO" | "IL";

/** Per-state income tax config. States with no income tax => brackets: null. */
export const STATE_TAX: Record<
  StateCode,
  {
    name: string;
    brackets: Bracket[] | null;
    stdDeduction: number;
    sdiRate: number;
  }
> = {
  TX: { name: "Texas", brackets: null, stdDeduction: 0, sdiRate: 0 },
  FL: { name: "Florida", brackets: null, stdDeduction: 0, sdiRate: 0 },
  WA: { name: "Washington", brackets: null, stdDeduction: 0, sdiRate: 0 },
  CA: {
    name: "California",
    brackets: CA_BRACKETS,
    stdDeduction: CA_STD_DEDUCTION,
    sdiRate: CA_SDI_RATE,
  },
  // NY/IL/CO included as common comparison targets; brackets simplified to single-filer 2025.
  NY: {
    name: "New York",
    brackets: [
      { upTo: 8500, rate: 0.04 },
      { upTo: 11700, rate: 0.045 },
      { upTo: 13900, rate: 0.0525 },
      { upTo: 80650, rate: 0.055 },
      { upTo: 215400, rate: 0.06 },
      { upTo: 1077550, rate: 0.0685 },
      { upTo: Infinity, rate: 0.0965 },
    ],
    stdDeduction: 8000,
    sdiRate: 0,
  },
  IL: {
    name: "Illinois",
    brackets: [{ upTo: Infinity, rate: 0.0495 }],
    stdDeduction: 0,
    sdiRate: 0,
  },
  CO: {
    name: "Colorado",
    brackets: [{ upTo: Infinity, rate: 0.044 }],
    stdDeduction: 0,
    sdiRate: 0,
  },
};

function taxFromBrackets(taxable: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (taxable > lower) {
      tax += (Math.min(taxable, b.upTo) - lower) * b.rate;
      lower = b.upTo;
    } else break;
  }
  return tax;
}

export function federalTax(gross: number): number {
  return taxFromBrackets(Math.max(0, gross - FED_STD_DEDUCTION), FED_BRACKETS);
}

export function stateTax(gross: number, state: StateCode): number {
  const cfg = STATE_TAX[state];
  if (!cfg.brackets) return 0;
  return taxFromBrackets(Math.max(0, gross - cfg.stdDeduction), cfg.brackets);
}

export function fica(gross: number, state: StateCode): number {
  const ss = Math.min(gross, SS_WAGE_BASE) * SS_RATE;
  const med = gross * MEDICARE_RATE;
  const addl =
    Math.max(0, gross - ADDL_MEDICARE_THRESHOLD) * ADDL_MEDICARE_RATE;
  const sdi = gross * STATE_TAX[state].sdiRate;
  return ss + med + addl + sdi;
}

export type Option = {
  label: string;
  city: string;
  state: StateCode;
  salary: number;
  rentMonthly: number;
  /** % of after-housing income the person intends to save (0–1). */
  savingsRate: number;
};

export type Breakdown = {
  gross: number;
  federal: number;
  state: number;
  fica: number;
  totalTax: number;
  effectiveRate: number;
  netAnnual: number;
  netMonthly: number;
  rentMonthly: number;
  // "Typical other costs" - a transparent, adjustable share of net, NOT a hidden multiplier.
  otherCostsMonthly: number;
  leftoverMonthly: number;
  savedMonthly: number;
};

/**
 * Other living costs (food, transport, utilities, etc.) scaled by a regional
 * index relative to the national baseline. Kept SEPARATE from housing on purpose.
 * Index ~ city price level excluding rent (1.0 = national average).
 */
export const CITY_COST_INDEX: Record<string, number> = {
  "San Francisco": 1.28,
  Austin: 1.01,
  "New York": 1.26,
  Seattle: 1.15,
  Denver: 1.03,
  Chicago: 1.06,
  Miami: 1.1,
  Other: 1.0,
};
const BASE_OTHER_COSTS = 1800; // national baseline non-housing essentials, monthly

export function evaluate(opt: Option): Breakdown {
  const federal = federalTax(opt.salary);
  const state = stateTax(opt.salary, opt.state);
  const ficaTax = fica(opt.salary, opt.state);
  const totalTax = federal + state + ficaTax;
  const netAnnual = opt.salary - totalTax;
  const netMonthly = netAnnual / 12;

  const idx = CITY_COST_INDEX[opt.city] ?? 1.0;
  const otherCostsMonthly = BASE_OTHER_COSTS * idx;

  const leftoverMonthly = netMonthly - opt.rentMonthly - otherCostsMonthly;
  const savedMonthly = Math.max(0, leftoverMonthly) * opt.savingsRate;

  return {
    gross: opt.salary,
    federal,
    state,
    fica: ficaTax,
    totalTax,
    effectiveRate: totalTax / opt.salary,
    netAnnual,
    netMonthly,
    rentMonthly: opt.rentMonthly,
    otherCostsMonthly,
    leftoverMonthly,
    savedMonthly,
  };
}

/** Savings trajectory over N months, compounded at a modest APY. */
export function trajectory(opt: Option, months: number, apy = 0.04): number[] {
  const { savedMonthly } = evaluate(opt);
  const monthlyRate = apy / 12;
  const out: number[] = [];
  let balance = 0;
  for (let m = 0; m < months; m++) {
    balance = balance * (1 + monthlyRate) + savedMonthly;
    out.push(Math.round(balance));
  }
  return out;
}

export const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
