//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/sections/[section]/page.tsx                                             ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia section detail route for mixed section asset and recipe browsing.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaSectionBrowser from "@/components/riseopedia/RiseopediaSectionBrowser";
import {
	findRiseopediaSectionBySlug,
	listRiseopediaSectionItems,
	type RiseopediaSectionItemListFilters,
} from "@/lib/data/riseopedia-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia Section | Corn Mafia",
};

type SearchParamValue = string | string[] | undefined;

type PageProps = {
	params: Promise<{
		section: string;
	}>;
	searchParams: Promise<{
		q?: SearchParamValue;
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

function parseFilters(args: {
	section: string;
	searchParams: Awaited<PageProps["searchParams"]>;
}): RiseopediaSectionItemListFilters {
	return {
		section: args.section,
		search: firstParam(args.searchParams.q),
		page: parsePositiveInt(firstParam(args.searchParams.page), DEFAULT_PAGE),
		pageSize: parsePageSize(firstParam(args.searchParams.pageSize)),
	};
}

export default async function RiseopediaSectionPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;
	const section = await findRiseopediaSectionBySlug(resolvedParams.section);

	if (!section) {
		notFound();
	}

	const filters = parseFilters({
		section: section.slug,
		searchParams: resolvedSearchParams,
	});
	const result = await listRiseopediaSectionItems(filters);

	return (
		<RiseopediaSectionBrowser
			section={section}
			result={result}
			search={filters.search}
		/>
	);
}
