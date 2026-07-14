//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/asset/RiseopediaAssetVariantsBlock.tsx                                  ////
//// Language: TSX                                                                                               ////
//// Renders channel-visible asset variants as an active parent/type/variant hierarchy.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { Layers3, Package } from "lucide-react";

import {
	RiseopediaHierarchyTree,
	RiseopediaHierarchyTreeChildren,
	RiseopediaHierarchyTreeItem,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaEntityDetailDoc,
	RiseopediaEntityMediaRef,
	RiseopediaEntityVariant,
	RiseopediaEntityVariantSelector,
	RiseopediaEntityVariantValue,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

const PREFERRED_VARIANT_GROUP_CODES = ["rarity", "tier"] as const;

type VariantGroupPresentation = {
	variantGroupCode: string;
	variantGroupName: string;
	variantGroupSortOrder: number;
};

type AssetVariantLeaf = {
	variant: RiseopediaEntityVariant;
	label: string;
	iconMedia: RiseopediaEntityMediaRef | null;
};

function orderedVariantValues(
	rows: RiseopediaEntityVariantValue[],
): RiseopediaEntityVariantValue[] {
	return [...rows].sort((left, right) => {
		if (left.variantGroupSortOrder !== right.variantGroupSortOrder) {
			return left.variantGroupSortOrder - right.variantGroupSortOrder;
		}

		if (left.variantValueSortOrder !== right.variantValueSortOrder) {
			return left.variantValueSortOrder - right.variantValueSortOrder;
		}

		return left.badgeLabel.localeCompare(right.badgeLabel);
	});
}

function variantValuesForVariant(args: {
	entityVariantId: string;
	variantValues: RiseopediaEntityVariantValue[];
}): RiseopediaEntityVariantValue[] {
	return orderedVariantValues(
		args.variantValues.filter(
			(row) => row.entityVariantId === args.entityVariantId,
		),
	);
}

function variantDisplayLabel(args: {
	variant: RiseopediaEntityVariant;
	variantValues: RiseopediaEntityVariantValue[];
}): string {
	const labels = variantValuesForVariant({
		entityVariantId: args.variant.entityVariantId,
		variantValues: args.variantValues,
	}).map((row) => row.badgeLabel);

	if (labels.length > 0) {
		return labels.join(" / ");
	}

	return (
		args.variant.variantDisplayName ??
		args.variant.variantName ??
		args.variant.variantKey.replaceAll("_", " ")
	);
}

function configuredVariantGroups(
	selectors: RiseopediaEntityVariantSelector[],
): VariantGroupPresentation[] {
	const uniqueByCode = new Map<string, VariantGroupPresentation>();

	for (const selector of [...selectors].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.variantGroupCode.localeCompare(right.variantGroupCode);
	})) {
		if (!uniqueByCode.has(selector.variantGroupCode)) {
			uniqueByCode.set(selector.variantGroupCode, {
				variantGroupCode: selector.variantGroupCode,
				variantGroupName: selector.variantGroupName ?? selector.selectorLabel,
				variantGroupSortOrder: selector.sortOrder,
			});
		}
	}

	return Array.from(uniqueByCode.values());
}

function availableVariantGroups(
	variantValues: RiseopediaEntityVariantValue[],
): VariantGroupPresentation[] {
	const rowsByGroupCode = new Map<string, RiseopediaEntityVariantValue[]>();

	for (const row of variantValues) {
		const rows = rowsByGroupCode.get(row.variantGroupCode) ?? [];
		rows.push(row);
		rowsByGroupCode.set(row.variantGroupCode, rows);
	}

	return Array.from(rowsByGroupCode.entries())
		.map(([variantGroupCode, rows]) => {
			const first = orderedVariantValues(rows)[0];
			if (!first) {
				return null;
			}

			return {
				variantGroupCode,
				variantGroupName:
					first.variantGroupName ?? variantGroupCode.replaceAll("_", " "),
				variantGroupSortOrder: first.variantGroupSortOrder,
			};
		})
		.filter((row): row is VariantGroupPresentation => row !== null)
		.sort((left, right) => {
			const leftPreference = PREFERRED_VARIANT_GROUP_CODES.indexOf(
				left.variantGroupCode as (typeof PREFERRED_VARIANT_GROUP_CODES)[number],
			);
			const rightPreference = PREFERRED_VARIANT_GROUP_CODES.indexOf(
				right.variantGroupCode as (typeof PREFERRED_VARIANT_GROUP_CODES)[number],
			);
			const normalizedLeftPreference =
				leftPreference === -1 ? 1000 : leftPreference;
			const normalizedRightPreference =
				rightPreference === -1 ? 1000 : rightPreference;

			if (normalizedLeftPreference !== normalizedRightPreference) {
				return normalizedLeftPreference - normalizedRightPreference;
			}

			if (left.variantGroupSortOrder !== right.variantGroupSortOrder) {
				return left.variantGroupSortOrder - right.variantGroupSortOrder;
			}

			return left.variantGroupName.localeCompare(right.variantGroupName);
		});
}

function primaryVariantGroup(args: {
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
}): VariantGroupPresentation | null {
	const variantsById = new Set(
		args.variants.map((variant) => variant.entityVariantId),
	);
	const usableGroup = (group: VariantGroupPresentation): boolean => {
		const distinctValues = new Set(
			args.variantValues
				.filter(
					(row) =>
						row.variantGroupCode === group.variantGroupCode &&
						variantsById.has(row.entityVariantId),
				)
				.map((row) => row.variantValueCode),
		);

		return distinctValues.size > 1;
	};

	return (
		configuredVariantGroups(args.variantSelectors).find(usableGroup) ??
		availableVariantGroups(args.variantValues).find(usableGroup) ??
		null
	);
}

function variantValueForGroup(args: {
	entityVariantId: string;
	variantGroupCode: string;
	variantValues: RiseopediaEntityVariantValue[];
}): RiseopediaEntityVariantValue | null {
	return (
		variantValuesForVariant({
			entityVariantId: args.entityVariantId,
			variantValues: args.variantValues,
		}).find((row) => row.variantGroupCode === args.variantGroupCode) ?? null
	);
}

function orderedIconMediaCandidates(
	rows: RiseopediaEntityMediaRef[],
): RiseopediaEntityMediaRef[] {
	return [...rows].sort((left, right) => {
		if (left.selectedIconRank !== right.selectedIconRank) {
			return left.selectedIconRank - right.selectedIconRank;
		}

		if (left.primary !== right.primary) {
			return left.primary ? -1 : 1;
		}

		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.mediaFileId.localeCompare(right.mediaFileId);
	});
}

function iconMediaForVariant(args: {
	media: RiseopediaEntityMediaRef[];
	entityVariantId: string | null;
}): RiseopediaEntityMediaRef | null {
	const exactRows = args.entityVariantId
		? args.media.filter(
				(row) =>
					row.roleCode === "icon" && row.entityVariantId === args.entityVariantId,
			)
		: [];
	const sharedRows = args.media.filter(
		(row) => row.roleCode === "icon" && row.entityVariantId === null,
	);
	const candidates = exactRows.length > 0 ? exactRows : sharedRows;

	return orderedIconMediaCandidates(candidates)[0] ?? null;
}

function VariantMediaIcon({
	media,
	className,
}: {
	media: RiseopediaEntityMediaRef | null;
	className: string;
}): JSX.Element {
	return (
		<span className={className} aria-hidden="true">
			{media ? (
				<RiseopediaEntityVisual
					className={`${className}-visual riseopedia-entity-visual--embedded`}
					media={media}
					alt=""
					placeholderLabel="Variant"
					size="inline"
					decorative
				/>
			) : (
				<Package className={`${className}-fallback`} />
			)}
		</span>
	);
}

function AssetVariantLeafRow({
	leaf,
	currentEntity,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: {
	leaf: AssetVariantLeaf;
	currentEntity: RiseopediaEntityDetailDoc;
	selectedEntityVariantId: string | null;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const isCurrent = leaf.variant.entityVariantId === selectedEntityVariantId;
	const href = isCurrent
		? null
		: buildRiseopediaEntityHref({
				entityTypeCode: currentEntity.entityTypeCode,
				entitySlug: currentEntity.entitySlug,
				targetEntityVariantKey: leaf.variant.variantKey,
				wikiCode,
				releaseFilters,
			});

	return (
		<RiseopediaHierarchyTreeItem
			className="riseopedia-asset-variants__node riseopedia-asset-variants__node--variant"
			current={isCurrent}
		>
			<div className="riseopedia-hierarchy-tree__row riseopedia-asset-variants__row riseopedia-asset-variants__row--variant">
				<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
				<VariantMediaIcon
					className="riseopedia-asset-variants__icon"
					media={leaf.iconMedia}
				/>
				<div className="riseopedia-asset-variants__copy">
					{href ? (
						<Link className="riseopedia-asset-variants__link" href={href}>
							{leaf.label}
						</Link>
					) : (
						<span aria-current="page" className="riseopedia-asset-variants__name">
							{leaf.label}
						</span>
					)}
				</div>
			</div>
		</RiseopediaHierarchyTreeItem>
	);
}

export type RiseopediaAssetVariantsBlockProps = {
	block: RiseopediaBodyBlock;
	currentEntity: RiseopediaEntityDetailDoc;
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
	media: RiseopediaEntityMediaRef[];
	selectedEntityVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

export default function RiseopediaAssetVariantsBlock({
	block,
	currentEntity,
	variants,
	variantValues,
	variantSelectors,
	media,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaAssetVariantsBlockProps): JSX.Element | null {
	if (currentEntity.entityTypeCode !== "asset" || variants.length < 2) {
		return null;
	}

	const group = primaryVariantGroup({
		variants,
		variantValues,
		variantSelectors,
	});
	if (!group) {
		return null;
	}

	const groupedValueCounts = new Map<string, number>();
	for (const variant of variants) {
		const value = variantValueForGroup({
			entityVariantId: variant.entityVariantId,
			variantGroupCode: group.variantGroupCode,
			variantValues,
		});
		const valueCode = value?.variantValueCode ?? "__missing__";
		groupedValueCounts.set(
			valueCode,
			(groupedValueCounts.get(valueCode) ?? 0) + 1,
		);
	}

	const leaves: AssetVariantLeaf[] = variants.map((variant) => {
		const groupValue = variantValueForGroup({
			entityVariantId: variant.entityVariantId,
			variantGroupCode: group.variantGroupCode,
			variantValues,
		});
		const uniqueGroupValue =
			groupValue && groupedValueCounts.get(groupValue.variantValueCode) === 1;

		return {
			variant,
			label: uniqueGroupValue
				? groupValue.badgeLabel
				: variantDisplayLabel({ variant, variantValues }),
			iconMedia: iconMediaForVariant({
				media,
				entityVariantId: variant.entityVariantId,
			}),
		};
	});
	const selectedIconMedia = iconMediaForVariant({
		media,
		entityVariantId: selectedEntityVariantId,
	});

	return (
		<RiseopediaHierarchyTree
			className="riseopedia-asset-variants__tree"
			label={block.bodyBlockLabel}
			variant="active_navigation"
		>
			<RiseopediaHierarchyTreeItem
				className="riseopedia-asset-variants__node riseopedia-asset-variants__node--entity"
				hasChildren
			>
				<div className="riseopedia-hierarchy-tree__row riseopedia-asset-variants__row riseopedia-asset-variants__row--entity">
					<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
					<VariantMediaIcon
						className="riseopedia-asset-variants__icon"
						media={selectedIconMedia}
					/>
					<span className="riseopedia-asset-variants__entity-name">
						{currentEntity.entityName}
					</span>
				</div>

				<RiseopediaHierarchyTreeChildren className="riseopedia-asset-variants__children">
					<RiseopediaHierarchyTreeItem
						className="riseopedia-asset-variants__node riseopedia-asset-variants__node--group"
						hasChildren
					>
						<div className="riseopedia-hierarchy-tree__row riseopedia-asset-variants__row riseopedia-asset-variants__row--group">
							<span className="riseopedia-hierarchy-tree__marker" aria-hidden />
							<span
								className="riseopedia-asset-variants__group-icon"
								aria-hidden="true"
							>
								<Layers3 className="riseopedia-asset-variants__group-icon-svg" />
							</span>
							<span className="riseopedia-asset-variants__group-name">
								{group.variantGroupName}
							</span>
						</div>

						<RiseopediaHierarchyTreeChildren className="riseopedia-asset-variants__children">
							{leaves.map((leaf) => (
								<AssetVariantLeafRow
									currentEntity={currentEntity}
									key={leaf.variant.entityVariantId}
									leaf={leaf}
									releaseFilters={releaseFilters}
									selectedEntityVariantId={selectedEntityVariantId}
									wikiCode={wikiCode}
								/>
							))}
						</RiseopediaHierarchyTreeChildren>
					</RiseopediaHierarchyTreeItem>
				</RiseopediaHierarchyTreeChildren>
			</RiseopediaHierarchyTreeItem>
		</RiseopediaHierarchyTree>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
