//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaSectionsBrowser.tsx                                    ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia sections index with dynamic search and representative rectangular media cards.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Link from "next/link";
import { Database } from "lucide-react";

import RiseopediaSearchBox from "@/components/riseopedia/RiseopediaSearchBox";
import RiseopediaSectionCard from "@/components/riseopedia/RiseopediaSectionCard";
import { StatusPill } from "@/components/ui";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";

export type RiseopediaSectionsBrowserProps = {
	sections: RiseopediaSectionDoc[];
	sectionMediaSamples: RiseopediaSectionMediaSample[];
	search: string | null;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function visibleSections(sections: RiseopediaSectionDoc[]): RiseopediaSectionDoc[] {
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
				<section className="public-collection-hero riseopedia-browser-hero">
					<div className="public-collection-hero__main">
						<div className="public-collection-hero__icon">
							<Database className="public-collection-hero__icon-glyph" aria-hidden />
						</div>
						<div>
							<nav className="riseopedia-breadcrumb" aria-label="Riseopedia breadcrumb">
								<Link href="/riseopedia">Riseopedia</Link>
								<span>Sections</span>
							</nav>
							<div className="public-collection-hero__eyebrow">Mixed collections</div>
							<h1 className="public-collection-hero__title">Sections</h1>
							<p className="public-collection-hero__description">
								Browse public Riseopedia sections with representative item images,
								then open a section to explore matching assets and recipes.
							</p>
						</div>
					</div>

					<div className="public-collection-hero__actions">
						<StatusPill tone="default" size="md">
							{formatNumber(filteredSections.length)} matching sections
						</StatusPill>
					</div>
				</section>

				<section className="public-collection-panel">
					<RiseopediaSearchBox
						basePath="/riseopedia/sections"
						search={search}
						placeholder="Search sections..."
					/>

					{filteredSections.length > 0 ? (
						<div className="admin-control-section__grid riseopedia-section-grid">
							{filteredSections.map((section) => (
								<RiseopediaSectionCard
									mediaSample={sectionSampleLookup.get(section.code) ?? null}
									section={section}
									key={section.id}
								/>
							))}
						</div>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveSearch ? "No matching sections found." : "No public sections found."}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveSearch
									? "Try a broader search or clear the search field."
									: "Sections will appear here when the public Riseopedia sections view has visible rows."}
							</p>
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
