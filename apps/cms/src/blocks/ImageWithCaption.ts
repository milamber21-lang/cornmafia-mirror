// FILE: apps/cms/src/blocks/ImageWithCaption.ts
import type { Block } from 'payload';

export const ImageWithCaption: Block = {
  slug: 'imageWithCaption',
  labels: { singular: 'Image with Caption', plural: 'Images with Caption' },
  fields: [
    {
      name: 'media',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'alt',
      label: 'Alt text',
      type: 'text',
    },
    {
      name: 'caption',
      label: 'Caption',
      type: 'richText',
    },
  ],
};
