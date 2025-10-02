// FILE: apps/cms/src/collections/map/MapFootprints.ts
// Language: TypeScript

import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../../access/isCmsAdmin';

export const MapFootprints: CollectionConfig = {
  slug: 'mapFootprints',
  admin: { useAsTitle: 'sizeCode', group: 'Map' },
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'gameAssetTypes',
      required: true,
      admin: { description: 'Which asset type this footprint applies to (e.g., plot, item).' },
    },
    { name: 'sizeCode', type: 'text' },
    { name: 'shape', type: 'text', admin: { description: 'rectangle | square | ellipse | circle | triangle | regular_polygon | hexagon | ...' } },
    { name: 'widthM', type: 'number', admin: { description: 'Major axis for rectangle/square/ellipse' } },
    { name: 'heightM', type: 'number', admin: { description: 'Minor axis for rectangle/square/ellipse' } },
    { name: 'sideAM', type: 'number', admin: { description: 'Triangle: side a' } },
    { name: 'sideBM', type: 'number', admin: { description: 'Triangle: side b' } },
    { name: 'sideCM', type: 'number', admin: { description: 'Triangle: side c' } },
    { name: 'sideM', type: 'number', admin: { description: 'Regular polygon / hexagon: common side length' } },
    { name: 'nSides', type: 'number', admin: { description: 'Regular polygon: number of sides' } },
    { name: 'radiusM', type: 'number', admin: { description: 'Circle radius' } },
    { name: 'apothemM', type: 'number', admin: { description: 'Regular polygon optional cached apothem' } },
    { name: 'comment', type: 'textarea' },
  ],
  timestamps: true,
};

export default MapFootprints;
