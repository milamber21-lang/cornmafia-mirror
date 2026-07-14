//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/quest/RiseopediaQuestFlowBlock.tsx                                    ////
//// Language: TSX                                                                                             ////
//// Renders DB-sectioned Quest relationships through the neutral hierarchy visual family.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import { useState, type JSX } from "react";
import Link from "next/link";

import IconRender from "@/components/ui/IconRender";
import {
	RiseopediaHierarchyTree,
	RiseopediaHierarchyTreeEmptyState,
	RiseopediaHierarchyTreeGroup,
	RiseopediaHierarchyTreeItem,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";

import type {
	RiseopediaBodyBlock,
	RiseopediaQuestFlowRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaQuestFlowBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaQuestFlowRow[];
	selectedEntityVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type QuestFlowGroup = {
	sectionCode: string;
	sectionLabel: string;
	sectionSortOrder: number;
	emptyLabel: string | null;
	initialVisibleRows: number | null;
	rows: RiseopediaQuestFlowRow[];
};

function rowsForSelectedVariant(args: {
	rows: RiseopediaQuestFlowRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaQuestFlowRow[] {
	if (!args.selectedEntityVariantId) {
		return args.rows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	const unscopedRows = args.rows.filter((row) => row.entityVariantId === null);
	const unscopedEmptySections = unscopedRows.filter(
		(row) => row.entityRelationshipId === null,
	);

	return exactRows.length > 0
		? [...exactRows, ...unscopedEmptySections]
		: unscopedRows;
}

function groupRows(rows: RiseopediaQuestFlowRow[]): QuestFlowGroup[] {
	const groups = new Map<string, QuestFlowGroup>();

	for (const row of rows) {
		const existing = groups.get(row.flowSectionCode);
		if (existing) {
			if (row.entityRelationshipId !== null) {
				existing.rows.push(row);
			}
			continue;
		}

		groups.set(row.flowSectionCode, {
			sectionCode: row.flowSectionCode,
			sectionLabel: row.flowSectionLabel,
			sectionSortOrder: row.sectionSortOrder,
			emptyLabel: row.flowSectionEmptyLabel,
			initialVisibleRows: row.initialVisibleRows,
			rows: row.entityRelationshipId === null ? [] : [row],
		});
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			rows: [...group.rows].sort((left, right) => {
				if (left.sortOrder !== right.sortOrder) {
					return left.sortOrder - right.sortOrder;
				}

				const nameCompare = (left.targetEntityName ?? "").localeCompare(
					right.targetEntityName ?? "",
				);
				return nameCompare !== 0
					? nameCompare
					: (left.entityRelationshipId ?? "").localeCompare(
							right.entityRelationshipId ?? "",
						);
			}),
		}))
		.sort((left, right) => {
			if (left.sectionSortOrder !== right.sectionSortOrder) {
				return left.sectionSortOrder - right.sectionSortOrder;
			}

			return left.sectionLabel.localeCompare(right.sectionLabel);
		});
}

function fallbackIconKey(row: RiseopediaQuestFlowRow): {
	key: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
} {
	return {
		key: row.fallbackIconKey,
		source: row.fallbackIconSourceCode === "media" ? "media" : "lucide",
		lucideName: row.fallbackIconLucideName,
	};
}

function QuestFlowIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaQuestFlowRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.targetIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-quest-flow__icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-quest-flow__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Quest flow"
					size="inline"
					decorative
				/>
			) : (
				<IconRender
					className="riseopedia-quest-flow__icon-fallback"
					fallback={{ lucideName: "CircleDot" }}
					iconKey={fallbackIconKey(row)}
					size={16}
				/>
			)}
		</span>
	);
}

function QuestFlowGroupBlock({
	group,
	wikiCode,
	releaseFilters,
}: {
	group: QuestFlowGroup;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const [expanded, setExpanded] = useState(false);
	const initialVisibleRows = group.initialVisibleRows;
	const limited =
		initialVisibleRows !== null &&
		initialVisibleRows > 0 &&
		group.rows.length > initialVisibleRows;
	const visibleRows =
		limited && !expanded ? group.rows.slice(0, initialVisibleRows) : group.rows;
	const hiddenCount = group.rows.length - visibleRows.length;

	return (
		<RiseopediaHierarchyTreeGroup
			className={`riseopedia-quest-flow__group riseopedia-quest-flow__group--${group.sectionCode}`}
			label={group.sectionLabel}
			meta={group.rows.length > 1 ? group.rows.length : undefined}
		>
			{group.rows.length > 0 ? (
				<>
					<RiseopediaHierarchyTree
						className="riseopedia-quest-flow__list"
						label={group.sectionLabel}
						rootConnectors
						variant="neutral"
					>
						{visibleRows.map((row) => {
							const href = buildRiseopediaEntityHref({
								entityTypeCode: row.targetEntityTypeCode,
								entitySlug: row.targetEntitySlug,
								targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
								wikiCode,
								releaseFilters,
							});

							return (
								<RiseopediaHierarchyTreeItem
									className="riseopedia-quest-flow__node"
									key={
										row.entityRelationshipId ?? `${group.sectionCode}:${row.sortOrder}`
									}
								>
									<div
										className="riseopedia-hierarchy-tree__row riseopedia-quest-flow__tree-row"
										data-resolution-status={row.resolutionStatusCode}
									>
										<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
										<QuestFlowIcon row={row} wikiCode={wikiCode} />
										{href ? (
											<Link className="riseopedia-quest-flow__link" href={href}>
												{row.targetEntityName ?? "—"}
											</Link>
										) : (
											<span className="riseopedia-quest-flow__name">
												{row.targetEntityName ?? "—"}
											</span>
										)}
									</div>
								</RiseopediaHierarchyTreeItem>
							);
						})}
					</RiseopediaHierarchyTree>
					{limited ? (
						<button
							className="riseopedia-quest-flow__toggle"
							onClick={() => setExpanded((value) => !value)}
							type="button"
						>
							{expanded ? "Show less" : `Show ${hiddenCount} more`}
						</button>
					) : null}
				</>
			) : (
				<p className="riseopedia-quest-flow__empty">
					{group.emptyLabel ?? "No rows available."}
				</p>
			)}
		</RiseopediaHierarchyTreeGroup>
	);
}

export default function RiseopediaQuestFlowBlock({
	block,
	rows,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaQuestFlowBlockProps): JSX.Element | null {
	const selected = rowsForSelectedVariant({ rows, selectedEntityVariantId });
	const groups = groupRows(selected);
	const hasRelationshipRows = groups.some((group) => group.rows.length > 0);

	if (groups.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-quest-flow">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			{hasRelationshipRows ? (
				<div className="riseopedia-quest-flow__tree">
					{groups.map((group) => (
						<QuestFlowGroupBlock
							group={group}
							key={group.sectionCode}
							wikiCode={wikiCode}
							releaseFilters={releaseFilters}
						/>
					))}
				</div>
			) : (
				<RiseopediaHierarchyTreeEmptyState message="No quest flow available." />
			)}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
