//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaDirectoryPage.tsx                                      ////
//// Language: TSX                                                                                              ////
//// Generic Riseopedia /info directory page for classification index routes.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { LucideIcon } from "lucide-react";

import RiseopediaHubDirectoryCard from "@/components/riseopedia/RiseopediaHubDirectoryCard";
import RiseopediaPageHeader from "@/components/riseopedia/RiseopediaPageHeader";
import RiseopediaSearchBox from "@/components/riseopedia/RiseopediaSearchBox";
import { StatusPill } from "@/components/ui";
import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import { RISEOPEDIA_INFO_BASE_PATH } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaDirectoryPageProps = {
	basePath: string;
	cards: RiseopediaHubDirectoryCardDoc[];
	description: string;
	emptySearchTitle: string;
	emptyTitle: string;
	fallbackIcon: LucideIcon;
	heroEyebrow: string;
	placeholder: string;
	search: string | null;
	title: string;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
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

export default function RiseopediaDirectoryPage({
	basePath,
	cards,
	description,
	emptySearchTitle,
	emptyTitle,
	fallbackIcon: FallbackIcon,
	heroEyebrow,
	placeholder,
	search,
	title,
}: RiseopediaDirectoryPageProps): JSX.Element {
	const searchValue = normalizedSearch(search);
	const filteredCards = cards.filter((card) => cardMatchesSearch(card, searchValue));
	const hasActiveSearch = searchValue.length > 0;

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<RiseopediaPageHeader
					title={title}
					description={description}
					eyebrow={heroEyebrow}
					breadcrumbs={[
						{ label: "Riseopedia", href: `${RISEOPEDIA_INFO_BASE_PATH}/browse` },
						{ label: title },
					]}
					actions={
						<StatusPill tone="default" size="md">
							{formatNumber(filteredCards.length)} matching rows
						</StatusPill>
					}
				/>

				<section className="public-collection-panel riseopedia-overview-search-panel">
					<RiseopediaSearchBox
						basePath={basePath}
						search={search}
						placeholder={placeholder}
					/>
				</section>

				<section className="riseopedia-classification-section public-collection-panel">
					{filteredCards.length > 0 ? (
						<div className="admin-control-section__grid riseopedia-section-grid">
							{filteredCards.map((card) => (
								<RiseopediaHubDirectoryCard
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
									: "Rows will appear here when the public Riseopedia read models expose matching data."}
							</p>
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
