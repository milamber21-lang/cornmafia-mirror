//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/classes/page.tsx                                                   ////
//// Language: TSX                                                                                               ////
//// DB-gated /info wiki classes index with release-aware non-empty section filtering.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/browse/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaClassDirectoryCards,
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
	title: "Wiki Classes | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
		section?: RiseopediaSearchParamValue;
		release?: RiseopediaSearchParamValue;
	}>;
};

function matchingEntriesHref(args: {
	categorySlug: string;
	section: string | null;
	release: string | null;
}): string | null {
	if (!args.section) {
		return null;
	}

	const basePath = `/info/${args.categorySlug}/sections/${args.section}`;
	return args.release
		? `${basePath}?release=${encodeURIComponent(args.release)}`
		: basePath;
}

export default async function InfoClassesPage({
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
		subcategorySlug: "classes",
	});

	if (!routeContent) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const section = firstSearchParam(resolvedSearchParams.section);
	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(resolvedSearchParams.release ?? null)
			: parseMafiosopediaReleaseFilters(null);
	const release =
		wiki.code === "mafiosopedia"
			? mafiosopediaReleaseSearchParam(releaseFilters)
			: null;
	const [sections, cards] = await Promise.all([
		listOpediaSectionDirectoryCards(wiki, releaseFilters),
		listOpediaClassDirectoryCards(wiki, { section, releaseFilters }),
	]);
	const sectionOptions = sections.map((row) => ({
		value: row.slug,
		label: row.name,
		count: row.itemCount,
	}));

	return (
		<RiseopediaClassificationBrowser
			basePath={wiki.classesPath}
			cards={cards}
			description={`Browse canonical ${wiki.title} classes. Use section filtering when you want only groups from one editorial area.`}
			emptySearchTitle="No matching classes found."
			emptyTitle={`No ${wiki.emptyPublicLabel} classes found.`}
			fallbackIcon={Boxes}
			filters={{
				search: firstSearchParam(resolvedSearchParams.q),
				section,
				entityClassCode: null,
				categorySlug: null,
				releaseFilters,
			}}
			filterOptions={{ sections: sectionOptions }}
			matchingEntriesHref={matchingEntriesHref({
				categorySlug,
				section,
				release,
			})}
			heroEyebrow="Classification index"
			placeholder="Search classes..."
			showReleaseFilter={wiki.code === "mafiosopedia"}
			showSectionFilter
			title="Classes"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
