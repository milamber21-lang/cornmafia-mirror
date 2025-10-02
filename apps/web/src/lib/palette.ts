// FILE: apps/web/lib/palette.ts
/**
 * Icon color tokens -> CSS variables from globals.css
 * This way the palette is driven by theme (cm-dark / etc.) without hardcoding hex in TS.
 */

export const ICON_PALETTE: Record<string, string> = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  text: 'var(--color-text)',
  muted: 'var(--color-muted)',
  border: 'var(--color-border)',
  red: 'var(--brand-red)',
};

/** Helper: resolve a token to a CSS color string (CSS var). Falls back to currentColor. */
export function iconColor(token?: string): string | undefined {
  if (!token) return undefined;
  return ICON_PALETTE[token] || undefined;
}
