// FILE: apps/cms/src/collections/ClaimOrders.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const ClaimOrders: CollectionConfig = {
  slug: "claim-orders",
  labels: { singular: "Claim Order", plural: "Claim Orders" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    {
      name: "landPlotId",
      type: "number",
      label: "Land Plot ID",
      required: true,
    },
    {
      name: "nextLandPlotId",
      type: "number",
      label: "Next Land Plot ID",
      required: true,
    },
  ],
};

export default ClaimOrders;
