// FILE: apps/cms/src/access/writeAccess.ts
// Secure access helpers: verify X-Viewer-Token (HS256) and NEVER trust raw role headers.

import type { PayloadRequest } from 'payload'
import { jwtVerify, type JWTPayload } from 'jose'

type ParentRefs = { categoryId: string | null; subcategoryId: string | null }

const SECRET = process.env.VIEWER_JWT_SECRET

type Viewer = {
  discordId: string | null
  rank?: number
  guildId?: string | null
  roleIds?: string[]
}

/** Verify the short-lived viewer JWT from X-Viewer-Token. Returns null if invalid. */
async function getViewerFromToken(req: PayloadRequest): Promise<Viewer | null> {
  try {
    if (!SECRET) return null
    // Try both Header APIs
    const headersAny: any = (req as any)?.headers
    const token =
      (typeof headersAny?.get === 'function'
        ? headersAny.get('x-viewer-token') || headersAny.get('X-Viewer-Token')
        : headersAny?.['x-viewer-token'] || headersAny?.['X-Viewer-Token']) || ''

    if (!token || typeof token !== 'string') return null

    const key = new TextEncoder().encode(SECRET)
    const { payload, protectedHeader } = await jwtVerify(token, key, {
      audience: 'cms',
      issuer: 'web',
      algorithms: ['HS256'],
    })
    if (protectedHeader?.alg !== 'HS256') return null

    const roleIdsRaw = (payload as any).roleIds
    const roleIds = Array.isArray(roleIdsRaw)
      ? roleIdsRaw.filter((r: unknown) => typeof r === 'string')
      : undefined

    return {
      discordId: (payload.sub as string) ?? null,
      rank: typeof (payload as any).rank === 'number' ? (payload as any).rank : undefined,
      guildId: typeof (payload as any).guildId === 'string' ? (payload as any).guildId : undefined,
      roleIds,
    }
  } catch {
    return null
  }
}

/** Prefer authenticated CMS user; else verified viewer token; NEVER trust plain headers. */
export const getActorDiscordId = async (req: PayloadRequest): Promise<string | null> => {
  const fromUser = (req as any)?.user?.discordId ?? (req as any)?.user?.discord_id
  if (typeof fromUser === 'string' && fromUser) return fromUser

  const viewer = await getViewerFromToken(req)
  return viewer?.discordId ?? null
}

export const getActorRoleIds = async (req: PayloadRequest): Promise<string[]> => {
  // If you later store roles on CMS user, prefer those.
  const fromUser =
    (req as any)?.user?.roleIds ??
    (req as any)?.user?.discordRoleIds
  if (Array.isArray(fromUser)) return fromUser.map(String)

  const viewer = await getViewerFromToken(req)
  return viewer?.roleIds ?? []
}

export const hasFullEditorialAccess = async (req: PayloadRequest): Promise<boolean> => {
  const roleIds = await getActorRoleIds(req)
  if (!roleIds.length) return false

  const res = await req.payload.find({
    collection: 'discordRoles',
    limit: 1,
    where: {
      and: [
        { roleId: { in: roleIds } },
        { fullEditorialAccess: { equals: true } },
      ],
    },
    depth: 0,
  })
  return (res?.docs?.length ?? 0) > 0
}

/**
 * Returns true when the actor can write in the provided parent scope.
 * We resolve permissions by checking if ANY of the actor's Discord roles
 * has a rel that matches the subcategory or category.
 */
export const canWriteForParent = async (
  req: PayloadRequest,
  { categoryId, subcategoryId }: ParentRefs,
): Promise<boolean> => {
  if (await hasFullEditorialAccess(req)) return true

  const roleIds = await getActorRoleIds(req)
  if (!roleIds.length) return false

  const or: any[] = []
  if (subcategoryId) or.push({ 'rels.subcategories': { equals: subcategoryId } })
  if (categoryId) or.push({ 'rels.categories': { equals: categoryId } })
  if (!or.length) return false

  const res = await req.payload.find({
    collection: 'discordRoles',
    where: {
      and: [
        { roleId: { in: roleIds } },
        { or },
      ],
    },
    limit: 1,
    depth: 0,
  })

  return (res?.docs?.length ?? 0) > 0
}
