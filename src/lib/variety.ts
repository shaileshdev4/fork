/**
 * Seeded life-variety. Life is unpredictable - but a decision TOOL must be
 * reproducible (same inputs => same run). Deterministic seed from the profile
 * picks realistic micro-events in quiet months.
 */
import type { LifeProfile } from "./profile";
import type { Persona } from "./persona";

export type MicroEvent = {
  month: number;
  kind:
    | "car"
    | "medical"
    | "raise"
    | "gift"
    | "bonus"
    | "repair"
    | "windfall"
    | "vet"
    | "tax";
  label: string;
  detail: string;
  amount: number;
};

function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(p: LifeProfile, persona: Persona): number {
  const s = `${p.city}|${p.salary}|${p.region}|${persona.stage}|${persona.kids}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const costScale = (cur: string) =>
  cur === "CAD" ? 1.35 : cur === "INR" ? 85 : 1;

function pool(cur: string): Omit<MicroEvent, "month">[] {
  const scale = costScale(cur);
  const r = (n: number) => Math.round(n * scale);
  return [
    {
      kind: "repair",
      label: "Home repair",
      detail: `A surprise repair - ${r(900)}.`,
      amount: -r(900),
    },
    {
      kind: "medical",
      label: "Dental work",
      detail: `Dental bill insurance didn't cover: ${r(1400)}.`,
      amount: -r(1400),
    },
    {
      kind: "bonus",
      label: "Work bonus",
      detail: `A one-time performance bonus of ${r(2200)}.`,
      amount: r(2200),
    },
    {
      kind: "gift",
      label: "A friend's wedding",
      detail: `Travel and a gift: ${r(800)}.`,
      amount: -r(800),
    },
    {
      kind: "windfall",
      label: "Tax refund",
      detail: `A bigger-than-expected refund: ${r(1600)}.`,
      amount: r(1600),
    },
    {
      kind: "vet",
      label: "Pet emergency",
      detail: `An unexpected vet bill: ${r(1100)}.`,
      amount: -r(1100),
    },
    {
      kind: "repair",
      label: "Phone + laptop die",
      detail: `Both gave out at once: ${r(1500)}.`,
      amount: -r(1500),
    },
    {
      kind: "tax",
      label: "Owed at tax time",
      detail: `A shortfall you had to cover: ${r(1900)}.`,
      amount: -r(1900),
    },
    {
      kind: "windfall",
      label: "Side cash",
      detail: `Sold some things, picked up odd work: ${r(700)}.`,
      amount: r(700),
    },
    {
      kind: "medical",
      label: "Minor procedure",
      detail: `Out-of-pocket: ${r(1700)}.`,
      amount: -r(1700),
    },
  ];
}

export function varietyEvents(
  p: LifeProfile,
  persona: Persona,
  forkMonths: number[],
  horizon: number,
): MicroEvent[] {
  const rand = rng(seedFrom(p, persona));
  const candidates = pool(p.currency);
  const count = 2 + Math.floor(rand() * 2);
  const quiet: number[] = [];
  for (let m = 6; m <= horizon - 2; m++) {
    if (!forkMonths.some((f) => Math.abs(f - m) <= 1)) quiet.push(m);
  }
  const events: MicroEvent[] = [];
  const usedMonths = new Set<number>();
  const usedKinds = new Set<string>();
  let guard = 0;
  while (events.length < count && quiet.length && guard < 40) {
    guard++;
    const ev = candidates[Math.floor(rand() * candidates.length)];
    if (usedKinds.has(ev.label)) continue;
    let mIdx = Math.floor(rand() * quiet.length);
    let tries = 0;
    while (usedMonths.has(quiet[mIdx]) && tries < quiet.length) {
      mIdx = (mIdx + 1) % quiet.length;
      tries++;
    }
    if (usedMonths.has(quiet[mIdx])) break;
    usedKinds.add(ev.label);
    usedMonths.add(quiet[mIdx]);
    events.push({ ...ev, month: quiet[mIdx] });
  }
  return events.sort((a, b) => a.month - b.month);
}
