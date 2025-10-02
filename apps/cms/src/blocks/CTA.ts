// FILE: apps/cms/src/blocks/CTA.ts
import type { Block } from 'payload';

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to Action', plural: 'CTAs' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'href', type: 'text', required: true, admin: { description: 'Absolute or relative URL' } },
    { name: 'newTab', type: 'checkbox', defaultValue: false },
  ],
};
