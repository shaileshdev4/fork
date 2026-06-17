/**
 * Save/resume. A real financial decision is revisited over days, so we
 * persist the run locally. No account, no server - just the browser.
 */
import type { LifeProfile } from "./profile";
import type { Persona } from "./persona";
import type { Choices } from "./simulation";

const KEY = "fork:lastRun:v1";

export type SavedRun = {
  a: LifeProfile;
  b: LifeProfile;
  persona: Persona;
  choicesA: Choices;
  choicesB: Choices;
  savedAt: number;
};

export function saveRun(run: Omit<SavedRun, "savedAt">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...run, savedAt: Date.now() }));
  } catch {}
}

export function loadRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as SavedRun;
    if (!r.a || !r.b || !r.persona) return null;
    return r;
  } catch {
    return null;
  }
}

export function clearRun() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
