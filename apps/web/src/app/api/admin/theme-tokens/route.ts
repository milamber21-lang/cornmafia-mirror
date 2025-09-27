// FILE: apps/web/src/app/api/admin/themetokens/route.ts
// Language: TypeScript

/**
 * Admin actions: Theme Tokens CRUD + list with normalized API error envelopes.
 * - GET  -> read via cmsFetchJson
 * - POST -> write via cmsAuthedFetchJsonForDiscordUser (uses user's discordId)
 * - Create: tries {key,...}; on "id must be unique" error, retries with {id:key,...}
 * - Revalidates tag 'tokens' on successful write
 * - Guard: Admin OR Editor (404 on deny)
 *
 * Error envelope (non-2xx):
 *   { ok: false, code: ApiErrorCode, message: string, details?: unknown }
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminOrEditor } from "@/lib/authz";
import { cmsFetchJson } from "@/lib/cms";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";

type ThemeToken = {
  id: string;
  key?: string;
  label: string;
  preview?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};
type FindResponse<T> = { docs: T[]; totalDocs: number };

type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "VALIDATION_REQUIRED"
  | "VALIDATION_INVALID_RELATIONSHIP"
  | "VALIDATION_UNSUPPORTED_TYPE"
  | "VALIDATION_FILE_TOO_LARGE"
  | "DUPLICATE_FILENAME"
  | "NETWORK_UPSTREAM_FAILURE"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "OWNER_REQUIRED_FOR_PRIVATE"
  | "CATEGORY_SUBCATEGORY_MISMATCH";

function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
) {
  const body: { ok: false; code: ApiErrorCode; message: string; details?: unknown } = {
    ok: false,
    code,
    message,
    ...(details !== undefined ? { details } : {}),
  };
  return NextResponse.json(body, { status });
}

function classifyFromMessage(msg: string): { code: ApiErrorCode; status: number } {
  const t = msg.toLowerCase();

  // Network / availability
  if (t.includes("fetch failed") || t.includes("econnrefused") || t.includes("network"))
    return { code: "NETWORK_UPSTREAM_FAILURE", status: 502 };
  if (t.includes("timeout") || t.includes("timed out") || t.includes("abort"))
    return { code: "TIMEOUT", status: 504 };

  // Permission
  if (t.includes("forbidden") || t.includes("permission"))
    return { code: "PERMISSION_DENIED", status: 403 };
  if (t.includes("unauthorized") || t.includes("auth"))
    return { code: "AUTH_REQUIRED", status: 401 };

  // Duplicates (unique constraint)
  if (t.includes("value must be unique") && (t.includes(" path ") || t.includes("path:")))
    return { code: "DUPLICATE_FILENAME", status: 409 };

  // Not found
  if (t.includes("not found"))
    return { code: "NOT_FOUND", status: 404 };

  // Validation
  if (t.includes("validation") || t.includes("invalid") || t.includes("bad request"))
    return { code: "VALIDATION_REQUIRED", status: 400 };

  // Default
  return { code: "SERVER_ERROR", status: 500 };
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminOrEditor(req as unknown as Request);
  if (!guard.allowed) {
    return jsonError("PERMISSION_DENIED", "You don’t have permission to view theme tokens.", 404);
  }

  try {
    const data = await cmsFetchJson<FindResponse<ThemeToken>>(
      "/api/themeTokens?limit=500&depth=0&sort=key",
      { headers: { accept: "application/json" } }
    );
    return NextResponse.json({ docs: data.docs ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? "Error");
    const { code, status } = classifyFromMessage(msg);
    return jsonError(code, code === "NETWORK_UPSTREAM_FAILURE" ? "CMS is unavailable." : "Failed to load theme tokens.", status, msg);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminOrEditor(req as unknown as Request);
  if (!guard.allowed) {
    return jsonError("PERMISSION_DENIED", "You don’t have permission to manage theme tokens.", 404);
  }

  const session = await getServerSession(buildAuthOptions());
  const user = session?.user as { discordId?: string | null } | null;
  const discordId = user?.discordId ?? null;
  if (!discordId) return jsonError("AUTH_REQUIRED", "Sign in required.", 401);

  try {
    const parsed = (await req.json()) as {
      op: "create" | "update" | "delete";
      id?: unknown;
      data?: unknown;
    };

    const op = typeof parsed?.op === "string" ? parsed.op : "";
    const id = parsed?.id;
    const data = (parsed?.data ?? null) as Record<string, unknown> | null;

    switch (op) {
      case "create": {
        if (!data) return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);

        // Attempt create with provided fields first (key-based schema).
        try {
          await cmsAuthedFetchJsonForDiscordUser(discordId, "/api/themeTokens", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e ?? "");
          const looksLikeIdUnique =
            /The following field is invalid:\s*id/i.test(msg) ||
            /Value must be unique.*path.*id/i.test(msg) ||
            /Value must be unique.*path.*key/i.test(msg);
          const key = typeof data.key === "string" ? data.key : undefined;

          if (looksLikeIdUnique && key) {
            // Retry for id-based schema: id := key; keep other fields.
            try {
              await cmsAuthedFetchJsonForDiscordUser(discordId, "/api/themeTokens", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  id: key,
                  label: data.label,
                  preview: data.preview ?? null,
                  enabled: data.enabled === true,
                }),
              });
            } catch (e2) {
              const m2 = e2 instanceof Error ? e2.message : String(e2 ?? "");
              // If still unique, classify as duplicate
              if (/Value must be unique/i.test(m2)) {
                return jsonError("DUPLICATE_FILENAME", "A token with this key already exists.", 409, m2);
              }
              const { code, status } = classifyFromMessage(m2);
              return jsonError(code, code === "NETWORK_UPSTREAM_FAILURE" ? "CMS is unavailable." : "Failed to create token.", status, m2);
            }
          } else {
            const { code, status } = classifyFromMessage(msg);
            // Duplicate key on first attempt
            if (code === "DUPLICATE_FILENAME") {
              return jsonError("DUPLICATE_FILENAME", "A token with this key already exists.", 409, msg);
            }
            return jsonError(code, code === "NETWORK_UPSTREAM_FAILURE" ? "CMS is unavailable." : "Failed to create token.", status, msg);
          }
        }
        break;
      }

      case "update": {
        const idStr =
          typeof id === "string" || typeof id === "number" ? String(id) : "";
        if (!idStr) return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);

        try {
          await cmsAuthedFetchJsonForDiscordUser(discordId, `/api/themeTokens/${idStr}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify((data ?? {}) as Record<string, unknown>),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e ?? "");
          const { code, status } = classifyFromMessage(msg);
          return jsonError(
            code,
            code === "NOT_FOUND"
              ? "Token not found."
              : code === "DUPLICATE_FILENAME"
              ? "A token with this key already exists."
              : code === "NETWORK_UPSTREAM_FAILURE"
              ? "CMS is unavailable."
              : "Failed to update token.",
            status,
            msg,
          );
        }
        break;
      }

      case "delete": {
        const idStr =
          typeof id === "string" || typeof id === "number" ? String(id) : "";
        if (!idStr) return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);

        try {
          await cmsAuthedFetchJsonForDiscordUser(discordId, `/api/themeTokens/${idStr}`, {
            method: "DELETE",
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e ?? "");
          const { code, status } = classifyFromMessage(msg);
          return jsonError(
            code,
            code === "NOT_FOUND"
              ? "Token not found."
              : code === "NETWORK_UPSTREAM_FAILURE"
              ? "CMS is unavailable."
              : "Failed to delete token.",
            status,
            msg,
          );
        }
        break;
      }

      default:
        return jsonError("VALIDATION_REQUIRED", "Unknown op.", 400);
    }

    revalidateTag("tokens");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? "");
    const { code, status } = classifyFromMessage(msg);
    return jsonError(code, "Unexpected error.", status, msg);
  }
}
