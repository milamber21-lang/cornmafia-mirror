//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/recipes/page.tsx                                                        ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia broad recipe list route with server-side DB-first filters and URL pagination.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";

import RiseopediaRecipeBrowser, {
	type RiseopediaRecipeBrowserFilters,
} from "@/components/riseopedia/RiseopediaRecipeBrowser";
import {
	listRiseopediaRecipes,
	type RiseopediaRecipeListFilters,
} from "@/lib/data/riseopedia-recipes";
import { listRiseopediaSections } from "@/lib/data/riseopedia-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia Recipes | Corn Mafia",
};

type SearchParamValue = string | string[] | undefined;

type PageProps = {
	searchParams: Promise<{
		q?: SearchParamValue;
		section?: SearchParamValue;
		page?: SearchParamValue;
		pageSize?: SearchParamValue;
	}>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;

function firstParam(value: SearchParamValue): string | null {
	const raw = Array.isArray(value) ? value[0] : value;
	const normalized = raw?.trim();
	return normalized && normalized.length > 0 ? normalized : null;
}

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value || !/^\d+$/.test(value)) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null): number {
	const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
	return PAGE_SIZE_OPTIONS.some((option) => option === parsed)
		? parsed
		: DEFAULT_PAGE_SIZE;
}

function parseFilters(searchParams: Awaited<PageProps["searchParams"]>): {
	browserFilters: RiseopediaRecipeBrowserFilters;
	listFilters: RiseopediaRecipeListFilters;
} {
	const search = firstParam(searchParams.q);
	const section = firstParam(searchParams.section);
	const page = parsePositiveInt(firstParam(searchParams.page), DEFAULT_PAGE);
	const pageSize = parsePageSize(firstParam(searchParams.pageSize));

	const browserFilters = {
		search,
		section,
	};
	const listFilters = {
		...browserFilters,
		benchCode: null,
		page,
		pageSize,
	};

	return { browserFilters, listFilters };
}

export default async function RiseopediaRecipesPage({
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedSearchParams = await searchParams;
	const { browserFilters, listFilters } = parseFilters(resolvedSearchParams);
	const [sections, result] = await Promise.all([
		listRiseopediaSections(),
		listRiseopediaRecipes(listFilters),
	]);

	return (
		<RiseopediaRecipeBrowser
			result={result}
			filters={browserFilters}
			sections={sections}
		/>
	);
}
