// FILE: apps/cms/src/utils/debug.ts
// Language: TypeScript

/** Lightweight debug logger for the Media collection. Toggle via DEBUG_MEDIA=1. */
export function isMediaDebugEnabled(): boolean {
  return String(process.env.DEBUG_MEDIA || "").trim() === "1";
}

function safe(v: unknown): unknown {
  // Avoid huge dumps; keep primitives, arrays (first few), and shallow objects
  if (v == null) return v;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 10);
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).slice(0, 20)) {
      out[k] = (v as Record<string, unknown>)[k];
    }
    return out;
  }
  return String(v);
}

/** Prefix logs so they’re easy to grep in docker logs. */
export function mediaDebug(label: string, payload?: Record<string, unknown>): void {
  if (!isMediaDebugEnabled()) return;
  const ts = new Date().toISOString();
  const body: Record<string, unknown> = {};
  if (payload) {
    for (const [k, v] of Object.entries(payload)) body[k] = safe(v);
  }
  console.log(`[MEDIA-DEBUG] ${ts} ${label}`, body);
}
