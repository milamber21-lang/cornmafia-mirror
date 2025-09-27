// FILE: apps/web/src/app/admin/land-plots/check-claim/page.tsx
// Language: TSX

import { getServerSession } from "next-auth";
import Link from "next/link";
import { buildAuthOptions } from "@/lib/auth-options";
import { Button, Table, THead, TBody, TR, TH, TD, Input } from "@/components/ui";
import CheckClaimClient from "./Client";
import {
  checkClaimByIndex,
  type CheckClaimResult,
} from "./data";

function getSearchParam(sp: unknown, key: string): string | null {
  if (!sp || typeof sp !== "object") return null;
  const v = (sp as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function s(u: unknown): string {
  return typeof u === "string" ? u : "";
}

export const dynamic = "force-dynamic";

export default async function Page(props: { searchParams?: Promise<Record<string, unknown>> }) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Claim Checker</h1>
        <p>Not authorized.</p>
        <Link href="/admin"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  const sp = (await props.searchParams) ?? {};
  const indexStr = getSearchParam(sp, "index") ?? "";
  const normalized = indexStr.trim();
  const indexNum = normalized ? Number(normalized) : NaN;

  let result: CheckClaimResult | null = null;
  let error: string | null = null;

  if (normalized) {
    if (Number.isFinite(indexNum)) {
      try {
        result = await checkClaimByIndex(actorDiscordId, Math.trunc(indexNum));
      } catch (e: unknown) {
        error = e instanceof Error ? e.message : String(e);
      }
    } else {
      error = "Index must be a number";
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Claim Checker</h1>
        <Link href="/admin"><Button variant="neutral">Back to Admin</Button></Link>
      </div>

      <CheckClaimClient initialIndex={normalized} />

      {!normalized ? (
        <div className="text-[var(--color-muted)]">Enter an NFT Index above to check claim status.</div>
      ) : error ? (
        <div className="text-red-400">Error: {error}</div>
      ) : result ? (
        <>
          {result.claimed.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Matched Status (Claimed)</h2>
              <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <Table>
                  <THead>
                    <TR>
                      <TH className="text-left">Status</TH>
                      <TH className="text-left">Rarity</TH>
                      <TH className="text-left">Size</TH>
                      <TH className="text-left">Plot ID</TH>
                      <TH className="text-left">Sector</TH>
                      <TH className="text-left">District</TH>
                      <TH className="text-left">Town</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {result.claimed.map((row) => (
                      <TR key={`claimed-${row.plotId}`}>
                        <TD className="font-semibold text-green-500">Claimed</TD>
                        <TD className="capitalize">{s(row.rarity) || "—"}</TD>
                        <TD className="capitalize">{row.size}</TD>
                        <TD>{row.plotId}</TD>
                        <TD>{row.sector}</TD>
                        <TD>{row.district}</TD>
                        <TD>{row.town}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">No matching Status — Pending candidates</h2>
              {result.pending.length === 0 ? (
                <div className="text-[var(--color-muted)]">
                  No NFT Index entries found with index <strong>{normalized}</strong>.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                  <Table>
                    <THead>
                      <TR>
                        <TH className="text-left">Status</TH>
                        <TH className="text-left">Rarity</TH>
                        <TH className="text-left">Size</TH>
                        <TH className="text-left">Plot ID</TH>
                        <TH className="text-left">Sector</TH>
                        <TH className="text-left">District</TH>
                        <TH className="text-left">Town</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {result.pending.map((row) => (
                        <TR key={`pending-${row.plotId}`}>
                          <TD className="text-[var(--color-muted)]">Pending</TD>
                          <TD className="capitalize">{s(row.rarity) || "—"}</TD>
                          <TD className="capitalize">{row.size}</TD>
                          <TD>{row.plotId}</TD>
                          <TD>{row.sector}</TD>
                          <TD>{row.district}</TD>
                          <TD>{row.town}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
