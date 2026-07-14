//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/location/RiseopediaLocationTreeBlock.tsx                                  ////
//// Language: TSX                                                                                             ////
//// Renders a bounded ancestor-current-descendant Location hierarchy through the active tree visual family.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import {
	RiseopediaHierarchyTree,
	RiseopediaHierarchyTreeChildren,
	RiseopediaHierarchyTreeItem,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaLocationTreeRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaLocationTreeRenderableRow = RiseopediaLocationTreeRow & {
	entityVariantId?: string | null;
};

export type RiseopediaLocationTreeBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaLocationTreeRenderableRow[];
	selectedEntityVariantId?: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type LocationTreeNode = {
	row: RiseopediaLocationTreeRenderableRow;
	children: LocationTreeNode[];
};

function rowsForSelectedVariant(args: {
	rows: RiseopediaLocationTreeRenderableRow[];
	selectedEntityVariantId: string | null | undefined;
}): RiseopediaLocationTreeRenderableRow[] {
	const fallbackRows = args.rows.filter(
		(row) => row.entityVariantId === null || row.entityVariantId === undefined,
	);

	if (!args.selectedEntityVariantId) {
		return fallbackRows;
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);

	return exactRows.length > 0 ? exactRows : fallbackRows;
}

function sortLocationRows(
	left: RiseopediaLocationTreeRenderableRow,
	right: RiseopediaLocationTreeRenderableRow,
): number {
	if (left.locationTreeRoleCode === "current") {
		return -1;
	}
	if (right.locationTreeRoleCode === "current") {
		return 1;
	}

	const nameCompare = left.locationEntityName.localeCompare(
		right.locationEntityName,
	);
	if (nameCompare !== 0) {
		return nameCompare;
	}

	return left.locationEntityId.localeCompare(right.locationEntityId);
}

function buildLocationTree(
	rows: RiseopediaLocationTreeRenderableRow[],
): LocationTreeNode[] {
	const nodesByLocationId = new Map<string, LocationTreeNode>();

	for (const row of rows) {
		if (!nodesByLocationId.has(row.locationEntityId)) {
			nodesByLocationId.set(row.locationEntityId, { row, children: [] });
		}
	}

	const rootNodes: LocationTreeNode[] = [];
	for (const node of nodesByLocationId.values()) {
		const parentNode = node.row.parentLocationEntityId
			? (nodesByLocationId.get(node.row.parentLocationEntityId) ?? null)
			: null;

		if (parentNode) {
			parentNode.children.push(node);
		} else {
			rootNodes.push(node);
		}
	}

	const sortNodes = (nodes: LocationTreeNode[]): void => {
		nodes.sort((left, right) => sortLocationRows(left.row, right.row));
		for (const node of nodes) {
			sortNodes(node.children);
		}
	};

	sortNodes(rootNodes);
	return rootNodes;
}

function LocationTreeIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaLocationTreeRenderableRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(
		row.locationIconMediaFileId,
		wikiCode,
	);

	return (
		<span className="riseopedia-location-tree__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-location-tree__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Location"
					size="inline"
					decorative
				/>
			) : (
				<MapPin className="riseopedia-location-tree__icon-fallback" />
			)}
		</span>
	);
}

function LocationTreeNodeRow({
	node,
	currentPageLocationEntityId,
	wikiCode,
	releaseFilters,
}: {
	node: LocationTreeNode;
	currentPageLocationEntityId: string | null;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const isCurrentPageLocation =
		currentPageLocationEntityId === node.row.locationEntityId;
	const isCurrentTreeLocation = node.row.locationTreeRoleCode === "current";
	const href = isCurrentPageLocation
		? null
		: buildRiseopediaEntityHref({
				entityTypeCode: "location",
				entitySlug: node.row.locationEntitySlug,
				wikiCode,
				releaseFilters,
			});
	const classLabel = node.row.locationEntityClassName;

	return (
		<RiseopediaHierarchyTreeItem
			className="riseopedia-location-tree__node"
			current={isCurrentTreeLocation}
			hasChildren={node.children.length > 0}
		>
			<div
				className="riseopedia-hierarchy-tree__row riseopedia-location-tree__row"
				data-location-tree-role={node.row.locationTreeRoleCode}
			>
				<span
					className="riseopedia-hierarchy-tree__marker riseopedia-location-tree__row-node"
					aria-hidden
				/>
				<LocationTreeIcon row={node.row} wikiCode={wikiCode} />
				<div className="riseopedia-location-tree__copy">
					{href ? (
						<Link className="riseopedia-location-tree__link" href={href}>
							{node.row.locationEntityName}
						</Link>
					) : (
						<span className="riseopedia-location-tree__name">
							{node.row.locationEntityName}
						</span>
					)}
					{classLabel ? (
						<span className="riseopedia-location-tree__meta">{classLabel}</span>
					) : null}
				</div>
			</div>

			{node.children.length > 0 ? (
				<RiseopediaHierarchyTreeChildren className="riseopedia-location-tree__list--nested">
					{node.children.map((child) => (
						<LocationTreeNodeRow
							currentPageLocationEntityId={currentPageLocationEntityId}
							key={child.row.locationEntityId}
							node={child}
							wikiCode={wikiCode}
							releaseFilters={releaseFilters}
						/>
					))}
				</RiseopediaHierarchyTreeChildren>
			) : null}
		</RiseopediaHierarchyTreeItem>
	);
}

export default function RiseopediaLocationTreeBlock({
	block,
	rows,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaLocationTreeBlockProps): JSX.Element | null {
	const visibleRows = rowsForSelectedVariant({
		rows,
		selectedEntityVariantId,
	});
	const tree = buildLocationTree(visibleRows);
	if (tree.length === 0) {
		return null;
	}

	const isPoiContext = block.entityTypeCode === "poi";
	const currentPageLocationEntityId = isPoiContext ? null : block.entityId;
	const sectionClassName = [
		"riseopedia-body-section",
		"riseopedia-location-tree",
		isPoiContext ? "riseopedia-location-tree--poi-context" : null,
	]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<section
			className={sectionClassName}
			data-location-tree-context={isPoiContext ? "poi" : "location"}
		>
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaHierarchyTree
				className="riseopedia-location-tree__list"
				label={block.bodyBlockLabel}
				rootConnectors={isPoiContext}
				variant="active_navigation"
			>
				{tree.map((node) => (
					<LocationTreeNodeRow
						currentPageLocationEntityId={currentPageLocationEntityId}
						key={node.row.locationEntityId}
						node={node}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				))}
			</RiseopediaHierarchyTree>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
