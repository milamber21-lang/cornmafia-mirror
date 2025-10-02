// FILE: apps/web/src/lib/cms.ts
// Small helper to call the CMS REST API from the web server.

const INTERNAL_URL = process.env.CMS_INTERNAL_URL;
const PUBLIC_URL = process.env.CMS_PUBLIC_URL;

function getCmsBase(): string {
  // Prefer internal URL when running inside Docker, fall back to public
  return INTERNAL_URL || PUBLIC_URL || "";
}

export async function cmsFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getCmsBase();
  if (!base) throw new Error("CMS url not configured (CMS_INTERNAL_URL / CMS_PUBLIC_URL)");
  const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    // CMS role config is small; don't cache at CDN layer
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CMS request failed ${res.status}: ${text || url}`);
  }
  return (await res.json()) as T;
}
