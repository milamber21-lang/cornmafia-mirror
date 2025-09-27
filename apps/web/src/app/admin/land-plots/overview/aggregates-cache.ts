// FILE: apps/web/src/app/admin/land-plots/overview/aggregates-cache.ts
// Language: TypeScript

import { unstable_cache } from "next/cache";
import { aggregateSectorOnce, aggregateDistrictOnce } from "./data";

/**
 * Semi-static, taggable cache wrappers around your aggregators.
 * We use a per-call `unstable_cache` so we can assign dynamic tags.
 * Default revalidate is 600s (10 minutes) — adjust as you like.
 */

const DEFAULT_REVALIDATE_SECONDS = 600;

export async function getSectorAggregateCached(actorDiscordId: string, sectorSlug: string) {
  // cache key parts must be deterministic and only include serializable strings
  const keyParts = ["agg-sector", sectorSlug];
  const tags = [`agg:sector:${sectorSlug}`, "agg:all"];

  const cached = unstable_cache(
    async () => {
      // delegate to your real aggregator (does the CMS fetches)
      return aggregateSectorOnce(actorDiscordId, sectorSlug);
    },
    keyParts,
    {
      revalidate: DEFAULT_REVALIDATE_SECONDS,
      tags,
    }
  );

  return cached();
}

export async function getDistrictAggregateCached(
  actorDiscordId: string,
  sectorSlug: string,
  districtSlug: string
) {
  const keyParts = ["agg-district", sectorSlug, districtSlug];
  const tags = [`agg:district:${sectorSlug}:${districtSlug}`, `agg:sector:${sectorSlug}`, "agg:all"];

  const cached = unstable_cache(
    async () => {
      return aggregateDistrictOnce(actorDiscordId, sectorSlug, districtSlug);
    },
    keyParts,
    {
      revalidate: DEFAULT_REVALIDATE_SECONDS,
      tags,
    }
  );

  return cached();
}
