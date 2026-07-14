//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/progression/RiseopediaExperienceLevelUnlocksBlock.tsx                        ////
//// Language: TSX                                                                                             ////
//// Renders channel-published Quest availability through the neutral hierarchy visual family.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import {
	RiseopediaDetailNumberBadge,
	RiseopediaHierarchyTree,
	RiseopediaHierarchyTreeChildren,
	RiseopediaHierarchyTreeItem,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaExperienceLevelUnlockRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaExperienceLevelUnlocksBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaExperienceLevelUnlockRow[];
	selectedEntityVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type ExperienceLevelUnlockGroup = {
	requiredLevelValue: number;
	primaryRow: RiseopediaExperienceLevelUnlockRow;
	childRows: RiseopediaExperienceLevelUnlockRow[];
};

function rowsForSelectedVariant(args: {
	rows: RiseopediaExperienceLevelUnlockRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaExperienceLevelUnlockRow[] {
	const fallbackRows = args.rows.filter((row) => row.entityVariantId === null);

	if (!args.selectedEntityVariantId) {
		return fallbackRows.length > 0 ? fallbackRows : args.rows;
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);

	return exactRows.length > 0 ? exactRows : fallbackRows;
}

function orderedRows(
	rows: RiseopediaExperienceLevelUnlockRow[],
): RiseopediaExperienceLevelUnlockRow[] {
	return [...rows].sort((left, right) => {
		if (left.requiredLevelValue !== right.requiredLevelValue) {
			return left.requiredLevelValue - right.requiredLevelValue;
		}

		const nameCompare = left.questEntityName.localeCompare(right.questEntityName);
		if (nameCompare !== 0) {
			return nameCompare;
		}

		return left.entityRelationshipId.localeCompare(right.entityRelationshipId);
	});
}

function groupRows(
	rows: RiseopediaExperienceLevelUnlockRow[],
): ExperienceLevelUnlockGroup[] {
	const rowsByLevel = new Map<number, RiseopediaExperienceLevelUnlockRow[]>();

	for (const row of orderedRows(rows)) {
		const currentRows = rowsByLevel.get(row.requiredLevelValue) ?? [];
		currentRows.push(row);
		rowsByLevel.set(row.requiredLevelValue, currentRows);
	}

	return Array.from(rowsByLevel.entries()).map(
		([requiredLevelValue, levelRows]) => ({
			requiredLevelValue,
			primaryRow: levelRows[0],
			childRows: levelRows.slice(1),
		}),
	);
}

function QuestUnlockLabel({
	row,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaExperienceLevelUnlockRow;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.questEntityTypeCode,
		entitySlug: row.questEntitySlug,
		wikiCode,
		releaseFilters,
	});

	return href ? (
		<Link className="riseopedia-experience-level-unlocks__link" href={href}>
			{row.questEntityName}
		</Link>
	) : (
		<span className="riseopedia-experience-level-unlocks__name">
			{row.questEntityName}
		</span>
	);
}

export default function RiseopediaExperienceLevelUnlocksBlock({
	block,
	rows,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaExperienceLevelUnlocksBlockProps): JSX.Element | null {
	const levelGroups = groupRows(
		rowsForSelectedVariant({ rows, selectedEntityVariantId }),
	);

	if (levelGroups.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-experience-level-unlocks">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaHierarchyTree
				className="riseopedia-experience-level-unlocks__tree"
				label={block.bodyBlockLabel}
				rootConnectors
				variant="neutral"
			>
				{levelGroups.map((group) => (
					<RiseopediaHierarchyTreeItem
						className="riseopedia-experience-level-unlocks__group"
						hasChildren={group.childRows.length > 0}
						key={group.requiredLevelValue}
					>
						<div className="riseopedia-hierarchy-tree__row riseopedia-experience-level-unlocks__row riseopedia-experience-level-unlocks__row--level">
							<RiseopediaDetailNumberBadge
								className="riseopedia-experience-level-unlocks__level-badge"
								label={`Level ${group.requiredLevelValue}`}
							>
								{group.requiredLevelValue}
							</RiseopediaDetailNumberBadge>
							<QuestUnlockLabel
								row={group.primaryRow}
								wikiCode={wikiCode}
								releaseFilters={releaseFilters}
							/>
						</div>
						{group.childRows.length > 0 ? (
							<RiseopediaHierarchyTreeChildren className="riseopedia-experience-level-unlocks__children">
								{group.childRows.map((row) => (
									<RiseopediaHierarchyTreeItem
										className="riseopedia-experience-level-unlocks__child"
										key={row.entityRelationshipId}
									>
										<div className="riseopedia-hierarchy-tree__row riseopedia-experience-level-unlocks__child-row">
											<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
											<QuestUnlockLabel
												row={row}
												wikiCode={wikiCode}
												releaseFilters={releaseFilters}
											/>
										</div>
									</RiseopediaHierarchyTreeItem>
								))}
							</RiseopediaHierarchyTreeChildren>
						) : null}
					</RiseopediaHierarchyTreeItem>
				))}
			</RiseopediaHierarchyTree>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
