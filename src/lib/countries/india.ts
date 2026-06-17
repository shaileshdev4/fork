import type { CountryEngine, Region, TaxResult, Bracket } from "./types";

/**
 * India - FY 2025-26 (AY 2026-27), new tax regime (default).
 * Validated against published slab tables + ClearTax-class calculators.
 *
 * Simplifications (disclosed in trust panel):
 * - New regime only (no HRA / 80C old-regime modeling)
 * - Salary treated as annual gross; Basic assumed 40% of gross for EPF
 * - EPF mandatory ceiling ₹15,000/mo basic (EPFO 2025)
 * - Regional line = professional tax (state), not income tax
 */

// New regime slabs FY 2025-26 - applied to taxable income (after std deduction).
const NEW_REGIME: Bracket[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const STD_DEDUCTION = 75000;
const REBATE_87A_MAX = 60000;
const REBATE_87A_TAXABLE_CAP = 1200000;
const CESS_RATE = 0.04;
const EPF_RATE = 0.12;
const EPF_BASIC_CEILING = 15000;
const BASIC_SALARY_RATIO = 0.4;

const REGIONS: Region[] = [
  { code: "KA", name: "Karnataka", brackets: null },
  { code: "MH", name: "Maharashtra", brackets: null },
  { code: "TS", name: "Telangana", brackets: null },
  { code: "TN", name: "Tamil Nadu", brackets: null },
  { code: "DL", name: "Delhi", brackets: null },
];

function brk(taxable: number, brackets: Bracket[]): number {
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

/** Professional tax - annual amount by state (max ₹2,500/yr nationally). */
function professionalTaxAnnual(gross: number, regionCode: string): number {
  const monthly = gross / 12;
  switch (regionCode) {
    case "DL":
      return 0;
    case "MH":
      if (monthly <= 7500) return 0;
      if (monthly <= 10000) return 175 * 12;
      return 200 * 11 + 300; // ₹2,500/yr
    case "KA":
    case "TS":
      return monthly >= 25000 ? 200 * 11 + 300 : 0;
    case "TN":
      return monthly >= 21000 ? 2400 : monthly >= 12000 ? 1320 : 0;
    default:
      return monthly >= 25000 ? 2500 : 0;
  }
}

function epfEmployeeAnnual(gross: number): number {
  const basicMonthly = (gross / 12) * BASIC_SALARY_RATIO;
  const epfWage = Math.min(basicMonthly, EPF_BASIC_CEILING);
  return epfWage * EPF_RATE * 12;
}

export const IN: CountryEngine = {
  code: "IN",
  name: "India",
  currency: "INR",
  currencySymbol: "₹",
  taxYear: 2025,
  regionLabel: "state",
  regions: REGIONS,
  compute(gross, regionCode): TaxResult {
    const region = REGIONS.find((r) => r.code === regionCode) ?? REGIONS[0];
    const taxable = Math.max(0, gross - STD_DEDUCTION);

    let incomeTax = brk(taxable, NEW_REGIME);
    if (taxable <= REBATE_87A_TAXABLE_CAP) {
      incomeTax = Math.max(0, incomeTax - Math.min(incomeTax, REBATE_87A_MAX));
    }
    const cess = incomeTax * CESS_RATE;
    const federal = incomeTax + cess;

    const regional = professionalTaxAnnual(gross, region.code);
    const payroll = epfEmployeeAnnual(gross);
    const totalTax = federal + regional + payroll;
    const netAnnual = gross - totalTax;

    return {
      gross,
      federal,
      regional,
      payroll,
      totalTax,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: totalTax / gross,
      lines: [
        {
          label: "Income tax + cess",
          amount: federal,
          note: "FY 2025-26 new regime, ₹75,000 std deduction, 4% cess, §87A rebate",
        },
        {
          label: `${region.name} professional tax`,
          amount: regional,
          note:
            regional === 0
              ? "Not levied in this state"
              : "State PT, max ₹2,500/yr",
        },
        {
          label: "EPF (employee)",
          amount: payroll,
          note: `12% of basic (assumed ${BASIC_SALARY_RATIO * 100}% of gross), capped at ₹15,000/mo basic`,
        },
      ],
    };
  },
  sources: [
    {
      label: "Income Tax Dept - rates AY 2026-27",
      url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-preparation",
    },
    {
      label: "EPFO contribution rates",
      url: "https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf",
    },
    {
      label: "ClearTax - professional tax by state",
      url: "https://cleartax.in/s/professional-tax-karnataka",
    },
  ],
};
