// FILE: apps/web/src/components/login/RolesPanel.tsx
"use client";

import { useEffect, useState } from "react";

type Role = {
  id: string;
  name: string;
  source: "discord" | "virtual";
  roleId?: string | null;
  colorHex?: string | null;
  rank: number;
  isPublicDefault?: boolean;
  isAuthenticatedDefault?: boolean;
};

type RolesResponse =
  | {
      ok: true;
      roleIds: string[];
      rank: number;
      roles: Role[];
      defaults?: { public: Role | null; authenticated: Role | null };
    }
  | { ok: false; error: string };

export default function RolesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/me/roles", { cache: "no-store" });
        const json: RolesResponse = await res.json();
        if (!cancelled) {
          if ("ok" in json && json.ok) {
            setRoles(json.roles ?? []);
          } else {
            setErr((json as { error?: string }).error || "Failed to load roles");
          }
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Your Roles</h2>
      {loading && <p>Loading roles...</p>}
      {err && <p className="text-red-600">Error: {err}</p>}
      {!loading && !err && (
        roles.length ? (
          <ul className="grid gap-2">
            {roles.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {r.colorHex ? (
                    <span
                      className="inline-block rounded-full ring-1 ring-[var(--color-border)]"
                      style={{ width: 12, height: 12, background: `#${r.colorHex.replace(/^#/, "")}` }}
                      aria-hidden
                    />
                  ) : null}
                  <span>{r.name}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No guild roles found.</p>
        )
      )}
    </section>
  );
}
