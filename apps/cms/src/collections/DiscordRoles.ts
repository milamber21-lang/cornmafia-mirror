// FILE: apps/cms/src/collections/DiscordRoles.ts
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload';
import { slugField } from '../utils/slugField';

// Enforce that only one document can be the public default
const ensureSinglePublicDefault: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  const nextIsPublicDefault = Boolean(data?.isPublicDefault);
  if (!nextIsPublicDefault) return;

  const excludeId = operation === 'update' ? (originalDoc as any)?.id : undefined;

  const existing = await req.payload.find({
    collection: 'discordRoles',
    where: {
      and: [
        { isPublicDefault: { equals: true } },
        ...(excludeId ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    limit: 1,
  });

  if (existing.totalDocs > 0) {
    throw new Error('Only one role can be the public default. Unset it on the other role first.');
  }
};

// Enforce that only one document can be the authenticated (non-guild) default
const ensureSingleAuthenticatedDefault: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  const nextIsAuthDefault = Boolean(data?.isAuthenticatedDefault);
  if (!nextIsAuthDefault) return;

  const excludeId = operation === 'update' ? (originalDoc as any)?.id : undefined;

  const existing = await req.payload.find({
    collection: 'discordRoles',
    where: {
      and: [
        { isAuthenticatedDefault: { equals: true } },
        ...(excludeId ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    limit: 1,
  });

  if (existing.totalDocs > 0) {
    throw new Error('Only one role can be the authenticated default. Unset it on the other role first.');
  }
};

export const DiscordRoles: CollectionConfig = {
  slug: 'discordRoles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'source',
      'roleId',
      'rank',
      'colorHex',
      'fullEditorialAccess',
      'cmsAdmin',
      'isPublicDefault',
      'isAuthenticatedDefault',
    ],
    group: 'Access',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeChange: [ensureSinglePublicDefault, ensureSingleAuthenticatedDefault],
  },
  fields: [
    { name: 'name', type: 'text', required: true },

    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'discord',
      options: [
        { label: 'Discord', value: 'discord' },
        { label: 'Virtual (no Discord role)', value: 'virtual' },
      ],
      admin: {
        description:
          'Choose "Discord" for real server roles, or "Virtual" for roles like public/unauthenticated defaults.',
      },
    },

    {
      name: 'roleId',
      type: 'text',
      required: false,
      unique: true,
      admin: {
        condition: (_: unknown, siblingData: any) => siblingData?.source === 'discord',
        description:
          'Discord Role ID (snowflake). Required for source = Discord. Leave empty for virtual roles.',
      },
      validate: (val: unknown, { data }: any): true | string => {
        const source = data?.source;
        if (source === 'discord') {
          if (!val) return 'roleId is required for Discord roles.';
          const s = String(val);
          if (!/^\d{5,25}$/.test(s)) return 'roleId must be a numeric Discord snowflake.';
        } else {
          if (val) return 'Virtual roles must not have a roleId.';
        }
        return true;
      },
    },

    {
      name: 'colorHex',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional hex color like #FFFFFF (used for UI badges, etc.)',
        width: '25%',
      },
      validate: (val: unknown): true | string => {
        if (val == null || val === '') return true;
        const s = String(val).trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(s)) return 'Must be a 6-digit hex color like #RRGGBB.';
        return true;
      },
    },

    {
      name: 'rank',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Used for READ gating only (highest read role wins). 0 = public.' },
      validate: (val: unknown): true | string => {
        if (typeof val !== 'number') return 'Rank must be a number.';
        if (val < 0 || val > 1000) return 'Rank must be between 0 and 1000.';
        return true;
      },
    },

    // NEW FLAGS
    {
      name: 'fullEditorialAccess',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'If enabled, members with this Discord role can create/edit/publish ANY content (bypass category/subcategory allow-lists) and see all drafts.',
      },
    },
    {
      name: 'cmsAdmin',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'If enabled, members with this role are considered CMS admins (intended for internal use; normal authors will NOT log into the Payload admin).',
      },
    },


    // Defaults
    {
      name: 'isPublicDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Exactly one role should be the public default (applies to anonymous users). Usually a virtual role like "Bystander".',
        condition: (_: unknown, siblingData: any) => siblingData?.source === 'virtual',
      },
    },
    {
      name: 'isAuthenticatedDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Exactly one role can be the default for logged-in users who are not in the Discord guild.',
        condition: (_: unknown, siblingData: any) => siblingData?.source === 'virtual',
      },
    },

    slugField(false),
  ],
  timestamps: true,
};

export default DiscordRoles;
