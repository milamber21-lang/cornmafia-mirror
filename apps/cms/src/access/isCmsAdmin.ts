// FILE: apps/cms/src/access/isCmsAdmin.ts
import type { Access, PayloadRequest } from 'payload'
import * as jwt from 'jsonwebtoken'

/** Shape we care about from the viewer token; extra fields are ignored safely. */
type RoleLite = { rank?: number; cmsAdmin?: boolean }
type ViewerTokenPayload = { rank?: number; roles?: RoleLite[] }

/** Get a header value regardless of whether req.headers is a Headers or a plain object. */
function getHeader(req: PayloadRequest, name: string): string | undefined {
  const h: unknown = (req as any)?.headers
  if (!h) return undefined

  // Fetch API Headers
  if (typeof (h as Headers).get === 'function') {
    const v = (h as Headers).get(name)
    return v ?? undefined
  }

  // Node IncomingHttpHeaders-like object (case-insensitive)
  const obj = h as Record<string, unknown>
  const lower = name.toLowerCase()
  const val = (obj[name] as unknown) ?? (obj[lower] as unknown)
  if (Array.isArray(val)) return val[0] as string
  return (typeof val === 'string' ? val : undefined)
}

/** Safely decode the viewer token; returns null on failure. */
function decodeViewerToken(token: string | undefined): ViewerTokenPayload | null {
  if (!token) return null
  const secret = process.env.VIEWER_JWT_SECRET
  if (!secret) return null
  try {
    const decoded = jwt.verify(token, secret) as unknown
    // Narrow to what we use
    const payload = decoded as Partial<ViewerTokenPayload> | null
    return payload ?? null
  } catch {
    return null
  }
}

/** Compute best-effort numeric rank for the caller (defaults to 0). */
export function getViewerRankFromReq(req: PayloadRequest): number {
  const token = getHeader(req, 'x-viewer-token')
  const payload = decodeViewerToken(token)
  if (!payload) return 0

  if (typeof payload.rank === 'number') return payload.rank

  const ranks = (payload.roles ?? [])
    .map(r => (typeof r?.rank === 'number' ? r.rank : undefined))
    .filter((n): n is number => typeof n === 'number')

  return ranks.length ? Math.max(...ranks) : 0
}

/** True if Payload user is admin or any role in viewer token has cmsAdmin=true. */
export function hasCmsAdminFromReq(req: PayloadRequest): boolean {
  if ((req.user as any)?.isAdmin) return true

  const token = getHeader(req, 'x-viewer-token')
  const payload = decodeViewerToken(token)
  if (!payload?.roles) return false

  return payload.roles.some(r => r?.cmsAdmin === true)
}

/** Access helper: allow if cmsAdmin (via viewer token) or Payload user is admin. */
export const cmsAdminOrPayloadAdmin: Access = ({ req }) => {
  if ((req.user as any)?.isAdmin) return true
  return hasCmsAdminFromReq(req as PayloadRequest)
}

/**
 * Read gating by numeric rank stored on the document's "minRank" field.
 * Allows docs where minRank <= viewerRank OR minRank is not set.
 */
export const readByViewerRank: Access = ({ req }) => {
  const viewerRank = getViewerRankFromReq(req as PayloadRequest)
  return {
    or: [
      { minRank: { less_than_equal: viewerRank } },
      { minRank: { exists: false } },
    ],
  }
}
