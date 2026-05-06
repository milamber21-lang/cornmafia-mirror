//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/content-kinds/route.ts                                                   ////
//// Language: TS                                                                                                 ////
//// DB-first admin content kinds API with route-prefix controls                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	createContentKindAdmin,
	deleteContentKindAdmin,
	findContentKindAdminByCode,
	listContentKindsAdmin,
	updateContentKindAdmin,
	type ContentKindPublicRoutePrefix,
	type ContentKindRendererCode,
} from "@/lib/data/content-kinds";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeCode,
	normalizeNonEmptyString,
	normalizeNullableString,
	parseBoolean,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type CreateBody = {
	contentKindCode?: unknown;
	label?: unknown;
	description?: unknown;
	publicRoutePrefix?: unknown;
	rendererCode?: unknown;
	enabled?: unknown;
};

type UpdateBody = {
	label?: unknown;
	description?: unknown;
	publicRoutePrefix?: unknown;
	rendererCode?: unknown;
	enabled?: unknown;
};

type MutationParseResult =
	| {
			ok: true;
			label: string;
			description: string | null;
			publicRoutePrefix: ContentKindPublicRoutePrefix | null;
			rendererCode: ContentKindRendererCode;
			enabled: boolean;
	  }
	| { ok: false; message: string };

const PUBLIC_ROUTE_PREFIXES: readonly ContentKindPublicRoutePrefix[] = [
	"map",
	"tool",
	"app",
	"event",
	"custom",
	"external",
	"video",
];

const PUBLIC_ROUTE_PREFIX_MESSAGE =
	"Route prefix must be blank, app, custom, event, external, map, tool, or video.";

const RENDERER_CODES: readonly ContentKindRendererCode[] = [
	"page",
	"map",
	"tool",
	"app",
	"event",
	"custom",
	"external_link",
	"youtube",
	"stream",
	"calendar",
];

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function classifyContentKindError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process content kind request.",
	);
}

function isPublicRoutePrefix(
	value: string,
): value is ContentKindPublicRoutePrefix {
	return PUBLIC_ROUTE_PREFIXES.includes(value as ContentKindPublicRoutePrefix);
}

function normalizePublicRoutePrefix(
	value: unknown,
): ContentKindPublicRoutePrefix | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	if (!normalized) {
		return null;
	}

	return isPublicRoutePrefix(normalized) ? normalized : null;
}

function hasInvalidPublicRoutePrefix(value: unknown): boolean {
	if (value === null || value === undefined) {
		return false;
	}

	if (typeof value !== "string") {
		return true;
	}

	const normalized = value.trim().toLowerCase();
	return normalized.length > 0 && !isPublicRoutePrefix(normalized);
}

function isRendererCode(value: string): value is ContentKindRendererCode {
	return RENDERER_CODES.includes(value as ContentKindRendererCode);
}

function normalizeRendererCode(value: unknown): ContentKindRendererCode | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isRendererCode(normalized) ? normalized : null;
}

function parseMutationData(
	data: CreateBody | UpdateBody,
	requireEnabled: boolean,
): MutationParseResult {
	const label = normalizeNonEmptyString(data.label);
	if (!label) {
		return { ok: false, message: "Label is required." };
	}

	if (hasInvalidPublicRoutePrefix(data.publicRoutePrefix)) {
		return {
			ok: false,
			message: PUBLIC_ROUTE_PREFIX_MESSAGE,
		};
	}

	const rendererCode = normalizeRendererCode(data.rendererCode);
	if (!rendererCode) {
		return {
			ok: false,
			message: "Renderer must be page, map, tool, app, event, custom, external_link, youtube, stream, or calendar.",
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
		label,
		description: normalizeNullableString(data.description),
		publicRoutePrefix: normalizePublicRoutePrefix(data.publicRoutePrefix),
		rendererCode,
		enabled,
	};
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listContentKindsAdmin();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyContentKindError(error);
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

			const contentKindCode = normalizeCode(data.contentKindCode);
			if (!contentKindCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Content kind code is required.",
					400,
				);
			}

			const parsed = parseMutationData(data, false);
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			const createdCode = await createContentKindAdmin({
				actorDiscordId,
				contentKindCode,
				label: parsed.label,
				description: parsed.description,
				publicRoutePrefix: parsed.publicRoutePrefix,
				rendererCode: parsed.rendererCode,
				enabled: parsed.enabled,
			});

			const doc = createdCode
				? await findContentKindAdminByCode(createdCode)
				: null;
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "update") {
			const contentKindCode = normalizeCode(payload.id);
			if (!contentKindCode) {
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

			await updateContentKindAdmin({
				actorDiscordId,
				contentKindCode,
				label: parsed.label,
				description: parsed.description,
				publicRoutePrefix: parsed.publicRoutePrefix,
				rendererCode: parsed.rendererCode,
				enabled: parsed.enabled,
			});

			const doc = await findContentKindAdminByCode(contentKindCode);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "toggle") {
			const contentKindCode = normalizeCode(payload.id);
			if (!contentKindCode) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existing = await findContentKindAdminByCode(contentKindCode);
			if (!existing) {
				return jsonError(
					"NOT_FOUND",
					`web_content_kind_c row ${contentKindCode} was not found.`,
					404,
				);
			}

			await updateContentKindAdmin({
				actorDiscordId,
				contentKindCode,
				label: existing.label,
				description: existing.description,
				publicRoutePrefix: existing.publicRoutePrefix,
				rendererCode: existing.rendererCode,
				enabled: !existing.enabled,
			});

			const doc = await findContentKindAdminByCode(contentKindCode);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "delete") {
			const contentKindCode = normalizeCode(payload.id);
			if (!contentKindCode) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteContentKindAdmin({ actorDiscordId, contentKindCode });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyContentKindError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
