// FILE: apps/cms/src/collections/Statuses.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const Statuses: CollectionConfig = {
  slug: "statuses",
  labels: { singular: "Status", plural: "Statuses" },
  admin: { useAsTitle: "rarity" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // landPlotId (num)
    { name: "landPlotId", type: "number", label: "Land Plot ID" },

    // startTime / lockedAt (Timestamp UTC)
    { name: "startTime", type: "date", label: "Start Time (UTC)" },
    { name: "lockedAt", type: "date", label: "Locked At (UTC)" },

    // playerUserFavoriteId (empty type in sheet → text)
    { name: "playerUserFavoriteId", type: "text", label: "Player User Favorite ID" },

    // hasPendingClaim (Bolean), nftIndex (number)
    { name: "hasPendingClaim", type: "checkbox", label: "Has Pending Claim", defaultValue: false },
    { name: "nftIndex", type: "number", label: "NFT Index" },

    // rarity (varchar)
    { name: "rarity", type: "text", label: "Rarity" },

    // myLandPlot (bolean), hasAnyEntry (bolean)
    { name: "myLandPlot", type: "checkbox", label: "My Land Plot", defaultValue: false },
    { name: "hasAnyEntry", type: "checkbox", label: "Has Any Entry", defaultValue: false },

    // Inserted (Timestamp)
    { name: "insertedAt", type: "date", label: "Inserted at" },
  ],
};

export default Statuses;
