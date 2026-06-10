//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/subcategories/[slug]/page.tsx                                      ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki subcategory entity overview route populated from entity read rows.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/RiseopediaEntityBrowser";
import {
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaSubcategoryDirectoryCards,
} from "@/lib/data/opedia-wiki";
import type { RiseopediaEntityListFilters } from "@/lib/data/riseopedia-entities";
import {
	firstSearchParam,
	parsePage,
	parsePageSize,
	type RiseopediaSearchParamValue,
} from "@/lib/helpers/riseopedia-page-params";
import {
	findInfoSubcategoryRoute,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Wiki Subcategory | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		page?: RiseopediaSearchParamValue;
		pageSize?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoEntitySubcategoryPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const entitySubcategorySlug = normalizeInfoRouteSegment(resolvedParams.slug);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !entitySubcategorySlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "subcategories",
	});

	if (!routeContent) {
		notFound();
	}

	const subcategoryCards = await listOpediaSubcategoryDirectoryCards(wiki);
	const subcategoryCard = subcategoryCards.find(
		(row) => row.slug === entitySubcategorySlug || row.code === entitySubcategorySlug,
	);

	if (!subcategoryCard) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const listFilters: RiseopediaEntityListFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: null,
		categorySlug: null,
		subcategorySlug: subcategoryCard.slug,
		cardPlacementCode: "subcategory",
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const result = await listOpediaEntities(wiki, listFilters);
	const basePath = `/info/${categorySlug}/subcategories/${subcategoryCard.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					result={result}
					search={listFilters.search}
					basePath={basePath}
					filters={{
						section: null,
						entityClassCode: null,
						categorySlug: null,
						subcategorySlug: subcategoryCard.slug,
					}}
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Subcategories", href: wiki.subcategoriesPath },
						{ label: subcategoryCard.name },
					]}
					description={subcategoryCard.description}
					eyebrow="Subcategory"
					searchPlaceholder={`Search ${subcategoryCard.name} entries...`}
					title={subcategoryCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
					emptyReadModelLabel={wiki.emptyPublicLabel}
				/>
			</div>
		</section>
	);
}
