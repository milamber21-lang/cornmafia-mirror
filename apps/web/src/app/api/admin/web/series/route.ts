//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/series/route.ts                                                          ////
//// Language: TS                                                                                                  ////
//// Admin API route for series list and mutation operations                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { findSeriesAdminById, listSeriesAdminPage } from "@/lib/data/series";
import type { SeriesAdminSortBy, SeriesAdminSortDir } from "@/lib/data/series";
import {
	createSeriesAdmin,
	deleteSeriesAdmin,
	updateSeriesAdmin,
} from "@/lib/data/admin-web-actions";
import { slugifyLoose } from "@/lib/helpers/slug";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	parseNonNegativeInt,
	parsePageParam,
	parsePageSizeParam,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminOrEditorResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const SERIES_SORT_KEYS: readonly SeriesAdminSortBy[] = [
	"icon",
	"title",
	"category",
	"subcategory",
	"read",
	"write",
	"author",
] as const;

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: string | number;
	data?: {
		title?: unknown;
		slug?: unknown;
		description?: unknown;
		categoryId?: unknown;
		subcategoryId?: unknown;
		readPolicy?: unknown;
		readMinRank?: unknown;
		writePolicy?: unknown;
		writeMinRank?: unknown;
		iconKeyId?: unknown;
		iconColorId?: unknown;
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

function normalizeSeriesSortBy(value: string | null): SeriesAdminSortBy {
	return SERIES_SORT_KEYS.find((sortKey) => sortKey === value) ?? "title";
}

function normalizeSeriesSortDir(value: string | null): SeriesAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminOrEditorResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const searchValue = (request.nextUrl.searchParams.get("search") ?? "").trim();
	const page = parsePageParam(request.nextUrl.searchParams.get("page"), 1);
	const pageSize = parsePageSizeParam(
		request.nextUrl.searchParams.get("pageSize"),
		{
			defaultPageSize: DEFAULT_PAGE_SIZE,
			maxPageSize: MAX_PAGE_SIZE,
			minPageSize: 1,
		},
	);
	const categoryId = parsePositiveInt(
		request.nextUrl.searchParams.get("categoryId"),
	);
	const subcategoryId = parsePositiveInt(
		request.nextUrl.searchParams.get("subcategoryId"),
	);
	const sortBy = normalizeSeriesSortBy(
		request.nextUrl.searchParams.get("sortBy"),
	);
	const sortDir = normalizeSeriesSortDir(
		request.nextUrl.searchParams.get("sortDir"),
	);

	try {
		const result = await listSeriesAdminPage({
			search: searchValue,
			page,
			pageSize,
			categoryId,
			subcategoryId,
			sortBy,
			sortDir,
		});
		return NextResponse.json({ ...result });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to process series request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminOrEditorResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const actorDiscordIdOrResponse = await requireActorDiscordId({
		allowAdminOrEditor: true,
	});
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
			const seriesId = parsePositiveInt(payload.id);
			if (!seriesId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}
			await deleteSeriesAdmin(actorDiscordId, seriesId);
			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const title = normalizeNonEmptyString(data.title);
		const slugInput = normalizeNonEmptyString(data.slug);
		const description =
			typeof data.description === "string" ? data.description.trim() : "";
		const categoryId = parsePositiveInt(data.categoryId);
		const subcategoryId = parsePositiveInt(data.subcategoryId);
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
		const iconKeyId = parsePositiveInt(data.iconKeyId);
		const iconColorId = parsePositiveInt(data.iconColorId);

		if (!title) {
			return jsonError("VALIDATION_REQUIRED", "Series title is required.", 400);
		}

		const slug = slugInput ?? slugifyLoose(title);
		if (!slug) {
			return jsonError("VALIDATION_REQUIRED", "Series slug is required.", 400);
		}

		if (!categoryId) {
			return jsonError("VALIDATION_REQUIRED", "Category is required.", 400);
		}

		if (!iconKeyId || !iconColorId) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Icon and icon color are required.",
				400,
			);
		}

		if (
			(readPolicyCode === "min_rank" || readPolicyCode === "equal_rank") &&
			readRank === null
		) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Read role is required for rank-based series policy.",
				400,
			);
		}

		if (
			(writePolicyCode === "min_rank" || writePolicyCode === "equal_rank") &&
			writeRank === null
		) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Write role is required for rank-based series policy.",
				400,
			);
		}

		if (op === "create") {
			const createdId = await createSeriesAdmin({
				actorDiscordId,
				title,
				slug,
				description,
				categoryId,
				subcategoryId,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				iconKeyId,
				iconColorId,
			});
			const doc = createdId ? await findSeriesAdminById(createdId) : null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const seriesId = parsePositiveInt(payload.id);
			if (!seriesId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateSeriesAdmin({
				actorDiscordId,
				seriesId,
				title,
				slug,
				description,
				categoryId,
				subcategoryId,
				readPolicyCode,
				readRank,
				writePolicyCode,
				writeRank,
				iconKeyId,
				iconColorId,
			});
			const doc = await findSeriesAdminById(seriesId);
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError(
			"VALIDATION_REQUIRED",
			`Unsupported op: ${String(op)}.`,
			400,
		);
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to process series request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
