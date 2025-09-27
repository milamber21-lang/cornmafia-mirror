// FILE: apps/web/src/app/api/admin/media/echo/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

type ApiErrorCode = "AUTH_REQUIRED";

function jsonError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: Request) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user && typeof (session.user as Record<string, unknown>).discordId === "string"
      ? String((session.user as Record<string, unknown>).discordId)
      : null);

  if (!actorDiscordId) {
    return jsonError("AUTH_REQUIRED", "Sign in required.", 401);
  }

  const form = await req.formData().catch(() => null);
  const alt = typeof form?.get("alt") === "string" ? (form?.get("alt") as string) : "";
  const category = typeof form?.get("category") === "string" ? (form?.get("category") as string) : "";
  const subcategory = typeof form?.get("subcategory") === "string" ? (form?.get("subcategory") as string) : "";
  const shared = typeof form?.get("shared") === "string" ? (form?.get("shared") as string) : "true";
  const traceId = crypto.randomUUID();

  const fd = new FormData();
  for (const key of ["file", "data", "alt", "category", "subcategory", "shared"]) {
    const v = form?.get(key);
    if (v) fd.set(key, v as Blob | string);
  }
  if (fd.get("data") == null) {
    fd.set("data", JSON.stringify({ alt, category, subcategory, shared: !(shared === "false" || shared === "0") }));
  }

  const qs = new URLSearchParams({ alt, category, subcategory, shared, trace: traceId });
  const headers: Record<string, string> = {
    "X-Trace-Id": traceId,
    ...(alt ? { "X-Media-Alt": alt } : {}),
    ...(category ? { "X-Media-Category": category } : {}),
    ...(subcategory ? { "X-Media-Subcategory": subcategory } : {}),
    "X-Media-Shared": shared,
  };

  const res = await cmsAuthedFetchJsonForDiscordUser(actorDiscordId, `/api/debug/echo?${qs}`, {
    method: "POST",
    body: fd as unknown as BodyInit,
    headers,
  });

  return NextResponse.json({ ok: true, cmsEcho: res, traceId });
}
