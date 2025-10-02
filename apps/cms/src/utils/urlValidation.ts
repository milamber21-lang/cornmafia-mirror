// FILE: apps/cms/src/utils/urlValidation.ts
export function isValidUrlLike(input?: string | null): boolean {
  if (!input) return true;
  // Accept absolute URLs or site-relative paths starting with "/"
  if (input.startsWith('/')) return true;
  try {
    const u = new URL(input);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
}
