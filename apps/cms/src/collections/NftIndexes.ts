// FILE: apps/cms/src/collections/NftIndexes.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const NftIndexes: CollectionConfig = {
  slug: "nft-indexes",
  labels: { singular: "NFT Index", plural: "NFT Indexes" },
  admin: { useAsTitle: "name" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // LandPlotId (Num)
    { name: "landPlotId", type: "number", label: "Land Plot ID" },

    // NFT ID (Varchar)
    { name: "nftId", type: "text", label: "NFT ID" },

    // name (Varchar), index (num), tag (varchar), rarity (varchar), collectionName (varchar)
    { name: "name", type: "text", label: "Name" },
    { name: "index", type: "number", label: "Index" },
    { name: "tag", type: "text", label: "Tag" },
    { name: "rarity", type: "text", label: "Rarity" },
    { name: "collectionName", type: "text", label: "Collection Name" },

    // Inserted (Timestamp)
    { name: "insertedAt", type: "date", label: "Inserted at" },
  ],
};

export default NftIndexes;
