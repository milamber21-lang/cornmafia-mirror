//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/browse/RiseopediaHub.tsx                                                 ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia-family hub with compact classification previews and entity search results.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { Boxes, Database, FolderTree, type LucideIcon } from "lucide-react";

import RiseopediaClassificationCard from "@/components/riseopedia/browse/cards/RiseopediaClassificationCard";
import RiseopediaEntityBrowser from "@/components/riseopedia/browse/RiseopediaEntityBrowser";
import RiseopediaPageHeader from "@/components/riseopedia/ui/RiseopediaPageHeader";
import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/ui/RiseopediaFilterBar";
import {
	BrowseFilterPanel,
	BrowsePanelHeader,
	BrowseResultsPanel,
	ButtonLink,
} from "@/components/ui";
import type { RiseopediaEntityListResult } from "@/lib/data/riseopedia-entities";
import {
	appendMafiosopediaReleaseSearchParam,
	hasNonDefaultMafiosopediaReleaseFilters,
	mafiosopediaReleaseFiltersForView,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";
import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import {
	RISEOPEDIA_INFO_BASE_PATH,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaHubProps = {
	sections: RiseopediaHubDirectoryCardDoc[];
	classes: RiseopediaHubDirectoryCardDoc[];
	categories: RiseopediaHubDirectoryCardDoc[];
	search: string | null;
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
	sectionOptions: RiseopediaFilterOption[];
	classOptions: RiseopediaFilterOption[];
	categoryOptions: RiseopediaFilterOption[];
	subcategoryOptions: RiseopediaFilterOption[];
	entityResult: RiseopediaEntityListResult | null;
	basePath?: string;
	classesPath?: string;
	categoriesPath?: string;
	wikiCode?: OpediaWikiCode;
	wikiName?: string;
	wikiDescription?: string;
	wikiBrowserDescription?: string;
	emptyReadModelLabel?: string;
};

type HubCardGroupProps = {
	cards: RiseopediaHubDirectoryCardDoc[];
	description: string;
	emptyTitle: string;
	emptyMessage: string;
	fallbackIcon: LucideIcon;
	limit?: number;
	title: string;
	viewAllHref?: string;
	viewAllLabel?: string;
};

const HUB_PREVIEW_LIMIT = 12;

function normalizedSearch(search: string | null): string {
	return search?.trim() ?? "";
}

function withReleaseFilter(args: {
	href: string;
	wikiCode: OpediaWikiCode;
	releaseFilters: MafiosopediaReleaseFilterCode[];
}): string {
	if (args.wikiCode !== "mafiosopedia") {
		return args.href;
	}

	return appendMafiosopediaReleaseSearchParam({
		href: args.href,
		filters: args.releaseFilters,
	});
}

function RiseopediaHubCardGroup({
	cards,
	description,
	emptyTitle,
	emptyMessage,
	fallbackIcon,
	limit,
	title,
	viewAllHref,
	viewAllLabel = "Go",
}: HubCardGroupProps): JSX.Element {
	const visibleCards = typeof limit === "number" ? cards.slice(0, limit) : cards;
	const hasHiddenCards = typeof limit === "number" && cards.length > limit;

	return (
		<BrowseResultsPanel className="riseopedia-classification-section">
			<BrowsePanelHeader
				className="riseopedia-classification-section__header"
				title={title}
				description={description}
				actions={
					viewAllHref && (hasHiddenCards || visibleCards.length > 0) ? (
						<ButtonLink href={viewAllHref} variant="secondary">
							{viewAllLabel}
						</ButtonLink>
					) : null
				}
			/>

			{visibleCards.length > 0 ? (
				<div className="riseopedia-classification-grid">
					{visibleCards.map((card) => (
						<RiseopediaClassificationCard
							card={card}
							fallbackIcon={fallbackIcon}
							key={`${card.nodeTypeCode}:${card.id}`}
						/>
					))}
				</div>
			) : (
				<div className="public-empty-state">
					<h2 className="public-empty-state__title">{emptyTitle}</h2>
					<p className="public-empty-state__message">{emptyMessage}</p>
				</div>
			)}
		</BrowseResultsPanel>
	);
}

export default function RiseopediaHub({
	sections,
	classes,
	categories,
	search,
	section,
	entityClassCode,
	categorySlug,
	subcategorySlug,
	releaseFilters = mafiosopediaReleaseFiltersForView("all"),
	sectionOptions,
	classOptions,
	categoryOptions,
	subcategoryOptions,
	entityResult,
	basePath = `${RISEOPEDIA_INFO_BASE_PATH}/browse`,
	classesPath = `${RISEOPEDIA_INFO_BASE_PATH}/classes`,
	categoriesPath = `${RISEOPEDIA_INFO_BASE_PATH}/categories`,
	wikiCode = "riseopedia",
	wikiName = "Riseopedia",
	wikiDescription = "Browse public game knowledge by section, class, and category. Search to jump directly into matching entries.",
	wikiBrowserDescription = "Matching public Riseopedia entries across sections, classes, categories, and subcategories.",
	emptyReadModelLabel = "public Riseopedia",
}: RiseopediaHubProps): JSX.Element {
	const searchValue = normalizedSearch(search);
	const hasActiveFilters = Boolean(
		section || entityClassCode || categorySlug || subcategorySlug,
	);
	const hasNonDefaultReleaseFilters =
		wikiCode === "mafiosopedia" &&
		hasNonDefaultMafiosopediaReleaseFilters(releaseFilters);
	const hasActiveSearch = searchValue.length > 0;
	const hasActiveBrowser =
		hasActiveSearch || hasActiveFilters || hasNonDefaultReleaseFilters;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaPageHeader
					eyebrow="Cornucopias knowledge base"
					title={wikiName}
					description={wikiDescription}
				/>

				<BrowseFilterPanel className="riseopedia-overview-search-panel">
					<RiseopediaFilterBar
						action={basePath}
						search={search}
						section={section}
						sectionOptions={sectionOptions}
						entityClass={entityClassCode}
						entityClassOptions={classOptions}
						category={categorySlug}
						categoryOptions={categoryOptions}
						subcategory={subcategorySlug}
						subcategoryOptions={subcategoryOptions}
						releaseFilters={releaseFilters}
						showReleaseFilter={wikiCode === "mafiosopedia"}
						pageSize={entityResult?.pageSize}
						showSectionFilter
						showClassFilter
						showCategoryFilter
						showSubcategoryFilter
						searchPlaceholder={`Search ${wikiName} entries...`}
						wikiName={wikiName}
					/>
				</BrowseFilterPanel>

				{hasActiveBrowser && entityResult ? (
					<RiseopediaEntityBrowser
						result={entityResult}
						search={search}
						basePath={basePath}
						title={
							searchValue ? `Search results: ${searchValue}` : "Filtered entries"
						}
						description={wikiBrowserDescription}
						eyebrow={hasActiveSearch ? "Search results" : "Filtered entries"}
						showHero={false}
						showSearch={false}
						filters={{
							section,
							entityClassCode,
							categorySlug,
							subcategorySlug,
							releaseFilters,
						}}
						filterOptions={{
							sections: sectionOptions,
							classes: classOptions,
							categories: categoryOptions,
							subcategories: subcategoryOptions,
						}}
						showSectionFilter
						showClassFilter
						showCategoryFilter
						showSubcategoryFilter
						showReleaseFilter={wikiCode === "mafiosopedia"}
						wikiCode={wikiCode}
						wikiName={wikiName}
						emptyReadModelLabel={emptyReadModelLabel}
					/>
				) : (
					<>
						<RiseopediaHubCardGroup
							cards={sections}
							description={`Start with the main ${wikiName} sections.`}
							emptyTitle={`No ${emptyReadModelLabel} sections found.`}
							emptyMessage={`Groups will appear here when matching ${emptyReadModelLabel} entries are available.`}
							fallbackIcon={Database}
							title="Sections"
						/>

						<RiseopediaHubCardGroup
							cards={classes}
							description="Jump into broad canonical classes before opening entity overviews."
							emptyTitle={`No ${emptyReadModelLabel} classes found.`}
							emptyMessage={`Groups will appear here when matching ${emptyReadModelLabel} entries are available.`}
							fallbackIcon={Boxes}
							limit={HUB_PREVIEW_LIMIT}
							title="Classes"
							viewAllHref={withReleaseFilter({
								href: classesPath,
								wikiCode,
								releaseFilters,
							})}
							viewAllLabel="Go to classes"
						/>

						<RiseopediaHubCardGroup
							cards={categories}
							description="Browse common category groupings before drilling into matching entries."
							emptyTitle={`No ${emptyReadModelLabel} categories found.`}
							emptyMessage={`Groups will appear here when matching ${emptyReadModelLabel} entries are available.`}
							fallbackIcon={FolderTree}
							limit={HUB_PREVIEW_LIMIT}
							title="Categories"
							viewAllHref={withReleaseFilter({
								href: categoriesPath,
								wikiCode,
								releaseFilters,
							})}
							viewAllLabel="Go to categories"
						/>
					</>
				)}
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
