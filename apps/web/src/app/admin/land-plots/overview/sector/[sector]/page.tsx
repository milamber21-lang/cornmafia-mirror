// FILE: apps/web/src/app/admin/land-plots/overview/sector/[sector]/page.tsx
// Language: TSX

import Link from "next/link";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { Button } from "@/components/ui";
import { findSectorBySlug } from "../../hierarchy";
import SummaryTable from "../../SummaryTable";
import { getSectorAggregateCached } from "../../aggregates-cache";
import type { SizeCounts } from "../../data";

function getParam(params: unknown, key: string): string | null {
  if (!params || typeof params !== "object") return null;
  const v = (params as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

type SectorAggregate = {
  sector: string;
  sectorSlug: string;
  sectorTotals: SizeCounts;
  byDistrict: Record<string, SizeCounts>;
};

export const dynamic = "force-dynamic";

export default async function SectorPage(props: { params?: Promise<Record<string, unknown>> }) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Sector</h1>
        <p>Not authorized.</p>
        <Link href="/admin/land-plots/overview"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  const awaitedParams = (await props.params) ?? {};
  const sectorSlug = getParam(awaitedParams, "sector");
  if (!sectorSlug) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Sector</h1>
        <p>Missing sector.</p>
        <Link href="/admin/land-plots/overview"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  const sectorDef = findSectorBySlug(sectorSlug);
  if (!sectorDef) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Sector: {sectorSlug}</h1>
        <p>Unknown sector.</p>
        <Link href="/admin/land-plots/overview"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  let resp: SectorAggregate | null = null;
  let err: string | null = null;
  try {
    resp = await getSectorAggregateCached(actorDiscordId, sectorDef.slug);
  } catch (e: unknown) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sector: {sectorDef.key}</h1>
        <div className="flex gap-2">
          <Link href="/admin/land-plots/overview"><Button variant="neutral">Go back</Button></Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Totals</h2>
        {resp ? (
          <SummaryTable data={resp.sectorTotals} />
        ) : (
          <div className="text-[var(--color-muted)]">No data{err ? ` (${err})` : ""}.</div>
        )}
      </div>

      {sectorDef.districts.map((d) => {
        const data = resp ? resp.byDistrict[d.key] : undefined;
        return (
          <div key={d.slug} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {d.key} <span className="text-[var(--color-muted)]">({d.label})</span>
              </h2>
              <Link href={`/admin/land-plots/overview/sector/${sectorDef.slug}/district/${d.slug}`}>
                <Button>View detail</Button>
              </Link>
            </div>
            {data ? <SummaryTable data={data} /> : <div className="text-[var(--color-muted)]">No data</div>}
          </div>
        );
      })}
    </section>
  );
}
