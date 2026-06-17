"use client";

import { useState } from "react";
import type { LifeProfile } from "@/lib/profile";
import { getCountry } from "@/lib/countries";
import { provenanceLabel } from "@/lib/data/cityData";

/**
 * Trust scaffolding (need #5). For a decision this size, visible provenance IS
 * the moat. Every number shows where it came from and its honest uncertainty.
 */
export default function TrustPanel({
  a,
  b,
}: {
  a: LifeProfile;
  b: LifeProfile;
}) {
  const [open, setOpen] = useState(false);
  const ca = getCountry(a.country),
    cb = getCountry(b.country);
  const sources = [
    ...ca.sources,
    ...(a.country !== b.country ? cb.sources : []),
  ];

  return (
    <div className="rounded-xl border border-line bg-paper/60 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-ink">
          Where every number comes from
        </span>
        <span className="text-muted text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-muted leading-relaxed">
          <Row
            label="Income tax"
            value={`${ca.name}: ${ca.taxYear} ${ca.code === "CA" ? "CRA" : ca.code === "IN" ? "IT Dept (new regime)" : "IRS"} brackets, validated`}
            note="Federal + regional + payroll. Exact, deterministic."
          />
          <Row
            label={`${a.label} rent`}
            value={provenanceLabel(a.rentSource)}
            note="Market rent varies ±15% by neighborhood - adjust to your actual."
          />
          <Row
            label={`${b.label} rent`}
            value={provenanceLabel(b.rentSource)}
            note="Same - your real number beats any average."
          />
          <Row
            label="Living costs"
            value={`${provenanceLabel(a.costSource)}, scaled to household`}
            note="Groceries, transport, utilities. Estimates - make them yours with the sliders."
          />
          <div className="pt-2 border-t border-line">
            <div className="text-ink text-xs font-medium mb-1">
              Primary sources
            </div>
            <ul className="space-y-0.5">
              {sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-ink"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs pt-2 border-t border-line">
            An estimate to compare options - not financial advice. The further
            from today, the wider the uncertainty; treat the shape of each path
            as the signal, not the exact dollar.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span className="text-ink">{label}</span>
        <span className="text-right">{value}</span>
      </div>
      <div className="text-xs text-muted/80">{note}</div>
    </div>
  );
}
