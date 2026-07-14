//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/subcategories/[slug]/page.tsx                                      ////
//// Language: TSX                                                                                               ////
//// DB-gated global semantic subcategory overview with Mafiosopedia release multi-select state.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/browse/RiseopediaEntityBrowser";
import {
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaSubcategoryDirectoryCards,
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
		release?: RiseopediaSearchParamValue;
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

	const resolvedSearchParams = await searchParams;
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const subcategoryCards = await listOpediaSubcategoryDirectoryCards(wiki, {
		section: null,
		entityClassCode: null,
		categorySlug: null,
		releaseFilters,
	});
	const subcategoryCard = subcategoryCards.find(
		(row) =>
			row.slug === entitySubcategorySlug || row.code === entitySubcategorySlug,
	);
	if (!subcategoryCard) {
		notFound();
	}

	const listFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: null,
		categorySlug: null,
		subcategorySlug: subcategoryCard.slug,
		releaseFilters,
		cardPlacementCode: "subcategory" as const,
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const result = await listOpediaEntities(wiki, listFilters);
	const basePath = `/info/${categorySlug}/subcategories/${subcategoryCard.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					basePath={basePath}
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Subcategories", href: wiki.subcategoriesPath },
						{ label: subcategoryCard.name },
					]}
					description={subcategoryCard.description}
					emptyReadModelLabel={wiki.emptyPublicLabel}
					eyebrow="Subcategory"
					filters={{
						section: null,
						entityClassCode: null,
						categorySlug: null,
						subcategorySlug: subcategoryCard.slug,
						releaseFilters,
					}}
					result={result}
					search={listFilters.search}
					searchPlaceholder={`Search ${subcategoryCard.name} entries...`}
					showReleaseFilter={wiki.code === "mafiosopedia"}
					title={subcategoryCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
