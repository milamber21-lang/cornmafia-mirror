// FILE: apps/cms/src/collections/ClaimProgress.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const ClaimProgress: CollectionConfig = {
  slug: "claim-progress",
  labels: { singular: "Claim Progress", plural: "Claim Progress" },
  // NOTE: removed admin.useAsTitle — the previous value pointed to a non-text field
  access: { read: () => true },
  timestamps: true,
  fields: [
    { name: "landPlotId", type: "number", label: "Land plot ID", required: true },
    { name: "finished", type: "checkbox", label: "Finished", defaultValue: false },
  ],
};

export default ClaimProgress;
