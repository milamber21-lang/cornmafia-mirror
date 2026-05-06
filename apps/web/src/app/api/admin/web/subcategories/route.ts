//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/subcategories/route.ts                                                   ////
//// Language: TS                                                                                                  ////
//// DB-first admin subcategories API with shared admin-route plumbing                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import { listSubcategoriesAdmin } from "@/lib/data/subcategories";
import {
	createSubcategoryAdmin,
	deleteSubcategoryAdmin,
	updateSubcategoryAdmin,
} from "@/lib/data/admin-web-actions";
import { slugifyLoose } from "@/lib/helpers/slug";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	parseNonNegativeInt,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: string | number;
	data?: {
		categoryId?: unknown;
		title?: unknown;
		slug?: unknown;
		readPolicy?: unknown;
		readMinRank?: unknown;
		writePolicy?: unknown;
		writeMinRank?: unknown;
		navMode?: unknown;
		iconKeyId?: unknown;
		iconColorId?: unknown;
		allowedTemplates?: unknown;
	};
};


function normalizeReadPolicy(
	value: unknown,
): "inherit" | "public" | "min_rank" | "equal_rank" {
	if (value === "inherit") {
		return "inherit";
	}
	if (value === "rank_equal" || value === "equal_rank") {
		return "equal_rank";
	}
	if (value === "rank_at_least" || value === "min_rank") {
		return "min_rank";
	}
	return "public";
}

function normalizeWritePolicy(
	value: unknown,
): "inherit" | "min_rank" | "equal_rank" {
	if (value === "inherit") {
		return "inherit";
	}
	return value === "rank_equal" || value === "equal_rank"
		? "equal_rank"
		: "min_rank";
}

function normalizeNavMode(value: unknown): "inherit" | "explicit" {
	return value === "explicit_hidden" ||
		value === "explicit_visible" ||
		value === "explicit"
		? "explicit"
		: "inherit";
}

function normalizeNavHidden(
	mode: "inherit" | "explicit",
	value: unknown,
): boolean | null {
	if (mode === "inherit") {
		return null;
	}
	return value === "explicit_hidden" || value === true;
}

function parseTemplateIds(value: unknown): number[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((entry) => parsePositiveInt(entry))
		.filter((entry): entry is number => entry !== null);
}

function classifySubcategoryError(error: unknown): {
	code: ApiErrorCode;
	message: string;
	status: number;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process subcategory request.",
	);
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listSubcategoriesAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifySubcategoryError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let payload: MutationBody;
	try {
		payload = (await request.json()) as MutationBody;
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const op = payload.op;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "delete") {
			const subcategoryId = parsePositiveInt(payload.id);
			if (!subcategoryId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteSubcategoryAdmin(actorDiscordId, subcategoryId);
			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const categoryId = parsePositiveInt(data.categoryId);
		const title = normalizeNonEmptyString(data.title);
		const slugInput = normalizeNonEmptyString(data.slug);
		const readPolicyCode = normalizeReadPolicy(data.readPolicy);
		const readRank =
			readPolicyCode === "inherit" || readPolicyCode === "public"
				? null
				: parseNonNegativeInt(data.readMinRank);
		const writePolicyCode = normalizeWritePolicy(data.writePolicy);
		const writeRank =
			writePolicyCode === "inherit"
				? null
				: parseNonNegativeInt(data.writeMinRank);
		const navHiddenModeCode = normalizeNavMode(data.navMode);
		const navHiddenValue = normalizeNavHidden(navHiddenModeCode, data.navMode);
		const iconKeyId = parsePositiveInt(data.iconKeyId);
		const iconColorId = parsePositiveInt(data.iconColorId);
		const templateIds = parseTemplateIds(data.allowedTemplates);

		if (!categoryId) {
			return jsonError("VALIDATION_REQUIRED", "Category is required.", 400);
		}
		if (!title) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Subcategory title is required.",
				400,
			);
		}

		const slug = slugInput ?? slugifyLoose(title);
		if (!slug) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Subcategory slug is required.",
				400,
			);
		}

		if (
			(readPolicyCode === "min_rank" || readPolicyCode === "equal_rank") &&
			readRank === null
		) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Read role is required for rank-based read policy.",
				400,
			);
		}
		if (
			(writePolicyCode === "min_rank" || writePolicyCode === "equal_rank") &&
			writeRank === null
		) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Write role is required for rank-based write policy.",
				400,
			);
		}
		if (!iconKeyId || !iconColorId) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Icon and icon color are required.",
				400,
			);
		}

		if (op === "create") {
			const createdId = await createSubcategoryAdmin({
				actorDiscordId,
				categoryId,
				title,
				slug,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				navHiddenModeCode,
				navHiddenValue,
				iconKeyId,
				iconColorId,
				templateIds,
			});
			const rows = await listSubcategoriesAdmin();
			const doc = createdId
				? (rows.find((row) => row.id === String(createdId)) ?? null)
				: null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const subcategoryId = parsePositiveInt(payload.id);
			if (!subcategoryId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateSubcategoryAdmin({
				actorDiscordId,
				subcategoryId,
				categoryId,
				title,
				slug,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				navHiddenModeCode,
				navHiddenValue,
				iconKeyId,
				iconColorId,
				templateIds,
			});

			const rows = await listSubcategoriesAdmin();
			const doc = rows.find((row) => row.id === String(subcategoryId)) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError(
			"VALIDATION_REQUIRED",
			`Unsupported op: ${String(op)}.`,
			400,
		);
	} catch (error: unknown) {
		const classified = classifySubcategoryError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
