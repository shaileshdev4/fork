/**
 * A LifeProfile is the fully-personalized input for ONE option in the fork.
 * Everything is sourced + overridable. This replaces the old thin `Option`.
 */
import type { CountryCode, CurrencyCode } from "@/lib/countries/types";
import { currencyForCountry } from "@/lib/countries/types";
import type { Provenance } from "./data/cityData";

export type LifeProfile = {
  label: string;
  country: CountryCode;
  city: string;
  region: string; // state/province code
  currency: CurrencyCode;
  salary: number;
  // monthly cost lines - each personalizable, each with provenance
  rentMonthly: number;
  rentSource: Provenance;
  groceriesMonthly: number;
  transportMonthly: number;
  utilitiesMonthly: number;
  otherMonthly: number;
  costSource: Provenance;
  savingsRate: number; // 0..1 of leftover saved
};

export function essentialsMonthly(p: LifeProfile): number {
  return (
    p.rentMonthly +
    p.groceriesMonthly +
    p.transportMonthly +
    p.utilitiesMonthly +
    p.otherMonthly
  );
}

/** Short salary label for lane headers - ₹25L for India, USD 130k elsewhere. */
export function formatSalaryShort(
  salary: number,
  currency: CurrencyCode,
): string {
  if (currency === "INR") {
    if (salary >= 10000000) return `₹${(salary / 10000000).toFixed(1)}Cr`;
    return `₹${Math.round(salary / 100000)}L`;
  }
  return `${currency} ${Math.round(salary / 1000)}k`;
}

export function profileCurrency(country: CountryCode): CurrencyCode {
  return currencyForCountry(country);
}
