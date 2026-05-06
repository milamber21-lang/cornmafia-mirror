//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/navigation-panels/route.ts                                               ////
//// Language: TS                                                                                                ////
//// DB-first admin API for navigation panel definitions                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteNavigationPanelAdmin,
	findNavigationPanelAdminByKey,
	listNavigationPanelsAdmin,
	saveNavigationPanelAdmin,
	type NavigationPanelReadPolicyCode,
	type NavigationPanelTypeCode,
} from "@/lib/data/navigation";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeCode,
	normalizeNonEmptyString,
	parseBoolean,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	panelKey?: unknown;
	label?: unknown;
	panelTypeCode?: unknown;
	panelSlotCode?: unknown;
	isDefault?: unknown;
	selectionOrder?: unknown;
	readPolicyCode?: unknown;
	readRank?: unknown;
	maxCategories?: unknown;
	maxSubcategoriesPerCategory?: unknown;
	maxTargetsPerSubcategory?: unknown;
	enabled?: unknown;
};

type MutationParseResult =
	| {
			ok: true;
			label: string;
			panelTypeCode: NavigationPanelTypeCode;
			panelSlotCode: string;
			isDefault: boolean;
			selectionOrder: number;
			readPolicyCode: NavigationPanelReadPolicyCode;
			readRank: number | null;
			maxCategories: number | null;
			maxSubcategoriesPerCategory: number | null;
			maxTargetsPerSubcategory: number | null;
			enabled: boolean;
	  }
	| { ok: false; message: string };

const PANEL_TYPE_CODES: readonly NavigationPanelTypeCode[] = [
	"header",
	"footer",
	"mobile",
	"custom",
];

const READ_POLICY_CODES: readonly NavigationPanelReadPolicyCode[] = [
	"public",
	"min_rank",
	"equal_rank",
];

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function classifyNavigationPanelError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process navigation panel request.",
	);
}

function isPanelTypeCode(value: string): value is NavigationPanelTypeCode {
	return PANEL_TYPE_CODES.includes(value as NavigationPanelTypeCode);
}

function normalizePanelTypeCode(value: unknown): NavigationPanelTypeCode | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isPanelTypeCode(normalized) ? normalized : null;
}

function isReadPolicyCode(value: string): value is NavigationPanelReadPolicyCode {
	return READ_POLICY_CODES.includes(value as NavigationPanelReadPolicyCode);
}

function normalizeReadPolicyCode(
	value: unknown,
): NavigationPanelReadPolicyCode | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isReadPolicyCode(normalized) ? normalized : null;
}

function normalizeSlotCode(value: unknown): string | null {
	const normalized = normalizeCode(value);
	if (!normalized || !/^[a-z0-9._-]{1,96}$/.test(normalized)) {
		return null;
	}

	return normalized;
}

function parseOptionalPositiveInt(value: unknown): number | null | undefined {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === "string" && value.trim().length === 0) {
		return null;
	}

	const raw = typeof value === "number" ? String(value) : value;
	if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) {
		return undefined;
	}

	const parsed = Number(raw.trim());
	if (!Number.isInteger(parsed) || parsed < 1) {
		return undefined;
	}

	return parsed;
}

function parseOptionalNonNegativeInt(value: unknown): number | null | undefined {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === "string" && value.trim().length === 0) {
		return null;
	}

	const raw = typeof value === "number" ? String(value) : value;
	if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) {
		return undefined;
	}

	const parsed = Number(raw.trim());
	if (!Number.isInteger(parsed) || parsed < 0) {
		return undefined;
	}

	return parsed;
}

function parseRequiredPositiveInt(value: unknown): number | null {
	const parsed = parseOptionalPositiveInt(value);
	return typeof parsed === "number" ? parsed : null;
}

function parseMutationData(
	data: MutationBody,
	requireEnabled: boolean,
): MutationParseResult {
	const label = normalizeNonEmptyString(data.label);
	if (!label) {
		return { ok: false, message: "Label is required." };
	}

	const panelTypeCode = normalizePanelTypeCode(data.panelTypeCode);
	if (!panelTypeCode) {
		return {
			ok: false,
			message: "Panel type must be header, footer, mobile, or custom.",
		};
	}

	const panelSlotCode = normalizeSlotCode(data.panelSlotCode);
	if (!panelSlotCode) {
		return {
			ok: false,
			message: "Panel slot code is required and must use code-safe characters.",
		};
	}

	const isDefault = parseBoolean(data.isDefault, false);
	const selectionOrder = parseRequiredPositiveInt(data.selectionOrder);
	if (selectionOrder === null) {
		return {
			ok: false,
			message: "Selection order is required and must be a positive integer.",
		};
	}

	const parsedReadPolicyCode = normalizeReadPolicyCode(data.readPolicyCode);
	if (!parsedReadPolicyCode) {
		return {
			ok: false,
			message: "Read policy must be public, min_rank, or equal_rank.",
		};
	}

	const parsedReadRank = parseOptionalNonNegativeInt(data.readRank);
	if (parsedReadRank === undefined) {
		return {
			ok: false,
			message: "Read rank must be blank or a non-negative integer.",
		};
	}

	const readPolicyCode = isDefault ? "public" : parsedReadPolicyCode;
	const readRank = isDefault ? null : parsedReadRank;

	if (readPolicyCode === "public" && readRank !== null) {
		return { ok: false, message: "Public read policy cannot have read rank." };
	}

	if (readPolicyCode !== "public" && readRank === null) {
		return { ok: false, message: "Rank read policies require read rank." };
	}

	const maxCategories = parseOptionalPositiveInt(data.maxCategories);
	if (maxCategories === undefined) {
		return {
			ok: false,
			message: "Max categories must be blank or a positive integer.",
		};
	}

	const maxSubcategoriesPerCategory = parseOptionalPositiveInt(
		data.maxSubcategoriesPerCategory,
	);
	if (maxSubcategoriesPerCategory === undefined) {
		return {
			ok: false,
			message: "Max subcategories must be blank or a positive integer.",
		};
	}

	const maxTargetsPerSubcategory = parseOptionalPositiveInt(
		data.maxTargetsPerSubcategory,
	);
	if (maxTargetsPerSubcategory === undefined) {
		return {
			ok: false,
			message: "Max targets must be blank or a positive integer.",
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
		panelTypeCode,
		panelSlotCode,
		isDefault,
		selectionOrder,
		readPolicyCode,
		readRank,
		maxCategories,
		maxSubcategoriesPerCategory,
		maxTargetsPerSubcategory,
		enabled,
	};
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listNavigationPanelsAdmin();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyNavigationPanelError(error);
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
			const data = asObject(payload.data) as MutationBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const panelKey = normalizeCode(data.panelKey);
			if (!panelKey || !/^[a-z0-9._-]{1,96}$/.test(panelKey)) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Panel key is required and must use code-safe characters.",
					400,
				);
			}

			const parsed = parseMutationData(data, false);
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			await saveNavigationPanelAdmin({
				actorDiscordId,
				panelKey,
				label: parsed.label,
				panelTypeCode: parsed.panelTypeCode,
				panelSlotCode: parsed.panelSlotCode,
				isDefault: parsed.isDefault,
				selectionOrder: parsed.selectionOrder,
				readPolicyCode: parsed.readPolicyCode,
				readRank: parsed.readRank,
				maxCategories: parsed.maxCategories,
				maxSubcategoriesPerCategory: parsed.maxSubcategoriesPerCategory,
				maxTargetsPerSubcategory: parsed.maxTargetsPerSubcategory,
				enabled: parsed.enabled,
			});

			const doc = await findNavigationPanelAdminByKey(panelKey);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "update") {
			const panelKey = normalizeCode(payload.id);
			if (!panelKey) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const data = asObject(payload.data) as MutationBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const parsed = parseMutationData(data, true);
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			await saveNavigationPanelAdmin({
				actorDiscordId,
				panelKey,
				label: parsed.label,
				panelTypeCode: parsed.panelTypeCode,
				panelSlotCode: parsed.panelSlotCode,
				isDefault: parsed.isDefault,
				selectionOrder: parsed.selectionOrder,
				readPolicyCode: parsed.readPolicyCode,
				readRank: parsed.readRank,
				maxCategories: parsed.maxCategories,
				maxSubcategoriesPerCategory: parsed.maxSubcategoriesPerCategory,
				maxTargetsPerSubcategory: parsed.maxTargetsPerSubcategory,
				enabled: parsed.enabled,
			});

			const doc = await findNavigationPanelAdminByKey(panelKey);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "toggle") {
			const panelKey = normalizeCode(payload.id);
			if (!panelKey) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existing = await findNavigationPanelAdminByKey(panelKey);
			if (!existing) {
				return jsonError(
					"NOT_FOUND",
					`Navigation panel ${panelKey} was not found.`,
					404,
				);
			}

			await saveNavigationPanelAdmin({
				actorDiscordId,
				panelKey: existing.panelKey,
				label: existing.label,
				panelTypeCode: existing.panelTypeCode,
				panelSlotCode: existing.panelSlotCode,
				isDefault: existing.isDefault,
				selectionOrder: existing.selectionOrder,
				readPolicyCode: existing.isDefault ? "public" : existing.readPolicyCode,
				readRank: existing.isDefault ? null : existing.readRank,
				maxCategories: existing.maxCategories,
				maxSubcategoriesPerCategory: existing.maxSubcategoriesPerCategory,
				maxTargetsPerSubcategory: existing.maxTargetsPerSubcategory,
				enabled: !existing.enabled,
			});

			const doc = await findNavigationPanelAdminByKey(panelKey);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "delete") {
			const panelKey = normalizeCode(payload.id);
			if (!panelKey) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteNavigationPanelAdmin({ actorDiscordId, panelKey });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyNavigationPanelError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
