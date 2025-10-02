// FILE: apps/web/src/app/api/admin/media/upload/route.ts
// Language: TypeScript

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { randomUUID } from "crypto";

/**
 * Logging toggles:
 *   MEDIA_DEBUG=1        → enable verbose [WEB upload:IN]/[WEB upload:OUT]
 *   MEDIA_LOG_ERRORS=0   → disable [WEB upload:ERROR] lines
 */
const LOG_MEDIA = String(process.env.MEDIA_DEBUG ?? "") === "1";
const LOG_ERRORS = String(process.env.MEDIA_LOG_ERRORS ?? "1") !== "0";

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

type ErrShape = {
  ok: false;
  code: ApiErrorCode;
  message: string;
  traceId?: string;
  details?: unknown;
};

function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  traceId?: string,
  details?: unknown,
) {
  const body: ErrShape = {
    ok: false,
    code,
    message,
    ...(traceId ? { traceId } : {}),
    ...(details ? { details } : {}),
  };
  return NextResponse.json(body, { status });
}

function isFile(x: unknown): x is File {
  return typeof File !== "undefined" && x instanceof File;
}
function asString(x: unknown): string {
  return typeof x === "string" ? x : "";
}
function normBoolStr(
  x: unknown,
  def: "true" | "false" = "true",
): "true" | "false" {
  if (typeof x === "boolean") return x ? "true" : "false";
  if (typeof x === "string") {
    const v = x.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return "true";
    if (["false", "0", "no", "off"].includes(v)) return "false";
  }
  return def;
}

const CMS_ORIGIN = process.env.CMS_INTERNAL_ORIGIN || "http://cm-cms:5322";

function classify400(text: string): ApiErrorCode {
  const t = text.toLowerCase();

  if ((t.includes("subcategory") && t.includes("category")) || t.includes("belongs to")) {
    if (t.includes("mismatch") || t.includes("does not belong")) return "CATEGORY_SUBCATEGORY_MISMATCH";
    return "VALIDATION_INVALID_RELATIONSHIP";
  }
  if (t.includes("unsupported") || t.includes("invalid type") || t.includes("mime")) {
    return "VALIDATION_UNSUPPORTED_TYPE";
  }
  if (t.includes("owner") && t.includes("required")) {
    return "OWNER_REQUIRED_FOR_PRIVATE";
  }
  return "VALIDATION_REQUIRED";
}

function classifyCmsFailure(
  status: number,
  text: string,
  contentType: string | null,
): { code: ApiErrorCode; message: string; status: number } {
  if (status === 401) return { code: "AUTH_REQUIRED", message: "Authentication required.", status };
  if (status === 403) return { code: "PERMISSION_DENIED", message: "You are not allowed to upload here.", status };
  if (status === 404) return { code: "NOT_FOUND", message: "Upload endpoint not found.", status };
  if (status === 409) return { code: "DUPLICATE_FILENAME", message: "A file with this derived path already exists.", status };
  if (status === 413) return { code: "VALIDATION_FILE_TOO_LARGE", message: "Uploaded file is too large.", status };
  if (status === 415) return { code: "VALIDATION_UNSUPPORTED_TYPE", message: "Unsupported file type.", status };
  if (status === 502 || status === 503) return { code: "NETWORK_UPSTREAM_FAILURE", message: "Upstream CMS is unavailable.", status };
  if (status === 504) return { code: "TIMEOUT", message: "Upload timed out.", status };

  if (status === 400) {
    const code = classify400(text);
    const message =
      code === "CATEGORY_SUBCATEGORY_MISMATCH"
        ? "Selected subcategory does not belong to the selected category."
        : code === "VALIDATION_INVALID_RELATIONSHIP"
          ? "Invalid relationship between fields."
          : code === "VALIDATION_UNSUPPORTED_TYPE"
            ? "Unsupported file type."
            : code === "OWNER_REQUIRED_FOR_PRIVATE"
              ? "When shared=false, an owner 'userDiscordId' is required."
              : "Validation failed.";
    return { code, message, status };
  }

  if (status >= 500) return { code: "SERVER_ERROR", message: "CMS error.", status };
  return status >= 400 && status < 500
    ? { code: "VALIDATION_REQUIRED", message: "Request invalid.", status }
    : { code: "SERVER_ERROR", message: "Unexpected error.", status: 500 };
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user &&
    typeof (session.user as Record<string, unknown>)["discordId"] === "string"
      ? String((session.user as Record<string, unknown>)["discordId"])
      : "") || "";

  const form = await req.formData();
  const file = form.get("file");
  const alt = asString(form.get("alt"));
  const category = asString(form.get("category"));
  const subcategory = asString(form.get("subcategory"));
  const shared = normBoolStr(form.get("shared"), "true");

  if (LOG_MEDIA) {
    // eslint-disable-next-line no-console
    console.log("[WEB upload:IN]", {
      traceId,
      hasFile: isFile(file),
      alt: alt || null,
      category: category || null,
      subcategory: subcategory || null,
      shared,
      actorDiscordId: actorDiscordId || null,
    });
  }

  if (!actorDiscordId) {
    return jsonError("AUTH_REQUIRED", "Sign in required.", 401, traceId);
  }
  if (!isFile(file)) {
    return jsonError("VALIDATION_REQUIRED", "Field 'file' is required.", 400, traceId);
  }

  const u = new URL("/api/media", CMS_ORIGIN);
  if (alt) u.searchParams.set("alt", alt);
  if (category) u.searchParams.set("category", category);
  if (subcategory) u.searchParams.set("subcategory", subcategory);
  u.searchParams.set("shared", shared);
  if (actorDiscordId) u.searchParams.set("userDiscordId", actorDiscordId);
  u.searchParams.set("trace", traceId);

  const out = new FormData();
  out.set("file", file, file.name);
  if (alt) out.set("alt", alt);
  if (category) out.set("category", category);
  if (subcategory) out.set("subcategory", subcategory);
  out.set("shared", shared);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Media-Alt": alt,
    "X-Media-Category": category,
    "X-Media-Subcategory": subcategory,
    "X-Media-Shared": shared,
    "X-Actor-Discord-Id": actorDiscordId,
    "X-User-Discord-Id": actorDiscordId,
    "X-Discord-Id": actorDiscordId,
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);

  try {
    const resp = await fetch(u.toString(), {
      method: "POST",
      body: out,
      headers,
      signal: controller.signal,
    });
    clearTimeout(t);

    const contentType = resp.headers.get("content-type");
    const rawText = await resp.text();

    let parsed: unknown = undefined;
    if (contentType && contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(rawText) as unknown;
      } catch { /* ignore */ }
    }

    if (!resp.ok) {
      if (resp.status === 400) {
        const lowerText = rawText.toLowerCase();
        const errs =
          (Array.isArray((parsed as { errors?: unknown[] } | null)?.errors)
            ? (parsed as { errors: unknown[] }).errors
            : Array.isArray((parsed as { data?: { errors?: unknown[] } } | null)?.data?.errors)
              ? ((parsed as { data: { errors: unknown[] } }).data.errors)
              : []) as unknown[];

        const first = errs.find((e) => {
          const msg = (e as { message?: unknown })?.message;
          const path = (e as { path?: unknown })?.path;
          const msgStr = typeof msg === "string" ? msg.toLowerCase() : "";
          const pathStr = typeof path === "string" ? path.toLowerCase() : "";
          return msgStr.includes("value must be unique") && (pathStr === "filename" || lowerText.includes("filename"));
        });

        const uniqueInText = lowerText.includes("value must be unique") && lowerText.includes("filename");

        if (first || uniqueInText) {
          if (LOG_ERRORS) {
            // eslint-disable-next-line no-console
            console.log("[WEB upload:ERROR]", {
              traceId,
              code: "DUPLICATE_FILENAME",
              status: 409,
              message: "A file with this derived path already exists.",
              from: u.toString(),
            });
          }
          return jsonError("DUPLICATE_FILENAME", "A file with this derived path already exists.", 409, traceId, parsed ?? rawText);
        }
      }

      const { code, message, status } = classifyCmsFailure(resp.status, rawText, contentType);
      if (LOG_ERRORS) {
        // eslint-disable-next-line no-console
        console.log("[WEB upload:ERROR]", { traceId, code, status, message, from: u.toString() });
      }
      const details = parsed !== undefined ? parsed : rawText;
      return jsonError(code, message, status, traceId, details);
    }

    const payload =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : rawText
          ? (JSON.parse(rawText) as Record<string, unknown>)
          : {};

    if (LOG_MEDIA) {
      // eslint-disable-next-line no-console
      console.log("[WEB upload:OUT]", {
        traceId,
        elapsedMs: 0,
        cmsResponseKeys: Object.keys(payload),
      });
    }

    return NextResponse.json({ ok: true, traceId, ...payload }, { status: 200 });
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "Upload failed";
    const name = e instanceof Error ? e.name : "";
    if (LOG_ERRORS) {
      // eslint-disable-next-line no-console
      console.log("[WEB upload:ERROR]", { traceId, error: msg });
    }

    if (name === "AbortError") {
      return jsonError("TIMEOUT", "Upload timed out.", 504, traceId);
    }
    const lowered = String(msg).toLowerCase();
    if (lowered.includes("fetch failed") || lowered.includes("econnrefused") || lowered.includes("network")) {
      return jsonError("NETWORK_UPSTREAM_FAILURE", "Cannot reach CMS.", 502, traceId);
    }
    return jsonError("SERVER_ERROR", "Unexpected error during upload.", 500, traceId);
  }
}
