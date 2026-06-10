//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/categories/[slug]/page.tsx                                         ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki category entity overview route populated from entity read rows.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/RiseopediaEntityBrowser";
import {
	getOpediaHubData,
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaEntitySubcategoryFilterOptions,
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
	title: "Wiki Category | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		subcategory?: RiseopediaSearchParamValue;
		page?: RiseopediaSearchParamValue;
		pageSize?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoEntityCategoryPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const entityCategorySlug = normalizeInfoRouteSegment(resolvedParams.slug);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !entityCategorySlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "categories",
	});

	if (!routeContent) {
		notFound();
	}

	const hubData = await getOpediaHubData(wiki);
	const categoryCard = hubData.categories.find(
		(row) => row.slug === entityCategorySlug || row.code === entityCategorySlug,
	);

	if (!categoryCard) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const selectedSubcategorySlug = firstSearchParam(resolvedSearchParams.subcategory);
	const listFilters: RiseopediaEntityListFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: null,
		categorySlug: categoryCard.slug,
		subcategorySlug: selectedSubcategorySlug,
		cardPlacementCode: "category",
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [subcategories, result] = await Promise.all([
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: null,
			categorySlug: categoryCard.slug,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/categories/${categoryCard.slug}`;

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
						categorySlug: categoryCard.slug,
						subcategorySlug: selectedSubcategorySlug,
					}}
					filterOptions={{
						subcategories,
					}}
					showSubcategoryFilter
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Categories", href: wiki.categoriesPath },
						{ label: categoryCard.name },
					]}
					description={categoryCard.description}
					eyebrow="Category"
					searchPlaceholder={`Search ${categoryCard.name} entries...`}
					title={categoryCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
					emptyReadModelLabel={wiki.emptyPublicLabel}
				/>
			</div>
		</section>
	);
}
