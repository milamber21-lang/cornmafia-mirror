// FILE: apps/web/src/app/api/admin/media/delete/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "VALIDATION_REQUIRED"
  | "SERVER_ERROR";

function jsonError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: Request) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return jsonError("AUTH_REQUIRED", "Sign in required.", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("VALIDATION_REQUIRED", "Body must be JSON.", 400);
  }

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) {
    return jsonError("VALIDATION_REQUIRED", "Field 'id' is required.", 400);
  }

  try {
    // CMS access rules will enforce authorization.
    await cmsAuthedFetchJsonForDiscordUser(actorDiscordId, `/api/media/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // We don't have a structured status from the helper—map generically.
    // If the helper includes status in message, we could parse it; otherwise fall back:
    const msg = err instanceof Error ? err.message : "Delete failed.";
    const lowered = msg.toLowerCase();
    if (lowered.includes(" 404 ") || lowered.includes(" not found")) {
      return jsonError("NOT_FOUND", "Delete target was not found.", 404);
    }
    if (lowered.includes(" 403 ") || lowered.includes("forbidden")) {
      return jsonError("PERMISSION_DENIED", "You are not allowed to delete this item.", 403);
    }
    return jsonError("SERVER_ERROR", "Delete failed.", 500);
  }
}
