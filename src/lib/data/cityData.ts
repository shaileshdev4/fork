/**
 * City data layer. Provides rent + monthly cost estimates for any city, with
 * provenance. Live path = RentCast (rent) + sourced cost baselines. Fallback =
 * bundled snapshot for major metros so the app NEVER breaks in a demo and the
 * free API tier survives real traffic.
 *
 * Every number carries a `source` so the UI can show "where's this from?" -
 * trust comes from transparency, not false precision.
 */

import type { CountryCode, CurrencyCode } from "@/lib/countries/types";
import { currencyForCountry } from "@/lib/countries/types";

export type Provenance = "live" | "snapshot" | "estimate" | "user";

export type CostBreakdown = {
  city: string;
  region: string; // state/province code
  country: CountryCode;
  currency: CurrencyCode;
  rentMonthly: number;
  rentSource: Provenance;
  groceriesMonthly: number;
  transportMonthly: number;
  utilitiesMonthly: number;
  otherMonthly: number;
  costSource: Provenance;
  asOf: string; // ISO date of the data
};

/**
 * Bundled snapshot of major-metro rents (1BR) + monthly non-housing costs.
 * Sourced from 2025 market data (RentCast/Zumper/Numbeo-class figures), used as
 * fallback and seed defaults. Figures are deliberately rounded and conservative.
 */
export const CITY_SNAPSHOT: Record<
  string,
  Omit<CostBreakdown, "rentSource" | "costSource" | "asOf">
> = {
  // --- US ---
  Austin: {
    city: "Austin",
    region: "TX",
    country: "US",
    currency: "USD",
    rentMonthly: 1450,
    groceriesMonthly: 420,
    transportMonthly: 180,
    utilitiesMonthly: 200,
    otherMonthly: 700,
  },
  "San Francisco": {
    city: "San Francisco",
    region: "CA",
    country: "US",
    currency: "USD",
    rentMonthly: 3500,
    groceriesMonthly: 520,
    transportMonthly: 200,
    utilitiesMonthly: 230,
    otherMonthly: 950,
  },
  "New York": {
    city: "New York",
    region: "NY",
    country: "US",
    currency: "USD",
    rentMonthly: 3900,
    groceriesMonthly: 540,
    transportMonthly: 130,
    utilitiesMonthly: 220,
    otherMonthly: 950,
  },
  Seattle: {
    city: "Seattle",
    region: "WA",
    country: "US",
    currency: "USD",
    rentMonthly: 2200,
    groceriesMonthly: 480,
    transportMonthly: 130,
    utilitiesMonthly: 220,
    otherMonthly: 820,
  },
  Denver: {
    city: "Denver",
    region: "CO",
    country: "US",
    currency: "USD",
    rentMonthly: 1750,
    groceriesMonthly: 440,
    transportMonthly: 150,
    utilitiesMonthly: 200,
    otherMonthly: 760,
  },
  Chicago: {
    city: "Chicago",
    region: "IL",
    country: "US",
    currency: "USD",
    rentMonthly: 1950,
    groceriesMonthly: 450,
    transportMonthly: 120,
    utilitiesMonthly: 210,
    otherMonthly: 780,
  },
  Miami: {
    city: "Miami",
    region: "FL",
    country: "US",
    currency: "USD",
    rentMonthly: 2600,
    groceriesMonthly: 470,
    transportMonthly: 160,
    utilitiesMonthly: 200,
    otherMonthly: 820,
  },
  // --- Canada (CAD) ---
  Toronto: {
    city: "Toronto",
    region: "ON",
    country: "CA",
    currency: "CAD",
    rentMonthly: 2400,
    groceriesMonthly: 480,
    transportMonthly: 156,
    utilitiesMonthly: 190,
    otherMonthly: 820,
  },
  Vancouver: {
    city: "Vancouver",
    region: "BC",
    country: "CA",
    currency: "CAD",
    rentMonthly: 2600,
    groceriesMonthly: 470,
    transportMonthly: 110,
    utilitiesMonthly: 130,
    otherMonthly: 800,
  },
  Calgary: {
    city: "Calgary",
    region: "AB",
    country: "CA",
    currency: "CAD",
    rentMonthly: 1700,
    groceriesMonthly: 450,
    transportMonthly: 112,
    utilitiesMonthly: 250,
    otherMonthly: 720,
  },
  Montreal: {
    city: "Montreal",
    region: "QC",
    country: "CA",
    currency: "CAD",
    rentMonthly: 1700,
    groceriesMonthly: 440,
    transportMonthly: 97,
    utilitiesMonthly: 120,
    otherMonthly: 700,
  },
  // --- India (INR) - 2025 metro snapshots (NoBroker / 99acres class, 1BHK mid-locality) ---
  Bangalore: {
    city: "Bangalore",
    region: "KA",
    country: "IN",
    currency: "INR",
    rentMonthly: 22000,
    groceriesMonthly: 5000,
    transportMonthly: 2500,
    utilitiesMonthly: 2500,
    otherMonthly: 8000,
  },
  Mumbai: {
    city: "Mumbai",
    region: "MH",
    country: "IN",
    currency: "INR",
    rentMonthly: 35000,
    groceriesMonthly: 6000,
    transportMonthly: 3500,
    utilitiesMonthly: 3000,
    otherMonthly: 10000,
  },
  Hyderabad: {
    city: "Hyderabad",
    region: "TS",
    country: "IN",
    currency: "INR",
    rentMonthly: 18000,
    groceriesMonthly: 4500,
    transportMonthly: 2000,
    utilitiesMonthly: 2000,
    otherMonthly: 7000,
  },
  Pune: {
    city: "Pune",
    region: "MH",
    country: "IN",
    currency: "INR",
    rentMonthly: 20000,
    groceriesMonthly: 4500,
    transportMonthly: 2500,
    utilitiesMonthly: 2000,
    otherMonthly: 7500,
  },
  Delhi: {
    city: "Delhi",
    region: "DL",
    country: "IN",
    currency: "INR",
    rentMonthly: 25000,
    groceriesMonthly: 5500,
    transportMonthly: 3000,
    utilitiesMonthly: 2500,
    otherMonthly: 8500,
  },
  Chennai: {
    city: "Chennai",
    region: "TN",
    country: "IN",
    currency: "INR",
    rentMonthly: 16000,
    groceriesMonthly: 4000,
    transportMonthly: 2000,
    utilitiesMonthly: 2000,
    otherMonthly: 6500,
  },
};

export const KNOWN_CITIES = Object.keys(CITY_SNAPSHOT);

export const CITY_OPTIONS: {
  city: string;
  region: string;
  country: CountryCode;
}[] = Object.values(CITY_SNAPSHOT).map((c) => ({
  city: c.city,
  region: c.region,
  country: c.country,
}));

export function resolveCityMeta(city: string): {
  region: string;
  country: CountryCode;
} {
  const hit = CITY_SNAPSHOT[city];
  if (hit) return { region: hit.region, country: hit.country };
  return { region: "TX", country: "US" };
}

/** National non-housing baselines for unknown cities, by country. */
const BASELINE: Record<
  CountryCode,
  {
    groceriesMonthly: number;
    transportMonthly: number;
    utilitiesMonthly: number;
    otherMonthly: number;
  }
> = {
  US: {
    groceriesMonthly: 450,
    transportMonthly: 160,
    utilitiesMonthly: 210,
    otherMonthly: 780,
  },
  CA: {
    groceriesMonthly: 460,
    transportMonthly: 120,
    utilitiesMonthly: 170,
    otherMonthly: 740,
  },
  IN: {
    groceriesMonthly: 5000,
    transportMonthly: 2500,
    utilitiesMonthly: 2200,
    otherMonthly: 8000,
  },
};

const DEFAULT_RENT: Record<CountryCode, number> = {
  US: 1700,
  CA: 1800,
  IN: 20000,
};

export function snapshotFor(
  city: string,
  country: CountryCode,
  region: string,
): CostBreakdown {
  const hit = CITY_SNAPSHOT[city];
  const asOf = "2025-Q4";
  if (hit) {
    return { ...hit, rentSource: "snapshot", costSource: "snapshot", asOf };
  }
  const base = BASELINE[country];
  return {
    city,
    region,
    country,
    currency: currencyForCountry(country),
    rentMonthly: DEFAULT_RENT[country],
    rentSource: "estimate",
    groceriesMonthly: base.groceriesMonthly,
    transportMonthly: base.transportMonthly,
    utilitiesMonthly: base.utilitiesMonthly,
    otherMonthly: base.otherMonthly,
    costSource: "estimate",
    asOf,
  };
}

export function provenanceLabel(p: Provenance): string {
  switch (p) {
    case "live":
      return "Live market estimate";
    case "snapshot":
      return "2025 market data";
    case "estimate":
      return "Regional estimate";
    case "user":
      return "Your number";
  }
}
