//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/recipes/route.ts                                                    ////
//// Language: TS                                                                                             ////
//// Public Riseopedia recipe list API backed by override-aware web_view read contracts.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	listRiseopediaRecipes,
	type RiseopediaRecipeListFilters,
} from "@/lib/data/riseopedia-recipes";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 48;
const MAX_PAGE_SIZE = 120;

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value || !/^\d+$/.test(value.trim())) {
		return fallback;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNullableParam(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized && normalized.length > 0 ? normalized : null;
}

function parseFilters(request: NextRequest): RiseopediaRecipeListFilters {
	const searchParams = request.nextUrl.searchParams;
	const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
	const requestedPageSize = parsePositiveInt(
		searchParams.get("pageSize"),
		DEFAULT_PAGE_SIZE,
	);
	const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

	return {
		search: normalizeNullableParam(searchParams.get("q")),
		section: normalizeNullableParam(searchParams.get("section")),
		benchCode: normalizeNullableParam(searchParams.get("bench")),
		page,
		pageSize,
	};
}

export async function GET(request: NextRequest): Promise<Response> {
	try {
		const result = await listRiseopediaRecipes(parseFilters(request));
		return NextResponse.json(result, { status: 200 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load Riseopedia recipes.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
