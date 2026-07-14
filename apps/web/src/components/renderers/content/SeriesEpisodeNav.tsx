//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/SeriesEpisodeNav.tsx                                         ////
//// Language: TSX                                                                                                ////
//// Shared single-row public navigation for content rows that belong to a published series.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import Link from "next/link";
import type { JSX } from "react";

import type { ContentRenderSeries, ContentRenderSeriesEpisode } from "./types";

type SeriesEpisodeDirection = "previous" | "next";

type SeriesEpisodeNavProps = {
	series: ContentRenderSeries | null;
};

type SeriesEpisodeLinkProps = {
	direction: SeriesEpisodeDirection;
	episode: ContentRenderSeriesEpisode;
};

function formatPartLabel(partNo: number | null): string | null {
	if (typeof partNo !== "number" || !Number.isFinite(partNo)) {
		return null;
	}

	return `Part ${partNo}`;
}

function SeriesEpisodeLink({
	direction,
	episode,
}: SeriesEpisodeLinkProps): JSX.Element {
	const className = `public-series-nav__episode-link public-series-nav__episode-link--${direction}`;

	return (
		<Link href={episode.href} className={className}>
			{direction === "previous" ? (
				<span className="public-series-nav__episode-arrow" aria-hidden="true">
					&larr;
				</span>
			) : null}
			<span className="public-series-nav__episode-title">{episode.title}</span>
			{direction === "next" ? (
				<span className="public-series-nav__episode-arrow" aria-hidden="true">
					&rarr;
				</span>
			) : null}
		</Link>
	);
}

export default function SeriesEpisodeNav({
	series,
}: SeriesEpisodeNavProps): JSX.Element | null {
	if (!series) {
		return null;
	}

	const currentPartLabel = formatPartLabel(series.partNo);
	const seriesHref = `/series/${series.slug}`;

	return (
		<nav className="public-series-nav" aria-label="Series episode navigation">
			<div className="public-series-nav__slot public-series-nav__slot--previous">
				{series.previousEpisode ? (
					<SeriesEpisodeLink direction="previous" episode={series.previousEpisode} />
				) : null}
			</div>

			<div className="public-series-nav__current" aria-current="page">
				<Link href={seriesHref} className="public-series-nav__series-link">
					{series.title}
				</Link>
				{currentPartLabel ? (
					<>
						<span className="public-series-nav__separator" aria-hidden="true">
							-
						</span>
						<span className="public-series-nav__part">{currentPartLabel}</span>
					</>
				) : null}
			</div>

			<div className="public-series-nav__slot public-series-nav__slot--next">
				{series.nextEpisode ? (
					<SeriesEpisodeLink direction="next" episode={series.nextEpisode} />
				) : null}
			</div>
		</nav>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
