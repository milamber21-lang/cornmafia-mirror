//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/browse/page.tsx                                                    ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki browse overview route backed by public wiki read models.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaHub from "@/components/riseopedia/browse/RiseopediaHub";
import {
	getOpediaWikiConfig,
	listOpediaCategoryDirectoryCards,
	listOpediaEntities,
	listOpediaEntityCategoryFilterOptions,
	listOpediaEntityClassFilterOptions,
	listOpediaEntitySubcategoryFilterOptions,
	listOpediaClassDirectoryCards,
	listOpediaSectionDirectoryCards,
} from "@/lib/data/opedia-wiki";
import {
	hasNonDefaultMafiosopediaReleaseFilters,
	parseMafiosopediaReleaseFilters,
} from "@/lib/data/mafiosopedia-release";
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
	title: "Wiki Browse | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		section?: RiseopediaSearchParamValue;
		class?: RiseopediaSearchParamValue;
		category?: RiseopediaSearchParamValue;
		subcategory?: RiseopediaSearchParamValue;
		page?: RiseopediaSearchParamValue;
		pageSize?: RiseopediaSearchParamValue;
		release?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoBrowsePage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "browse",
	});

	if (!routeContent) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const search = firstSearchParam(resolvedSearchParams.q);
	const selectedSection = firstSearchParam(resolvedSearchParams.section);
	const selectedClassCode = firstSearchParam(resolvedSearchParams.class);
	const selectedCategorySlug = firstSearchParam(resolvedSearchParams.category);
	const selectedSubcategorySlug = firstSearchParam(
		resolvedSearchParams.subcategory,
	);
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const hasActiveBrowser = Boolean(
		search ||
		selectedSection ||
		selectedClassCode ||
		selectedCategorySlug ||
		selectedSubcategorySlug ||
		(wiki.code === "mafiosopedia" &&
			hasNonDefaultMafiosopediaReleaseFilters(releaseFilters)),
	);
	const [sections, classes, categories] = await Promise.all([
		listOpediaSectionDirectoryCards(wiki, releaseFilters),
		listOpediaClassDirectoryCards(wiki, { section: null, releaseFilters }),
		listOpediaCategoryDirectoryCards(wiki, {
			section: null,
			entityClassCode: null,
			releaseFilters,
		}),
	]);
	const [classOptions, categoryOptions, subcategoryOptions, entityResult] =
		await Promise.all([
			listOpediaEntityClassFilterOptions(wiki, {
				section: selectedSection,
				releaseFilters,
			}),
			listOpediaEntityCategoryFilterOptions(wiki, {
				section: selectedSection,
				entityClassCode: selectedClassCode,
				releaseFilters,
			}),
			listOpediaEntitySubcategoryFilterOptions(wiki, {
				section: selectedSection,
				entityClassCode: selectedClassCode,
				categorySlug: selectedCategorySlug,
				releaseFilters,
			}),
			hasActiveBrowser
				? listOpediaEntities(wiki, {
						search,
						section: selectedSection,
						entityClassCode: selectedClassCode,
						categorySlug: selectedCategorySlug,
						subcategorySlug: selectedSubcategorySlug,
						page: parsePage(firstSearchParam(resolvedSearchParams.page)),
						pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
						releaseFilters,
						cardPlacementCode: "hub",
					})
				: Promise.resolve(null),
		]);
	const sectionOptions = sections.map((section) => ({
		value: section.slug,
		label: section.name,
		count: section.itemCount,
	}));

	return (
		<RiseopediaHub
			sections={sections}
			classes={classes}
			categories={categories}
			search={search}
			section={selectedSection}
			entityClassCode={selectedClassCode}
			categorySlug={selectedCategorySlug}
			subcategorySlug={selectedSubcategorySlug}
			releaseFilters={releaseFilters}
			sectionOptions={sectionOptions}
			classOptions={classOptions}
			categoryOptions={categoryOptions}
			subcategoryOptions={subcategoryOptions}
			entityResult={entityResult}
			basePath={wiki.browsePath}
			classesPath={wiki.classesPath}
			categoriesPath={wiki.categoriesPath}
			wikiCode={wiki.code}
			wikiName={wiki.title}
			wikiDescription={wiki.description}
			wikiBrowserDescription={wiki.browserDescription}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
