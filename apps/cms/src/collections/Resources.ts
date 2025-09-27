// FILE: apps/cms/src/collections/Resources.ts
// Language: TypeScript
import type { CollectionConfig } from "payload";

export const Resources: CollectionConfig = {
  slug: "resources",
  labels: { singular: "Resource", plural: "Resources" },
  admin: { useAsTitle: "resourceType" },
  access: { read: () => true },
  timestamps: true,
  fields: [
    // From sheet: ID (Num)
    { name: "resourceId", type: "number", label: "resource ID" },

    // From sheet (varchar)
    { name: "resourceType", type: "text", label: "Resource type" },
    { name: "sector", type: "text", label: "Sector" },
    { name: "district", type: "text", label: "District" },
    { name: "houseNumber", type: "text", label: "House number" },
    { name: "town", type: "text", label: "Town" },
    { name: "size", type: "text", label: "Size" },

    // From sheet (decimal → number)
    { name: "latitude", type: "number", label: "Latitude" },
    { name: "longitude", type: "number", label: "Longitude" },
    { name: "rotation", type: "number", label: "Rotation" },

    // From sheet: Inserted (Timestamp)
    { name: "insertedAt", type: "date", label: "Inserted at" },
  ],
};

export default Resources;
