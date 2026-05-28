//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaAssetBrowser.tsx                                        ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia broad asset overview page using existing public card and UI primitive styling.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Box, Database } from "lucide-react";

import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/RiseopediaFilterBar";
import RiseopediaPager from "@/components/riseopedia/RiseopediaPager";
import { ButtonLink, StatusPill } from "@/components/ui";
import type {
	RiseopediaAssetDoc,
	RiseopediaAssetListResult,
} from "@/lib/data/riseopedia-assets";
import type { RiseopediaAssetClassDoc } from "@/lib/data/riseopedia-asset-classes";
import type { RiseopediaSectionDoc } from "@/lib/data/riseopedia-sections";

export type RiseopediaAssetBrowserFilters = {
	search: string | null;
	section: string | null;
	assetClassCode: string | null;
};

export type RiseopediaAssetBrowserProps = {
	result: RiseopediaAssetListResult;
	filters: RiseopediaAssetBrowserFilters;
	sections: RiseopediaSectionDoc[];
	assetClasses: RiseopediaAssetClassDoc[];
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function sectionOptions(sections: RiseopediaSectionDoc[]): RiseopediaFilterOption[] {
	return sections
		.filter((section) => section.publicVisible || section.showWhenEmpty)
		.map((section) => ({
			value: section.slug,
			label: section.name,
			count: section.itemCount,
		}));
}

function assetClassOptions(
	assetClasses: RiseopediaAssetClassDoc[],
): RiseopediaFilterOption[] {
	return assetClasses.map((assetClass) => ({
		value: assetClass.code,
		label: assetClass.name,
		count: assetClass.assetCount,
	}));
}

function assetMetaParts(asset: RiseopediaAssetDoc): string[] {
	return [
		asset.assetClassName,
		asset.categoryName,
		asset.primaryBrandName,
		asset.rarityCode,
	].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function RiseopediaAssetCard({ asset }: { asset: RiseopediaAssetDoc }): JSX.Element {
	const metaParts = assetMetaParts(asset);
	const media = asset.iconMedia ?? asset.detailMedia;

	return (
		<Link
			className="public-collection-card riseopedia-result-card"
			href={`/riseopedia/assets/${asset.slug}`}
		>
			<span className="public-collection-card__icon riseopedia-result-card__icon" aria-hidden>
				{media ? (
					<img
						className="riseopedia-result-card__image"
						src={media.url}
						alt=""
						width={media.width ?? undefined}
						height={media.height ?? undefined}
						loading="lazy"
					/>
				) : (
					<Box className="riseopedia-result-card__fallback-icon" />
				)}
			</span>

			<span className="public-collection-card__body">
				<span className="public-collection-card__meta">
					<span className="public-collection-card__meta-item">
						{metaParts.length > 0 ? metaParts.join(" / ") : "Asset"}
					</span>
				</span>
				<span className="public-collection-card__title">{asset.name}</span>
				{asset.summary ? (
					<span className="public-collection-card__summary">{asset.summary}</span>
				) : asset.description ? (
					<span className="public-collection-card__summary">{asset.description}</span>
				) : null}
			</span>

			<ArrowRight className="public-collection-card__arrow" aria-hidden />
		</Link>
	);
}

export default function RiseopediaAssetBrowser({
	result,
	filters,
	sections,
	assetClasses,
}: RiseopediaAssetBrowserProps): JSX.Element {
	const hasActiveFilters = Boolean(
		filters.search || filters.section || filters.assetClassCode,
	);

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
								<span>Assets</span>
							</nav>
							<div className="public-collection-hero__eyebrow">Game item index</div>
							<h1 className="public-collection-hero__title">Assets</h1>
						</div>
					</div>

					<div className="public-collection-hero__actions">
						<StatusPill tone="default" size="md">
							{formatNumber(result.totalDocs)} matching assets
						</StatusPill>
						<ButtonLink href="/riseopedia/recipes" variant="neutral">
							Browse recipes
						</ButtonLink>
					</div>
				</section>

				<section className="public-collection-panel">
					<RiseopediaFilterBar
						action="/riseopedia/assets"
						search={filters.search}
						section={filters.section}
						sectionOptions={sectionOptions(sections)}
						pageSize={result.pageSize}
						assetClass={filters.assetClassCode}
						assetClassOptions={assetClassOptions(assetClasses)}
					/>

					{result.rows.length > 0 ? (
						<>
							<div className="public-collection-grid riseopedia-result-grid">
								{result.rows.map((asset) => (
									<RiseopediaAssetCard asset={asset} key={asset.id} />
								))}
							</div>

							<RiseopediaPager
								basePath="/riseopedia/assets"
								params={[
									{ name: "q", value: filters.search },
									{ name: "section", value: filters.section },
									{ name: "class", value: filters.assetClassCode },
								]}
								page={result.page}
								pageSize={result.pageSize}
								totalDocs={result.totalDocs}
								totalPages={result.totalPages}
							/>
						</>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveFilters ? "No matching assets found." : "No public assets found."}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveFilters
									? "Try a broader search or clear the filters."
									: "Assets will appear here when the Riseopedia public asset view has visible rows."}
							</p>
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
