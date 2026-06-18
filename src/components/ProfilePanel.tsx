"use client";

import { useState } from "react";
import type { LifeProfile } from "@/lib/profile";
import { essentialsMonthly } from "@/lib/profile";
import type { LaneTheme } from "@/lib/scenario";
import { getCountry, currencyForCountry } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries/types";
import {
  provenanceLabel,
  CITY_OPTIONS,
  snapshotFor,
} from "@/lib/data/cityData";

function fmt(n: number, c: string) {
  return n.toLocaleString(c === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  });
}

/**
 * "See it, correct what matters." Pre-filled with sourced numbers; every line is
 * tap-to-edit. Personalization is invited, never required. Source shown per line.
 */
export default function ProfilePanel({
  profile,
  theme,
  onChange,
  cityScope = "play",
}: {
  profile: LifeProfile;
  theme: LaneTheme;
  onChange: (p: LifeProfile) => void;
  /** "play" locks city to this fork; "all" exposes every supported city (calculator). */
  cityScope?: "play" | "all";
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<LifeProfile>) =>
    onChange({ ...profile, ...patch });
  const country = getCountry(profile.country);
  const tax = country.compute(profile.salary, profile.region);
  const essentials = essentialsMonthly(profile);
  const bounds =
    profile.country === "IN"
      ? {
          salary: { min: 500000, max: 10000000, step: 50000 },
          rent: { min: 5000, max: 100000, step: 1000 },
          groceries: { min: 2000, max: 30000, step: 500 },
          transport: { min: 500, max: 15000, step: 500 },
          utilities: { min: 1000, max: 8000, step: 500 },
          other: { min: 3000, max: 30000, step: 500 },
        }
      : {
          salary: { min: 40000, max: 400000, step: 5000 },
          rent: { min: 500, max: 6000, step: 50 },
          groceries: { min: 150, max: 1500, step: 10 },
          transport: { min: 0, max: 800, step: 10 },
          utilities: { min: 50, max: 600, step: 10 },
          other: { min: 100, max: 2500, step: 25 },
        };

  return (
    <div
      className="rounded-xl border border-line bg-paper p-4"
      style={{ borderTop: `3px solid ${theme.accent}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ background: theme.accent }}
        />
        <input
          value={profile.label}
          onChange={(e) => set({ label: e.target.value })}
          className="font-display text-base bg-transparent border-b border-transparent hover:border-line focus:border-ink outline-none flex-1"
          aria-label="Option name"
        />
        <span className="text-[11px] text-muted">
          {profile.city}, {profile.region}
        </span>
      </div>

      {/* City + salary */}
      <label className="block mb-3">
        <span className="text-[11px] uppercase tracking-wider text-muted">
          City
        </span>
        {cityScope === "play" ? (
          <div
            className="mt-1 w-full bg-paper/60 border border-line rounded-lg px-3 py-2 text-sm text-ink"
            aria-label={`City: ${profile.city}`}
          >
            {profile.city}
            <span className="text-muted">, {profile.region}</span>
          </div>
        ) : (
          <CitySelect
            profile={profile}
            onPick={(city, region, ctry) => {
              const s = snapshotFor(city, ctry, region);
              set({
                city,
                region,
                country: ctry,
                currency: currencyForCountry(ctry),
                rentMonthly: s.rentMonthly,
                rentSource: s.rentSource,
                groceriesMonthly: s.groceriesMonthly,
                transportMonthly: s.transportMonthly,
                utilitiesMonthly: s.utilitiesMonthly,
                otherMonthly: s.otherMonthly,
                costSource: s.costSource,
              });
            }}
          />
        )}
      </label>

      <SliderRow
        label="Salary"
        value={profile.salary}
        display={fmt(profile.salary, profile.currency)}
        min={bounds.salary.min}
        max={bounds.salary.max}
        step={bounds.salary.step}
        accent={theme.accent}
        onChange={(v) => set({ salary: v })}
      />

      {/* Live tax readout */}
      <div className="flex justify-between items-baseline mt-1 mb-3 text-xs">
        <span className="text-muted">Take-home / mo</span>
        <span className="tnum text-ink">
          {fmt(Math.round(tax.netMonthly), profile.currency)}{" "}
          <span className="text-muted">
            ({(tax.effectiveRate * 100).toFixed(0)}% tax)
          </span>
        </span>
      </div>

      <SliderRow
        label="Rent / month"
        value={profile.rentMonthly}
        display={fmt(profile.rentMonthly, profile.currency)}
        min={bounds.rent.min}
        max={bounds.rent.max}
        step={bounds.rent.step}
        accent={theme.accent}
        onChange={(v) => set({ rentMonthly: v, rentSource: "user" })}
        source={provenanceLabel(profile.rentSource)}
      />

      <SliderRow
        label="Save % of leftover"
        value={Math.round(profile.savingsRate * 100)}
        display={`${Math.round(profile.savingsRate * 100)}%`}
        min={0}
        max={100}
        step={5}
        accent={theme.accent}
        onChange={(v) => set({ savingsRate: v / 100 })}
      />

      {/* Expandable detail: per-category monthly costs */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-1 text-xs text-muted hover:text-ink underline underline-offset-4"
      >
        {open ? "Hide" : "Adjust"} monthly costs ·{" "}
        {fmt(essentials, profile.currency)}/mo total
      </button>
      {open && (
        <div className="mt-3 space-y-3 pt-3 border-t border-line">
          <div className="text-[11px] text-muted">
            {provenanceLabel(profile.costSource)} - tap to make them yours.
          </div>
          <SliderRow
            label="Groceries"
            value={profile.groceriesMonthly}
            display={fmt(profile.groceriesMonthly, profile.currency)}
            min={bounds.groceries.min}
            max={bounds.groceries.max}
            step={bounds.groceries.step}
            accent={theme.accent}
            onChange={(v) => set({ groceriesMonthly: v, costSource: "user" })}
          />
          <SliderRow
            label="Transport"
            value={profile.transportMonthly}
            display={fmt(profile.transportMonthly, profile.currency)}
            min={bounds.transport.min}
            max={bounds.transport.max}
            step={bounds.transport.step}
            accent={theme.accent}
            onChange={(v) => set({ transportMonthly: v, costSource: "user" })}
          />
          <SliderRow
            label="Utilities"
            value={profile.utilitiesMonthly}
            display={fmt(profile.utilitiesMonthly, profile.currency)}
            min={bounds.utilities.min}
            max={bounds.utilities.max}
            step={bounds.utilities.step}
            accent={theme.accent}
            onChange={(v) => set({ utilitiesMonthly: v, costSource: "user" })}
          />
          <SliderRow
            label="Everything else"
            value={profile.otherMonthly}
            display={fmt(profile.otherMonthly, profile.currency)}
            min={bounds.other.min}
            max={bounds.other.max}
            step={bounds.other.step}
            accent={theme.accent}
            onChange={(v) => set({ otherMonthly: v, costSource: "user" })}
          />
        </div>
      )}
    </div>
  );
}

function CitySelect({
  profile,
  onPick,
}: {
  profile: LifeProfile;
  onPick: (city: string, region: string, country: CountryCode) => void;
}) {
  const groups: { label: string; code: CountryCode }[] = [
    { label: "United States", code: "US" },
    { label: "Canada", code: "CA" },
    { label: "India", code: "IN" },
  ];
  return (
    <select
      value={profile.city}
      onChange={(e) => {
        const o = CITY_OPTIONS.find((x) => x.city === e.target.value)!;
        onPick(o.city, o.region, o.country);
      }}
      className="mt-1 w-full bg-paper border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
    >
      {groups.map((g) => (
        <optgroup key={g.code} label={g.label}>
          {CITY_OPTIONS.filter((o) => o.country === g.code).map((o) => (
            <option key={o.city} value={o.city}>
              {o.city}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  accent,
  onChange,
  source,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  accent: string;
  onChange: (v: number) => void;
  source?: string;
}) {
  return (
    <label className="block mb-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="tnum text-sm text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1.5"
        style={{ ["--thumb" as string]: accent }}
        aria-label={label}
      />
      {source && <span className="text-[10px] text-muted/80">{source}</span>}
    </label>
  );
}
