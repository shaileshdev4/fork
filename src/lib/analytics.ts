/**
 * Analytics helpers — thin, safe wrappers over the globally injected pendo snippet.
 * Fork has no user accounts or server, so we assign a persistent anonymous visitor ID
 * stored in localStorage. Every export is a no-op if pendo hasn't loaded yet or
 * localStorage is unavailable — they will never throw.
 */

// Must match the key used by PendoInitializer.tsx so both modules share the same UUID.
const VID_KEY = "fork-pendo-visitor";

/** Get or create a persistent anonymous visitor ID. */
export function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Fire a named analytics event with optional properties. */
export function track(event: string, props?: Record<string, unknown>): void {
  try {
    // pendo is declared as a global ambient var in global.d.ts and queues
    // calls internally until the full agent script has loaded.
    pendo.track(event, props ?? {});
  } catch {}
}

/**
 * Update visitor metadata after the persona is known.
 * Called once after persona_completed so every subsequent event carries
 * lifeStage, topValues, and sessionType dimensions.
 */
export function identifyVisitor(metadata: Record<string, unknown>): void {
  try {
    const vid = getOrCreateVisitorId();
    if (!vid) return;
    pendo.identify({ visitor: { id: vid, ...metadata } });
  } catch {}
}
