//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/subcategories/page.tsx                                             ////
//// Language: TSX                                                                                               ////
//// DB-gated /info wiki subcategory index with release-aware non-empty classification filtering.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListTree } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/browse/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaCategoryFilterOptions,
	listOpediaClassFilterOptions,
	listOpediaSectionDirectoryCards,
	listOpediaSubcategoryDirectoryCards,
} from "@/lib/data/opedia-wiki";
import {
	mafiosopediaReleaseSearchParam,
	parseMafiosopediaReleaseFilters,
} from "@/lib/data/mafiosopedia-release";
import {
	firstSearchParam,
	type RiseopediaSearchParamValue,
} from "@/lib/helpers/riseopedia-page-params";
import {
	findInfoSubcategoryRoute,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Wiki Subcategories | Corn Mafia",
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
		release?: RiseopediaSearchParamValue;
	}>;
};

function matchingEntriesHref(args: {
	categorySlug: string;
	section: string | null;
	entityClassCode: string | null;
	selectedCategorySlug: string | null;
	release: string | null;
}): string | null {
	const basePath = args.selectedCategorySlug
		? `/info/${args.categorySlug}/categories/${args.selectedCategorySlug}`
		: args.entityClassCode
			? `/info/${args.categorySlug}/classes/${args.entityClassCode}`
			: args.section
				? `/info/${args.categorySlug}/sections/${args.section}`
				: null;

	return basePath && args.release
		? `${basePath}?release=${encodeURIComponent(args.release)}`
		: basePath;
}

export default async function InfoSubcategoriesPage({
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
		subcategorySlug: "subcategories",
	});

	if (!routeContent) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const section = firstSearchParam(resolvedSearchParams.section);
	const entityClassCode = firstSearchParam(resolvedSearchParams.class);
	const selectedCategorySlug = firstSearchParam(resolvedSearchParams.category);
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const release =
		wiki.code === "mafiosopedia"
			? mafiosopediaReleaseSearchParam(releaseFilters)
			: null;
	const [sections, classOptions, categoryOptions, cards] = await Promise.all([
		listOpediaSectionDirectoryCards(wiki, releaseFilters),
		listOpediaClassFilterOptions(wiki, { section, releaseFilters }),
		listOpediaCategoryFilterOptions(wiki, {
			section,
			entityClassCode,
			releaseFilters,
		}),
		listOpediaSubcategoryDirectoryCards(wiki, {
			section,
			entityClassCode,
			categorySlug: selectedCategorySlug,
			releaseFilters,
		}),
	]);
	const sectionOptions = sections.map((row) => ({
		value: row.slug,
		label: row.name,
		count: row.itemCount,
	}));

	return (
		<RiseopediaClassificationBrowser
			basePath={wiki.subcategoriesPath}
			cards={cards}
			description={`Browse canonical ${wiki.title} subcategories. Use the dependent filters to narrow by section, class, and category.`}
			emptySearchTitle="No matching subcategories found."
			emptyTitle={`No ${wiki.emptyPublicLabel} subcategories found.`}
			fallbackIcon={ListTree}
			filters={{
				search: firstSearchParam(resolvedSearchParams.q),
				section,
				entityClassCode,
				categorySlug: selectedCategorySlug,
				releaseFilters,
			}}
			filterOptions={{
				sections: sectionOptions,
				classes: classOptions,
				categories: categoryOptions,
			}}
			matchingEntriesHref={matchingEntriesHref({
				categorySlug,
				section,
				entityClassCode,
				selectedCategorySlug,
				release,
			})}
			heroEyebrow="Classification index"
			placeholder="Search subcategories..."
			showReleaseFilter={wiki.code === "mafiosopedia"}
			showSectionFilter
			showClassFilter
			showCategoryFilter
			title="Subcategories"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
