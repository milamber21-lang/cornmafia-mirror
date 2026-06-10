//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/categories/page.tsx                                                ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki categories index route with section and class filtering.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderTree } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaCategoryDirectoryCards,
	listOpediaClassFilterOptions,
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
	}>;
};

function matchingEntriesHref(args: {
	categorySlug: string;
	section: string | null;
	entityClassCode: string | null;
}): string | null {
	if (args.entityClassCode) {
		return `/info/${args.categorySlug}/classes/${args.entityClassCode}`;
	}

	return args.section ? `/info/${args.categorySlug}/sections/${args.section}` : null;
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
	const [sections, classOptions, cards] = await Promise.all([
		listOpediaSections(wiki),
		listOpediaClassFilterOptions(wiki, { section }),
		listOpediaCategoryDirectoryCards(wiki, { section, entityClassCode }),
	]);
	const sectionOptions = sections
		.filter((row) => row.publicVisible || row.showWhenEmpty)
		.map((row) => ({ value: row.slug, label: row.name, count: row.itemCount }));

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
			}}
			filterOptions={{
				sections: sectionOptions,
				classes: classOptions,
			}}
			matchingEntriesHref={matchingEntriesHref({
				categorySlug,
				section,
				entityClassCode,
			})}
			heroEyebrow="Classification index"
			placeholder="Search categories..."
			showSectionFilter
			showClassFilter
			title="Categories"
			wikiName={wiki.title}
			homeHref={wiki.browsePath}
			emptyReadModelLabel={wiki.emptyPublicLabel}
		/>
	);
}
