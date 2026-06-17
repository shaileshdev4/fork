import { NextRequest, NextResponse } from "next/server";
import { groqChat, parseJsonFromLLM } from "@/lib/groq";

/**
 * POST /api/whatif { text: "what if I lose my job in year 2" }
 * Groq (Llama) maps a natural-language worry into a structured Perturbation the
 * simulation understands. Falls back to keyword matching.
 */

function fallback(text: string) {
  const t = text.toLowerCase();
  const monthMatch = t.match(/year\s*(\d)/);
  const baseMonth = monthMatch ? Math.max(1, (Number(monthMatch[1]) - 1) * 12 + 6) : 14;
  if (/(laid off|lose my job|fired|unemploy|layoff)/.test(t)) {
    const mm = t.match(/(\d+)\s*month/);
    return { kind: "layoff", atMonth: baseMonth, monthsUnemployed: mm ? Number(mm[1]) : 4 };
  }
  if (/(rent|housing).*(up|rise|spike|increase|jump)/.test(t) || /rent/.test(t)) {
    const pm = t.match(/(\d+)\s*%/);
    return { kind: "rent_spike", atMonth: baseMonth, pct: pm ? Number(pm[1]) / 100 : 0.2 };
  }
  if (/(recession|downturn|economy|crash)/.test(t)) {
    return { kind: "recession", atMonth: baseMonth, incomeCutPct: 0.15, months: 12 };
  }
  if (/(pay cut|salary cut|less money|income drop|demot)/.test(t)) {
    const pm = t.match(/(\d+)\s*%/);
    return { kind: "income_drop", atMonth: baseMonth, pct: pm ? Number(pm[1]) / 100 : 0.2, permanent: /forever|permanent/.test(t) };
  }
  return { kind: "none" };
}

export async function POST(req: NextRequest) {
  const { text } = (await req.json().catch(() => ({ text: "" }))) as { text?: string };
  if (!text) return NextResponse.json({ kind: "none" });

  const prompt = `Map this financial worry into a JSON "perturbation" for a 36-month life simulation: "${text}".
Return ONLY JSON, one of these shapes:
{"kind":"layoff","atMonth":<1-36>,"monthsUnemployed":<int>}
{"kind":"rent_spike","atMonth":<1-36>,"pct":<0..1>}
{"kind":"recession","atMonth":<1-36>,"incomeCutPct":<0..1>,"months":<int>}
{"kind":"income_drop","atMonth":<1-36>,"pct":<0..1>,"permanent":<bool>}
{"kind":"big_expense","atMonth":<1-36>,"amount":<number>,"label":"<short>"}
{"kind":"none"}
"year 2" -> around month 18. Default atMonth 14 if unspecified. Choose the closest single shape.`;

  try {
    const out = await groqChat(prompt, 150);
    if (!out) return NextResponse.json(fallback(text));
    return NextResponse.json(parseJsonFromLLM(out));
  } catch {
    return NextResponse.json(fallback(text));
  }
}
