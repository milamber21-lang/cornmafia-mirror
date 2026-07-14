//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/categories/page.tsx                                                ////
//// Language: TSX                                                                                               ////
//// DB-gated /info wiki categories index with release-aware non-empty classification filtering.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderTree } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/browse/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaCategoryDirectoryCards,
	listOpediaClassFilterOptions,
	listOpediaSectionDirectoryCards,
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
	title: "Wiki Categories | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		section?: RiseopediaSearchParamValue;
		class?: RiseopediaSearchParamValue;
		release?: RiseopediaSearchParamValue;
	}>;
};

function matchingEntriesHref(args: {
	categorySlug: string;
	section: string | null;
	entityClassCode: string | null;
	release: string | null;
}): string | null {
	const basePath = args.entityClassCode
		? `/info/${args.categorySlug}/classes/${args.entityClassCode}`
		: args.section
			? `/info/${args.categorySlug}/sections/${args.section}`
			: null;

	return basePath && args.release
		? `${basePath}?release=${encodeURIComponent(args.release)}`
		: basePath;
}

export default async function InfoCategoriesPage({
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
		subcategorySlug: "categories",
	});

	if (!routeContent) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const section = firstSearchParam(resolvedSearchParams.section);
	const entityClassCode = firstSearchParam(resolvedSearchParams.class);
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const release =
		wiki.code === "mafiosopedia"
			? mafiosopediaReleaseSearchParam(releaseFilters)
			: null;
	const [sections, classOptions, cards] = await Promise.all([
		listOpediaSectionDirectoryCards(wiki, releaseFilters),
		listOpediaClassFilterOptions(wiki, { section, releaseFilters }),
		listOpediaCategoryDirectoryCards(wiki, {
			section,
			entityClassCode,
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
			basePath={wiki.categoriesPath}
			cards={cards}
			description={`Browse canonical ${wiki.title} categories. Narrow by section and class when you already know the broad area.`}
			emptySearchTitle="No matching categories found."
			emptyTitle={`No ${wiki.emptyPublicLabel} categories found.`}
			fallbackIcon={FolderTree}
			filters={{
				search: firstSearchParam(resolvedSearchParams.q),
				section,
				entityClassCode,
				categorySlug: null,
				releaseFilters,
			}}
			filterOptions={{
				sections: sectionOptions,
				classes: classOptions,
			}}
			matchingEntriesHref={matchingEntriesHref({
				categorySlug,
				section,
				entityClassCode,
				release,
			})}
			heroEyebrow="Classification index"
			placeholder="Search categories..."
			showReleaseFilter={wiki.code === "mafiosopedia"}
			showSectionFilter
			showClassFilter
			title="Categories"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
