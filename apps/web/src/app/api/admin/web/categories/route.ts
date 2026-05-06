//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/categories/route.ts                                                      ////
//// Language: TS                                                                                                  ////
//// DB-first admin categories API with shared admin-route plumbing                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import { listCategoriesAdmin } from "@/lib/data/categories";
import {
	createCategoryAdmin,
	deleteCategoryAdmin,
	toggleCategoryNavHiddenAdmin,
	updateCategoryAdmin,
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
	op?: "create" | "update" | "toggle" | "delete";
	id?: string | number;
	data?: {
		title?: unknown;
		slug?: unknown;
		navHidden?: unknown;
		readPolicy?: unknown;
		readMinRank?: unknown;
		writePolicy?: unknown;
		writeMinRank?: unknown;
		iconKeyId?: unknown;
		iconColorId?: unknown;
		allowedTemplates?: unknown;
	};
};


function normalizeReadPolicy(
	value: unknown,
): "public" | "min_rank" | "equal_rank" {
	if (value === "rank_equal" || value === "equal_rank") {
		return "equal_rank";
	}

	if (value === "rank_at_least" || value === "min_rank") {
		return "min_rank";
	}

	return "public";
}

function normalizeWritePolicy(value: unknown): "min_rank" | "equal_rank" {
	return value === "rank_equal" || value === "equal_rank"
		? "equal_rank"
		: "min_rank";
}

function parseTemplateIds(value: unknown): number[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((entry) => parsePositiveInt(entry))
		.filter((entry): entry is number => entry !== null);
}

function classifyCategoryError(error: unknown): {
	code: ApiErrorCode;
	message: string;
	status: number;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process category request.",
	);
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listCategoriesAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyCategoryError(error);
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
			const categoryId = parsePositiveInt(payload.id);
			if (!categoryId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteCategoryAdmin(actorDiscordId, categoryId);
			return NextResponse.json({ ok: true });
		}

		if (op === "toggle") {
			const categoryId = parsePositiveInt(payload.id);
			if (!categoryId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await toggleCategoryNavHiddenAdmin(actorDiscordId, categoryId);
			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const title = normalizeNonEmptyString(data.title);
		const slugInput = normalizeNonEmptyString(data.slug);
		const navHidden = data.navHidden === true;
		const readPolicyCode = normalizeReadPolicy(data.readPolicy);
		const readRank =
			readPolicyCode === "public" ? null : parseNonNegativeInt(data.readMinRank);
		const writePolicyCode = normalizeWritePolicy(data.writePolicy);
		const writeRank = parseNonNegativeInt(data.writeMinRank);
		const iconKeyId = parsePositiveInt(data.iconKeyId);
		const iconColorId = parsePositiveInt(data.iconColorId);
		const templateIds = parseTemplateIds(data.allowedTemplates);

		if (!title) {
			return jsonError("VALIDATION_REQUIRED", "Category title is required.", 400);
		}

		const slug = slugInput ?? slugifyLoose(title);
		if (!slug) {
			return jsonError("VALIDATION_REQUIRED", "Category slug is required.", 400);
		}

		if (readPolicyCode !== "public" && readRank === null) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Read role is required for rank-based category policy.",
				400,
			);
		}

		if (writeRank === null) {
			return jsonError("VALIDATION_REQUIRED", "Write role is required.", 400);
		}

		if (!iconKeyId || !iconColorId) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Icon and icon color are required.",
				400,
			);
		}

		if (op === "create") {
			const createdId = await createCategoryAdmin({
				actorDiscordId,
				title,
				slug,
				navHidden,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				iconKeyId,
				iconColorId,
				templateIds,
			});
			const rows = await listCategoriesAdmin();
			const doc = createdId
				? (rows.find((row) => row.id === String(createdId)) ?? null)
				: null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const categoryId = parsePositiveInt(payload.id);
			if (!categoryId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateCategoryAdmin({
				actorDiscordId,
				categoryId,
				title,
				slug,
				navHidden,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				iconKeyId,
				iconColorId,
				templateIds,
			});

			const rows = await listCategoriesAdmin();
			const doc = rows.find((row) => row.id === String(categoryId)) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError(
			"VALIDATION_REQUIRED",
			`Unsupported op: ${String(op)}.`,
			400,
		);
	} catch (error: unknown) {
		const classified = classifyCategoryError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
