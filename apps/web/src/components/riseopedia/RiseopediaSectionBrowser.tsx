//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaSectionBrowser.tsx                                    ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia section detail page with dynamic search and mixed asset and recipe cards.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Box, ChefHat, Database } from "lucide-react";

import RiseopediaPager from "@/components/riseopedia/RiseopediaPager";
import RiseopediaSearchBox from "@/components/riseopedia/RiseopediaSearchBox";
import { StatusPill } from "@/components/ui";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionItemDoc,
	RiseopediaSectionItemListResult,
} from "@/lib/data/riseopedia-sections";

export type RiseopediaSectionBrowserProps = {
	section: RiseopediaSectionDoc;
	result: RiseopediaSectionItemListResult;
	search: string | null;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function itemHref(item: RiseopediaSectionItemDoc): string {
	if (item.entityTypeCode === "recipe") {
		return `/riseopedia/recipes/${item.entitySlug}`;
	}

	return `/riseopedia/assets/${item.entitySlug}`;
}

function itemTypeLabel(item: RiseopediaSectionItemDoc): string {
	return item.entityTypeCode === "recipe" ? "Recipe" : "Asset";
}

function itemMetaParts(item: RiseopediaSectionItemDoc): string[] {
	if (item.entityTypeCode === "recipe") {
		return ["Recipe", item.benchName].filter(
			(value): value is string => typeof value === "string" && value.trim().length > 0,
		);
	}

	return ["Asset", item.assetClassName].filter(
		(value): value is string => typeof value === "string" && value.trim().length > 0,
	);
}

function RiseopediaSectionItemIcon({
	item,
}: {
	item: RiseopediaSectionItemDoc;
}): JSX.Element {
	if (item.media) {
		return (
			<img
				className="riseopedia-result-card__image"
				src={item.media.url}
				alt=""
				width={item.media.width ?? undefined}
				height={item.media.height ?? undefined}
				loading="lazy"
			/>
		);
	}

	if (item.entityTypeCode === "recipe") {
		return <ChefHat className="riseopedia-result-card__fallback-icon" />;
	}

	return <Box className="riseopedia-result-card__fallback-icon" />;
}

function RiseopediaSectionItemCard({
	item,
}: {
	item: RiseopediaSectionItemDoc;
}): JSX.Element {
	const metaParts = itemMetaParts(item);
	const summary = item.entitySubtitle
		? item.entitySubtitle
		: item.entityTypeCode === "recipe"
			? "Open the recipe detail page for components and outputs."
			: "Open the asset detail page for profile-controlled data.";

	return (
		<Link
			className="public-collection-card riseopedia-result-card"
			href={itemHref(item)}
		>
			<span
				className="public-collection-card__icon riseopedia-result-card__icon"
				aria-hidden
			>
				<RiseopediaSectionItemIcon item={item} />
			</span>

			<span className="public-collection-card__body">
				<span className="public-collection-card__meta">
					<span className="public-collection-card__meta-item">
						{metaParts.length > 0 ? metaParts.join(" / ") : itemTypeLabel(item)}
					</span>
				</span>
				<span className="public-collection-card__title">{item.entityName}</span>
				<span className="public-collection-card__summary">{summary}</span>
			</span>

			<ArrowRight className="public-collection-card__arrow" aria-hidden />
		</Link>
	);
}

export default function RiseopediaSectionBrowser({
	section,
	result,
	search,
}: RiseopediaSectionBrowserProps): JSX.Element {
	const hasActiveSearch = Boolean(search);

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
								<Link href="/riseopedia/sections">Sections</Link>
								<span>{section.name}</span>
							</nav>
							<div className="public-collection-hero__eyebrow">Section</div>
							<h1 className="public-collection-hero__title">{section.name}</h1>
							{section.description ? (
								<p className="public-collection-hero__description">
									{section.description}
								</p>
							) : null}
						</div>
					</div>

					<div className="public-collection-hero__actions">
						<StatusPill tone="default" size="md">
							{formatNumber(result.totalDocs)} matching items
						</StatusPill>
					</div>
				</section>

				<section className="public-collection-panel riseopedia-section-items-panel">
					<RiseopediaSearchBox
						basePath={`/riseopedia/sections/${section.slug}`}
						search={search}
						placeholder={`Search ${section.name}...`}
						pageSize={result.pageSize}
					/>

					{result.rows.length > 0 ? (
						<>
							<div className="public-collection-grid riseopedia-result-grid">
								{result.rows.map((item) => (
									<RiseopediaSectionItemCard
										item={item}
										key={`${item.entityTypeCode}:${item.entityKey}`}
									/>
								))}
							</div>

							<RiseopediaPager
								basePath={`/riseopedia/sections/${section.slug}`}
								params={[{ name: "q", value: search }]}
								page={result.page}
								pageSize={result.pageSize}
								totalDocs={result.totalDocs}
								totalPages={result.totalPages}
							/>
						</>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveSearch ? "No matching section items found." : "No section items found."}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveSearch
									? "Try a broader search or clear the search field."
									: "Items will appear here when this public Riseopedia section has asset or recipe memberships."}
							</p>
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
