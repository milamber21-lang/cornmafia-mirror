// FILE: apps/cms/src/collections/game/GameAssetPlots.ts
// Language: TypeScript

import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../../access/isCmsAdmin';

type MaybeId = string | number | { id?: unknown } | undefined;

function getId(val: MaybeId): string | undefined {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object' && 'id' in val) {
    const v = (val as { id?: unknown }).id;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

export const GameAssetPlots: CollectionConfig = {
  slug: 'gameAssetPlots',
  admin: { useAsTitle: 'asset', group: 'Game' },
  timestamps: true,
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'asset',
      type: 'relationship',
      relationTo: 'gameAssets',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Must reference a Game Asset of type "plot".' },
    },
    { name: 'sector', type: 'text' },
    { name: 'district', type: 'text' },
    { name: 'town', type: 'text' },
    { name: 'houseNumber', type: 'text' },
    { name: 'sizeCode', type: 'text' },
    { name: 'centroidLat', type: 'number' },
    { name: 'centroidLon', type: 'number' },
    { name: 'centroidElv', type: 'number' },
    { name: 'rotationDeg', type: 'number' },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const assetVal = (data as unknown as { asset?: MaybeId }).asset;
        const assetId = getId(assetVal);
        if (!assetId) throw new Error('Missing asset reference.');

        const asset = await req.payload.findByID({ collection: 'gameAssets', id: assetId, depth: 1 });

        // Resolve type code (supports populated relation or id)
        let typeCode: string | undefined;
        const typeField = (asset as unknown as { type?: unknown }).type;

        if (typeof typeField === 'string' || typeof typeField === 'number') {
          const tdoc = await req.payload.findByID({
            collection: 'gameAssetTypes',
            id: String(typeField),
            depth: 0,
          });
          if (tdoc && typeof tdoc === 'object' && 'code' in tdoc && typeof (tdoc as { code?: unknown }).code === 'string') {
            typeCode = (tdoc as { code: string }).code;
          }
        } else if (typeField && typeof typeField === 'object') {
          if ('code' in typeField && typeof (typeField as { code?: unknown }).code === 'string') {
            typeCode = (typeField as { code: string }).code;
          }
        }

        if (typeCode !== 'plot') {
          throw new Error('GameAssetPlots can only be created for Game Assets of type "plot".');
        }

        return data as unknown;
      },
    ],
  },
};

export default GameAssetPlots;
