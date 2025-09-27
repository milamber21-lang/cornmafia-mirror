// FILE: apps/cms/src/collections/Templates.ts
import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';
import { iconColorField, iconKeyField } from '../fields/icon';
import { RichTextBlock } from '../blocks/RichText';
import { ImageBlock } from '../blocks/Image';
import { ImageWithCaption } from '../blocks/ImageWithCaption';
import { GalleryBlock } from '../blocks/Gallery';
import { MediaTextBlock } from '../blocks/MediaText';
import { VideoEmbedBlock } from '../blocks/VideoEmbed';
import { CTABlock } from '../blocks/CTA';

export const Templates: CollectionConfig = {
  slug: 'templates',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['key', 'label', 'defaultIconKey', 'defaultColorToken', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'label', type: 'text', required: true },

    // Defaults for pages using this template
    iconKeyField('defaultIconKey', 'Default Icon'),
    iconColorField('defaultColorToken', 'Default Icon Color'),

    // Which blocks are allowed for Pages using this template.
    {
      name: 'allowedBlocks',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'richText', value: 'richText' },
        { label: 'image', value: 'image' },
        { label: 'imageWithCaption', value: 'imageWithCaption' },
        { label: 'gallery', value: 'gallery' },
        { label: 'mediaText', value: 'mediaText' },
        { label: 'videoEmbed', value: 'videoEmbed' },
        { label: 'cta', value: 'cta' },
      ],
      admin: { description: 'Which blocks are allowed for Pages using this template.' },
    },

    // Default blocks applied on Page create if empty
    {
      name: 'defaultBlocks',
      label: 'Default Blocks (applied on Page create if empty)',
      type: 'blocks',
      blocks: [
        RichTextBlock,
        ImageBlock,
        ImageWithCaption,
        GalleryBlock,
        MediaTextBlock,
        VideoEmbedBlock,
        CTABlock,
      ],
    },

    // NEW: forced blocks that must always be present and positioned
    {
      name: 'forcedStartBlocks',
      label: 'Forced Blocks (at START of page)',
      type: 'blocks',
      admin: { description: 'Blocks that must appear at the very top, in this order.' },
      blocks: [
        RichTextBlock,
        ImageBlock,
        ImageWithCaption,
        GalleryBlock,
        MediaTextBlock,
        VideoEmbedBlock,
        CTABlock,
      ],
    },
    {
      name: 'forcedEndBlocks',
      label: 'Forced Blocks (at END of page)',
      type: 'blocks',
      admin: { description: 'Blocks that must appear at the very bottom, in this order.' },
      blocks: [
        RichTextBlock,
        ImageBlock,
        ImageWithCaption,
        GalleryBlock,
        MediaTextBlock,
        VideoEmbedBlock,
        CTABlock,
      ],
    },
  ],
};

export default Templates;
