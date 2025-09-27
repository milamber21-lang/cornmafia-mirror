// FILE: apps/cms/src/collections/DiscordUsers.ts
// Language: TypeScript

import type { CollectionConfig, PayloadRequest } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';
import { getActorDiscordId } from '../access/writeAccess';

/**
 * Extract a JS Date from a Discord snowflake.
 * Discord epoch: 2015-01-01T00:00:00.000Z = 1420070400000 ms
 */
function dateFromSnowflake(discordId: string): Date | null {
  try {
    const id = BigInt(discordId);
    const ms = Number((id >> 22n) + 1420070400000n);
    return new Date(ms);
  } catch {
    return null;
  }
}

export const DiscordUsers: CollectionConfig = {
  slug: 'discordUsers',
  admin: {
    useAsTitle: 'username',
    defaultColumns: ['discordId', 'username', 'globalName', 'isMember', 'lastLoginAt'],
    description: 'Lightweight records for Discord-authenticated users used for logging & permissions.',
  },

  access: {
    // READ remains admin-only (as before)
    read: cmsAdminOrPayloadAdmin,

    /**
     * CREATE:
     * - allow CMS/Payload admins
     * - OR allow a viewer with a valid X-Viewer-Token to create ONLY their own document
     */
    create: async ({ req, data }) => {
      if (await cmsAdminOrPayloadAdmin({ req } as any)) return true;
      const actor = await getActorDiscordId(req as PayloadRequest);
      const targetDiscordId = typeof (data as any)?.discordId === 'string' ? (data as any).discordId : null;
      return Boolean(actor && targetDiscordId && actor === targetDiscordId);
    },

    /**
     * UPDATE:
     * - allow CMS/Payload admins
     * - OR allow a viewer with a valid X-Viewer-Token to update ONLY their own document
     *
     * Note: Access args in Payload v3 do NOT include `originalDoc`. We fetch it by `id`.
     */
    update: async ({ req, id, data }) => {
      if (await cmsAdminOrPayloadAdmin({ req } as any)) return true;

      const actor = await getActorDiscordId(req as PayloadRequest);
      if (!actor) return false;

      // Fetch the current document to compare its discordId with the actor
      try {
        const existing = await (req as any).payload.findByID({
          collection: 'discordUsers',
          id,
          depth: 0,
        });

        const targetDiscordId =
          (typeof existing?.discordId === 'string' && existing.discordId) ||
          (typeof (data as any)?.discordId === 'string' && (data as any).discordId) ||
          null;

        return Boolean(targetDiscordId && actor === targetDiscordId);
      } catch {
        // If we cannot read the existing doc, deny update to be safe
        return false;
      }
    },

    // DELETE remains admin-only
    delete: cmsAdminOrPayloadAdmin,
  },

  fields: [
    // Identity
    {
      name: 'discordId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Discord user snowflake (string).' },
    },
    { name: 'username', type: 'text', required: true },              // legacy username (can change)
    { name: 'globalName', type: 'text', required: false },           // display name (nullable)
    { name: 'avatarHash', type: 'text', required: false },           // hash only, build CDN URL on the client if needed
    { name: 'discriminator', type: 'text', required: false },        // mostly deprecated; keep for older accounts

    // Derived
    {
      name: 'createdFromSnowflake',
      type: 'date',
      required: false,
      admin: { description: 'Derived from discordId at save time.' },
    },

    // Guild state
    { name: 'isMember', type: 'checkbox', defaultValue: true },
    {
      name: 'roles',
      type: 'array',
      required: false,
      labels: { singular: 'Role ID', plural: 'Role IDs' },
      fields: [{ name: 'value', type: 'text', required: true }],
      admin: { description: 'Raw guild role IDs at last sync/login.' },
    },
    {
      name: 'joinedAt',
      type: 'date',
      required: false,
      admin: { description: 'Guild join time (if available).' },
    },

    // Wallet links (to your existing Wallets collection)
    {
      name: 'wallets',
      type: 'relationship',
      relationTo: 'wallets',
      hasMany: true,
      required: false,
    },

    // Operational
    { name: 'lastLoginAt', type: 'date', required: false },
  ],

  hooks: {
    beforeValidate: [
      async ({ data }: { data?: Record<string, unknown>; req: PayloadRequest }) => {
        if (!data) return data;

        // Ensure createdFromSnowflake is set/updated when discordId is present
        const did = data.discordId as string | undefined;
        if (did) {
          const derived = dateFromSnowflake(did);
          if (derived) {
            data.createdFromSnowflake = derived.toISOString();
          }
        }
        return data;
      },
    ],
  },
};

export default DiscordUsers;
