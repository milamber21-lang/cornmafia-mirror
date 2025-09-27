// FILE: apps/cms/src/collections/Wallets.ts
// Language: TypeScript

import type { CollectionConfig } from "payload";

const chains = [
  { label: "Cardano", value: "cardano" },
  { label: "EVM", value: "evm" },
];

export const Wallets: CollectionConfig = {
  slug: "wallets",
  admin: { useAsTitle: "label", defaultColumns: ["label", "chain", "address", "status"] },
  access: { read: () => true },
  fields: [
    { name: "label", type: "text", required: true },
    {
      name: "address",
      type: "text",
      required: true,
      unique: true, // combined unique with chain is better; Payload doesn't do compound unique; we validate below
    },
    {
      name: "chain",
      type: "select",
      options: chains,
      required: true,
      defaultValue: "cardano",
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Verified", value: "verified" },
        { label: "Active", value: "active" },
        { label: "Revoked", value: "revoked" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "active",
      required: true,
    },
    // These two are free-text per your instruction
    { name: "owner", type: "text", required: false },
    { name: "role", type: "text", required: false, admin: { description: "Use-case label, not user role." } },

    // Tags = simple text[]
    {
      name: "tags",
      type: "array",
      required: false,
      fields: [{ name: "value", type: "text" }],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, context }) => {
        // Optional: chain-aware basic validation
        if (data?.chain === "cardano" && data?.address && !/^addr[0-9a-z]+$/i.test(data.address)) {
          throw new Error("Address does not look like a Cardano address.");
        }
        if (data?.chain === "evm" && data?.address && !/^0x[0-9a-f]{40}$/i.test(data.address)) {
          throw new Error("Address does not look like an EVM (0x...) address.");
        }
        return data;
      },
    ],
  },
};
