import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

/**
 * POST /api/narrate  { facts: {...computed numbers...} }
 * Groq (Llama) turns the COMPUTED numbers into a plain-language, personalized verdict.
 * It is given only the already-computed facts and is instructed never to invent
 * figures - the math stays deterministic; AI only does the storytelling.
 * Falls back to a templated sentence if no key / on failure.
 */

type Facts = {
  aLabel: string;
  bLabel: string;
  aLeftover: number;
  bLeftover: number;
  aFinal: number;
  bFinal: number;
  aMinRunway: number;
  bMinRunway: number;
  currency: string;
  topDriver: string;
  topValue?: string;
  recommendation?: string;
};

function template(f: Facts): string {
  const lifeWinner = f.aFinal >= f.bFinal ? f.aLabel : f.bLabel;
  const monthWinner = f.aLeftover >= f.bLeftover ? f.aLabel : f.bLabel;
  const flips = lifeWinner !== monthWinner;
  if (flips) {
    return `${monthWinner} leaves more in your pocket each month, but ${lifeWinner} banks more over three years - the gap is mostly ${f.topDriver}. Watch the runway: it dips lowest to ${Math.min(f.aMinRunway, f.bMinRunway).toFixed(1)} months on one path.`;
  }
  return `${lifeWinner} wins on both fronts - more each month and more saved over time, driven mainly by ${f.topDriver}.`;
}

export async function POST(req: NextRequest) {
  const facts = (await req.json().catch(() => null)) as Facts | null;
  if (!facts) return NextResponse.json({ text: "" });

  const prompt = `You are a calm, honest financial guide helping someone make a real life decision. Using ONLY these already-computed numbers, write a 2-sentence plain-language read. Do not invent or change any number. Be specific, warm, and human - not salesy.\nNumbers: ${JSON.stringify(facts)}.\nThe person said their top priority is "${facts.topValue ?? "security"}". Speak to THAT - tell them what each path means for what they care about, name the main driver (${facts.topDriver}), and be honest if it is close. Under 50 words.`;

  try {
    const out = await groqChat(prompt, 150);
    return NextResponse.json({ text: out || template(facts) });
  } catch {
    return NextResponse.json({ text: template(facts) });
  }
}
