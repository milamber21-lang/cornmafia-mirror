// FILE: apps/web/src/app/admin/land-plots/overview/hierarchy.ts
// Language: TypeScript

export type SectorKey = "Solace 1" | "Solace 2" | "Solace 3";

export type DistrictKey =
  | "District 1" | "District 2" | "District 3" | "District 4"
  | "District 5" | "District 6" | "District 7" | "District 8"
  | "District 9" | "District 10" | "District 11" | "District 12";

export type TownKey =
  | "Silver Springs" | "Riverbend" | "Quarryside"
  | "Green Meadows" | "Elmwood" | "Willowbrook"
  | "Fox Hollow" | "Sunnyside" | "Eagle's Perch"
  | "Rocky Rapids" | "Millfield" | "Vista Plains"
  | "Smith's Shallows" | "Rapid Meadow" | "Orange Falls"
  | "Timber Creek" | "Pinehurst" | "Small Stone"
  | "Stone's Seat" | "Little Monument" | "Raven Hills"
  | "Lakeview" | "Wolf Grove" | "Wind's Wake"
  | "Warden's Watch" | "Wither Wood" | "Fernwood"
  | "Laurel Hill" | "Ivy Creek" | "Crystal Falls"
  | "Canyon Views" | "Cedarville" | "Hawk's Hunt"
  | "Stonebridges" | "Aspen Valley" | "Heritage Rapids";

export type DistrictDef = {
  key: DistrictKey;          // e.g., "District 1"
  label: string;             // pretty name in parentheses
  slug: string;              // hyphen slug for routes: "District-1"
  towns: Array<{ key: TownKey; slug: string }>;
};

export type SectorDef = {
  key: SectorKey;            // e.g., "Solace 1"
  slug: string;              // "Solace-1"
  districts: DistrictDef[];
};

// Export slugger so pages/utilities can normalize consistently
export function toSlug(s: string): string {
  // Keep it simple: just replace spaces with hyphens (do not strip apostrophes or special chars).
  return s.replace(/ /g, "-");
}

export const HIERARCHY: SectorDef[] = [
  {
    key: "Solace 1",
    slug: "Solace-1",
    districts: [
      { key: "District 1", label: "Mountain Springs", slug: "District-1", towns: [
        { key: "Silver Springs", slug: "Silver-Springs" },
        { key: "Riverbend", slug: "Riverbend" },
        { key: "Quarryside", slug: "Quarryside" },
      ]},
      { key: "District 2", label: "Clearview", slug: "District-2", towns: [
        { key: "Green Meadows", slug: "Green-Meadows" },
        { key: "Elmwood", slug: "Elmwood" },
        { key: "Willowbrook", slug: "Willowbrook" },
      ]},
      { key: "District 3", label: "Panorama Meadows", slug: "District-3", towns: [
        { key: "Fox Hollow", slug: "Fox-Hollow" },
        { key: "Sunnyside", slug: "Sunnyside" },
        { key: "Eagle's Perch", slug: toSlug("Eagle's Perch") },
      ]},
      { key: "District 4", label: "Deep Lakes", slug: "District-4", towns: [
        { key: "Rocky Rapids", slug: "Rocky-Rapids" },
        { key: "Millfield", slug: "Millfield" },
        { key: "Vista Plains", slug: "Vista-Plains" },
      ]},
    ],
  },
  {
    key: "Solace 2",
    slug: "Solace-2",
    districts: [
      { key: "District 5", label: "Great Lagoons", slug: "District-5", towns: [
        { key: "Smith's Shallows", slug: toSlug("Smith's Shallows") },
        { key: "Rapid Meadow", slug: "Rapid-Meadow" },
        { key: "Orange Falls", slug: "Orange-Falls" },
      ]},
      { key: "District 6", label: "Rocky Fields", slug: "District-6", towns: [
        { key: "Timber Creek", slug: "Timber-Creek" },
        { key: "Pinehurst", slug: "Pinehurst" },
        { key: "Small Stone", slug: "Small-Stone" },
      ]},
      { key: "District 7", label: "Edgeside Cliffs", slug: "District-7", towns: [
        { key: "Stone's Seat", slug: toSlug("Stone's Seat") },
        { key: "Little Monument", slug: "Little-Monument" },
        { key: "Raven Hills", slug: "Raven-Hills" },
      ]},
      { key: "District 8", label: "Mountain's Shadow", slug: "District-8", towns: [
        { key: "Lakeview", slug: "Lakeview" },
        { key: "Wolf Grove", slug: "Wolf-Grove" },
        { key: "Wind's Wake", slug: toSlug("Wind's Wake") },
      ]},
    ],
  },
  {
    key: "Solace 3",
    slug: "Solace-3",
    districts: [
      { key: "District 9", label: "Pleasant Meadows", slug: "District-9", towns: [
        { key: "Warden's Watch", slug: toSlug("Warden's Watch") },
        { key: "Wither Wood", slug: "Wither-Wood" },
        { key: "Fernwood", slug: "Fernwood" },
      ]},
      { key: "District 10", label: "Canyon Run", slug: "District-10", towns: [
        { key: "Laurel Hill", slug: "Laurel-Hill" },
        { key: "Ivy Creek", slug: "Ivy-Creek" },
        { key: "Crystal Falls", slug: "Crystal-Falls" },
      ]},
      { key: "District 11", label: "Sheerside Cliffs", slug: "District-11", towns: [
        { key: "Canyon Views", slug: "Canyon-Views" },
        { key: "Cedarville", slug: "Cedarville" },
        { key: "Hawk's Hunt", slug: toSlug("Hawk's Hunt") },
      ]},
      { key: "District 12", label: "Green Plateau", slug: "District-12", towns: [
        { key: "Stonebridges", slug: "Stonebridges" },
        { key: "Aspen Valley", slug: "Aspen-Valley" },
        { key: "Heritage Rapids", slug: "Heritage-Rapids" },
      ]},
    ],
  },
];

export const CANON_SIZES = ["small", "medium", "large", "epic", "copias"] as const;
export type SizeKey = typeof CANON_SIZES[number];

export const CANON_RARITIES = ["common", "uncommon", "rare", "legendary", "mythic"] as const;
export type RarityKey = typeof CANON_RARITIES[number];

export function canonSize(s: unknown): SizeKey | null {
  if (typeof s !== "string") return null;
  const k = s.trim().toLowerCase();
  return (CANON_SIZES as readonly string[]).includes(k) ? (k as SizeKey) : null;
}

export function canonRarity(r: unknown): RarityKey | null {
  if (typeof r !== "string") return null;
  const k = r.trim().toLowerCase();
  if (k === "uncomon") return "uncommon";
  return (CANON_RARITIES as readonly string[]).includes(k) ? (k as RarityKey) : null;
}

export function findSectorBySlug(slug: string): SectorDef | null {
  for (const s of HIERARCHY) if (s.slug === slug) return s;
  return null;
}

// Accept either the "District-X" slug or the label slug (e.g., "Mountain-Springs")
export function findDistrictBySlugs(
  sectorSlug: string,
  districtSlug: string
): { sector: SectorDef; district: DistrictDef } | null {
  const sector = findSectorBySlug(sectorSlug);
  if (!sector) return null;
  const alt = toSlug(
    (sector.districts.find((d) => d.slug === districtSlug)?.label) ?? ""
  );
  const district =
    sector.districts.find((d) => d.slug === districtSlug) ||
    sector.districts.find((d) => toSlug(d.label) === districtSlug) ||
    sector.districts.find((d) => d.slug === alt);
  if (!district) return null;
  return { sector, district };
}
