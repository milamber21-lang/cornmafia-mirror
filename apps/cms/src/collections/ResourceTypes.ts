// FILE: apps/cms/src/collections/ResourceTypes.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const ResourceTypes: CollectionConfig = {
  slug: "resource-types",
  labels: { singular: "Resource Type", plural: "Resource Types" },
  admin: { useAsTitle: "name" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // ID (Num)
    { name: "resourceTypeId", type: "number", label: "resource type ID" },

    // Name (varchar), Description (Varchar)
    { name: "name", type: "text", label: "Name", required: true },
    { name: "description", type: "textarea", label: "Description" },
  ],
};

export default ResourceTypes;
