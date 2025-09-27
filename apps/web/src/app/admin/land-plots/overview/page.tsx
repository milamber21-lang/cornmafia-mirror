// FILE: apps/web/src/app/admin/land-plots/overview/page.tsx
// Language: TSX

import Link from "next/link";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { Button } from "@/components/ui";
import SummaryTable from "./SummaryTable";
import { HIERARCHY } from "./hierarchy";
import type { SizeCounts } from "./data";
import { getSectorAggregateCached } from "./aggregates-cache";

// Keep dynamic (session check), but heavy data is cached & shared.
export const dynamic = "force-dynamic";

type SectorAggregate = {
  sector: string;
  sectorSlug: string;
  sectorTotals: SizeCounts;
  byDistrict: Record<string, SizeCounts>;
};

export default async function OverviewPage() {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Land Plots – Overview</h1>
        <p>Not authorized.</p>
        <Link href="/admin"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  const aggregates = await Promise.all(
    HIERARCHY.map(async (sector) => {
      try {
        const data = await getSectorAggregateCached(actorDiscordId, sector.slug);
        return { slug: sector.slug, data };
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : String(e);
        return { slug: sector.slug, data: null as SectorAggregate | null, error };
      }
    })
  );

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Land Plots – Overview (Sectors)</h1>
        <Link href="/admin"><Button variant="neutral">Go back</Button></Link>
      </div>

      {HIERARCHY.map((sector) => {
        const entry = aggregates.find((a) => a.slug === sector.slug);
        const good = !!entry?.data;
        return (
          <div key={sector.slug} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{sector.key}</h2>
              <Link href={`/admin/land-plots/overview/sector/${sector.slug}`}>
                <Button>View detail</Button>
              </Link>
            </div>
            {good ? (
              <SummaryTable data={(entry!.data as SectorAggregate).sectorTotals} />
            ) : (
              <div className="text-[var(--color-muted)]">
                No data{entry?.error ? ` (${entry.error})` : ""}.
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
