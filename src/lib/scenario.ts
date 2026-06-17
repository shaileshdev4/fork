import type { LifeProfile } from "./profile";
import { profileCurrency } from "./profile";
import type { CountryCode } from "@/lib/countries/types";
import { snapshotFor } from "./data/cityData";
import type { Persona } from "./persona";
import { householdCostMultiplier } from "./persona";

export type LaneTheme = {
  key: "A" | "B";
  accent: string;
  accentSoft: string;
  cityAsset: string;
  aptModestAsset: string;
  aptComfortableAsset: string;
};

// Visual themes are assigned per-lane (A=amber, B=teal) regardless of city,
// so the eye always tracks "option A vs option B".
export const THEME_A: LaneTheme = {
  key: "A", accent: "#c77b30", accentSoft: "#f0d9bd",
  cityAsset: "city-austin", aptModestAsset: "apt-austin-modest", aptComfortableAsset: "apt-austin-comfortable",
};
export const THEME_B: LaneTheme = {
  key: "B", accent: "#2f7d77", accentSoft: "#c5e0dc",
  cityAsset: "city-sf", aptModestAsset: "apt-sf-modest", aptComfortableAsset: "apt-sf-comfortable",
};

/** Build a personalized profile from a city + salary, seeded with sourced costs. */
export function profileFromCity(
  label: string, country: CountryCode, city: string, region: string, salary: number, savingsRate = 0.5
): LifeProfile {
  const c = snapshotFor(city, country, region);
  return {
    label, country, city: c.city, region: c.region, currency: c.currency, salary,
    rentMonthly: c.rentMonthly, rentSource: c.rentSource,
    groceriesMonthly: c.groceriesMonthly, transportMonthly: c.transportMonthly,
    utilitiesMonthly: c.utilitiesMonthly, otherMonthly: c.otherMonthly, costSource: c.costSource,
    savingsRate,
  };
}


/** Scale a profile's non-housing costs to the household (couple/family eat more). */
export function scaleToHousehold(p: LifeProfile, persona: Persona): LifeProfile {
  const m = householdCostMultiplier(persona);
  return {
    ...p,
    groceriesMonthly: Math.round(p.groceriesMonthly * m),
    transportMonthly: Math.round(p.transportMonthly * (persona.stage === "family" ? 1.4 : persona.stage === "couple" ? 1.2 : 1)),
    utilitiesMonthly: Math.round(p.utilitiesMonthly * (persona.stage === "family" ? 1.3 : persona.stage === "couple" ? 1.15 : 1)),
    otherMonthly: Math.round(p.otherMonthly * m),
  };
}

export const DEFAULT_A = profileFromCity("Austin", "US", "Austin", "TX", 130000, 0.6);
export const DEFAULT_B = profileFromCity("San Francisco", "US", "San Francisco", "CA", 200000, 0.45);
export const DEFAULT_HORIZON = 36;

// --- URL sharing ---
function enc(p: LifeProfile): string {
  return [p.label, p.country, p.city, p.region, p.salary, p.rentMonthly,
    p.groceriesMonthly, p.transportMonthly, p.utilitiesMonthly, p.otherMonthly,
    Math.round(p.savingsRate * 100)].map((v) => encodeURIComponent(String(v))).join("~");
}
function dec(s: string): LifeProfile | null {
  const a = s.split("~").map((x) => decodeURIComponent(x));
  if (a.length !== 11) return null;
  return {
    label: a[0], country: a[1] as CountryCode, city: a[2], region: a[3],
    currency: profileCurrency(a[1] as CountryCode),
    salary: +a[4], rentMonthly: +a[5], rentSource: "user",
    groceriesMonthly: +a[6], transportMonthly: +a[7], utilitiesMonthly: +a[8], otherMonthly: +a[9],
    costSource: "user", savingsRate: (+a[10]) / 100,
  };
}
export function encodeRun(a: LifeProfile, b: LifeProfile, h: number): string {
  const q = new URLSearchParams();
  q.set("a", enc(a)); q.set("b", enc(b)); q.set("h", String(h));
  return q.toString();
}
export function decodeRun(query: string): { a: LifeProfile; b: LifeProfile; horizon: number } | null {
  try {
    const q = new URLSearchParams(query);
    const a = q.get("a") ? dec(q.get("a")!) : null;
    const b = q.get("b") ? dec(q.get("b")!) : null;
    if (!a || !b) return null;
    return { a, b, horizon: +(q.get("h") ?? 36) || 36 };
  } catch { return null; }
}
