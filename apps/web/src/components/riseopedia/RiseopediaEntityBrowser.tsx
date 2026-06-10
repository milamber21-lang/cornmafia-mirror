//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityBrowser.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Public Riseopedia entity result browser for classification detail pages and hub search results.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaEntityCard, {
	buildRiseopediaFullCardPropertyDefinitions,
} from "@/components/riseopedia/RiseopediaEntityCard";
import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/RiseopediaFilterBar";
import RiseopediaPageHeader, {
	type RiseopediaPageHeaderBreadcrumbItem,
} from "@/components/riseopedia/RiseopediaPageHeader";
import RiseopediaPager from "@/components/riseopedia/RiseopediaPager";
import RiseopediaSearchBox, {
	type RiseopediaSearchParam,
} from "@/components/riseopedia/RiseopediaSearchBox";
import { StatusPill } from "@/components/ui";
import type { RiseopediaEntityListResult } from "@/lib/data/riseopedia-entities";
import {
	RISEOPEDIA_INFO_BASE_PATH,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityBrowserBreadcrumbItem = RiseopediaPageHeaderBreadcrumbItem;

export type RiseopediaEntityBrowserFilters = {
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
};

export type RiseopediaEntityBrowserFilterOptions = {
	sections?: RiseopediaFilterOption[];
	classes?: RiseopediaFilterOption[];
	categories?: RiseopediaFilterOption[];
	subcategories?: RiseopediaFilterOption[];
};

const EMPTY_SEARCH_PARAMS: RiseopediaSearchParam[] = [];
const DEFAULT_ENTITY_FILTERS: RiseopediaEntityBrowserFilters = {
	section: null,
	entityClassCode: null,
	categorySlug: null,
	subcategorySlug: null,
};

export type RiseopediaEntityBrowserProps = {
	result: RiseopediaEntityListResult;
	search: string | null;
	basePath: string;
	breadcrumbs?: RiseopediaEntityBrowserBreadcrumbItem[];
	description?: string | null;
	eyebrow?: string;
	title: string;
	searchPlaceholder?: string;
	showHero?: boolean;
	showSearch?: boolean;
	showPager?: boolean;
	params?: RiseopediaSearchParam[];
	filters?: RiseopediaEntityBrowserFilters;
	filterOptions?: RiseopediaEntityBrowserFilterOptions;
	showSectionFilter?: boolean;
	showClassFilter?: boolean;
	showCategoryFilter?: boolean;
	showSubcategoryFilter?: boolean;
	wikiCode?: OpediaWikiCode;
	wikiName?: string;
	emptyReadModelLabel?: string;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function defaultBreadcrumbs(args: {
	wikiName: string;
	homePath: string;
}): RiseopediaEntityBrowserBreadcrumbItem[] {
	return [
		{ label: args.wikiName, href: args.homePath },
		{ label: "Entries" },
	];
}

function entityBrowserPagerParams(args: {
	search: string | null;
	params: RiseopediaSearchParam[];
	filters: RiseopediaEntityBrowserFilters;
	showSectionFilter: boolean;
	showClassFilter: boolean;
	showCategoryFilter: boolean;
	showSubcategoryFilter: boolean;
}): RiseopediaSearchParam[] {
	const filterParams: RiseopediaSearchParam[] = [];

	if (args.showSectionFilter) {
		filterParams.push({ name: "section", value: args.filters.section });
	}

	if (args.showClassFilter) {
		filterParams.push({ name: "class", value: args.filters.entityClassCode });
	}

	if (args.showCategoryFilter) {
		filterParams.push({ name: "category", value: args.filters.categorySlug });
	}

	if (args.showSubcategoryFilter) {
		filterParams.push({ name: "subcategory", value: args.filters.subcategorySlug });
	}

	return [{ name: "q", value: args.search }, ...filterParams, ...args.params];
}

function gridMode(result: RiseopediaEntityListResult): "compact" | "full" | "mixed" {
	const hasFull = result.rows.some((row) => row.cardMode === "full");
	const hasCompact = result.rows.some((row) => row.cardMode === "compact");

	if (hasFull && hasCompact) {
		return "mixed";
	}

	return hasFull ? "full" : "compact";
}

export default function RiseopediaEntityBrowser({
	result,
	search,
	basePath,
	breadcrumbs,
	description = null,
	eyebrow = "Entity overview",
	title,
	searchPlaceholder = "Search entries...",
	showHero = true,
	showSearch = true,
	showPager = true,
	params = EMPTY_SEARCH_PARAMS,
	filters = DEFAULT_ENTITY_FILTERS,
	filterOptions = {},
	showSectionFilter = false,
	showClassFilter = false,
	showCategoryFilter = false,
	showSubcategoryFilter = false,
	wikiCode = "riseopedia",
	wikiName = "Riseopedia",
	emptyReadModelLabel = "public Riseopedia",
}: RiseopediaEntityBrowserProps): JSX.Element {
	const resolvedBreadcrumbs = breadcrumbs ?? defaultBreadcrumbs({
		wikiName,
		homePath: wikiCode === "mafiosopedia" ? "/info/mafiosopedia/browse" : `${RISEOPEDIA_INFO_BASE_PATH}/browse`,
	});
	const hasActiveSearch = Boolean(search && search.trim().length > 0);
	const propertyDefinitions = buildRiseopediaFullCardPropertyDefinitions(result.rows);
	const hasFilterControls = showSectionFilter || showClassFilter || showCategoryFilter || showSubcategoryFilter;
	const filterBarKey = [
		filters.section ?? "",
		filters.entityClassCode ?? "",
		filters.categorySlug ?? "",
		filters.subcategorySlug ?? "",
		String(result.pageSize),
	].join(":");
	const pagerParams = entityBrowserPagerParams({
		search,
		params,
		filters,
		showSectionFilter,
		showClassFilter,
		showCategoryFilter,
		showSubcategoryFilter,
	});
	const resultGridMode = gridMode(result);

	return (
		<>
			{showHero ? (
				<RiseopediaPageHeader
					title={title}
					description={description}
					eyebrow={eyebrow}
					breadcrumbs={resolvedBreadcrumbs}
					actions={
						<StatusPill tone="default" size="md">
							{formatNumber(result.totalDocs)} matching entries
						</StatusPill>
					}
				/>
			) : null}

			{showSearch ? (
				<section className="public-collection-panel riseopedia-overview-search-panel">
					{hasFilterControls ? (
						<RiseopediaFilterBar
							key={filterBarKey}
							action={basePath}
							search={search}
							section={filters.section}
							sectionOptions={filterOptions.sections ?? []}
							entityClass={filters.entityClassCode}
							entityClassOptions={filterOptions.classes ?? []}
							category={filters.categorySlug}
							categoryOptions={filterOptions.categories ?? []}
							subcategory={filters.subcategorySlug}
							subcategoryOptions={filterOptions.subcategories ?? []}
							pageSize={result.pageSize}
							showSectionFilter={showSectionFilter}
							showClassFilter={showClassFilter}
							showCategoryFilter={showCategoryFilter}
							showSubcategoryFilter={showSubcategoryFilter}
							searchPlaceholder={searchPlaceholder}
							wikiName={wikiName}
						/>
					) : (
						<RiseopediaSearchBox
							basePath={basePath}
							search={search}
							placeholder={searchPlaceholder}
							params={params}
							pageSize={result.pageSize}
						/>
					)}
				</section>
			) : null}

			<section className="public-collection-panel riseopedia-entity-results-panel">
				{!showHero ? (
					<div className="riseopedia-entity-results-panel__header">
						<div>
							<div className="public-collection-hero__eyebrow">{eyebrow}</div>
							<h2 className="riseopedia-entity-results-panel__title">{title}</h2>
							{description ? (
								<p className="riseopedia-entity-results-panel__description">{description}</p>
							) : null}
						</div>
						<StatusPill tone="default" size="md">
							{formatNumber(result.totalDocs)} matching entries
						</StatusPill>
					</div>
				) : null}

				{result.rows.length > 0 ? (
					<>
						<div className={`public-collection-grid riseopedia-result-grid riseopedia-result-grid--${resultGridMode}`}>
							{result.rows.map((entity) => (
								<RiseopediaEntityCard
									entity={entity}
									key={entity.entityId}
									propertyDefinitions={propertyDefinitions}
								wikiCode={wikiCode}
								/>
							))}
						</div>

						{showPager ? (
							<RiseopediaPager
								basePath={basePath}
								params={pagerParams}
								page={result.page}
								pageSize={result.pageSize}
								totalDocs={result.totalDocs}
								totalPages={result.totalPages}
							/>
						) : null}
					</>
				) : (
					<div className="public-empty-state">
						<h2 className="public-empty-state__title">
							{hasActiveSearch ? "No matching entries found." : "No public entries found."}
						</h2>
						<p className="public-empty-state__message">
							{hasActiveSearch
								? "Try a broader search or clear the search field."
								: `Entries will appear here when the ${emptyReadModelLabel} read models expose matching data.`}
						</p>
					</div>
				)}
			</section>
		</>
	);
}
