// apps/web/src/app/login/LoginClient.tsx
"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";

type RoleSource = "discord" | "virtual";
type Role = {
  id: string;
  name: string;
  source: RoleSource;
  roleId?: string | null;
  colorHex?: string | null;
  rank: number;
  isPublicDefault?: boolean;
  isAuthenticatedDefault?: boolean;
};

type RolesOk = {
  ok: true;
  roleIds: string[];
  rank: number;
  roles: Role[];
  defaults?: { public: Role | null; authenticated: Role | null };
};
type RolesErr = { ok: false; error: string };
type RolesResponse = RolesOk | RolesErr;

export default function LoginClient({ session }: { session: Session | null }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function go() {
      setLoading(true);
      try {
        const res = await fetch("/api/me/roles", { cache: "no-store" });
        const json: RolesResponse = await res.json();
        if (!cancelled) {
          if ("ok" in json && json.ok) {
            setRoles(json.roles);
            setRank(json.rank);
          } else {
            setErr((json as RolesErr).error ?? "Failed to load roles");
          }
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (session) go();
    return () => { cancelled = true; };
  }, [session]);

  return (
    <div className="space-y-6">
      {/* your existing greeting / sign-out UI stays here */}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your Discord roles</h2>
        {loading && <p>Loading roles…</p>}
        {err && <p className="text-red-600">Error: {err}</p>}
        {!loading && !err && (
          roles.length ? (
            <ul className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <li
                  key={r.id}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                  style={r.colorHex ? { borderColor: r.colorHex, color: r.colorHex } : undefined}
                  title={r.roleId ?? ""}
                >
                  {r.name}{typeof r.rank === "number" ? <span className="ml-1 opacity-70">· rank {r.rank}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>No guild roles found (you may only have the default access).</p>
          )
        )}
        <p className="text-sm text-gray-500">Computed read rank: <strong>{rank}</strong></p>
      </section>
    </div>
  );
}
