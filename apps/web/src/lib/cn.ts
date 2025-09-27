// FILE: apps/web/src/lib/cn.ts
// Simple className combiner with strict typing (no `any`).
// Usage: cn("a", condition && "b", ["c", "d"], { e: true, f: false }) => "a b c d e"

export function cn(...args: unknown[]): string {
  const out: string[] = [];

  for (const a of args) {
    if (!a) continue;

    if (typeof a === "string") {
      out.push(a);
      continue;
    }

    if (Array.isArray(a)) {
      // Recursively flatten arrays of class values
      out.push(cn(...(a as unknown[])));
      continue;
    }

    if (typeof a === "object") {
      // Object form: { className: truthy }
      for (const [key, val] of Object.entries(a as Record<string, unknown>)) {
        if (val) out.push(key);
      }
      continue;
    }
  }

  return out.join(" ");
}
