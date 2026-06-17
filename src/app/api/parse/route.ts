import { NextRequest, NextResponse } from "next/server";
import { KNOWN_CITIES } from "@/lib/data/cityData";
import { groqChat, parseJsonFromLLM } from "@/lib/groq";

/**
 * POST /api/parse  { text: "I might move from Toronto to Austin for a job paying 140k" }
 * Uses Groq (Llama) to extract structured fork inputs from one natural sentence.
 * Falls back to a keyword extractor if no key / on failure - AI is an accelerant,
 * never a single point of failure.
 */

type Parsed = {
  optionA: { label: string; city: string; salary: number | null };
  optionB: { label: string; city: string; salary: number | null };
  note?: string;
};

function parseSalary(text: string): number | null {
  const lakh = text.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  if (lakh) return Math.round(Number(lakh[1]) * 100000);
  const lSuffix = text.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (lSuffix) return Math.round(Number(lSuffix[1]) * 100000);
  const kMatch = text.match(/(\d{2,3})\s*k/i);
  if (kMatch) return Number(kMatch[1]) * 1000;
  const dollarMatch = text.match(/\$?\s*(\d{2,3}[,.]?\d{0,3})/);
  if (dollarMatch) {
    const raw = dollarMatch[1].replace(/[,.]/g, "");
    return raw.length <= 3 ? Number(raw) * 1000 : Number(raw);
  }
  return null;
}

function keywordFallback(text: string): Parsed {
  const cities = KNOWN_CITIES.filter((c) =>
    text.toLowerCase().includes(c.toLowerCase()),
  );
  const salaries: number[] = [];
  const lakhAll = [...text.matchAll(/(\d+(?:\.\d+)?)\s*lakh/gi)];
  for (const m of lakhAll) salaries.push(Math.round(Number(m[1]) * 100000));
  const lAll = [...text.matchAll(/(\d+(?:\.\d+)?)\s*l\b/gi)];
  for (const m of lAll) salaries.push(Math.round(Number(m[1]) * 100000));
  const salary = salaries[0] ?? parseSalary(text);
  const a = cities[0] ?? "Austin";
  const b = cities[1] ?? "San Francisco";
  return {
    optionA: { label: a, city: a, salary: salaries[0] ?? salary },
    optionB: {
      label: b,
      city: b,
      salary: salaries[1] ?? (salary ? Math.round(salary * 1.15) : null),
    },
    note: "Parsed locally - adjust anything below.",
  };
}

export async function POST(req: NextRequest) {
  const { text } = (await req.json().catch(() => ({ text: "" }))) as {
    text?: string;
  };
  if (!text || text.trim().length < 3) {
    return NextResponse.json(keywordFallback(""));
  }

  const cityList = KNOWN_CITIES.join(", ");
  const prompt = `Extract a two-option financial relocation/job decision from this sentence: "${text}".
Known cities (prefer these spellings; map nearby/synonyms): ${cityList}.
Return ONLY compact JSON, no prose, shape:
{"optionA":{"label":string,"city":string,"salary":number|null},"optionB":{"label":string,"city":string,"salary":number|null}}
Rules: salary is annual gross as a number (e.g. "140k" -> 140000, "25 lakh" -> 2500000, "30L" -> 3000000). If a city isn't in the known list, still return its proper name. If only one option is stated, infer the other as the person's current situation if mentioned, else leave city empty. Never invent salaries that weren't stated; use null.`;

  try {
    const out = await groqChat(prompt, 300);
    if (!out) return NextResponse.json(keywordFallback(text));
    const parsed = parseJsonFromLLM(out) as Parsed;
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(keywordFallback(text));
  }
}
