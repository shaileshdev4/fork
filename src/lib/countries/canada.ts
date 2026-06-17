import type { CountryEngine, Region, TaxResult, Bracket } from "./types";

// 2025 federal: blended 14.5% lowest bracket (Bill C-4), BPA $16,129.
const FED: Bracket[] = [
  { upTo: 57375, rate: 0.145 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];
const FED_BPA = 16129, FED_LOW = 0.145;

// CPP 2025: 5.95% on (earnings up to YMPE 71300 minus 3500 exemption); CPP2 4% from 71300–81200.
const CPP_RATE = 0.0595, YMPE = 71300, CPP_EXEMPT = 3500, CPP2_RATE = 0.04, YAMPE = 81200;
// EI 2025: 1.64% up to max insurable 65700.
const EI_RATE = 0.0164, EI_MAX = 65700;

const REGIONS: Region[] = [
  {
    code: "ON", name: "Ontario", lowestRate: 0.0505, basicAmount: 12747,
    brackets: [
      { upTo: 52886, rate: 0.0505 }, { upTo: 105775, rate: 0.0915 }, { upTo: 150000, rate: 0.1116 },
      { upTo: 220000, rate: 0.1216 }, { upTo: Infinity, rate: 0.1316 },
    ],
    surtax: [{ threshold: 5710, rate: 0.2 }, { threshold: 7307, rate: 0.36 }],
  },
  {
    code: "BC", name: "British Columbia", lowestRate: 0.0506, basicAmount: 12932,
    brackets: [
      { upTo: 49279, rate: 0.0506 }, { upTo: 98560, rate: 0.077 }, { upTo: 113158, rate: 0.105 },
      { upTo: 137407, rate: 0.1229 }, { upTo: 186306, rate: 0.147 }, { upTo: 259829, rate: 0.168 },
      { upTo: Infinity, rate: 0.205 },
    ],
  },
  {
    code: "AB", name: "Alberta", lowestRate: 0.08, basicAmount: 22323,
    brackets: [
      { upTo: 60000, rate: 0.08 }, { upTo: 151234, rate: 0.10 }, { upTo: 181481, rate: 0.12 },
      { upTo: 241974, rate: 0.13 }, { upTo: 362961, rate: 0.14 }, { upTo: Infinity, rate: 0.15 },
    ],
  },
  {
    code: "QC", name: "Quebec", lowestRate: 0.14, basicAmount: 18571,
    brackets: [
      { upTo: 53255, rate: 0.14 }, { upTo: 106495, rate: 0.19 }, { upTo: 129590, rate: 0.24 },
      { upTo: Infinity, rate: 0.2575 },
    ],
  },
];

function brk(taxable: number, b: Bracket[]): number {
  let t = 0, lo = 0;
  for (const x of b) { if (taxable > lo) { t += (Math.min(taxable, x.upTo) - lo) * x.rate; lo = x.upTo; } else break; }
  return t;
}

export const CA: CountryEngine = {
  code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$",
  taxYear: 2025, regionLabel: "province", regions: REGIONS,
  compute(gross, regionCode): TaxResult {
    const region = REGIONS.find((r) => r.code === regionCode) ?? REGIONS[0];
    const federal = Math.max(0, brk(gross, FED) - FED_BPA * FED_LOW);
    let regional = Math.max(0, brk(gross, region.brackets!) - (region.basicAmount ?? 0) * (region.lowestRate ?? 0));
    for (const s of region.surtax ?? []) if (regional > s.threshold) regional += (regional - s.threshold) * s.rate;
    const cpp = Math.max(0, Math.min(gross, YMPE) - CPP_EXEMPT) * CPP_RATE + Math.max(0, Math.min(gross, YAMPE) - YMPE) * CPP2_RATE;
    const ei = Math.min(gross, EI_MAX) * EI_RATE;
    const payroll = cpp + ei;
    const totalTax = federal + regional + payroll;
    const netAnnual = gross - totalTax;
    return {
      gross, federal, regional, payroll, totalTax, netAnnual,
      netMonthly: netAnnual / 12, effectiveRate: totalTax / gross,
      lines: [
        { label: "Federal income tax", amount: federal, note: "2025 CRA brackets (blended 14.5% lowest), BPA $16,129" },
        { label: `${region.name} provincial tax`, amount: regional, note: "2025 provincial brackets" },
        { label: "CPP + EI", amount: payroll, note: "2025 contribution rates" },
      ],
    };
  },
  sources: [
    { label: "CRA 2025 federal brackets", url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html" },
    { label: "KPMG 2025 federal & provincial rates", url: "https://kpmg.com/ca/en/home/services/tax/tax-facts.html" },
  ],
};
