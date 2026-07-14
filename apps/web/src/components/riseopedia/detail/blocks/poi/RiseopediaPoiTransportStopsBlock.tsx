//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiTransportStopsBlock.tsx             ////
//// Language: TSX                                                                                               ////
//// Renders ordered transport stops with standardized icons and canonical town links.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import {
	RiseopediaDetailNumberBadge,
	RiseopediaDetailTable,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import IconRender from "@/components/ui/IconRender";
import type { RiseopediaPoiTransportStopRow } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaPoiTransportStopsBlockProps = {
	rows: RiseopediaPoiTransportStopRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

export default function RiseopediaPoiTransportStopsBlock({
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiTransportStopsBlockProps): JSX.Element | null {
	const visibleRows = [...rows].sort((left, right) => {
		if (left.pointOrder !== right.pointOrder) {
			return left.pointOrder - right.pointOrder;
		}

		return left.routePointId.localeCompare(right.routePointId);
	});

	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<RiseopediaDetailTable
			className="riseopedia-poi-numbered-list"
			variant="numbered_entity_rows"
		>
			<ul className="riseopedia-poi-numbered-list__rows">
				{visibleRows.map((row) => {
					const href = buildRiseopediaEntityHref({
						entityTypeCode: row.locationEntitySlug ? "location" : null,
						entitySlug: row.locationEntitySlug,
						wikiCode,
						releaseFilters,
					});
					const iconHref = buildRiseopediaMediaHref(
						row.locationIconMediaFileId,
						wikiCode,
					);

					return (
						<li className="riseopedia-poi-numbered-list__row" key={row.routePointId}>
							<RiseopediaDetailNumberBadge label={`Stop ${row.pointOrder}`}>
								{row.pointOrder}
							</RiseopediaDetailNumberBadge>
							<span className="riseopedia-poi-numbered-list__icon" aria-hidden="true">
								<IconRender
									className="riseopedia-poi-list-icon"
									fallback={{
										lucideName: row.locationEntityId ? "MapPin" : "TrainFront",
									}}
									iconKey={
										iconHref
											? {
													label: row.locationEntityName ?? row.stopName,
													source: "media",
													iconMedia: iconHref,
												}
											: null
									}
									size={24}
								/>
							</span>
							<div className="riseopedia-poi-numbered-list__copy">
								{href ? (
									<Link className="riseopedia-poi-numbered-list__link" href={href}>
										{row.stopName}
									</Link>
								) : (
									<span className="riseopedia-poi-numbered-list__name">
										{row.stopName}
									</span>
								)}
								<span className="riseopedia-poi-numbered-list__meta">
									{row.locationEntityId ? "Town stop" : "Route stop"}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
		</RiseopediaDetailTable>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
