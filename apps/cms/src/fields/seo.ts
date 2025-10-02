// FILE: apps/cms/src/fields/seo.ts
import type { Field } from 'payload';

export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  admin: { description: 'Per-page SEO & social metadata.' },
  fields: [
    { name: 'metaTitle', type: 'text', required: false, maxLength: 70 },
    { name: 'metaDescription', type: 'textarea', required: false, maxLength: 160 },
    {
      name: 'canonical',
      type: 'text',
      required: false,
      admin: { description: 'Optional canonical URL. Include scheme (https://...).'},
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
};
