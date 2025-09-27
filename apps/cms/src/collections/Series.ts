// FILE: apps/cms/src/collections/Series.ts
// Language: TypeScript

import type { CollectionConfig } from "payload";

export const Series: CollectionConfig = {
  slug: "series",
  admin: { useAsTitle: "title", defaultColumns: ["title", "category", "subcategory", "authorDiscordId"] },
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "description", type: "textarea" },
    // new taxonomy + author
    { name: "category", type: "relationship", relationTo: "categories", required: false },
    {
      name: "subcategory",
      type: "relationship",
      relationTo: "subcategories",
      required: false,
      admin: { condition: (_, siblingData) => !!siblingData?.category },
       filterOptions: ({ siblingData }) => {
        const cat =
          (siblingData as any)?.category?.id ??
          (siblingData as any)?.category ??
          undefined;
        if (!cat) return true; 
        return { category: { equals: String(cat) } }; 
      },
    },
    {
      name: "authorDiscordId",
      type: "text",
      required: false,
      admin: { description: "Discord ID of the author (can be null for now)." },
    },
    { name: "minRank", type: "number", required: false },
  ],
};
