// FILE: apps/cms/src/fields/gating.ts
import type { Field } from 'payload';

export const gatingFields: Field = {
  name: 'visibility',
  type: 'group',
  admin: { description: 'Read/Write gating. Inherit uses parent (subcategory/category) defaults.' },
  fields: [
    {
      name: 'mode',
      label: 'Mode',
      type: 'select',
      defaultValue: 'inherit',
      options: [
        { label: 'Inherit', value: 'inherit' },
        { label: 'Override', value: 'override' },
      ],
    },
    {
      name: 'read',
      type: 'group',
      admin: { condition: (data) => data?.visibility?.mode === 'override' },
      fields: [
        {
          name: 'policy',
          type: 'select',
          defaultValue: 'public',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Require Min Rank', value: 'rank_at_least' },
          ],
        },
        {
          name: 'minRank',
          type: 'number',
          admin: { description: 'Lowest Discord rank that can read. Higher ranks inherit access.' },
          required: false,
        },
        {
          name: 'allowRoleIds',
          type: 'relationship',
          relationTo: 'discordRoles',
          hasMany: true,
          required: false,
          admin: { description: 'Explicit allow-list of Discord roles (optional).' },
        },
        {
          name: 'hideInMenus',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'If user is not authorized, hide this from menus (recommended).' },
        },
      ],
    },
    {
      name: 'write',
      type: 'group',
      admin: { condition: (data) => data?.visibility?.mode === 'override' },
      fields: [
        {
          name: 'policy',
          type: 'select',
          defaultValue: 'editor_roles_only',
          options: [
            { label: 'Editor Roles Only', value: 'editor_roles_only' },
            { label: 'Require Min Rank', value: 'rank_at_least' },
          ],
        },
        {
          name: 'minRank',
          type: 'number',
          required: false,
        },
      ],
    },
  ],
};

export const defaultGatingFields: Field = {
  name: 'defaultVisibility',
  type: 'group',
  admin: { description: 'Default read/write policy for all descendants (pages, tutorials).' },
  fields: [
    {
      name: 'readPolicy',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Require Min Rank', value: 'rank_at_least' },
      ],
    },
    {
      name: 'minReadRank',
      type: 'number',
      required: false,
    },
    {
      name: 'allowRoleIds',
      type: 'relationship',
      relationTo: 'discordRoles',
      hasMany: true,
      required: false,
    },
    {
      name: 'hideInMenus',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'writePolicy',
      type: 'select',
      defaultValue: 'editor_roles_only',
      options: [
        { label: 'Editor Roles Only', value: 'editor_roles_only' },
        { label: 'Require Min Rank', value: 'rank_at_least' },
      ],
    },
    { name: 'minWriteRank', type: 'number', required: false },
  ],
};
