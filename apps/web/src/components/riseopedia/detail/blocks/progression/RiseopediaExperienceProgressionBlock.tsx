//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/progression/RiseopediaExperienceProgressionBlock.tsx                         ////
//// Language: TSX                                                                                             ////
//// Renders parent and child Experience tracks through the neutral hierarchy visual family.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { CircleDot } from "lucide-react";

import {
	RiseopediaHierarchyTree,
	RiseopediaHierarchyTreeEmptyState,
	RiseopediaHierarchyTreeGroup,
	RiseopediaHierarchyTreeItem,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaExperienceProgressionRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaExperienceProgressionBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaExperienceProgressionRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type ExperienceProgressionRole = "parent" | "child";

function orderedRows(
	rows: RiseopediaExperienceProgressionRow[],
): RiseopediaExperienceProgressionRow[] {
	return [...rows].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		const nameCompare = left.relatedEntityName.localeCompare(
			right.relatedEntityName,
		);
		if (nameCompare !== 0) {
			return nameCompare;
		}

		return left.entityRelationshipId.localeCompare(right.entityRelationshipId);
	});
}

function relationshipMetadata(
	row: RiseopediaExperienceProgressionRow,
): string | null {
	const summary =
		row.progressionSummaryLabel && row.progressionSummaryValueText
			? `${row.progressionSummaryLabel} ${row.progressionSummaryValueText}`
			: null;
	const values = [summary, row.progressionSecondaryDisplayText].filter(
		(value): value is string => value !== null,
	);

	return values.length > 0 ? values.join(" · ") : null;
}

function ExperienceTrackIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaExperienceProgressionRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(
		row.relatedIconMediaFileId,
		wikiCode,
	);

	return (
		<span className="riseopedia-experience-progression__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-experience-progression__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Progression"
					size="inline"
					decorative
				/>
			) : (
				<CircleDot className="riseopedia-experience-progression__icon-fallback" />
			)}
		</span>
	);
}

function ExperienceTrackRow({
	row,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaExperienceProgressionRow;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: "mechanic",
		entitySlug: row.relatedEntitySlug,
		wikiCode,
		releaseFilters,
	});
	const metadata = relationshipMetadata(row);

	return (
		<RiseopediaHierarchyTreeItem className="riseopedia-experience-progression__node">
			<div
				className="riseopedia-hierarchy-tree__row riseopedia-experience-progression__row"
				data-progression-role={row.relationshipRoleCode}
			>
				<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
				<ExperienceTrackIcon row={row} wikiCode={wikiCode} />
				<div className="riseopedia-experience-progression__copy">
					{href ? (
						<Link className="riseopedia-experience-progression__link" href={href}>
							{row.relatedEntityName}
						</Link>
					) : (
						<span className="riseopedia-experience-progression__name">
							{row.relatedEntityName}
						</span>
					)}
					{metadata ? (
						<span className="riseopedia-experience-progression__meta">
							{metadata}
						</span>
					) : null}
				</div>
			</div>
		</RiseopediaHierarchyTreeItem>
	);
}

function TrackGroup({
	role,
	rows,
	wikiCode,
	releaseFilters,
}: {
	role: ExperienceProgressionRole;
	rows: RiseopediaExperienceProgressionRow[];
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	return (
		<RiseopediaHierarchyTreeGroup
			className={`riseopedia-experience-progression__group riseopedia-experience-progression__group--${role}`}
			label={role === "parent" ? "Parent Track" : "Child Tracks"}
			meta={rows.length > 1 ? rows.length : undefined}
		>
			<RiseopediaHierarchyTree
				className="riseopedia-experience-progression__list"
				label={role === "parent" ? "Parent Track" : "Child Tracks"}
				rootConnectors
				variant="neutral"
			>
				{rows.map((row) => (
					<ExperienceTrackRow
						key={row.entityRelationshipId}
						row={row}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				))}
			</RiseopediaHierarchyTree>
		</RiseopediaHierarchyTreeGroup>
	);
}

export default function RiseopediaExperienceProgressionBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaExperienceProgressionBlockProps): JSX.Element | null {
	const ordered = orderedRows(rows);
	const parentRows = ordered.filter(
		(row) => row.relationshipRoleCode === "parent",
	);
	const childRows = ordered.filter(
		(row) => row.relationshipRoleCode === "child",
	);
	const hasRows = parentRows.length > 0 || childRows.length > 0;

	if (!hasRows && block.emptyBehaviorCode !== "show_empty_state") {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-experience-progression">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			{hasRows ? (
				<div className="riseopedia-experience-progression__groups">
					<TrackGroup
						role="parent"
						rows={parentRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
					<TrackGroup
						role="child"
						rows={childRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				</div>
			) : (
				<RiseopediaHierarchyTreeEmptyState message="No progression tracks available." />
			)}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
