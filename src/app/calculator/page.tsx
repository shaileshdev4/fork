"use client";

import { useState } from "react";
import Link from "next/link";
import ProfilePanel from "@/components/ProfilePanel";
import TrustPanel from "@/components/TrustPanel";
import { Logo } from "@/components/Logo";
import {
  DEFAULT_A,
  DEFAULT_B,
  THEME_A,
  THEME_B,
} from "@/lib/scenario";
import type { LifeProfile } from "@/lib/profile";
import { essentialsMonthly } from "@/lib/profile";
import { getCountry } from "@/lib/countries";

function fmt(n: number, c: string) {
  return n.toLocaleString(c === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  });
}

/** Open city explorer — full dropdown, no story sim. */
export default function CalculatorPage() {
  const [a, setA] = useState<LifeProfile>(DEFAULT_A);
  const [b, setB] = useState<LifeProfile>(DEFAULT_B);

  const netA = getCountry(a.country).compute(a.salary, a.region).netMonthly;
  const netB = getCountry(b.country).compute(b.salary, b.region).netMonthly;
  const spendA = essentialsMonthly(a);
  const spendB = essentialsMonthly(b);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-8">
        <Logo href="/" variant="eyebrow" className="mb-4" />
        <h1 className="font-display text-2xl md:text-3xl text-ink leading-tight">
          City calculator
        </h1>
        <p className="text-muted mt-2 max-w-xl">
          Compare any two cities with your numbers — salary, rent, and monthly
          costs. For a full decision story with forks and stress tests,{" "}
          <Link href="/" className="text-ink underline underline-offset-4">
            start a decision
          </Link>
          .
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <ProfilePanel
          profile={a}
          theme={THEME_A}
          onChange={setA}
          cityScope="all"
        />
        <ProfilePanel
          profile={b}
          theme={THEME_B}
          onChange={setB}
          cityScope="all"
        />
      </section>

      <section className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm">
        <h2 className="font-display text-lg text-ink mb-2">Quick read</h2>
        <p className="text-muted">
          At these settings, monthly leftover after rent and essentials is about{" "}
          <span className="tnum text-ink">{fmt(Math.round(netA - spendA), a.currency)}</span>{" "}
          in {a.city} vs{" "}
          <span className="tnum text-ink">{fmt(Math.round(netB - spendB), b.currency)}</span>{" "}
          in {b.city}
          {a.currency !== b.currency && " (different currencies — convert before comparing)"}
          .
        </p>
      </section>

      <section className="mt-4">
        <TrustPanel a={a} b={b} />
      </section>
    </main>
  );
}
