import type { CountryEngine, Region, TaxResult, Bracket } from "./types";

const FED: Bracket[] = [
  { upTo: 11925, rate: 0.1 },
  { upTo: 48475, rate: 0.12 },
  { upTo: 103350, rate: 0.22 },
  { upTo: 197300, rate: 0.24 },
  { upTo: 250525, rate: 0.32 },
  { upTo: 626350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];
const FED_STD = 15750;
const SS_RATE = 0.062, SS_BASE = 176100;
const MED_RATE = 0.0145, ADDL_MED = 0.009, ADDL_MED_THRESH = 200000;

const REGIONS: Region[] = [
  { code: "TX", name: "Texas", brackets: null },
  { code: "FL", name: "Florida", brackets: null },
  { code: "WA", name: "Washington", brackets: null },
  {
    code: "CA", name: "California", lowestRate: 0.01, basicAmount: 5540,
    brackets: [
      { upTo: 11079, rate: 0.01 }, { upTo: 26264, rate: 0.02 }, { upTo: 41452, rate: 0.04 },
      { upTo: 57542, rate: 0.06 }, { upTo: 72724, rate: 0.08 }, { upTo: 371479, rate: 0.093 },
      { upTo: 445771, rate: 0.103 }, { upTo: 742953, rate: 0.113 }, { upTo: Infinity, rate: 0.123 },
    ],
  },
  {
    code: "NY", name: "New York", lowestRate: 0.04, basicAmount: 8000,
    brackets: [
      { upTo: 8500, rate: 0.04 }, { upTo: 11700, rate: 0.045 }, { upTo: 13900, rate: 0.0525 },
      { upTo: 80650, rate: 0.055 }, { upTo: 215400, rate: 0.06 }, { upTo: 1077550, rate: 0.0685 },
      { upTo: Infinity, rate: 0.0965 },
    ],
  },
  { code: "CO", name: "Colorado", brackets: [{ upTo: Infinity, rate: 0.044 }] },
  { code: "IL", name: "Illinois", brackets: [{ upTo: Infinity, rate: 0.0495 }] },
];

function brk(taxable: number, b: Bracket[]): number {
  let t = 0, lo = 0;
  for (const x of b) { if (taxable > lo) { t += (Math.min(taxable, x.upTo) - lo) * x.rate; lo = x.upTo; } else break; }
  return t;
}

export const US: CountryEngine = {
  code: "US", name: "United States", currency: "USD", currencySymbol: "$",
  taxYear: 2025, regionLabel: "state", regions: REGIONS,
  compute(gross, regionCode): TaxResult {
    const region = REGIONS.find((r) => r.code === regionCode) ?? REGIONS[0];
    const federal = brk(Math.max(0, gross - FED_STD), FED);
    let regional = 0;
    if (region.brackets) {
      regional = brk(Math.max(0, gross - (region.basicAmount ?? 0)), region.brackets);
    }
    const ss = Math.min(gross, SS_BASE) * SS_RATE;
    const med = gross * MED_RATE + Math.max(0, gross - ADDL_MED_THRESH) * ADDL_MED;
    const payroll = ss + med;
    const totalTax = federal + regional + payroll;
    const netAnnual = gross - totalTax;
    return {
      gross, federal, regional, payroll, totalTax, netAnnual,
      netMonthly: netAnnual / 12, effectiveRate: totalTax / gross,
      lines: [
        { label: "Federal income tax", amount: federal, note: "2025 IRS brackets, $15,750 std deduction" },
        { label: `${region.name} state tax`, amount: regional, note: region.brackets ? "2025 state brackets" : "No state income tax" },
        { label: "Social Security + Medicare", amount: payroll, note: "FICA 2025" },
      ],
    };
  },
  sources: [
    { label: "IRS 2025 federal brackets", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets" },
    { label: "Tax Foundation state tax data", url: "https://taxfoundation.org/data/all/state/state-income-tax-rates/" },
  ],
};
