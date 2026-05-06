//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/theme-colors/route.ts                                                    ////
//// Language: TS                                                                                                  ////
//// DB-first admin theme colors API with shared admin-route plumbing and normalized rows/doc responses            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { NextRequest, NextResponse } from "next/server";

import {
	findThemeColorAdminById,
	listThemeColorsAdmin,
} from "@/lib/data/theme-colors";
import {
	createThemeColorAdmin,
	deleteThemeColorAdmin,
	updateThemeColorAdmin,
} from "@/lib/data/admin-web-actions";
import { validateThemeColorPreviewValue } from "@/lib/helpers/icon-color";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeCode,
	normalizeNonEmptyString,
	parsePositiveInt,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type CreateBody = {
	key?: unknown;
	label?: unknown;
	preview?: unknown;
	enabled?: unknown;
};

type UpdateBody = {
	label?: unknown;
	preview?: unknown;
	enabled?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function classifyThemeColorError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process theme color request.",
	);
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listThemeColorsAdmin();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyThemeColorError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(req: NextRequest): Promise<Response> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let body: unknown;
	try {
		body = await req.json();
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

			const key = normalizeCode(data.key);
			const label = normalizeNonEmptyString(data.label);
			const preview = normalizeNonEmptyString(data.preview);
			const enabled = parseRequiredBoolean(data.enabled);

			if (!key) {
				return jsonError("VALIDATION_REQUIRED", "Key is required.", 400);
			}

			if (!label) {
				return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
			}

			if (!preview) {
				return jsonError("VALIDATION_REQUIRED", "Preview is required.", 400);
			}

			const previewError = validateThemeColorPreviewValue(preview);
			if (previewError) {
				return jsonError("VALIDATION_REQUIRED", previewError, 400);
			}

			if (enabled === null) {
				return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
			}

			const createdId = await createThemeColorAdmin({
				actorDiscordId,
				key,
				label,
				preview,
				enabled,
			});

			const doc = createdId ? await findThemeColorAdminById(createdId) : null;
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "update") {
			const themeColorId = parsePositiveInt(payload.id);
			if (themeColorId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const data = asObject(payload.data) as UpdateBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const label = normalizeNonEmptyString(data.label);
			const preview = normalizeNonEmptyString(data.preview);
			const enabled = parseRequiredBoolean(data.enabled);

			if (!label) {
				return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
			}

			if (!preview) {
				return jsonError("VALIDATION_REQUIRED", "Preview is required.", 400);
			}

			const previewError = validateThemeColorPreviewValue(preview);
			if (previewError) {
				return jsonError("VALIDATION_REQUIRED", previewError, 400);
			}

			if (enabled === null) {
				return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
			}

			await updateThemeColorAdmin({
				actorDiscordId,
				themeColorId,
				label,
				preview,
				enabled,
			});

			const doc = await findThemeColorAdminById(themeColorId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "toggle") {
			const themeColorId = parsePositiveInt(payload.id);
			if (themeColorId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existing = await findThemeColorAdminById(themeColorId);
			if (!existing) {
				return jsonError(
					"NOT_FOUND",
					`web_theme_colors row ${String(themeColorId)} was not found.`,
					404,
				);
			}

			await updateThemeColorAdmin({
				actorDiscordId,
				themeColorId,
				label: existing.label,
				preview: existing.preview,
				enabled: !existing.enabled,
			});

			const doc = await findThemeColorAdminById(themeColorId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "delete") {
			const themeColorId = parsePositiveInt(payload.id);
			if (themeColorId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteThemeColorAdmin(actorDiscordId, themeColorId);
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyThemeColorError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
