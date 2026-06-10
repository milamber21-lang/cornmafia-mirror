//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/classes/[slug]/page.tsx                                           ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki class entity overview route populated from entity read rows.                          ////
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
	listOpediaEntityCategoryFilterOptions,
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
	title: "Wiki Class | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		category?: RiseopediaSearchParamValue;
		subcategory?: RiseopediaSearchParamValue;
		page?: RiseopediaSearchParamValue;
		pageSize?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoClassPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const classSlug = normalizeInfoRouteSegment(resolvedParams.slug);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !classSlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "classes",
	});

	if (!routeContent) {
		notFound();
	}

	const hubData = await getOpediaHubData(wiki);
	const classCard = hubData.classes.find(
		(row) => row.slug === classSlug || row.code === classSlug,
	);

	if (!classCard) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const selectedCategorySlug = firstSearchParam(resolvedSearchParams.category);
	const selectedSubcategorySlug = firstSearchParam(resolvedSearchParams.subcategory);
	const listFilters: RiseopediaEntityListFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: classCard.code,
		categorySlug: selectedCategorySlug,
		subcategorySlug: selectedSubcategorySlug,
		cardPlacementCode: "class",
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [categories, subcategories, result] = await Promise.all([
		listOpediaEntityCategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: classCard.code,
		}),
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: classCard.code,
			categorySlug: selectedCategorySlug,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/classes/${classCard.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					result={result}
					search={listFilters.search}
					basePath={basePath}
					filters={{
						section: null,
						entityClassCode: classCard.code,
						categorySlug: selectedCategorySlug,
						subcategorySlug: selectedSubcategorySlug,
					}}
					filterOptions={{
						categories,
						subcategories,
					}}
					showCategoryFilter
					showSubcategoryFilter
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Classes", href: wiki.classesPath },
						{ label: classCard.name },
					]}
					description={classCard.description}
					eyebrow="Class"
					searchPlaceholder={`Search ${classCard.name} entries...`}
					title={classCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
					emptyReadModelLabel={wiki.emptyPublicLabel}
				/>
			</div>
		</section>
	);
}
