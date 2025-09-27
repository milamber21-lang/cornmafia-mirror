// FILE: apps/web/src/app/api/land-plot-aggregates/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { aggregateSectorOnce, aggregateDistrictOnce } from "@/app/admin/land-plots/overview/data";
import { findSectorBySlug, findDistrictBySlugs } from "@/app/admin/land-plots/overview/hierarchy";

/**
 * GET /api/land-plot-aggregates
 *
 * Query params:
 *  - level: "sector" | "district"
 *  - sector: sector slug (e.g., "Solace-1")
 *  - district: district slug (when level=district, e.g., "District-1")
 *  - debug: "1" (optional) → include extra debug fields
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = (searchParams.get("level") || "").trim().toLowerCase();
  const sectorSlug = (searchParams.get("sector") || "").trim();
  const districtSlug = (searchParams.get("district") || "").trim();
  const debug = (searchParams.get("debug") || "").trim() === "1";

  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    const body = debug
      ? { error: "Unauthorized", debug: { hasSession: false, level, sectorSlug, districtSlug } }
      : { error: "Unauthorized" };
    return NextResponse.json(body, { status: 401 });
  }

  try {
    if (level === "sector") {
      const sectorDef = findSectorBySlug(sectorSlug);
      if (!sectorDef) {
        const body = debug
          ? { error: "Unknown sector", debug: { level, sectorSlug } }
          : { error: "Unknown sector" };
        return NextResponse.json(body, { status: 404 });
      }
      const data = await aggregateSectorOnce(actorDiscordId, sectorDef.slug);
      return NextResponse.json(debug ? { ...data, _debug: { actorDiscordId } } : data, { status: 200 });
    }

    if (level === "district") {
      const combo = findDistrictBySlugs(sectorSlug, districtSlug);
      if (!combo) {
        const body = debug
          ? { error: "Unknown sector or district", debug: { level, sectorSlug, districtSlug } }
          : { error: "Unknown sector or district" };
        return NextResponse.json(body, { status: 404 });
      }
      const data = await aggregateDistrictOnce(actorDiscordId, combo.sector.slug, combo.district.slug);
      return NextResponse.json(debug ? { ...data, _debug: { actorDiscordId } } : data, { status: 200 });
    }

    const body = debug
      ? { error: "Invalid level", debug: { level, sectorSlug, districtSlug } }
      : { error: "Invalid level" };
    return NextResponse.json(body, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const body = debug
      ? { error: "Internal error", detail: msg, debug: { level, sectorSlug, districtSlug } }
      : { error: "Internal error", detail: msg };
    return NextResponse.json(body, { status: 500 });
  }
}

export const revalidate = 600;
