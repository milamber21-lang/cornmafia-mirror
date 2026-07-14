//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiRelatedQuestsBlock.tsx              ////
//// Language: TSX                                                                                               ////
//// Renders related Quest links with standardized icons and optional classification grouping.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import {
	RiseopediaDetailNumberBadge,
	RiseopediaDetailTable,
	RiseopediaHierarchyTreeGroup,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import IconRender from "@/components/ui/IconRender";
import type { RiseopediaPoiRelatedQuestRow } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaPoiRelatedQuestsBlockProps = {
	rows: RiseopediaPoiRelatedQuestRow[];
	selectedEntityVariantId: string | null;
	groupByClassification?: boolean;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type QuestClassificationGroup = {
	key: string;
	label: string;
	rows: RiseopediaPoiRelatedQuestRow[];
};

function rowsForVariant(args: {
	rows: RiseopediaPoiRelatedQuestRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiRelatedQuestRow[] {
	if (!args.selectedEntityVariantId) {
		return args.rows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	return exactRows.length > 0
		? exactRows
		: args.rows.filter((row) => row.entityVariantId === null);
}

function classificationParts(row: RiseopediaPoiRelatedQuestRow): string[] {
	const values = [
		row.questEntityClassName,
		row.questEntityCategoryName,
		row.questEntitySubcategoryName,
	].filter((value): value is string => Boolean(value?.trim()));
	const seen = new Set<string>();

	return values.filter((value) => {
		const normalized = value.trim().toLocaleLowerCase();
		if (seen.has(normalized)) {
			return false;
		}

		seen.add(normalized);
		return true;
	});
}

function classificationLabel(row: RiseopediaPoiRelatedQuestRow): string {
	const parts = classificationParts(row);
	return parts.length > 0
		? parts.join(" / ")
		: (row.questClassificationLabel ?? "Quests");
}

function classificationKey(row: RiseopediaPoiRelatedQuestRow): string {
	return [
		row.questEntityClassCode ?? "xna",
		row.questEntityCategoryCode ?? "xna",
		row.questEntitySubcategoryCode ?? "xna",
	].join(":");
}

function groupedRows(
	rows: RiseopediaPoiRelatedQuestRow[],
): QuestClassificationGroup[] {
	const groups = new Map<string, QuestClassificationGroup>();

	for (const row of rows) {
		const key = classificationKey(row);
		const existing = groups.get(key);
		if (existing) {
			existing.rows.push(row);
			continue;
		}

		groups.set(key, {
			key,
			label: classificationLabel(row),
			rows: [row],
		});
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			rows: [...group.rows].sort((left, right) => {
				if (left.sortOrder !== right.sortOrder) {
					return left.sortOrder - right.sortOrder;
				}

				return left.questEntityName.localeCompare(right.questEntityName);
			}),
		}))
		.sort((left, right) => left.label.localeCompare(right.label));
}

function QuestIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaPoiRelatedQuestRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.questIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-poi-numbered-list__icon" aria-hidden="true">
			<IconRender
				className="riseopedia-poi-list-icon"
				fallback={{ lucideName: "ScrollText" }}
				iconKey={
					iconHref
						? {
								label: row.questEntityName,
								source: "media",
								iconMedia: iconHref,
							}
						: null
				}
				size={24}
			/>
		</span>
	);
}

function QuestCopy({
	row,
	grouped,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaPoiRelatedQuestRow;
	grouped: boolean;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: "quest",
		entitySlug: row.questEntitySlug,
		wikiCode,
		releaseFilters,
	});
	const meta = grouped
		? row.questRoleLabel
		: [row.questRoleLabel, classificationLabel(row)].join(" · ");

	return (
		<div className="riseopedia-poi-numbered-list__copy">
			{href ? (
				<Link className="riseopedia-poi-numbered-list__link" href={href}>
					{row.questEntityName}
				</Link>
			) : (
				<span className="riseopedia-poi-numbered-list__name">
					{row.questEntityName}
				</span>
			)}
			<span className="riseopedia-poi-numbered-list__meta">{meta}</span>
		</div>
	);
}

export default function RiseopediaPoiRelatedQuestsBlock({
	rows,
	selectedEntityVariantId,
	groupByClassification = false,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiRelatedQuestsBlockProps): JSX.Element | null {
	const visibleRows = rowsForVariant({ rows, selectedEntityVariantId }).sort(
		(left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			return left.questEntityName.localeCompare(right.questEntityName);
		},
	);

	if (visibleRows.length === 0) {
		return null;
	}

	if (groupByClassification) {
		const groups = groupedRows(visibleRows);

		return (
			<RiseopediaDetailTable
				className="riseopedia-poi-grouped-list"
				variant="standard"
			>
				<div className="riseopedia-poi-grouped-list__groups">
					{groups.map((group) => (
						<RiseopediaHierarchyTreeGroup
							className="riseopedia-poi-grouped-list__group"
							key={group.key}
							label={group.label}
							meta={group.rows.length}
						>
							<ul className="riseopedia-poi-grouped-list__rows">
								{group.rows.map((row) => (
									<li
										className="riseopedia-poi-grouped-list__row"
										data-resolution-status={row.resolutionStatusCode}
										key={row.entityRelationshipId}
									>
										<QuestIcon row={row} wikiCode={wikiCode} />
										<QuestCopy
											grouped
											row={row}
											wikiCode={wikiCode}
											releaseFilters={releaseFilters}
										/>
									</li>
								))}
							</ul>
						</RiseopediaHierarchyTreeGroup>
					))}
				</div>
			</RiseopediaDetailTable>
		);
	}

	return (
		<RiseopediaDetailTable
			className="riseopedia-poi-numbered-list"
			variant="numbered_entity_rows"
		>
			<ul className="riseopedia-poi-numbered-list__rows">
				{visibleRows.map((row, index) => (
					<li
						className="riseopedia-poi-numbered-list__row"
						data-resolution-status={row.resolutionStatusCode}
						key={row.entityRelationshipId}
					>
						<RiseopediaDetailNumberBadge label={`Quest ${index + 1}`}>
							{index + 1}
						</RiseopediaDetailNumberBadge>
						<QuestIcon row={row} wikiCode={wikiCode} />
						<QuestCopy
							grouped={false}
							row={row}
							wikiCode={wikiCode}
							releaseFilters={releaseFilters}
						/>
					</li>
				))}
			</ul>
		</RiseopediaDetailTable>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
