// FILE: apps/web/src/app/admin/land-plots/overview/sector/[sector]/district/[district]/page.tsx
// Language: TSX

import Link from "next/link";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { Button } from "@/components/ui";
import { findDistrictBySlugs } from "../../../../hierarchy";
import SummaryTable from "../../../../SummaryTable";
import { getDistrictAggregateCached } from "../../../../aggregates-cache";
import type { SizeCounts } from "../../../../data";

function getParam(params: unknown, key: string): string | null {
  if (!params || typeof params !== "object") return null;
  const v = (params as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

// Same normalization as data layer for fallback lookups
function norm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .replace(/[\u2019\u2018\u02BC'`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type DistrictAggregate = {
  sector: string;
  sectorSlug: string;
  district: string;
  districtSlug: string;
  districtTotals: SizeCounts;
  byTown: Record<string, SizeCounts>;
};

export const dynamic = "force-dynamic";

export default async function DistrictPage(props: { params?: Promise<Record<string, unknown>> }) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">District</h1>
        <p>Not authorized.</p>
        <Link href="/admin/land-plots/overview"><Button variant="neutral">Go back</Button></Link>
      </section>
    );
  }

  const awaitedParams = (await props.params) ?? {};
  const sectorSlug = getParam(awaitedParams, "sector");
  const districtSlug = getParam(awaitedParams, "district");

  const combo = sectorSlug && districtSlug ? findDistrictBySlugs(sectorSlug, districtSlug) : null;
  if (!combo) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">District</h1>
        <p>Unknown sector or district.</p>
        <Link href={`/admin/land-plots/overview/sector/${encodeURIComponent(sectorSlug ?? "")}`}>
          <Button variant="neutral">Go back</Button>
        </Link>
      </section>
    );
  }

  let resp: DistrictAggregate | null = null;
  let err: string | null = null;
  try {
    resp = await getDistrictAggregateCached(actorDiscordId, combo.sector.slug, combo.district.slug);
  } catch (e: unknown) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {combo.sector.key} — {combo.district.key}{" "}
          <span className="text-[var(--color-muted)]">({combo.district.label})</span>
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/land-plots/overview/sector/${combo.sector.slug}`}>
            <Button variant="neutral">Go back</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Totals</h2>
        {resp ? (
          <SummaryTable data={resp.districtTotals} />
        ) : (
          <div className="text-[var(--color-muted)]">
            No data{err ? ` (${err})` : ""}.
          </div>
        )}
      </div>

      {combo.district.towns.map((t) => {
        // Robust lookup: try key, slug, and normalized fallbacks
        const candidates = [t.key, t.slug, norm(t.key), norm(t.slug)];
        let data: SizeCounts | undefined = undefined;
        if (resp) {
          for (const k of candidates) {
            if (k && resp.byTown[k]) {
              data = resp.byTown[k];
              break;
            }
          }
        }

        return (
          <div key={t.slug} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.key}</h2>
            </div>
            {data ? <SummaryTable data={data} /> : <div className="text-[var(--color-muted)]">No data</div>}
          </div>
        );
      })}
    </section>
  );
}
