/**
 * Groq OpenAI-compatible chat - powers /api/parse, /api/narrate, /api/whatif.
 * Falls back gracefully when GROQ_API_KEY is unset.
 */

export const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export async function groqChat(
  prompt: string,
  maxTokens = 300,
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export function parseJsonFromLLM(raw: string): unknown {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
