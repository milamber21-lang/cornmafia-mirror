// FILE: apps/cms/src/blocks/MediaText.ts
import type { Block } from 'payload';

export const MediaTextBlock: Block = {
  slug: 'mediaText',
  labels: { singular: 'Media + Text', plural: 'Media + Text' },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      required: true,
    },
    {
      name: 'mediaPosition',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'right',
      label: 'Media Position',
    },
    {
      name: 'mediaWidth',
      type: 'number',
      label: 'Media Width %',
      defaultValue: 40,
      min: 10,
      max: 90,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Text',
    },
  ],
};
