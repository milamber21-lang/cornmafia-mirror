//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/browse/RiseopediaSectionsBrowser.tsx                                    ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia sections index with dynamic search and representative rectangular media cards.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaPageHeader from "@/components/riseopedia/ui/RiseopediaPageHeader";
import RiseopediaSearchBox from "@/components/riseopedia/ui/RiseopediaSearchBox";
import RiseopediaSectionCard from "@/components/riseopedia/browse/cards/RiseopediaSectionCard";
import {
	BrowseFilterPanel,
	BrowseResultsPanel,
	StatusPill,
} from "@/components/ui";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";
import { RISEOPEDIA_INFO_BASE_PATH } from "@/lib/helpers/riseopedia-entity-links";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaSectionsBrowserProps = {
	sections: RiseopediaSectionDoc[];
	sectionMediaSamples: RiseopediaSectionMediaSample[];
	search: string | null;
	basePath?: string;
	homePath?: string;
};

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
}

function visibleSections(
	sections: RiseopediaSectionDoc[],
): RiseopediaSectionDoc[] {
	return sections.filter(
		(section) => section.publicVisible || section.showWhenEmpty,
	);
}

function normalizedSearch(search: string | null): string {
	return search?.trim().toLowerCase() ?? "";
}

function sectionMatchesSearch(
	section: RiseopediaSectionDoc,
	search: string,
): boolean {
	if (!search) {
		return true;
	}

	const values = [section.name, section.code, section.description ?? ""];
	return values.some((value) => value.toLowerCase().includes(search));
}

function buildSectionSampleLookup(
	samples: RiseopediaSectionMediaSample[],
): Map<string, RiseopediaSectionMediaSample> {
	return new Map(samples.map((sample) => [sample.sectionCode, sample]));
}

export default function RiseopediaSectionsBrowser({
	sections,
	sectionMediaSamples,
	search,
	basePath = `${RISEOPEDIA_INFO_BASE_PATH}/sections`,
	homePath = `${RISEOPEDIA_INFO_BASE_PATH}/browse`,
}: RiseopediaSectionsBrowserProps): JSX.Element {
	const sectionSampleLookup = buildSectionSampleLookup(sectionMediaSamples);
	const searchValue = normalizedSearch(search);
	const publicSections = visibleSections(sections);
	const filteredSections = publicSections.filter((section) =>
		sectionMatchesSearch(section, searchValue),
	);
	const hasActiveSearch = searchValue.length > 0;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaPageHeader
					title="Sections"
					description="Browse public Riseopedia sections with representative item images, then open a section to explore matching entries."
					eyebrow="Mixed collections"
					breadcrumbs={[
						{ label: "Riseopedia", href: homePath },
						{ label: "Sections" },
					]}
					actions={
						<StatusPill tone="default" size="md">
							{formatNumber(filteredSections.length)} matching sections
						</StatusPill>
					}
				/>

				<BrowseFilterPanel className="riseopedia-overview-search-panel">
					<RiseopediaSearchBox
						basePath={basePath}
						search={search}
						placeholder="Search sections..."
					/>
				</BrowseFilterPanel>

				<BrowseResultsPanel className="riseopedia-classification-section">
					{filteredSections.length > 0 ? (
						<div className="admin-control-section__grid riseopedia-section-grid">
							{filteredSections.map((section) => (
								<RiseopediaSectionCard
									mediaSample={sectionSampleLookup.get(section.code) ?? null}
									section={section}
									basePath={basePath}
									key={section.id}
								/>
							))}
						</div>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveSearch
									? "No matching sections found."
									: "No public sections found."}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveSearch
									? "Try a broader search or clear the search field."
									: "Sections will appear here when the public Riseopedia sections view has visible rows."}
							</p>
						</div>
					)}
				</BrowseResultsPanel>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
