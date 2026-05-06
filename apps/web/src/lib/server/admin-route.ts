//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/admin-route.ts                                                                  ////
//// Language: TS                                                                                                  ////
//// Shared server-side guard, parsing, and JSON error helpers for admin API routes                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/auth";
import { requireAdmin, requireAdminOrEditor } from "@/lib/auth/authz";

export type ApiErrorCode =
	| "AUTH_REQUIRED"
	| "PERMISSION_DENIED"
	| "NOT_FOUND"
	| "VALIDATION_REQUIRED"
	| "SERVER_ERROR";

export type AdminRouteError = {
	code: ApiErrorCode;
	message: string;
	status: number;
};

export interface PageSizeParseOptions {
	defaultPageSize?: number;
	maxPageSize?: number;
	minPageSize?: number;
}

export function jsonError(
	code: ApiErrorCode,
	message: string,
	status: number,
): NextResponse {
	return NextResponse.json({ ok: false, code, message }, { status });
}

export async function requireAdminResponse(): Promise<NextResponse | null> {
	const guard = await requireAdmin();
	if (guard.allowed) {
		return null;
	}

	return guard.reason === "not-authenticated"
		? jsonError("AUTH_REQUIRED", "Sign in required.", 401)
		: jsonError("PERMISSION_DENIED", "Admin access required.", 403);
}

export async function requireAdminOrEditorResponse(): Promise<NextResponse | null> {
	const guard = await requireAdminOrEditor();
	if (guard.allowed) {
		return null;
	}

	return guard.reason === "not-authenticated"
		? jsonError("AUTH_REQUIRED", "Sign in required.", 401)
		: jsonError("PERMISSION_DENIED", "Admin or editor access required.", 403);
}

export function getActorDiscordId(session: unknown): string | null {
	if (
		typeof session === "object" &&
		session !== null &&
		"user" in session &&
		typeof (session as { user?: unknown }).user === "object" &&
		(session as { user?: unknown }).user !== null &&
		"discordId" in ((session as { user?: unknown }).user as object)
	) {
		const discordId = ((session as { user?: { discordId?: unknown } }).user
			?.discordId ?? null) as unknown;
		return typeof discordId === "string" && discordId.trim().length > 0
			? discordId.trim()
			: null;
	}

	return null;
}

export async function requireActorDiscordId(args?: {
	allowAdminOrEditor?: boolean;
}): Promise<string | NextResponse> {
	const guardResponse = args?.allowAdminOrEditor
		? await requireAdminOrEditorResponse()
		: await requireAdminResponse();

	if (guardResponse) {
		return guardResponse;
	}

	const session = await getAuthSession();
	const actorDiscordId = getActorDiscordId(session);
	if (!actorDiscordId) {
		return jsonError("AUTH_REQUIRED", "Sign in required.", 401);
	}

	return actorDiscordId;
}

export function parsePositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

export function parseNonNegativeInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
	}

	return null;
}

export function parsePageParam(value: unknown, fallback = 1): number {
	const parsed = parsePositiveInt(value);
	return parsed ?? fallback;
}

export function parsePageSizeParam(
	value: unknown,
	options?: PageSizeParseOptions,
): number {
	const defaultPageSize = options?.defaultPageSize ?? 20;
	const maxPageSize = options?.maxPageSize ?? 1000;
	const minPageSize = options?.minPageSize ?? 1;
	const parsed = parsePositiveInt(value);

	if (parsed === null) {
		return defaultPageSize;
	}

	return Math.min(Math.max(parsed, minPageSize), maxPageSize);
}

export function parseRequiredBoolean(value: unknown): boolean | null {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true") {
			return true;
		}
		if (normalized === "false") {
			return false;
		}
	}

	return null;
}

export function parseBoolean(value: unknown, fallback = false): boolean {
	return parseRequiredBoolean(value) ?? fallback;
}

export function normalizeNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

export function normalizeNullableString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

export function normalizeCode(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return normalized.length > 0 ? normalized : null;
}

export function classifyAdminMutationError(
	error: unknown,
	fallbackMessage: string,
): AdminRouteError {
	const message = error instanceof Error ? error.message : fallbackMessage;
	const normalized = message.toLowerCase();

	if (normalized.includes("not found") || normalized.includes("was not found")) {
		return { code: "NOT_FOUND", message, status: 404 };
	}

	if (
		normalized.includes("required") ||
		normalized.includes("already exists") ||
		normalized.includes("exists") ||
		normalized.includes("must") ||
		normalized.includes("violates") ||
		normalized.includes("cannot") ||
		normalized.includes("duplicate") ||
		normalized.includes("referenced")
	) {
		return { code: "VALIDATION_REQUIRED", message, status: 400 };
	}

	return { code: "SERVER_ERROR", message, status: 500 };
}
