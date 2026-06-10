//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/subcategories/page.tsx                                             ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki subcategories index route with dependent classification filtering.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListTree } from "lucide-react";

import RiseopediaClassificationBrowser from "@/components/riseopedia/RiseopediaClassificationBrowser";
import {
	getOpediaWikiConfig,
	listOpediaCategoryFilterOptions,
	listOpediaClassFilterOptions,
	listOpediaSections,
	listOpediaSubcategoryDirectoryCards,
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
	}>;
};

function matchingEntriesHref(args: {
	categorySlug: string;
	section: string | null;
	entityClassCode: string | null;
	selectedCategorySlug: string | null;
}): string | null {
	if (args.selectedCategorySlug) {
		return `/info/${args.categorySlug}/categories/${args.selectedCategorySlug}`;
	}

	if (args.entityClassCode) {
		return `/info/${args.categorySlug}/classes/${args.entityClassCode}`;
	}

	return args.section ? `/info/${args.categorySlug}/sections/${args.section}` : null;
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
	const [sections, classOptions, categoryOptions, cards] = await Promise.all([
		listOpediaSections(wiki),
		listOpediaClassFilterOptions(wiki, { section }),
		listOpediaCategoryFilterOptions(wiki, { section, entityClassCode }),
		listOpediaSubcategoryDirectoryCards(wiki, {
			section,
			entityClassCode,
			categorySlug: selectedCategorySlug,
		}),
	]);
	const sectionOptions = sections
		.filter((row) => row.publicVisible || row.showWhenEmpty)
		.map((row) => ({ value: row.slug, label: row.name, count: row.itemCount }));

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
			})}
			heroEyebrow="Classification index"
			placeholder="Search subcategories..."
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
