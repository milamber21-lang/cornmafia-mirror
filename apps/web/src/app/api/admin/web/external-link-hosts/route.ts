//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/external-link-hosts/route.ts                                            ////
//// Language: TS                                                                                                ////
//// DB-first admin external link whitelist API with host and path rule validation                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	createExternalLinkHostAdmin,
	deleteExternalLinkHostAdmin,
	findExternalLinkHostAdminById,
	listExternalLinkHostsAdmin,
	updateExternalLinkHostAdmin,
	type ExternalLinkHostMatchModeCode,
	type ExternalLinkHostSurfaceScopeCode,
	type ExternalLinkPathMatchModeCode,
} from "@/lib/data/external-link-hosts";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNullableString,
	parseBoolean,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type CreateBody = {
	hostPattern?: unknown;
	hostMatchModeCode?: unknown;
	pathPattern?: unknown;
	pathMatchModeCode?: unknown;
	allowedSurfaceScopeCode?: unknown;
	comment?: unknown;
	validFrom?: unknown;
	validTo?: unknown;
	enabled?: unknown;
};

type UpdateBody = CreateBody;

type DateBoundary = "start" | "end";

type DateParseResult =
	| { ok: true; value: string | null }
	| { ok: false; message: string };

type MutationParseResult =
	| {
			ok: true;
			hostPattern: string;
			hostMatchModeCode: ExternalLinkHostMatchModeCode;
			pathPattern: string;
			pathMatchModeCode: ExternalLinkPathMatchModeCode;
			allowedSurfaceScopeCode: ExternalLinkHostSurfaceScopeCode;
			comment: string | null;
			validFrom: string | null;
			validTo: string | null;
			enabled: boolean;
	  }
	| { ok: false; message: string };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HOST_PATTERN = /^[a-z0-9.-]{1,253}$/;
const HOST_MATCH_MODE_CODES: readonly ExternalLinkHostMatchModeCode[] = [
	"exact_host",
];
const PATH_MATCH_MODE_CODES: readonly ExternalLinkPathMatchModeCode[] = [
	"any_path",
	"exact_path",
	"path_prefix",
];
const SURFACE_SCOPE_CODES: readonly ExternalLinkHostSurfaceScopeCode[] = [
	"admin",
	"public",
	"all",
];

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function normalizeHostPattern(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase().replace(/\.$/, "");
	return normalized.length > 0 ? normalized : null;
}

function normalizePathPattern(value: unknown): string | null {
	if (value === null || value === undefined) {
		return "/";
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : "/";
}

function isHostMatchModeCode(
	value: string,
): value is ExternalLinkHostMatchModeCode {
	return HOST_MATCH_MODE_CODES.includes(
		value as ExternalLinkHostMatchModeCode,
	);
}

function normalizeHostMatchModeCode(
	value: unknown,
): ExternalLinkHostMatchModeCode | null {
	if (value === null || value === undefined || value === "") {
		return "exact_host";
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isHostMatchModeCode(normalized) ? normalized : null;
}

function isPathMatchModeCode(
	value: string,
): value is ExternalLinkPathMatchModeCode {
	return PATH_MATCH_MODE_CODES.includes(
		value as ExternalLinkPathMatchModeCode,
	);
}

function normalizePathMatchModeCode(
	value: unknown,
): ExternalLinkPathMatchModeCode | null {
	if (value === null || value === undefined || value === "") {
		return "any_path";
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isPathMatchModeCode(normalized) ? normalized : null;
}

function isSurfaceScopeCode(
	value: string,
): value is ExternalLinkHostSurfaceScopeCode {
	return SURFACE_SCOPE_CODES.includes(value as ExternalLinkHostSurfaceScopeCode);
}

function normalizeSurfaceScopeCode(
	value: unknown,
): ExternalLinkHostSurfaceScopeCode | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isSurfaceScopeCode(normalized) ? normalized : null;
}

function parseNullableDateOnly(
	value: unknown,
	label: string,
	boundary: DateBoundary,
): DateParseResult {
	if (value === null || value === undefined) {
		return { ok: true, value: null };
	}

	if (typeof value !== "string") {
		return { ok: false, message: `${label} must be a date string.` };
	}

	const normalized = value.trim();
	if (!normalized) {
		return { ok: true, value: null };
	}

	if (!DATE_ONLY_PATTERN.test(normalized)) {
		return { ok: false, message: `${label} must be a valid date.` };
	}

	const [yearText, monthText, dayText] = normalized.split("-");
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const hour = boundary === "start" ? 0 : 23;
	const minute = boundary === "start" ? 0 : 59;
	const second = boundary === "start" ? 0 : 59;
	const millisecond = boundary === "start" ? 0 : 999;
	const date = new Date(
		Date.UTC(year, month - 1, day, hour, minute, second, millisecond),
	);

	if (
		Number.isNaN(date.getTime()) ||
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return { ok: false, message: `${label} must be a valid date.` };
	}

	return { ok: true, value: date.toISOString() };
}

function parseRequiredBoolean(value: unknown): boolean | null {
	if (typeof value !== "boolean") {
		return null;
	}

	return value;
}

function validateHostPattern(hostPattern: string): string | null {
	if (
		!HOST_PATTERN.test(hostPattern) ||
		hostPattern.startsWith(".") ||
		hostPattern.endsWith(".") ||
		hostPattern.includes("..") ||
		hostPattern.includes("/") ||
		hostPattern.includes(":") ||
		hostPattern.includes("@")
	) {
		return "Host pattern must be an exact normalized host such as youtube.com.";
	}

	return null;
}

function validatePathPattern(
	pathPattern: string,
	pathMatchModeCode: ExternalLinkPathMatchModeCode,
): string | null {
	if (pathMatchModeCode === "any_path") {
		return pathPattern === "/"
			? null
			: "Any path rules must use / as the path pattern.";
	}

	if (pathPattern === "/") {
		return "Exact path and path prefix rules must use a path more specific than /.";
	}

	if (
		!pathPattern.startsWith("/") ||
		pathPattern.includes("?") ||
		pathPattern.includes("#") ||
		pathPattern.includes("\\") ||
		pathPattern.includes("//") ||
		pathPattern.includes("..") ||
		pathPattern.toLowerCase().includes("%2e") ||
		/\s/.test(pathPattern) ||
		pathPattern.endsWith("/")
	) {
		return "Path pattern must be a clean path such as /@channel or /news/item.";
	}

	return null;
}

function classifyExternalLinkHostError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process external link request.",
	);
}

function parseMutationData(
	data: CreateBody,
	requireEnabled: boolean,
): MutationParseResult {
	const hostPattern = normalizeHostPattern(data.hostPattern);
	if (!hostPattern) {
		return { ok: false, message: "Host pattern is required." };
	}

	const hostValidationError = validateHostPattern(hostPattern);
	if (hostValidationError) {
		return { ok: false, message: hostValidationError };
	}

	const hostMatchModeCode = normalizeHostMatchModeCode(data.hostMatchModeCode);
	if (!hostMatchModeCode) {
		return {
			ok: false,
			message: "Host match mode must be exact_host.",
		};
	}

	const pathMatchModeCode = normalizePathMatchModeCode(data.pathMatchModeCode);
	if (!pathMatchModeCode) {
		return {
			ok: false,
			message: "Path match mode must be any_path, exact_path, or path_prefix.",
		};
	}

	const rawPathPattern = normalizePathPattern(data.pathPattern);
	if (!rawPathPattern) {
		return { ok: false, message: "Path pattern is required." };
	}

	const pathPattern = pathMatchModeCode === "any_path" ? "/" : rawPathPattern;
	const pathValidationError = validatePathPattern(
		pathPattern,
		pathMatchModeCode,
	);
	if (pathValidationError) {
		return { ok: false, message: pathValidationError };
	}

	const allowedSurfaceScopeCode = normalizeSurfaceScopeCode(
		data.allowedSurfaceScopeCode,
	);
	if (!allowedSurfaceScopeCode) {
		return {
			ok: false,
			message: "Surface scope must be admin, public, or all.",
		};
	}

	const validFromResult = parseNullableDateOnly(
		data.validFrom,
		"Valid from",
		"start",
	);
	if (!validFromResult.ok) {
		return { ok: false, message: validFromResult.message };
	}

	const validToResult = parseNullableDateOnly(data.validTo, "Valid to", "end");
	if (!validToResult.ok) {
		return { ok: false, message: validToResult.message };
	}

	if (
		validFromResult.value &&
		validToResult.value &&
		Date.parse(validToResult.value) < Date.parse(validFromResult.value)
	) {
		return {
			ok: false,
			message: "Valid to must be greater than or equal to valid from.",
		};
	}

	const enabled = requireEnabled
		? parseRequiredBoolean(data.enabled)
		: parseBoolean(data.enabled, true);
	if (enabled === null) {
		return { ok: false, message: "Enabled is required." };
	}

	return {
		ok: true,
		hostPattern,
		hostMatchModeCode,
		pathPattern,
		pathMatchModeCode,
		allowedSurfaceScopeCode,
		comment: normalizeNullableString(data.comment),
		validFrom: validFromResult.value,
		validTo: validToResult.value,
		enabled,
	};
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listExternalLinkHostsAdmin();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyExternalLinkHostError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const payload = asObject(body);
	if (!payload) {
		return jsonError("VALIDATION_REQUIRED", "Invalid request body.", 400);
	}

	const op = typeof payload.op === "string" ? payload.op : null;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "create") {
			const data = asObject(payload.data) as CreateBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const parsed = parseMutationData(data, false);
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			const createdId = await createExternalLinkHostAdmin({
				actorDiscordId,
				hostPattern: parsed.hostPattern,
				hostMatchModeCode: parsed.hostMatchModeCode,
				pathPattern: parsed.pathPattern,
				pathMatchModeCode: parsed.pathMatchModeCode,
				allowedSurfaceScopeCode: parsed.allowedSurfaceScopeCode,
				comment: parsed.comment,
				validFrom: parsed.validFrom,
				validTo: parsed.validTo,
				enabled: parsed.enabled,
			});

			const doc = createdId
				? await findExternalLinkHostAdminById(createdId)
				: null;
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "update") {
			const externalLinkHostId = parsePositiveInt(payload.id);
			if (externalLinkHostId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const data = asObject(payload.data) as UpdateBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const parsed = parseMutationData(data, true);
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			await updateExternalLinkHostAdmin({
				actorDiscordId,
				externalLinkHostId,
				hostPattern: parsed.hostPattern,
				hostMatchModeCode: parsed.hostMatchModeCode,
				pathPattern: parsed.pathPattern,
				pathMatchModeCode: parsed.pathMatchModeCode,
				allowedSurfaceScopeCode: parsed.allowedSurfaceScopeCode,
				comment: parsed.comment,
				validFrom: parsed.validFrom,
				validTo: parsed.validTo,
				enabled: parsed.enabled,
			});

			const doc = await findExternalLinkHostAdminById(externalLinkHostId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "toggle") {
			const externalLinkHostId = parsePositiveInt(payload.id);
			if (externalLinkHostId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existing = await findExternalLinkHostAdminById(externalLinkHostId);
			if (!existing) {
				return jsonError(
					"NOT_FOUND",
					`web_external_link_host_c row ${String(externalLinkHostId)} was not found.`,
					404,
				);
			}

			await updateExternalLinkHostAdmin({
				actorDiscordId,
				externalLinkHostId,
				hostPattern: existing.hostPattern,
				hostMatchModeCode: existing.hostMatchModeCode,
				pathPattern: existing.pathPattern,
				pathMatchModeCode: existing.pathMatchModeCode,
				allowedSurfaceScopeCode: existing.allowedSurfaceScopeCode,
				comment: existing.comment,
				validFrom: existing.validFrom,
				validTo: existing.validTo,
				enabled: !existing.enabled,
			});

			const doc = await findExternalLinkHostAdminById(externalLinkHostId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "delete") {
			const externalLinkHostId = parsePositiveInt(payload.id);
			if (externalLinkHostId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteExternalLinkHostAdmin({ actorDiscordId, externalLinkHostId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyExternalLinkHostError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
