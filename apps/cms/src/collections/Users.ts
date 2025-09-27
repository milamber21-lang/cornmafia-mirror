// FILE: apps/cms/src/collections/Users.ts
import type { CollectionConfig } from 'payload'

/**
 * Users collection hardened:
 * - Login with USERNAME (no email needed, no SMTP)
 * - Admin-only creation (lock down user provisioning)
 * - isAdmin flag governs elevated actions
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'username',
    defaultColumns: ['username', 'isAdmin', 'updatedAt'],
  },
  auth: {
    loginWithUsername: true, // Payload v3: allow username/password auth
    verify: false,           // no email verify (no SMTP)
  },
  access: {
    // Only admins can create CMS users
    create: ({ req }) => Boolean((req as any)?.user?.isAdmin === true),
    // You can tighten these later if desired:
    // read:   ({ req }) => Boolean((req as any)?.user?.isAdmin === true),
    // update: ({ req }) => Boolean((req as any)?.user?.isAdmin === true),
    // delete: ({ req }) => Boolean((req as any)?.user?.isAdmin === true),
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Login name (3–32 chars, letters/numbers/._-)' },
      validate: (val: unknown) => {
        const v = String(val || '').trim()
        if (!/^[a-zA-Z0-9._-]{3,32}$/.test(v)) {
          return 'Username must be 3–32 chars (letters, numbers, . _ -).'
        }
        return true
      },
    },
    {
      name: 'isAdmin',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Admins can manage users and schema content.',
        position: 'sidebar',
      },
      access: {
        update: ({ req }) => Boolean((req as any)?.user?.isAdmin === true),
      },
    },
    // Optional: keep a Discord link if helpful in the admin UI
    // { name: 'discordId', type: 'text', admin: { position: 'sidebar' } },
  ],
}
