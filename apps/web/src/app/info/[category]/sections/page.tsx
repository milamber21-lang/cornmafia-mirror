//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/sections/page.tsx                                                  ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki sections index route.                                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Database } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaSectionDirectoryCards,
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
	title: "Wiki Sections | Corn Mafia",
};

type PageProps = {
	params: Promise<{
		category: string;
	}>;
	searchParams: Promise<{
		q?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoSectionsPage({
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
		subcategorySlug: "sections",
	});

	if (!routeContent) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const cards = await listOpediaSectionDirectoryCards(wiki);

	return (
		<RiseopediaClassificationBrowser
			basePath={wiki.sectionsPath}
			cards={cards}
			description={`Browse the main ${wiki.title} sections, then open a section to explore matching entries.`}
			emptySearchTitle="No matching sections found."
			emptyTitle={`No ${wiki.emptyPublicLabel} sections found.`}
			fallbackIcon={Database}
			filters={{
				search: firstSearchParam(resolvedSearchParams.q),
				section: null,
				entityClassCode: null,
				categorySlug: null,
			}}
			heroEyebrow="Main collections"
			placeholder="Search sections..."
			title="Sections"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}
