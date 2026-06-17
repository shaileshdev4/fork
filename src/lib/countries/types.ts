/**
 * Multi-country tax engine - types.
 * Each country is a self-contained module implementing TaxEngine. Adding a country
 * = adding a module. The simulation engine and UI never change. This is the seam
 * that lets us validate 2 deeply now and add more later without a rewrite.
 */

export type CountryCode = "US" | "CA" | "IN";
export type CurrencyCode = "USD" | "CAD" | "INR";

export type Bracket = { upTo: number; rate: number };

export type Region = {
  code: string; // e.g. "CA" (US state), "ON" (Canadian province), "KA" (India)
  name: string;
  brackets: Bracket[] | null; // null = no regional income tax
  basicAmount?: number; // personal amount credited at lowest rate
  lowestRate?: number; // rate at which the basic amount is credited
  surtax?: { threshold: number; rate: number }[]; // tax-on-tax (e.g. Ontario)
};

export type TaxResult = {
  gross: number;
  federal: number;
  regional: number;
  payroll: number; // FICA (US) / CPP+EI (CA) / EPF (IN)
  totalTax: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  // transparent line items for the "where's this from" disclosure
  lines: { label: string; amount: number; note?: string }[];
};

export type CountryEngine = {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  currencySymbol: string;
  taxYear: number;
  regionLabel: string; // "state" | "province"
  regions: Region[];
  /** Compute full tax breakdown for a gross salary in a given region. */
  compute: (gross: number, regionCode: string) => TaxResult;
  /** Source citations shown in the trust panel. */
  sources: { label: string; url: string }[];
};

export function currencyForCountry(code: CountryCode): CurrencyCode {
  if (code === "CA") return "CAD";
  if (code === "IN") return "INR";
  return "USD";
}
