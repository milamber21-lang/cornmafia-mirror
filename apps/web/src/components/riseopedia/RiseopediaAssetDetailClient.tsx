//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaAssetDetailClient.tsx                                 ////
//// Language: TSX                                                                                            ////
//// Client-side Riseopedia asset detail state selector for rarity and source variant display.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import { useMemo, useState, type JSX } from "react";

import RiseopediaBodyContent from "@/components/riseopedia/RiseopediaBodyContent";
import RiseopediaBottomBlocks from "@/components/riseopedia/RiseopediaBottomBlocks";
import RiseopediaDetailLayout from "@/components/riseopedia/RiseopediaDetailLayout";
import RiseopediaMediaFrame from "@/components/riseopedia/RiseopediaMediaFrame";
import RiseopediaOverviewTable, {
	type RiseopediaOverviewRow,
} from "@/components/riseopedia/RiseopediaOverviewTable";
import type {
	RiseopediaAssetDoc,
	RiseopediaAssetRarity,
	RiseopediaAssetRecipeRef,
	RiseopediaAssetStateProperty,
	RiseopediaAssetVariant,
	RiseopediaMediaRef,
} from "@/lib/data/riseopedia-assets";
import type {
	RiseopediaDisplayLayout,
	RiseopediaDisplayProperty,
} from "@/lib/data/riseopedia-display";
import type { RiseopediaEntitySectionRef } from "@/lib/data/riseopedia-sections";

export type RiseopediaAssetDetailClientProps = {
	doc: RiseopediaAssetDoc;
	sections: RiseopediaEntitySectionRef[];
	rarities: RiseopediaAssetRarity[];
	stateProperties: RiseopediaAssetStateProperty[];
	variants: RiseopediaAssetVariant[];
	usedInRecipes: RiseopediaAssetRecipeRef[];
	craftedByRecipes: RiseopediaAssetRecipeRef[];
	display: RiseopediaDisplayLayout;
};

type AssetStateSelection = {
	rarityCode: string;
	variantKey: string;
};

type VariantOption = {
	variantKey: string;
	variantLabel: string;
	sortOrder: number;
};

function displayValue(row: RiseopediaDisplayProperty): string {
	return row.unitCode ? `${row.displayValue} ${row.unitCode}` : row.displayValue;
}

function displayOverviewRows(
	rows: RiseopediaDisplayProperty[],
): RiseopediaOverviewRow[] {
	return rows.map((row) => ({
		key: `display-${row.displayProfilePropertyId}`,
		label: row.displayLabel,
		value: displayValue(row),
	}));
}

function firstRarityCode(
	rarities: RiseopediaAssetRarity[],
	doc: RiseopediaAssetDoc,
): string {
	const common = rarities.find((rarity) => rarity.rarityCode === "common");
	const firstRarity = common ?? rarities[0] ?? null;
	return firstRarity?.rarityCode ?? doc.rarityCode ?? "common";
}

function displayVariantLabel(variant: RiseopediaAssetVariant): string {
	if (variant.variantLabel && variant.variantLabel.trim().length > 0) {
		return variant.variantLabel;
	}

	if (variant.variantKey === "base") {
		return "Base";
	}

	return variant.variantKey
		.replace(/^color_/, "")
		.replace(/^body_/, "")
		.replaceAll("_", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function variantOptionsForRarity(
	variants: RiseopediaAssetVariant[],
	rarityCode: string,
): VariantOption[] {
	const options = new Map<string, VariantOption>();
	const matchingVariants = variants.filter(
		(variant) => variant.variantRarityCode === rarityCode,
	);
	const sourceVariants = matchingVariants.length > 0 ? matchingVariants : variants;

	for (const variant of sourceVariants) {
		const existing = options.get(variant.variantKey);
		const nextOption = {
			variantKey: variant.variantKey,
			variantLabel: displayVariantLabel(variant),
			sortOrder: variant.sortOrder,
		};

		if (!existing || nextOption.sortOrder < existing.sortOrder) {
			options.set(variant.variantKey, nextOption);
		}
	}

	if (options.size === 0) {
		options.set("base", {
			variantKey: "base",
			variantLabel: "Base",
			sortOrder: 0,
		});
	}

	return Array.from(options.values()).sort((left, right) => {
		if (left.variantKey === "base") {
			return -1;
		}

		if (right.variantKey === "base") {
			return 1;
		}

		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.variantLabel.localeCompare(right.variantLabel);
	});
}

function nextVariantKeyForRarity(args: {
	variants: RiseopediaAssetVariant[];
	rarityCode: string;
	preferredVariantKey: string;
}): string {
	const options = variantOptionsForRarity(args.variants, args.rarityCode);

	if (options.some((option) => option.variantKey === args.preferredVariantKey)) {
		return args.preferredVariantKey;
	}

	return (
		options.find((option) => option.variantKey === "base")?.variantKey ??
		options[0]?.variantKey ??
		"base"
	);
}

function statePropertyScore(
	row: RiseopediaAssetStateProperty,
	selection: AssetStateSelection,
): number {
	if (
		row.rarityCode === selection.rarityCode &&
		row.variantKey === selection.variantKey
	) {
		return 0;
	}

	if (row.rarityCode === selection.rarityCode && row.variantKey === "base") {
		return 1;
	}

	if (row.rarityCode === "common" && row.variantKey === selection.variantKey) {
		return 2;
	}

	if (row.rarityCode === "common" && row.variantKey === "base") {
		return 3;
	}

	if (row.rarityCode === selection.rarityCode) {
		return 4;
	}

	if (row.rarityCode === "common") {
		return 5;
	}

	return 6;
}

function toDisplayProperty(
	row: RiseopediaAssetStateProperty,
): RiseopediaDisplayProperty {
	return {
		entityTypeCode: "asset",
		entityKey: row.canonicalAssetKey,
		displayProfileId: row.displayProfileId,
		displayProfileCode: row.displayProfileCode,
		displayProfileName: row.displayProfileName,
		displayProfilePropertyId: row.displayProfilePropertyId,
		propertyCatalogId: row.propertyCatalogId,
		propertyCode: row.propertyCode,
		displayLabel: row.displayLabel,
		propertyName: row.propertyName,
		description: row.description,
		propertyOriginCode: row.propertyOriginCode,
		dataTypeCode: row.dataTypeCode,
		unitCode: row.unitCode,
		displaySlotCode: row.displaySlotCode,
		displaySlotName: row.displaySlotName,
		groupCode: row.groupCode,
		sortOrder: row.sortOrder,
		compact: row.compact,
		featured: row.featured,
		valueText: row.valueText,
		displayValue: row.displayValue,
	};
}

function selectedDisplayProperties(args: {
	stateProperties: RiseopediaAssetStateProperty[];
	selection: AssetStateSelection;
}): RiseopediaDisplayProperty[] {
	const rowsByProperty = new Map<string, RiseopediaAssetStateProperty>();

	for (const row of args.stateProperties) {
		const key = `${row.displaySlotCode}:${row.groupCode}:${row.propertyCode}`;
		const current = rowsByProperty.get(key);

		if (!current) {
			rowsByProperty.set(key, row);
			continue;
		}

		const nextScore = statePropertyScore(row, args.selection);
		const currentScore = statePropertyScore(current, args.selection);

		if (nextScore < currentScore) {
			rowsByProperty.set(key, row);
			continue;
		}

		if (nextScore === currentScore && row.sortOrder < current.sortOrder) {
			rowsByProperty.set(key, row);
		}
	}

	return Array.from(rowsByProperty.values())
		.sort((left, right) => {
			if (left.displaySlotCode !== right.displaySlotCode) {
				return left.displaySlotCode.localeCompare(right.displaySlotCode);
			}

			if (left.groupCode !== right.groupCode) {
				return left.groupCode.localeCompare(right.groupCode);
			}

			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			return left.displayLabel.localeCompare(right.displayLabel);
		})
		.map(toDisplayProperty);
}

function buildDisplayLayout(args: {
	baseDisplay: RiseopediaDisplayLayout;
	stateProperties: RiseopediaAssetStateProperty[];
	selection: AssetStateSelection;
}): RiseopediaDisplayLayout {
	const selectedProperties = selectedDisplayProperties({
		stateProperties: args.stateProperties,
		selection: args.selection,
	});

	if (selectedProperties.length === 0) {
		return args.baseDisplay;
	}

	const firstProperty = selectedProperties[0] ?? null;

	return {
		profile: {
			displayProfileId:
				firstProperty?.displayProfileId ?? args.baseDisplay.profile.displayProfileId,
			displayProfileCode:
				firstProperty?.displayProfileCode ??
				args.baseDisplay.profile.displayProfileCode,
			displayProfileName:
				firstProperty?.displayProfileName ??
				args.baseDisplay.profile.displayProfileName,
		},
		overviewRows: selectedProperties.filter(
			(row) => row.displaySlotCode === "overview_table",
		),
		bodyLead: selectedProperties.filter(
			(row) => row.displaySlotCode === "body_lead",
		),
		bodyMain: selectedProperties.filter(
			(row) => row.displaySlotCode === "body_main",
		),
		bodyNotes: selectedProperties.filter(
			(row) => row.displaySlotCode === "body_notes",
		),
		specRows: selectedProperties.filter(
			(row) => row.displaySlotCode === "spec_table",
		),
		requirementRows: selectedProperties.filter(
			(row) => row.displaySlotCode === "requirements",
		),
		relationshipBlocks: args.baseDisplay.relationshipBlocks,
		dependencyBlocks: args.baseDisplay.dependencyBlocks,
		changeLogBlocks: args.baseDisplay.changeLogBlocks,
	};
}

function mediaForSelection(args: {
	doc: RiseopediaAssetDoc;
	variants: RiseopediaAssetVariant[];
	selection: AssetStateSelection;
}): RiseopediaMediaRef | null {
	const exact = args.variants.find(
		(variant) =>
			variant.variantRarityCode === args.selection.rarityCode &&
			variant.variantKey === args.selection.variantKey,
	);
	const rarityBase = args.variants.find(
		(variant) =>
			variant.variantRarityCode === args.selection.rarityCode &&
			variant.variantKey === "base",
	);
	const commonVariant = args.variants.find(
		(variant) =>
			variant.variantRarityCode === "common" &&
			variant.variantKey === args.selection.variantKey,
	);
	const commonBase = args.variants.find(
		(variant) =>
			variant.variantRarityCode === "common" && variant.variantKey === "base",
	);
	const selectedVariant = exact ?? rarityBase ?? commonVariant ?? commonBase;

	return (
		selectedVariant?.detailMedia ??
		selectedVariant?.iconMedia ??
		args.doc.detailMedia ??
		args.doc.iconMedia
	);
}

function AssetStateControls({
	rarities,
	selection,
	onRarityChange,
}: {
	rarities: RiseopediaAssetRarity[];
	selection: AssetStateSelection;
	onRarityChange: (rarityCode: string) => void;
}): JSX.Element | null {
	if (rarities.length <= 1) {
		return null;
	}

	return (
		<div className="riseopedia-detail-header__selectors">
			<div
				className="riseopedia-detail-selector riseopedia-detail-selector--rarities"
				aria-label="Rarities"
			>
				<div className="riseopedia-detail-selector__options">
					{rarities.map((rarity) => (
						<button
							className={
								rarity.rarityCode === selection.rarityCode
									? "riseopedia-state-toggle riseopedia-state-toggle--rarity is-active"
									: "riseopedia-state-toggle riseopedia-state-toggle--rarity"
							}
							data-rarity={rarity.rarityCode}
							key={rarity.rarityCode}
							type="button"
							aria-pressed={rarity.rarityCode === selection.rarityCode}
							onClick={() => onRarityChange(rarity.rarityCode)}
						>
							{rarity.rarityName}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export default function RiseopediaAssetDetailClient({
	doc,
	sections,
	rarities,
	stateProperties,
	variants,
	usedInRecipes,
	craftedByRecipes,
	display,
}: RiseopediaAssetDetailClientProps): JSX.Element {
	const initialRarityCode = firstRarityCode(rarities, doc);
	const initialVariantKey = nextVariantKeyForRarity({
		variants,
		rarityCode: initialRarityCode,
		preferredVariantKey: "base",
	});
	const [selection, setSelection] = useState<AssetStateSelection>({
		rarityCode: initialRarityCode,
		variantKey: initialVariantKey,
	});
	const selectedDisplay = useMemo(
		() =>
			buildDisplayLayout({
				baseDisplay: display,
				stateProperties,
				selection,
			}),
		[display, stateProperties, selection],
	);
	const selectedMedia = useMemo(
		() => mediaForSelection({ doc, variants, selection }),
		[doc, selection, variants],
	);
	const overviewRows = displayOverviewRows(selectedDisplay.overviewRows);

	return (
		<RiseopediaDetailLayout
			breadcrumb={[
				{ label: "Riseopedia", href: "/riseopedia" },
				{ label: "Assets", href: "/riseopedia/assets" },
				{ label: doc.name },
			]}
			title={doc.name}
			summary={null}
			brandName={doc.primaryBrandName}
			sections={sections}
			selectedRarityCode={selection.rarityCode}
			controls={
				<AssetStateControls
					rarities={rarities}
					selection={selection}
					onRarityChange={(rarityCode) => {
						setSelection((current) => ({
							rarityCode,
							variantKey: nextVariantKeyForRarity({
								variants,
								rarityCode,
								preferredVariantKey: current.variantKey,
							}),
						}));
					}}
				/>
			}
			media={
				<RiseopediaMediaFrame
					media={selectedMedia}
					alt={doc.name}
					placeholderLabel="No asset media"
					rarityCode={selection.rarityCode}
				/>
			}
			overview={
				<RiseopediaOverviewTable
					rows={overviewRows}
					rarityCode={selection.rarityCode}
				/>
			}
			body={<RiseopediaBodyContent display={selectedDisplay} />}
			bottom={
				<RiseopediaBottomBlocks
					display={selectedDisplay}
					usedInRecipes={usedInRecipes}
					craftedByRecipes={craftedByRecipes}
				/>
			}
		/>
	);
}
