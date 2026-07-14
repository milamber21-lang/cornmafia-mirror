//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/location/RiseopediaLocationPoiListBlock.tsx                               ////
//// Language: TSX                                                                                            ////
//// Renders recursively scoped POIs grouped by their canonical nearest-town location owner.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import type {
	RiseopediaBodyBlock,
	RiseopediaLocationPoiRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaLocationPoiListBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaLocationPoiRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type PoiGroup = {
	locationEntityId: string;
	locationEntitySlug: string;
	locationEntityName: string;
	locationDepth: number;
	rows: RiseopediaLocationPoiRow[];
};

const INITIAL_VISIBLE_GROUP_COUNT = 3;

function poiClassLabel(row: RiseopediaLocationPoiRow): string {
	return row.poiEntityClassName ?? row.poiEntityClassCode ?? "Point of Interest";
}

function groupPoiRows(rows: RiseopediaLocationPoiRow[]): PoiGroup[] {
	const groups = new Map<string, PoiGroup>();

	for (const row of rows) {
		const existing = groups.get(row.locationEntityId);
		if (existing) {
			existing.rows.push(row);
			continue;
		}

		groups.set(row.locationEntityId, {
			locationEntityId: row.locationEntityId,
			locationEntitySlug: row.locationEntitySlug,
			locationEntityName: row.locationEntityName,
			locationDepth: row.locationDepth,
			rows: [row],
		});
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			rows: [...group.rows].sort((left, right) => {
				const nameCompare = left.poiEntityName.localeCompare(right.poiEntityName);
				if (nameCompare !== 0) {
					return nameCompare;
				}

				return left.poiEntityId.localeCompare(right.poiEntityId);
			}),
		}))
		.sort((left, right) => {
			if (left.locationDepth !== right.locationDepth) {
				return left.locationDepth - right.locationDepth;
			}

			const nameCompare = left.locationEntityName.localeCompare(
				right.locationEntityName,
			);
			if (nameCompare !== 0) {
				return nameCompare;
			}

			return left.locationEntityId.localeCompare(right.locationEntityId);
		});
}

function LocationPoiIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaLocationPoiRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.poiIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-location-pois__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-location-pois__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Point of interest"
					size="inline"
					decorative
				/>
			) : (
				<MapPin className="riseopedia-location-pois__icon-fallback" />
			)}
		</span>
	);
}

function LocationPoiRowItem({
	row,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaLocationPoiRow;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const poiHref = buildRiseopediaEntityHref({
		entityTypeCode: "poi",
		entitySlug: row.poiEntitySlug,
		wikiCode,
		releaseFilters,
	});

	return (
		<li className="riseopedia-location-pois__row">
			<LocationPoiIcon row={row} wikiCode={wikiCode} />
			<div className="riseopedia-location-pois__copy">
				{poiHref ? (
					<Link className="riseopedia-location-pois__link" href={poiHref}>
						{row.poiEntityName}
					</Link>
				) : (
					<span className="riseopedia-location-pois__name">{row.poiEntityName}</span>
				)}
			</div>
			<span className="riseopedia-location-pois__type">{poiClassLabel(row)}</span>
		</li>
	);
}

export default function RiseopediaLocationPoiListBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaLocationPoiListBlockProps): JSX.Element | null {
	const [showAll, setShowAll] = useState(false);
	const groups = useMemo(() => groupPoiRows(rows), [rows]);
	if (groups.length === 0) {
		return null;
	}

	const visibleGroups = showAll
		? groups
		: groups.slice(0, INITIAL_VISIBLE_GROUP_COUNT);
	const hiddenPoiCount = groups
		.slice(INITIAL_VISIBLE_GROUP_COUNT)
		.reduce((total, group) => total + group.rows.length, 0);

	return (
		<section className="riseopedia-body-section riseopedia-location-pois">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<div className="riseopedia-location-pois__groups">
				{visibleGroups.map((group) => {
					const locationHref = buildRiseopediaEntityHref({
						entityTypeCode: "location",
						entitySlug: group.locationEntitySlug,
						wikiCode,
						releaseFilters,
					});

					return (
						<section
							className="riseopedia-location-pois__group"
							key={group.locationEntityId}
						>
							<h3 className="riseopedia-location-pois__group-title">
								{locationHref ? (
									<Link
										className="riseopedia-location-pois__location-link"
										href={locationHref}
									>
										{group.locationEntityName}
									</Link>
								) : (
									<span>{group.locationEntityName}</span>
								)}
								<span className="riseopedia-location-pois__count">
									{group.rows.length}
								</span>
							</h3>
							<ul className="riseopedia-location-pois__list">
								{group.rows.map((row) => (
									<LocationPoiRowItem
										key={row.poiEntityId}
										row={row}
										wikiCode={wikiCode}
										releaseFilters={releaseFilters}
									/>
								))}
							</ul>
						</section>
					);
				})}
			</div>
			{!showAll && hiddenPoiCount > 0 ? (
				<button
					className="riseopedia-location-pois__show-more"
					type="button"
					onClick={() => setShowAll(true)}
				>
					Show more ({hiddenPoiCount})
				</button>
			) : null}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
