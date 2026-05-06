//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicSeriesPage.tsx                                                    ////
//// Language: TSX                                                                                               ////
//// Public series landing page that lists readable published episodes for one DB-backed series.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import IconRender from "@/components/ui/IconRender";
import type { PublicSeriesEpisode, PublicSeriesResult } from "@/lib/data/public-series";

function formatDate(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function formatPartLabel(partNo: number | null): string | null {
	if (typeof partNo !== "number" || !Number.isFinite(partNo)) {
		return null;
	}

	return `Part ${partNo}`;
}

function episodeMeta(episode: PublicSeriesEpisode): string {
	return [
		formatPartLabel(episode.partNo),
		episode.contentKindLabel,
		formatDate(episode.publishedAt),
	]
		.filter((part): part is string => typeof part === "string" && part.length > 0)
		.join(" / ");
}

function PublicSeriesEpisodeCard({
	episode,
}: {
	episode: PublicSeriesEpisode;
}): JSX.Element {
	return (
		<article className="public-series-episode-card">
			<div className="public-series-episode-card__header">
				{episode.iconKey ? (
					<div className="public-series-episode-card__icon">
						<IconRender
							iconKey={episode.iconKey}
							iconColor={episode.iconColor}
							mediaRouteScope="app"
							size={20}
							title={episode.title}
						/>
					</div>
				) : null}
				<p className="public-series-episode-card__meta">
					{episodeMeta(episode)}
				</p>
			</div>

			<h2 className="public-series-episode-card__title">
				<Link href={episode.href}>{episode.title}</Link>
			</h2>

			{episode.summary ? (
				<p className="public-series-episode-card__summary">
					{episode.summary}
				</p>
			) : null}

			<p className="public-series-episode-card__collection">
				{episode.categoryTitle} / {episode.subcategoryTitle}
			</p>
		</article>
	);
}

function PublicSeriesEmptyState(): JSX.Element {
	return (
		<div className="public-empty-state">
			<h2 className="public-empty-state__title">No published episodes yet.</h2>
			<p className="public-empty-state__message">
				Episodes will appear here when they are published and visible to your role.
			</p>
		</div>
	);
}

export default function PublicSeriesPage({
	series,
}: {
	series: PublicSeriesResult;
}): JSX.Element {
	const episodeCount = series.episodes.length;
	const episodeCountLabel = episodeCount === 1 ? "1 episode" : `${episodeCount} episodes`;

	return (
		<section className="public-series-page-shell">
			<div className="card public-series-page">
				<section className="public-series-hero">
					<div className="public-series-hero__main">
						<div className="public-series-hero__icon">
							{series.series.iconKey ? (
								<IconRender
									iconKey={series.series.iconKey}
									iconColor={series.series.iconColor}
									mediaRouteScope="app"
									size={24}
									title={series.series.title}
								/>
							) : (
								<BookOpen className="public-series-hero__icon-glyph" aria-hidden />
							)}
						</div>

						<div>
							<p className="public-series-hero__eyebrow">
								Series / {series.series.categoryTitle}
							</p>
							<h1 className="public-series-hero__title">{series.series.title}</h1>
							<p className="public-series-hero__meta">{episodeCountLabel}</p>
						</div>
					</div>

					{series.series.description ? (
						<p className="public-series-hero__description">
							{series.series.description}
						</p>
					) : null}
				</section>

				<section className="public-series-episodes" aria-label="Series episodes">
					<div className="public-series-section-header">
						<p className="public-series-section-header__eyebrow">Episodes</p>
						<h2 className="public-series-section-header__title">
							Watch or read the series in order
						</h2>
					</div>

					{series.episodes.length > 0 ? (
						<div className="public-series-episode-grid">
							{series.episodes.map((episode) => (
								<PublicSeriesEpisodeCard key={episode.id} episode={episode} />
							))}
						</div>
					) : (
						<PublicSeriesEmptyState />
					)}
				</section>
			</div>
		</section>
	);
}
