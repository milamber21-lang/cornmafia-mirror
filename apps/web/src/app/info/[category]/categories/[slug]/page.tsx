//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/categories/[slug]/page.tsx                                         ////
//// Language: TSX                                                                                               ////
//// DB-gated category entity overview with Mafiosopedia release multi-select state.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/browse/RiseopediaEntityBrowser";
import {
	getOpediaHubData,
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaEntitySubcategoryFilterOptions,
} from "@/lib/data/opedia-wiki";
import { parseMafiosopediaReleaseFilters } from "@/lib/data/mafiosopedia-release";
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
		release?: RiseopediaSearchParamValue;
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

	const resolvedSearchParams = await searchParams;
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const hubData = await getOpediaHubData(wiki, releaseFilters);
	const categoryCard = hubData.categories.find(
		(row) => row.slug === entityCategorySlug || row.code === entityCategorySlug,
	);
	if (!categoryCard) {
		notFound();
	}

	const selectedSubcategorySlug = firstSearchParam(
		resolvedSearchParams.subcategory,
	);
	const listFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: null,
		categorySlug: categoryCard.slug,
		subcategorySlug: selectedSubcategorySlug,
		releaseFilters,
		cardPlacementCode: "category" as const,
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [subcategories, result] = await Promise.all([
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: null,
			categorySlug: categoryCard.slug,
			releaseFilters,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/categories/${categoryCard.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					basePath={basePath}
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Categories", href: wiki.categoriesPath },
						{ label: categoryCard.name },
					]}
					description={categoryCard.description}
					emptyReadModelLabel={wiki.emptyPublicLabel}
					eyebrow="Category"
					filterOptions={{ subcategories }}
					filters={{
						section: null,
						entityClassCode: null,
						categorySlug: categoryCard.slug,
						subcategorySlug: selectedSubcategorySlug,
						releaseFilters,
					}}
					result={result}
					search={listFilters.search}
					searchPlaceholder={`Search ${categoryCard.name} entries...`}
					showReleaseFilter={wiki.code === "mafiosopedia"}
					showSubcategoryFilter
					title={categoryCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
