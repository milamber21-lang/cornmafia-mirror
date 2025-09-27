// FILE: apps/cms/src/collections/NftOwners.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const NftOwners: CollectionConfig = {
  slug: "nft-owners",
  labels: { singular: "NFT Owner", plural: "NFT Owners" },
  admin: { useAsTitle: "nftId" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // From sheet:
    // NFT id (Num)
    { name: "nftId", type: "text", label: "NFT id", required: true },

    // Wallet (varchar)
    { name: "wallet", type: "text", label: "Wallet", required: true },
  ],
};

export default NftOwners;
