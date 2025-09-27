// FILE: apps/cms/src/collections/ResourceSizes.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const ResourceSizes: CollectionConfig = {
  slug: "resource-sizes",
  labels: { singular: "Resource Size", plural: "Resource Sizes" },
  admin: { useAsTitle: "name" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // ID (Num)
    { name: "resourceSizeId", type: "number", label: "Resource size ID" },

    // Name (Varchar), Description (varchar)
    { name: "name", type: "text", label: "Name", required: true },
    { name: "description", type: "textarea", label: "Description" },

    // X (num), Y (num)
    { name: "x", type: "number", label: "X" },
    { name: "y", type: "number", label: "Y" },
  ],
};

export default ResourceSizes;
