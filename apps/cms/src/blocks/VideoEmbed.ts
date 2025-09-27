// FILE: apps/cms/src/blocks/VideoEmbed.ts
import type { Block } from 'payload';

export const VideoEmbedBlock: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video Embed', plural: 'Video Embeds' },
  fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'url', type: 'text', label: 'Video URL', required: true },
  ],
};
