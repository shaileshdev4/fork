import type { CountryEngine, CountryCode } from "./types";
import { US } from "./us";
import { CA } from "./canada";
import { IN } from "./india";

export const COUNTRIES: Record<CountryCode, CountryEngine> = { US, CA, IN };

export type { CountryEngine, CountryCode, CurrencyCode, TaxResult, Region } from "./types";
export { currencyForCountry } from "./types";

export function getCountry(code: string): CountryEngine {
  return COUNTRIES[(code as CountryCode)] ?? US;
}
