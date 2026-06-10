//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/classes/page.tsx                                                   ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki classes index route with section filtering.                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaClassDirectoryCards,
	listOpediaSections,
} from "@/lib/data/opedia-wiki";
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
	}>;
};

function matchingEntriesHref(categorySlug: string, section: string | null): string | null {
	return section ? `/info/${categorySlug}/sections/${section}` : null;
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
	const [sections, cards] = await Promise.all([
		listOpediaSections(wiki),
		listOpediaClassDirectoryCards(wiki, { section }),
	]);
	const sectionOptions = sections
		.filter((row) => row.publicVisible || row.showWhenEmpty)
		.map((row) => ({ value: row.slug, label: row.name, count: row.itemCount }));

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
			}}
			filterOptions={{ sections: sectionOptions }}
			matchingEntriesHref={matchingEntriesHref(categorySlug, section)}
			heroEyebrow="Classification index"
			placeholder="Search classes..."
			showSectionFilter
			title="Classes"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}
