//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/browse/RiseopediaEntityBrowser.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Public Riseopedia entity result browser for classification detail pages and hub search results.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaEntityCard, {
	buildRiseopediaFullCardPropertyDefinitions,
} from "@/components/riseopedia/browse/cards/RiseopediaEntityCard";
import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/ui/RiseopediaFilterBar";
import RiseopediaPageHeader, {
	type RiseopediaPageHeaderBreadcrumbItem,
} from "@/components/riseopedia/ui/RiseopediaPageHeader";
import RiseopediaPager from "@/components/riseopedia/ui/RiseopediaPager";
import RiseopediaSearchBox, {
	type RiseopediaSearchParam,
} from "@/components/riseopedia/ui/RiseopediaSearchBox";
import {
	BrowseFilterPanel,
	BrowsePanelHeader,
	BrowseResultsPanel,
	StatusPill,
} from "@/components/ui";
import type { RiseopediaEntityListResult } from "@/lib/data/riseopedia-entities";
import {
	appendMafiosopediaReleaseSearchParam,
	mafiosopediaReleaseFiltersForView,
	mafiosopediaReleaseSearchParam,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";
import {
	RISEOPEDIA_INFO_BASE_PATH,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaEntityBrowserBreadcrumbItem =
	RiseopediaPageHeaderBreadcrumbItem;

export type RiseopediaEntityBrowserFilters = {
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
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
	showReleaseFilter?: boolean;
	wikiCode?: OpediaWikiCode;
	wikiName?: string;
	emptyReadModelLabel?: string;
};

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
}

function defaultBreadcrumbs(args: {
	wikiName: string;
	homePath: string;
}): RiseopediaEntityBrowserBreadcrumbItem[] {
	return [{ label: args.wikiName, href: args.homePath }, { label: "Entries" }];
}

function entityBrowserPagerParams(args: {
	search: string | null;
	params: RiseopediaSearchParam[];
	filters: RiseopediaEntityBrowserFilters;
	showSectionFilter: boolean;
	showClassFilter: boolean;
	showCategoryFilter: boolean;
	showSubcategoryFilter: boolean;
	showReleaseFilter: boolean;
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
		filterParams.push({
			name: "subcategory",
			value: args.filters.subcategorySlug,
		});
	}

	if (args.showReleaseFilter) {
		filterParams.push({
			name: "release",
			value: mafiosopediaReleaseSearchParam(
				args.filters.releaseFilters ?? mafiosopediaReleaseFiltersForView("all"),
			),
		});
	}

	return [{ name: "q", value: args.search }, ...filterParams, ...args.params];
}

function gridMode(
	result: RiseopediaEntityListResult,
): "compact" | "full" | "mixed" {
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
	showReleaseFilter = false,
	wikiCode = "riseopedia",
	wikiName = "Riseopedia",
	emptyReadModelLabel = "public Riseopedia",
}: RiseopediaEntityBrowserProps): JSX.Element {
	const resolvedBreadcrumbs =
		breadcrumbs ??
		defaultBreadcrumbs({
			wikiName,
			homePath:
				wikiCode === "mafiosopedia"
					? appendMafiosopediaReleaseSearchParam({
							href: "/info/mafiosopedia/browse",
							filters:
								filters.releaseFilters ?? mafiosopediaReleaseFiltersForView("all"),
						})
					: `${RISEOPEDIA_INFO_BASE_PATH}/browse`,
		});
	const hasActiveSearch = Boolean(search && search.trim().length > 0);
	const propertyDefinitions = buildRiseopediaFullCardPropertyDefinitions(
		result.rows,
	);
	const hasFilterControls =
		showSectionFilter ||
		showClassFilter ||
		showCategoryFilter ||
		showSubcategoryFilter ||
		showReleaseFilter;
	const pagerParams = entityBrowserPagerParams({
		search,
		params,
		filters,
		showSectionFilter,
		showClassFilter,
		showCategoryFilter,
		showSubcategoryFilter,
		showReleaseFilter,
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
				<BrowseFilterPanel className="riseopedia-overview-search-panel">
					{hasFilterControls ? (
						<RiseopediaFilterBar
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
							releaseFilters={filters.releaseFilters}
							showReleaseFilter={showReleaseFilter}
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
				</BrowseFilterPanel>
			) : null}

			<BrowseResultsPanel className="riseopedia-entity-results-panel">
				{!showHero ? (
					<BrowsePanelHeader
						className="riseopedia-entity-results-panel__header"
						eyebrow={eyebrow}
						title={title}
						description={description}
						actions={
							<StatusPill tone="default" size="md">
								{formatNumber(result.totalDocs)} matching entries
							</StatusPill>
						}
					/>
				) : null}

				{result.rows.length > 0 ? (
					<>
						<div
							className={`public-collection-grid riseopedia-result-grid riseopedia-result-grid--${resultGridMode}`}
						>
							{result.rows.map((entity) => (
								<RiseopediaEntityCard
									entity={entity}
									key={entity.entityId}
									propertyDefinitions={propertyDefinitions}
									wikiCode={wikiCode}
									releaseFilters={
										wikiCode === "mafiosopedia"
											? (filters.releaseFilters ??
												mafiosopediaReleaseFiltersForView("all"))
											: undefined
									}
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
							{hasActiveSearch
								? "No matching entries found."
								: "No matching entries found."}
						</h2>
						<p className="public-empty-state__message">
							{hasActiveSearch
								? "Try a broader search or clear the search field."
								: `Entries will appear here when the ${emptyReadModelLabel} read models expose matching data.`}
						</p>
					</div>
				)}
			</BrowseResultsPanel>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
