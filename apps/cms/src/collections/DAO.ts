// FILE: apps/cms/src/collections/DAO.ts
// Language: TypeScript

import type { CollectionConfig } from 'payload';

export const DAO: CollectionConfig = {
  slug: 'dao',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'chain', 'mintPrice'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'daoPolicyId', type: 'text', required: false },
    { name: 'assetPolicyId', type: 'text', required: false },
    {
      name: 'chain',
      type: 'select',
      required: true,
      defaultValue: 'cardano',
      options: [
        { label: 'Cardano', value: 'cardano' },
        { label: 'EVM', value: 'evm' },
      ] as const,
    },
    {
      name: 'mintPrice',
      type: 'text', // decimal string (e.g., "12.5")
      required: false,
      admin: { description: "Decimal string in native units (e.g., '12.5')." },
      validate: (val: unknown): true | string => {
        if (val == null || val === '') return true;
        if (typeof val === 'number') {
          // allow numeric too; will be stored as string by Payload for type 'text'
          return Number.isFinite(val) ? true : 'Invalid decimal string';
        }
        if (typeof val !== 'string') return 'Invalid decimal string';
        return /^[0-9]+(\.[0-9]+)?$/.test(val) ? true : 'Invalid decimal string';
      },
    },
    {
      name: 'wallets',
      type: 'relationship',
      relationTo: 'wallets',
      hasMany: true,
      required: false,
    },
    {
      name: 'roles',
      type: 'relationship',
      relationTo: 'discordRoles',
      hasMany: true,
      required: false,
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      fields: [{ name: 'value', type: 'text' }],
    },
  ],
};
