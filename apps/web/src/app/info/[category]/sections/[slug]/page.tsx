//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/sections/[slug]/page.tsx                                           ////
//// Language: TSX                                                                                               ////
//// DB-gated section entity overview with Mafiosopedia release multi-select state.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/browse/RiseopediaEntityBrowser";
import {
	findOpediaSectionBySlug,
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaEntityCategoryFilterOptions,
	listOpediaEntityClassFilterOptions,
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
	title: "Wiki Section | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		class?: RiseopediaSearchParamValue;
		category?: RiseopediaSearchParamValue;
		subcategory?: RiseopediaSearchParamValue;
		page?: RiseopediaSearchParamValue;
		pageSize?: RiseopediaSearchParamValue;
		release?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoSectionPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const sectionSlug = normalizeInfoRouteSegment(resolvedParams.slug);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !sectionSlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "sections",
	});
	if (!routeContent) {
		notFound();
	}

	const section = await findOpediaSectionBySlug(wiki, sectionSlug);
	if (!section) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const selectedClassCode = firstSearchParam(resolvedSearchParams.class);
	const selectedCategorySlug = firstSearchParam(resolvedSearchParams.category);
	const selectedSubcategorySlug = firstSearchParam(
		resolvedSearchParams.subcategory,
	);
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const listFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: section.slug,
		entityClassCode: selectedClassCode,
		categorySlug: selectedCategorySlug,
		subcategorySlug: selectedSubcategorySlug,
		releaseFilters,
		cardPlacementCode: "section" as const,
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [classes, categories, subcategories, result] = await Promise.all([
		listOpediaEntityClassFilterOptions(wiki, {
			section: section.slug,
			releaseFilters,
		}),
		listOpediaEntityCategoryFilterOptions(wiki, {
			section: section.slug,
			entityClassCode: selectedClassCode,
			releaseFilters,
		}),
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: section.slug,
			entityClassCode: selectedClassCode,
			categorySlug: selectedCategorySlug,
			releaseFilters,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/sections/${section.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					basePath={basePath}
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Sections", href: wiki.sectionsPath },
						{ label: section.name },
					]}
					description={section.description}
					emptyReadModelLabel={wiki.emptyPublicLabel}
					eyebrow="Section"
					filterOptions={{ classes, categories, subcategories }}
					filters={{
						section: section.slug,
						entityClassCode: selectedClassCode,
						categorySlug: selectedCategorySlug,
						subcategorySlug: selectedSubcategorySlug,
						releaseFilters,
					}}
					result={result}
					search={listFilters.search}
					searchPlaceholder={`Search ${section.name} entries...`}
					showCategoryFilter
					showClassFilter
					showReleaseFilter={wiki.code === "mafiosopedia"}
					showSubcategoryFilter
					title={section.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
