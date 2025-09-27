// FILE: apps/web/src/app/admin/land-plots/overview/SummaryTable.tsx
// Language: TSX
"use client";

import * as React from "react";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui";
import {
  CANON_RARITIES,
  CANON_SIZES,
  type SizeKey,
  type RarityKey,
} from "./hierarchy";
import type { SizeCounts } from "./data";

function prettySize(s: SizeKey): string {
  if (s === "copias") return "Copias";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rarityClass(r: RarityKey | "unclaimed"): string {
  if (r === "mythic") return "text-yellow-400";
  if (r === "legendary") return "text-purple-400";
  if (r === "rare") return "text-blue-400";
  if (r === "uncommon") return "text-green-400";
  if (r === "common") return "text-gray-400";
  if (r === "unclaimed") return "text-gray-400"; // lowest tier, gray
  return "text-[var(--color-text)]";
}

export default function SummaryTable(props: { data: SizeCounts }) {
  const data = props.data;

  const rows = CANON_SIZES.map((s) => {
    const row = data[s];
    return { size: s, row };
    // runtime guard not necessary; types ensure presence
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <Table>
        <THead>
          <TR>
            <TH className="text-left w-[14%]">Size</TH>
            <TH className="text-center w-[10%]">Available</TH>

            {/* Successful — UNCLAIMED FIRST (lowest tier), then Common..Mythic */}
            <TH className="text-center">Successful — unclaimed</TH>
            {CANON_RARITIES.map((r) => (
              <TH key={`succ-head-${r}`} className="text-center">
                Successful — {r}
              </TH>
            ))}

            {/* Claims — per rarity */}
            {CANON_RARITIES.map((r) => (
              <TH key={`claims-head-${r}`} className="text-center">
                Claims — {r}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {rows.map(({ size, row }) => (
            <TR key={size}>
              <TD className="font-medium">{prettySize(size)}</TD>
              <TD className="text-center">{row.plots}</TD>

              {/* Unclaimed first */}
              <TD
                className={`text-center font-semibold ${rarityClass("unclaimed")}`}
                title="Finished with no rarity (unclaimed)"
              >
                {row.successUnclaimed}
              </TD>

              {/* Then the rarities in order common..mythic */}
              {CANON_RARITIES.map((r) => (
                <TD
                  key={`${size}-succ-${r}`}
                  className={`text-center font-semibold ${rarityClass(r)}`}
                >
                  {row.successByRarity[r]}
                </TD>
              ))}

              {/* Claims cells */}
              {CANON_RARITIES.map((r) => (
                <TD
                  key={`${size}-claims-${r}`}
                  className={`text-center ${rarityClass(r)}`}
                >
                  {row.claimsByRarity[r]}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
