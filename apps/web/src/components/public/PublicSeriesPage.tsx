//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicSeriesPage.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Public series landing page with shared browse header, filters, sorting, result cards, and empty states.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX, ReactNode } from "react";
import * as React from "react";
import { BookOpen, SearchX } from "lucide-react";

import PublicTaxonomyIcon from "@/components/public/PublicTaxonomyIcon";
import {
	BrowseFilterPanel,
	BrowsePageHeader,
	BrowseResultCard,
	BrowseResultsPanel,
	DropdownMenuSingle,
	Input,
	StatusPill,
	SurfaceState,
} from "@/components/ui";
import type {
	PublicSeriesEpisode,
	PublicSeriesResult,
} from "@/lib/data/public-series";
import {
	compareDisplayText,
	formatDisplayDate,
	formatDisplayInteger,
} from "@/lib/helpers/display-format";

export type PublicSeriesSortCode =
	| "series"
	| "series-desc"
	| "newest"
	| "oldest"
	| "title";

type FilterOption = {
	value: string;
	label: string;
};

const ALL_FILTER_VALUE = "__all";

const SORT_OPTIONS: Array<{
	value: PublicSeriesSortCode;
	label: string;
}> = [
	{ value: "series", label: "Series order" },
	{ value: "series-desc", label: "Series order reversed" },
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "title", label: "Title A-Z" },
];

function formatPartLabel(partNo: number | null): string | null {
	if (typeof partNo !== "number" || !Number.isFinite(partNo)) {
		return null;
	}

	return `Part ${partNo}`;
}

function formatEpisodeCount(value: number): string {
	return `${formatDisplayInteger(value)} ${value === 1 ? "matching episode" : "matching episodes"}`;
}

function getEpisodeCollectionLabel(episode: PublicSeriesEpisode): string {
	return `${episode.categoryTitle} / ${episode.subcategoryTitle}`;
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function uniqueOptions(args: {
	episodes: PublicSeriesEpisode[];
	getValue: (episode: PublicSeriesEpisode) => string;
	getLabel: (episode: PublicSeriesEpisode) => string;
	allLabel: string;
}): FilterOption[] {
	const values = new Map<string, string>();

	for (const episode of args.episodes) {
		const value = args.getValue(episode).trim();
		const label = args.getLabel(episode).trim();
		if (value && label && !values.has(value)) {
			values.set(value, label);
		}
	}

	return [
		{ value: ALL_FILTER_VALUE, label: args.allLabel },
		...Array.from(values.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => compareDisplayText(left.label, right.label)),
	];
}

function comparePartNumbers(
	left: PublicSeriesEpisode,
	right: PublicSeriesEpisode,
	direction: "asc" | "desc",
): number {
	const leftPart = left.partNo ?? Number.POSITIVE_INFINITY;
	const rightPart = right.partNo ?? Number.POSITIVE_INFINITY;

	if (leftPart !== rightPart) {
		if (!Number.isFinite(leftPart)) {
			return 1;
		}
		if (!Number.isFinite(rightPart)) {
			return -1;
		}
		return direction === "asc" ? leftPart - rightPart : rightPart - leftPart;
	}

	return compareDisplayText(left.title, right.title);
}

function compareEpisodeDates(
	left: PublicSeriesEpisode,
	right: PublicSeriesEpisode,
	direction: "asc" | "desc",
): number {
	const leftDate = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
	const rightDate = right.publishedAt
		? new Date(right.publishedAt).getTime()
		: 0;

	if (leftDate !== rightDate) {
		return direction === "asc" ? leftDate - rightDate : rightDate - leftDate;
	}

	return compareDisplayText(left.title, right.title);
}

function compareEpisodes(
	left: PublicSeriesEpisode,
	right: PublicSeriesEpisode,
	sort: PublicSeriesSortCode,
): number {
	if (sort === "series-desc") {
		return comparePartNumbers(left, right, "desc");
	}
	if (sort === "newest") {
		return compareEpisodeDates(left, right, "desc");
	}
	if (sort === "oldest") {
		return compareEpisodeDates(left, right, "asc");
	}
	if (sort === "title") {
		return compareDisplayText(left.title, right.title);
	}

	return comparePartNumbers(left, right, "asc");
}

function SeriesCardMetadata({
	items,
}: {
	items: Array<ReactNode | null | undefined | false>;
}): JSX.Element {
	const visibleItems = items.filter(
		(item) => item !== null && item !== undefined && item !== false,
	);

	return (
		<span className="public-browse-card-meta">
			{visibleItems.map((item, index) => (
				<span className="public-browse-card-meta__item" key={index}>
					{index > 0 ? (
						<span className="public-browse-card-meta__separator" aria-hidden>
							|
						</span>
					) : null}
					{item}
				</span>
			))}
		</span>
	);
}

function PublicSeriesEpisodeCard({
	episode,
}: {
	episode: PublicSeriesEpisode;
}): JSX.Element {
	const partLabel = formatPartLabel(episode.partNo);
	const publishedLabel = formatDisplayDate(episode.publishedAt);

	return (
		<li className="public-series-episode-item">
			<BrowseResultCard
				href={episode.href}
				density="standard"
				className="public-series-browse-card"
				visual={
					<PublicTaxonomyIcon
						iconKey={episode.iconKey}
						iconColor={episode.iconColor}
						title={episode.title}
						size="lg"
						fallbackLucideName="FileText"
					/>
				}
				eyebrow={
					<SeriesCardMetadata
						items={[partLabel, episode.contentKindLabel, publishedLabel]}
					/>
				}
				title={episode.title}
				summary={episode.summary}
				details={
					<span className="public-series-browse-card__collection">
						{getEpisodeCollectionLabel(episode)}
					</span>
				}
			/>
		</li>
	);
}

export default function PublicSeriesPage({
	series,
}: {
	series: PublicSeriesResult;
}): JSX.Element {
	const [contentKindCode, setContentKindCode] = React.useState(ALL_FILTER_VALUE);
	const [templateId, setTemplateId] = React.useState(ALL_FILTER_VALUE);
	const [search, setSearch] = React.useState("");
	const [sort, setSort] = React.useState<PublicSeriesSortCode>("series");

	const contentKindOptions = React.useMemo(
		() =>
			uniqueOptions({
				episodes: series.episodes,
				getValue: (episode) => episode.contentKindCode,
				getLabel: (episode) => episode.contentKindLabel,
				allLabel: "All kinds",
			}),
		[series.episodes],
	);
	const templateOptions = React.useMemo(
		() =>
			uniqueOptions({
				episodes: series.episodes,
				getValue: (episode) => episode.templateId,
				getLabel: (episode) => episode.templateLabel,
				allLabel: "All templates",
			}),
		[series.episodes],
	);
	const normalizedSearch = normalizeSearch(search);
	const visibleEpisodes = React.useMemo(
		() =>
			series.episodes
				.filter(
					(episode) =>
						contentKindCode === ALL_FILTER_VALUE ||
						episode.contentKindCode === contentKindCode,
				)
				.filter(
					(episode) =>
						templateId === ALL_FILTER_VALUE || episode.templateId === templateId,
				)
				.filter((episode) => {
					if (!normalizedSearch) {
						return true;
					}

					return [
						episode.title,
						episode.summary ?? "",
						episode.contentKindLabel,
						episode.templateLabel,
					]
						.join(" ")
						.toLowerCase()
						.includes(normalizedSearch);
				})
				.sort((left, right) => compareEpisodes(left, right, sort)),
		[contentKindCode, normalizedSearch, series.episodes, sort, templateId],
	);
	const hasActiveFilters =
		contentKindCode !== ALL_FILTER_VALUE ||
		templateId !== ALL_FILTER_VALUE ||
		normalizedSearch.length > 0;

	return (
		<section className="public-series-page-shell">
			<div className="public-series-page">
				<BrowsePageHeader
					className="public-overview-header"
					breadcrumbs={[
						{
							label: series.series.categoryTitle,
							href: `/${series.series.categorySlug}`,
						},
						...(series.series.subcategorySlug && series.series.subcategoryTitle
							? [
									{
										label: series.series.subcategoryTitle,
										href: `/${series.series.categorySlug}/${series.series.subcategorySlug}`,
									},
								]
							: []),
						{ label: "Series" },
					]}
					title={series.series.title}
					description={series.series.description}
					actions={
						<StatusPill tone="muted">
							{formatEpisodeCount(visibleEpisodes.length)}
						</StatusPill>
					}
				/>

				<BrowseFilterPanel
					className="public-series-filter-panel"
					aria-label={`${series.series.title} episode filters`}
				>
					<div className="public-series-controls">
						<DropdownMenuSingle
							options={contentKindOptions}
							value={contentKindCode}
							onChange={(value) => setContentKindCode(value || ALL_FILTER_VALUE)}
							ariaLabel="Filter series by content kind"
							className="public-collection-control"
						/>
						<DropdownMenuSingle
							options={templateOptions}
							value={templateId}
							onChange={(value) => setTemplateId(value || ALL_FILTER_VALUE)}
							ariaLabel="Filter series by template"
							className="public-collection-control"
						/>
						<div className="public-browse-filter-search">
							<label className="public-collection-sr-label" htmlFor="series-search">
								Search episodes
							</label>
							<Input
								id="series-search"
								type="search"
								value={search}
								onChange={(event) => setSearch(event.currentTarget.value)}
								placeholder={`Search ${series.series.title.toLowerCase()}...`}
							/>
						</div>
						<DropdownMenuSingle
							options={SORT_OPTIONS}
							value={sort}
							onChange={(value) => {
								const option = SORT_OPTIONS.find((item) => item.value === value);
								setSort(option?.value ?? "series");
							}}
							ariaLabel="Sort series episodes"
							className="public-collection-control"
						/>
					</div>
				</BrowseFilterPanel>

				<BrowseResultsPanel
					className="public-series-results-panel"
					aria-label="Series episodes"
				>
					{visibleEpisodes.length > 0 ? (
						<ol className="public-series-episode-grid">
							{visibleEpisodes.map((episode) => (
								<PublicSeriesEpisodeCard key={episode.id} episode={episode} />
							))}
						</ol>
					) : series.episodes.length > 0 && hasActiveFilters ? (
						<SurfaceState
							kind="empty"
							align="center"
							icon={<SearchX aria-hidden />}
							title="No episodes match these filters"
							description="Try another search term, content kind, template, or sort order."
						/>
					) : (
						<SurfaceState
							kind="empty"
							align="center"
							icon={<BookOpen aria-hidden />}
							title="No published episodes yet"
							description="Episodes will appear here when they are published and visible to your role."
						/>
					)}
				</BrowseResultsPanel>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
