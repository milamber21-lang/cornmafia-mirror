//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/sections/[slug]/page.tsx                                           ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki section entity overview route populated from entity read rows.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RiseopediaEntityBrowser from "@/components/riseopedia/RiseopediaEntityBrowser";
import {
	findOpediaSectionBySlug,
	getOpediaWikiConfig,
	listOpediaEntities,
	listOpediaEntityCategoryFilterOptions,
	listOpediaEntityClassFilterOptions,
	listOpediaEntitySubcategoryFilterOptions,
} from "@/lib/data/opedia-wiki";
import type { RiseopediaEntityListFilters } from "@/lib/data/riseopedia-entities";
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
	const selectedSubcategorySlug = firstSearchParam(resolvedSearchParams.subcategory);
	const listFilters: RiseopediaEntityListFilters = {
		search: firstSearchParam(resolvedSearchParams.q),
		section: section.slug,
		entityClassCode: selectedClassCode,
		categorySlug: selectedCategorySlug,
		subcategorySlug: selectedSubcategorySlug,
		cardPlacementCode: "section",
		page: parsePage(firstSearchParam(resolvedSearchParams.page)),
		pageSize: parsePageSize(firstSearchParam(resolvedSearchParams.pageSize)),
	};
	const [classes, categories, subcategories, result] = await Promise.all([
		listOpediaEntityClassFilterOptions(wiki, { section: section.slug }),
		listOpediaEntityCategoryFilterOptions(wiki, {
			section: section.slug,
			entityClassCode: selectedClassCode,
		}),
		listOpediaEntitySubcategoryFilterOptions(wiki, {
			section: section.slug,
			entityClassCode: selectedClassCode,
			categorySlug: selectedCategorySlug,
		}),
		listOpediaEntities(wiki, listFilters),
	]);
	const basePath = `/info/${categorySlug}/sections/${section.slug}`;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaEntityBrowser
					result={result}
					search={listFilters.search}
					basePath={basePath}
					filters={{
						section: section.slug,
						entityClassCode: selectedClassCode,
						categorySlug: selectedCategorySlug,
						subcategorySlug: selectedSubcategorySlug,
					}}
					filterOptions={{
						classes,
						categories,
						subcategories,
					}}
					showClassFilter
					showCategoryFilter
					showSubcategoryFilter
					breadcrumbs={[
						{ label: wiki.title, href: wiki.browsePath },
						{ label: "Sections", href: wiki.sectionsPath },
						{ label: section.name },
					]}
					description={section.description}
					eyebrow="Section"
					searchPlaceholder={`Search ${section.name} entries...`}
					title={section.name}
					wikiCode={wiki.code}
					wikiName={wiki.title}
					emptyReadModelLabel={wiki.emptyPublicLabel}
				/>
			</div>
		</section>
	);
}
