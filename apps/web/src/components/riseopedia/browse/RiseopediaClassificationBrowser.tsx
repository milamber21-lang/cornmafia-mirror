//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/browse/RiseopediaClassificationBrowser.tsx                              ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia classification browser with compact cards, dependent filters, and no pagination.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import type { LucideIcon } from "lucide-react";

import RiseopediaClassificationCard from "@/components/riseopedia/browse/cards/RiseopediaClassificationCard";
import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/ui/RiseopediaFilterBar";
import RiseopediaPageHeader from "@/components/riseopedia/ui/RiseopediaPageHeader";
import {
	BrowseFilterPanel,
	BrowseResultsPanel,
	ButtonLink,
	StatusPill,
} from "@/components/ui";
import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaClassificationBrowserFilters = {
	search: string | null;
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

export type RiseopediaClassificationBrowserFilterOptions = {
	sections?: RiseopediaFilterOption[];
	classes?: RiseopediaFilterOption[];
	categories?: RiseopediaFilterOption[];
};

export type RiseopediaClassificationBrowserProps = {
	basePath: string;
	cards: RiseopediaHubDirectoryCardDoc[];
	description: string;
	emptySearchTitle: string;
	emptyTitle: string;
	fallbackIcon: LucideIcon;
	filters: RiseopediaClassificationBrowserFilters;
	filterOptions?: RiseopediaClassificationBrowserFilterOptions;
	matchingEntriesHref?: string | null;
	heroEyebrow: string;
	placeholder: string;
	showSectionFilter?: boolean;
	showClassFilter?: boolean;
	showCategoryFilter?: boolean;
	showReleaseFilter?: boolean;
	showSearch?: boolean;
	title: string;
	wikiName?: string;
	homeHref?: string;
	emptyReadModelLabel?: string;
};

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
}

function normalizedSearch(search: string | null): string {
	return search?.trim().toLowerCase() ?? "";
}

function cardMatchesSearch(
	card: RiseopediaHubDirectoryCardDoc,
	search: string,
): boolean {
	if (!search) {
		return true;
	}

	const values = [
		card.name,
		card.code,
		card.description ?? "",
		card.sampleEntityName ?? "",
	];
	return values.some((value) => value.toLowerCase().includes(search));
}

export default function RiseopediaClassificationBrowser({
	basePath,
	cards,
	description,
	emptySearchTitle,
	emptyTitle,
	fallbackIcon: FallbackIcon,
	filters,
	filterOptions = {},
	matchingEntriesHref = null,
	heroEyebrow,
	placeholder,
	showSectionFilter = false,
	showClassFilter = false,
	showCategoryFilter = false,
	showReleaseFilter = false,
	showSearch = true,
	title,
	wikiName = "Riseopedia",
	homeHref = "/info/riseopedia/browse",
	emptyReadModelLabel = "Riseopedia",
}: RiseopediaClassificationBrowserProps): JSX.Element {
	const searchValue = normalizedSearch(filters.search);
	const filteredCards = cards.filter((card) =>
		cardMatchesSearch(card, searchValue),
	);
	const hasActiveSearch = searchValue.length > 0;
	const hasControls =
		showSearch ||
		showSectionFilter ||
		showClassFilter ||
		showCategoryFilter ||
		showReleaseFilter;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaPageHeader
					title={title}
					description={description}
					eyebrow={heroEyebrow}
					breadcrumbs={[{ label: wikiName, href: homeHref }, { label: title }]}
					actions={
						<>
							<StatusPill tone="default" size="md">
								{formatNumber(filteredCards.length)} matching groups
							</StatusPill>
							{matchingEntriesHref ? (
								<ButtonLink href={matchingEntriesHref} variant="secondary">
									Matching entries
								</ButtonLink>
							) : null}
						</>
					}
				/>

				{hasControls ? (
					<BrowseFilterPanel className="riseopedia-overview-search-panel">
						<RiseopediaFilterBar
							action={basePath}
							search={filters.search}
							section={filters.section}
							sectionOptions={filterOptions.sections ?? []}
							entityClass={filters.entityClassCode}
							entityClassOptions={filterOptions.classes ?? []}
							category={filters.categorySlug}
							categoryOptions={filterOptions.categories ?? []}
							releaseFilters={filters.releaseFilters}
							showReleaseFilter={showReleaseFilter}
							showSectionFilter={showSectionFilter}
							showClassFilter={showClassFilter}
							showCategoryFilter={showCategoryFilter}
							wikiName={wikiName}
							searchPlaceholder={placeholder}
						/>
					</BrowseFilterPanel>
				) : null}

				<BrowseResultsPanel className="riseopedia-classification-section">
					{filteredCards.length > 0 ? (
						<div className="riseopedia-classification-grid">
							{filteredCards.map((card) => (
								<RiseopediaClassificationCard
									card={card}
									fallbackIcon={FallbackIcon}
									key={`${card.nodeTypeCode}:${card.id}`}
								/>
							))}
						</div>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveSearch ? emptySearchTitle : emptyTitle}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveSearch
									? "Try a broader search or clear the search field."
									: `Groups will appear here when matching ${emptyReadModelLabel} entries are available.`}
							</p>
						</div>
					)}
				</BrowseResultsPanel>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
