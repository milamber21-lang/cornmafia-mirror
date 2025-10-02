// FILE: apps/cms/src/collections/game/GameAssetTypes.ts
// Language: TypeScript

import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../../access/isCmsAdmin';

export const GameAssetTypes: CollectionConfig = {
  slug: 'gameAssetTypes',
  admin: { useAsTitle: 'label', group: 'Game' },
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable lowercase code, e.g. "plot", "item".' },
      validate: (val: unknown): true | string => {
        if (typeof val !== 'string' || !/^[a-z0-9\-]{1,64}$/.test(val)) {
          return 'code must be 1-64 chars, lowercase letters/numbers/dashes';
        }
        return true;
      },
    },
    { name: 'label', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
  ],
};

export default GameAssetTypes;
