//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/[category]/[subcategory]/page.tsx                                                    ////
//// Language: TSX                                                                                               ////
//// Public collection hub route for DB-first role-aware content discovery                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import { notFound, redirect } from "next/navigation";

import PublicCollectionHub, {
	type PublicCollectionSortCode,
} from "@/components/public/PublicCollectionHub";
import {
	findPublicCollectionByPath,
	findPublicSubcategoryAppHref,
} from "@/lib/data/public-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
		subcategory: string;
	}>;
	searchParams?: Promise<{
		action?: string;
		page?: string;
		pageSize?: string;
		search?: string;
		sort?: string;
	}>;
};

const SORT_CODES: readonly PublicCollectionSortCode[] = ["newest", "title"] as const;

function parseSortCode(value: string | undefined): PublicCollectionSortCode {
	return SORT_CODES.find((sortCode) => sortCode === value) ?? "newest";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function PublicCollectionPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = resolvedParams.category.trim();
	const subcategorySlug = resolvedParams.subcategory.trim();

	if (!categorySlug || !subcategorySlug) {
		notFound();
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	const appHref = await findPublicSubcategoryAppHref({
		actorDiscordId,
		categorySlug,
		subcategorySlug,
	});

	if (appHref) {
		redirect(appHref);
	}

	const collection = await findPublicCollectionByPath({
		actorDiscordId,
		categorySlug,
		subcategorySlug,
	});

	if (!collection) {
		notFound();
	}

	const resolvedSearchParams = searchParams ? await searchParams : {};
	const action = (resolvedSearchParams.action ?? "").trim().toLowerCase();
	const search = (resolvedSearchParams.search ?? "").trim();
	const sort = parseSortCode(resolvedSearchParams.sort);
	const page = parsePositiveInteger(resolvedSearchParams.page, 1);
	const pageSize = parsePositiveInteger(resolvedSearchParams.pageSize, 9);

	return (
		<PublicCollectionHub
			collection={collection}
			initialPage={page}
			initialPageSize={pageSize}
			initialCreateOpen={action === "create"}
			initialSearch={search}
			initialSort={sort}
		/>
	);
}
