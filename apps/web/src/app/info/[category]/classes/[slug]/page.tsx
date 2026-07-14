//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/classes/[slug]/page.tsx                                            ////
//// Language: TSX                                                                                               ////
//// DB-gated class entity overview with Mafiosopedia release multi-select state.                              ////
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
	listOpediaEntityCategoryFilterOptions,
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
		release?: RiseopediaSearchParamValue;
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

	const resolvedSearchParams = await searchParams;
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const hubData = await getOpediaHubData(wiki, releaseFilters);
	const classCard = hubData.classes.find(
		(row) => row.slug === classSlug || row.code === classSlug,
	);
	if (!classCard) {
		notFound();
	}

	const selectedCategorySlug = firstSearchParam(resolvedSearchParams.category);
	const selectedSubcategorySlug = firstSearchParam(
		resolvedSearchParams.subcategory,
	);
	const listFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: null,
		entityClassCode: classCard.code,
		categorySlug: selectedCategorySlug,
		subcategorySlug: selectedSubcategorySlug,
		releaseFilters,
		cardPlacementCode: "class" as const,
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [categories, subcategories, result] = await Promise.all([
		listOpediaEntityCategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: classCard.code,
			releaseFilters,
		}),
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: null,
			entityClassCode: classCard.code,
			categorySlug: selectedCategorySlug,
			releaseFilters,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/classes/${classCard.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					basePath={basePath}
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Classes", href: wiki.classesPath },
						{ label: classCard.name },
					]}
					description={classCard.description}
					emptyReadModelLabel={wiki.emptyPublicLabel}
					eyebrow="Class"
					filterOptions={{ categories, subcategories }}
					filters={{
						section: null,
						entityClassCode: classCard.code,
						categorySlug: selectedCategorySlug,
						subcategorySlug: selectedSubcategorySlug,
						releaseFilters,
					}}
					result={result}
					search={listFilters.search}
					searchPlaceholder={`Search ${classCard.name} entries...`}
					showCategoryFilter
					showReleaseFilter={wiki.code === "mafiosopedia"}
					showSubcategoryFilter
					title={classCard.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
