/**
 * Synthesis - the "so what do I do?" engine.
 *
 * The core problem is decision paralysis. A visualizer shows two paths; a
 * decision TOOL tells you what they mean for what YOU value. This scores each
 * path on the dimensions people actually weigh, maps them to the player's
 * stated value ranking, and produces an honest, non-prescriptive read:
 * not "SF wins," but "if security matters most to you, here's the one to watch."
 */
import type { SimulatedLife } from "./simulation";
import type { LifeProfile } from "./profile";
import type { Persona, ValuePriority } from "./persona";

export type PathScore = {
  security: number; // cushion + lowest runway
  lifestyle: number; // monthly leftover to actually live on
  growth: number; // wealth built over the horizon
  freedom: number; // flexibility = runway + low fixed obligations
  family: number; // stability + ability to absorb shocks for others
};

function norm(a: number, b: number): [number, number] {
  // map two values to 0..100 relative scores (higher = better)
  if (a === b) return [50, 50];
  const lo = Math.min(a, b),
    hi = Math.max(a, b);
  const sa = ((a - lo) / (hi - lo)) * 100;
  const sb = ((b - lo) / (hi - lo)) * 100;
  return [Math.round(sa), Math.round(sb)];
}

export type Synthesis = {
  scoreA: PathScore;
  scoreB: PathScore;
  /** Per-value, which path serves it better and by how much (signed, -100..100, + favors A). */
  valueLean: Record<ValuePriority, number>;
  /** The headline read, ordered by the player's value ranking. */
  topValue: ValuePriority;
  recommendation: "A" | "B" | "close";
  /** Plain, honest summary line (fallback if AI narration absent). */
  line: string;
};

export function synthesize(
  a: LifeProfile,
  b: LifeProfile,
  lifeA: SimulatedLife,
  lifeB: SimulatedLife,
  persona: Persona,
): Synthesis {
  // Raw signals
  const leftoverA = lifeA.months.at(-1)?.leftover ?? 0;
  const leftoverB = lifeB.months.at(-1)?.leftover ?? 0;
  const [secA, secB] = norm(lifeA.minRunway, lifeB.minRunway);
  const [lifeAS, lifeBS] = norm(leftoverA, leftoverB);
  const [growA, growB] = norm(lifeA.finalBalance, lifeB.finalBalance);
  // freedom: high runway + high leftover (optionality)
  const [freeA, freeB] = norm(
    lifeA.minRunway * 1000 + leftoverA,
    lifeB.minRunway * 1000 + leftoverB,
  );
  // family: ability to absorb shocks (runway) + final cushion
  const [famA, famB] = norm(
    lifeA.minRunway * 800 + lifeA.finalBalance / 12,
    lifeB.minRunway * 800 + lifeB.finalBalance / 12,
  );

  const scoreA: PathScore = {
    security: secA,
    lifestyle: lifeAS,
    growth: growA,
    freedom: freeA,
    family: famA,
  };
  const scoreB: PathScore = {
    security: secB,
    lifestyle: lifeBS,
    growth: growB,
    freedom: freeB,
    family: famB,
  };

  const valueLean: Record<ValuePriority, number> = {
    security: scoreA.security - scoreB.security,
    lifestyle: scoreA.lifestyle - scoreB.lifestyle,
    growth: scoreA.growth - scoreB.growth,
    freedom: scoreA.freedom - scoreB.freedom,
    family: scoreA.family - scoreB.family,
  };

  // Weighted overall, by the player's value ranking (rank 0 weighs most).
  const weights: Record<ValuePriority, number> = {
    security: 1,
    lifestyle: 1,
    growth: 1,
    freedom: 1,
    family: 1,
  };
  persona.values.forEach((v, i) => (weights[v] = persona.values.length - i));
  let weighted = 0;
  (Object.keys(valueLean) as ValuePriority[]).forEach(
    (v) => (weighted += valueLean[v] * weights[v]),
  );

  const recommendation: Synthesis["recommendation"] =
    Math.abs(weighted) < 40 ? "close" : weighted > 0 ? "A" : "B";

  const topValue = persona.values[0];
  const topLean = valueLean[topValue];
  const winner = topLean >= 0 ? a.label : b.label;

  const VALUE_PHRASE: Record<ValuePriority, string> = {
    security: "a cushion and peace of mind",
    lifestyle: "living well month to month",
    growth: "building wealth over time",
    freedom: "flexibility and options",
    family: "stability for the people you support",
  };

  let line: string;
  if (recommendation === "close") {
    line = `It's genuinely close. On what you care about most - ${VALUE_PHRASE[topValue]} - ${winner} has a slight edge, but money alone won't decide this one.`;
  } else {
    const recProfile = recommendation === "A" ? a : b;
    line = `Weighing what you said matters - starting with ${VALUE_PHRASE[topValue]} - ${recProfile.label} fits you better. ${winner === recProfile.label ? "It leads on your top priority too." : "Even though " + winner + " edges your top priority, the rest tilts the other way."}`;
  }

  return { scoreA, scoreB, valueLean, topValue, recommendation, line };
}
