//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityDetailClient.tsx                                ////
//// Language: TSX                                                                                            ////
//// Client-side entity-first Riseopedia detail page with real variant selection and linked detail rows.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import { useMemo, useState, type JSX } from "react";
import Link from "next/link";

import RiseopediaDetailLayout, {
	type RiseopediaBreadcrumbItem,
} from "@/components/riseopedia/RiseopediaDetailLayout";
import RiseopediaEntityBodyContent from "@/components/riseopedia/RiseopediaEntityBodyContent";
import RiseopediaEntityFooterBlocks from "@/components/riseopedia/RiseopediaEntityFooterBlocks";
import RiseopediaEntityRecipeTree from "@/components/riseopedia/RiseopediaEntityRecipeTree";
import RiseopediaMediaFrame from "@/components/riseopedia/RiseopediaMediaFrame";
import RiseopediaOverviewTable, {
	type RiseopediaOverviewRow,
} from "@/components/riseopedia/RiseopediaOverviewTable";
import type {
	RiseopediaDetailElement,
	RiseopediaEntityDetail,
	RiseopediaEntityMediaRef,
	RiseopediaEntityVariant,
	RiseopediaEntityVariantSelector,
	RiseopediaEntityVariantValue,
} from "@/lib/data/riseopedia-entity-detail";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaInfoPath,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityDetailClientProps = {
	detail: RiseopediaEntityDetail;
	wikiCode?: OpediaWikiCode;
	wikiName?: string;
};

const FALLBACK_HEADER_VARIANT_GROUPS = ["rarity", "tier", "color", "edition"] as const;
const HEADER_VARIANT_GROUPS = new Set<string>(FALLBACK_HEADER_VARIANT_GROUPS);
const RARITY_SORT_ORDER = new Map<string, number>([
	["common", 10],
	["uncommon", 20],
	["rare", 30],
	["epic", 35],
	["legendary", 40],
	["mythic", 50],
]);

function safeToneCode(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : null;
}

function detailElementKey(row: RiseopediaDetailElement): string {
	return [
		row.displayProfileElementId ?? "fallback",
		row.entityPropertyValueId ?? "value",
		row.entityVariantId ?? "entity",
		row.sourceCode,
	].join(":");
}

function selectedInitialVariant(
	variants: RiseopediaEntityVariant[],
): RiseopediaEntityVariant | null {
	return variants[0] ?? null;
}

function parseFirstInteger(value: string | null | undefined): number | null {
	if (!value) {
		return null;
	}

	const match = value.match(/\d+/);
	if (!match) {
		return null;
	}

	const parsed = Number.parseInt(match[0], 10);
	return Number.isFinite(parsed) ? parsed : null;
}

function variantRankFromValue(value: RiseopediaEntityVariantValue | undefined): number {
	if (!value) {
		return 100000;
	}

	if (value.variantGroupCode === "tier") {
		return (
			value.variantValueNumber ??
			parseFirstInteger(value.variantValueCode) ??
			parseFirstInteger(value.variantValueName) ??
			value.variantValueSortOrder
		);
	}

	if (value.variantGroupCode === "rarity") {
		return (
			RARITY_SORT_ORDER.get(value.variantValueCode) ??
			RARITY_SORT_ORDER.get(value.visualToneCode) ??
			value.variantValueSortOrder
		);
	}

	return value.variantValueSortOrder;
}

function orderedVariantsForDisplay(args: {
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
}): RiseopediaEntityVariant[] {
	return [...args.variants].sort((left, right) => {
		const leftValues = variantValuesForVariant({
			variant: left,
			variantValues: args.variantValues,
		});
		const rightValues = variantValuesForVariant({
			variant: right,
			variantValues: args.variantValues,
		});

		const leftTierRank = variantRankFromValue(
			leftValues.find((row) => row.variantGroupCode === "tier"),
		);
		const rightTierRank = variantRankFromValue(
			rightValues.find((row) => row.variantGroupCode === "tier"),
		);
		if (leftTierRank !== rightTierRank) {
			return leftTierRank - rightTierRank;
		}

		const leftRarityRank = variantRankFromValue(
			leftValues.find((row) => row.variantGroupCode === "rarity"),
		);
		const rightRarityRank = variantRankFromValue(
			rightValues.find((row) => row.variantGroupCode === "rarity"),
		);
		if (leftRarityRank !== rightRarityRank) {
			return leftRarityRank - rightRarityRank;
		}

		if (left.defaultCandidateOrder !== right.defaultCandidateOrder) {
			return left.defaultCandidateOrder - right.defaultCandidateOrder;
		}

		return variantLabel({ variant: left, variantValues: args.variantValues }).localeCompare(
			variantLabel({ variant: right, variantValues: args.variantValues }),
		);
	});
}

function variantValuesForVariant(args: {
	variant: RiseopediaEntityVariant;
	variantValues: RiseopediaEntityVariantValue[];
}): RiseopediaEntityVariantValue[] {
	return args.variantValues
		.filter((row) => row.entityVariantId === args.variant.entityVariantId)
		.sort((left, right) => {
			if (left.variantGroupSortOrder !== right.variantGroupSortOrder) {
				return left.variantGroupSortOrder - right.variantGroupSortOrder;
			}

			if (left.variantValueSortOrder !== right.variantValueSortOrder) {
				return left.variantValueSortOrder - right.variantValueSortOrder;
			}

			return left.badgeLabel.localeCompare(right.badgeLabel);
		});
}

function selectedToneForVariant(args: {
	variant: RiseopediaEntityVariant | null;
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
}): string | null {
	if (!args.variant) {
		return null;
	}

	const values = variantValuesForVariant({
		variant: args.variant,
		variantValues: args.variantValues,
	});
	const selectorGroups = variantSelectorGroups({
		selectors: args.variantSelectors,
		variantValues: args.variantValues,
	});

	for (const group of selectorGroups) {
		const matchingValue = values.find(
			(row) => row.variantGroupCode === group.variantGroupCode,
		);
		const toneCode = safeToneCode(matchingValue?.visualToneCode);

		if (toneCode) {
			return toneCode;
		}
	}

	const rarity = values.find((row) => row.variantGroupCode === "rarity");
	const tier = values.find((row) => row.variantGroupCode === "tier");
	return safeToneCode(rarity?.visualToneCode ?? tier?.visualToneCode ?? null);
}

function variantLabel(args: {
	variant: RiseopediaEntityVariant;
	variantValues: RiseopediaEntityVariantValue[];
}): string {
	const badgeLabels = variantValuesForVariant(args)
		.filter((row) => HEADER_VARIANT_GROUPS.has(row.variantGroupCode))
		.map((row) => row.badgeLabel);

	if (badgeLabels.length > 0) {
		return badgeLabels.join(" / ");
	}

	return (
		args.variant.variantDisplayName ??
		args.variant.variantName ??
		args.variant.variantCode.replaceAll("_", " ")
	);
}

type VariantSelectorGroup = {
	variantGroupCode: string;
	selectorLabel: string;
	sortOrder: number;
	configured: boolean;
};

type VariantSelectorOption = {
	key: string;
	variantGroupCode: string;
	variantValueCode: string;
	label: string;
	toneCode: string | null;
	rank: number;
};

function fallbackVariantSelectorGroups(
	variantValues: RiseopediaEntityVariantValue[],
): VariantSelectorGroup[] {
	const groups = new Map<string, RiseopediaEntityVariantValue>();

	for (const groupCode of FALLBACK_HEADER_VARIANT_GROUPS) {
		const matchingValue = variantValues.find((row) => row.variantGroupCode === groupCode);
		if (matchingValue) {
			groups.set(groupCode, matchingValue);
		}
	}

	return Array.from(groups.entries()).map(([groupCode, value], index) => ({
		variantGroupCode: groupCode,
		selectorLabel: value.variantGroupName ?? groupCode.replaceAll("_", " "),
		sortOrder: value.variantGroupSortOrder || (index + 1) * 100,
		configured: false,
	}));
}

function variantSelectorGroups(args: {
	selectors: RiseopediaEntityVariantSelector[];
	variantValues: RiseopediaEntityVariantValue[];
}): VariantSelectorGroup[] {
	if (args.selectors.length === 0) {
		return fallbackVariantSelectorGroups(args.variantValues);
	}

	return [...args.selectors]
		.sort((left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			return left.selectorLabel.localeCompare(right.selectorLabel);
		})
		.map((selector) => ({
			variantGroupCode: selector.variantGroupCode,
			selectorLabel: selector.selectorLabel,
			sortOrder: selector.sortOrder,
			configured: true,
		}));
}

function variantValueForGroup(args: {
	variant: RiseopediaEntityVariant;
	variantValues: RiseopediaEntityVariantValue[];
	variantGroupCode: string;
}): RiseopediaEntityVariantValue | undefined {
	return args.variantValues.find(
		(row) =>
			row.entityVariantId === args.variant.entityVariantId &&
			row.variantGroupCode === args.variantGroupCode,
	);
}

function variantSelectorOptions(args: {
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	group: VariantSelectorGroup;
}): VariantSelectorOption[] {
	const options = new Map<string, VariantSelectorOption>();

	for (const variant of args.variants) {
		const value = variantValueForGroup({
			variant,
			variantValues: args.variantValues,
			variantGroupCode: args.group.variantGroupCode,
		});

		if (!value || options.has(value.variantValueCode)) {
			continue;
		}

		options.set(value.variantValueCode, {
			key: `${args.group.variantGroupCode}:${value.variantValueCode}`,
			variantGroupCode: args.group.variantGroupCode,
			variantValueCode: value.variantValueCode,
			label: value.badgeLabel,
			toneCode: safeToneCode(value.visualToneCode),
			rank: variantRankFromValue(value),
		});
	}

	return Array.from(options.values()).sort((left, right) => {
		if (left.rank !== right.rank) {
			return left.rank - right.rank;
		}

		return left.label.localeCompare(right.label);
	});
}

function selectedVariantValueCode(args: {
	selectedVariant: RiseopediaEntityVariant | null;
	variantValues: RiseopediaEntityVariantValue[];
	variantGroupCode: string;
}): string | null {
	if (!args.selectedVariant) {
		return null;
	}

	return (
		variantValueForGroup({
			variant: args.selectedVariant,
			variantValues: args.variantValues,
			variantGroupCode: args.variantGroupCode,
		})?.variantValueCode ?? null
	);
}

function variantMatchesSelectorOption(args: {
	variant: RiseopediaEntityVariant;
	variantValues: RiseopediaEntityVariantValue[];
	variantGroupCode: string;
	variantValueCode: string;
}): boolean {
	return (
		variantValueForGroup({
			variant: args.variant,
			variantValues: args.variantValues,
			variantGroupCode: args.variantGroupCode,
		})?.variantValueCode === args.variantValueCode
	);
}

function selectedVariantForSelectorOption(args: {
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	selectorGroups: VariantSelectorGroup[];
	selectedVariant: RiseopediaEntityVariant | null;
	variantGroupCode: string;
	variantValueCode: string;
}): RiseopediaEntityVariant | null {
	const selectedValues = new Map<string, string>();

	for (const group of args.selectorGroups) {
		const selectedValueCode = selectedVariantValueCode({
			selectedVariant: args.selectedVariant,
			variantValues: args.variantValues,
			variantGroupCode: group.variantGroupCode,
		});

		if (selectedValueCode) {
			selectedValues.set(group.variantGroupCode, selectedValueCode);
		}
	}

	selectedValues.set(args.variantGroupCode, args.variantValueCode);

	const exact = args.variants.find((variant) =>
		Array.from(selectedValues.entries()).every(([groupCode, valueCode]) =>
			variantMatchesSelectorOption({
				variant,
				variantValues: args.variantValues,
				variantGroupCode: groupCode,
				variantValueCode: valueCode,
			}),
		),
	);

	if (exact) {
		return exact;
	}

	return (
		args.variants.find((variant) =>
			variantMatchesSelectorOption({
				variant,
				variantValues: args.variantValues,
				variantGroupCode: args.variantGroupCode,
				variantValueCode: args.variantValueCode,
			}),
		) ?? null
	);
}

function matchesDisplaySlot(rowSlotCode: string, targetSlotCode: string): boolean {
	if (targetSlotCode === "overview") {
		return rowSlotCode === "overview" || rowSlotCode === "overview_table";
	}

	if (targetSlotCode === "body") {
		return [
			"body",
			"body_lead",
			"body_main",
			"body_notes",
			"spec_table",
			"requirements",
		].includes(rowSlotCode);
	}

	return rowSlotCode === targetSlotCode;
}

function elementVariantScore(
	row: RiseopediaDetailElement,
	selectedVariantId: string | null,
): number | null {
	if (selectedVariantId && row.entityVariantId === selectedVariantId) {
		return 0;
	}

	if (row.entityVariantId === null) {
		return 1;
	}

	return null;
}

function profileElementGroupKey(row: RiseopediaDetailElement): string {
	return [
		row.displayProfileElementId ?? "fallback",
		row.displaySlotCode,
		row.displayGroupCode ?? "group",
		row.sourceTypeCode,
		row.sourceCode,
	].join(":");
}

function selectedElementsForSlot(args: {
	rows: RiseopediaDetailElement[];
	selectedVariantId: string | null;
	displaySlotCode: string;
	preserveRepeatedValues?: boolean;
}): RiseopediaDetailElement[] {
	if (args.preserveRepeatedValues === true) {
		return selectedRepeatedElementsForSlot(args);
	}

	const selectedByKey = new Map<string, RiseopediaDetailElement>();

	for (const row of args.rows) {
		if (!matchesDisplaySlot(row.displaySlotCode, args.displaySlotCode)) {
			continue;
		}

		const score = elementVariantScore(row, args.selectedVariantId);
		if (score === null) {
			continue;
		}

		const key = profileElementGroupKey(row);
		const current = selectedByKey.get(key);

		if (!current) {
			selectedByKey.set(key, row);
			continue;
		}

		const currentScore = elementVariantScore(current, args.selectedVariantId);
		if (currentScore === null || score < currentScore) {
			selectedByKey.set(key, row);
			continue;
		}

		if (score === currentScore && row.sortOrder < current.sortOrder) {
			selectedByKey.set(key, row);
		}
	}

	return orderedDetailElements(Array.from(selectedByKey.values()));
}

function selectedRepeatedElementsForSlot(args: {
	rows: RiseopediaDetailElement[];
	selectedVariantId: string | null;
	displaySlotCode: string;
}): RiseopediaDetailElement[] {
	type GroupedRows = {
		score: number;
		rows: RiseopediaDetailElement[];
	};

	const selectedByKey = new Map<string, GroupedRows>();

	for (const row of args.rows) {
		if (!matchesDisplaySlot(row.displaySlotCode, args.displaySlotCode)) {
			continue;
		}

		const score = elementVariantScore(row, args.selectedVariantId);
		if (score === null) {
			continue;
		}

		const key = profileElementGroupKey(row);
		const current = selectedByKey.get(key);

		if (!current || score < current.score) {
			selectedByKey.set(key, { score, rows: [row] });
			continue;
		}

		if (score === current.score) {
			current.rows.push(row);
		}
	}

	return orderedDetailElements(
		Array.from(selectedByKey.values()).flatMap((group) => uniqueDetailElements(group.rows)),
	);
}

function orderedDetailElements(rows: RiseopediaDetailElement[]): RiseopediaDetailElement[] {
	return [...rows].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		const labelCompare = left.displayLabel.localeCompare(right.displayLabel);
		if (labelCompare !== 0) {
			return labelCompare;
		}

		const valueCompare = left.displayValue.localeCompare(right.displayValue);
		if (valueCompare !== 0) {
			return valueCompare;
		}

		return (left.entityPropertyValueId ?? "").localeCompare(
			right.entityPropertyValueId ?? "",
		);
	});
}

function uniqueDetailElements(rows: RiseopediaDetailElement[]): RiseopediaDetailElement[] {
	const byValue = new Map<string, RiseopediaDetailElement>();

	for (const row of rows) {
		const key = [
			row.linkedEntityId ?? "entity",
			row.linkedEntitySlug ?? "slug",
			row.displayValue,
		].join(":");

		if (!byValue.has(key)) {
			byValue.set(key, row);
		}
	}

	return Array.from(byValue.values());
}

function orderedMediaCandidates(rows: RiseopediaEntityMediaRef[]): RiseopediaEntityMediaRef[] {
	return [...rows].sort((left, right) => {
		if (left.selectedHeaderRank !== right.selectedHeaderRank) {
			return left.selectedHeaderRank - right.selectedHeaderRank;
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

function selectedMediaForVariant(args: {
	media: RiseopediaEntityMediaRef[];
	selectedVariantId: string | null;
}): RiseopediaEntityMediaRef | null {
	const exact = args.selectedVariantId
		? args.media.filter((row) => row.entityVariantId === args.selectedVariantId)
		: [];
	const shared = args.media.filter((row) => row.entityVariantId === null);
	const candidates = exact.length > 0
		? exact
		: shared.length > 0
			? shared
			: args.media;

	return orderedMediaCandidates(candidates)[0] ?? null;
}

function mediaByFileId(
	rows: RiseopediaEntityMediaRef[],
): Map<string, RiseopediaEntityMediaRef> {
	const byFileId = new Map<string, RiseopediaEntityMediaRef>();

	for (const row of rows) {
		byFileId.set(row.mediaFileId, row);
	}

	return byFileId;
}

function linkedValue(
	row: RiseopediaDetailElement,
	wikiCode: OpediaWikiCode | undefined,
): JSX.Element | string {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.linkedEntityTypeCode,
		entitySlug: row.linkedEntitySlug,
		wikiCode,
	});

	if (!href) {
		return row.displayValue;
	}

	return (
		<Link className="riseopedia-recipe-tree__asset-link" href={href}>
			{row.displayValue}
		</Link>
	);
}

function overviewRows(
	rows: RiseopediaDetailElement[],
	wikiCode: OpediaWikiCode | undefined,
): RiseopediaOverviewRow[] {
	const groups = new Map<string, RiseopediaDetailElement[]>();

	for (const row of rows) {
		const key = profileElementGroupKey(row);
		const current = groups.get(key);

		if (current) {
			current.push(row);
			continue;
		}

		groups.set(key, [row]);
	}

	return Array.from(groups.entries())
		.map(([key, groupRows]) => {
			const orderedRows = orderedDetailElements(uniqueDetailElements(groupRows));
			const firstRow = orderedRows[0] ?? groupRows[0];

			return {
				key,
				label: firstRow.displayLabel,
				value: overviewValue(orderedRows, wikiCode),
			};
		})
		.sort((left, right) => {
			const leftRow = groups.get(left.key)?.[0];
			const rightRow = groups.get(right.key)?.[0];

			if (leftRow && rightRow && leftRow.sortOrder !== rightRow.sortOrder) {
				return leftRow.sortOrder - rightRow.sortOrder;
			}

			return left.label.localeCompare(right.label);
		});
}

function splitOverviewDisplayValue(row: RiseopediaDetailElement): string[] {
	if (row.linkedEntityId) {
		return [];
	}

	return row.displayValue
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

function overviewValue(
	rows: RiseopediaDetailElement[],
	wikiCode: OpediaWikiCode | undefined,
): JSX.Element | string {
	if (rows.length === 0) {
		return "";
	}

	if (rows.length === 1) {
		const splitValues = splitOverviewDisplayValue(rows[0]);

		if (splitValues.length > 1) {
			return (
				<ul className="riseopedia-overview-table__value-list">
					{splitValues.map((value) => {
						const key = `${detailElementKey(rows[0])}:${value}`;

						return (
							<li className="riseopedia-overview-table__value-item" key={key}>
								{value}
							</li>
						);
					})}
				</ul>
			);
		}

		return linkedValue(rows[0], wikiCode);
	}

	return (
		<ul className="riseopedia-overview-table__value-list">
			{rows.map((row) => (
				<li className="riseopedia-overview-table__value-item" key={detailElementKey(row)}>
					{linkedValue(row, wikiCode)}
				</li>
			))}
		</ul>
	);
}

function normalizedBreadcrumbLabel(value: string): string {
	return value.trim().toLowerCase();
}

function pushBreadcrumbItem(
	items: RiseopediaBreadcrumbItem[],
	item: RiseopediaBreadcrumbItem,
): void {
	const previous = items[items.length - 1];
	if (previous && normalizedBreadcrumbLabel(previous.label) === normalizedBreadcrumbLabel(item.label)) {
		return;
	}

	items.push(item);
}

function classificationBreadcrumb(args: {
	detail: RiseopediaEntityDetail;
	wikiCode: OpediaWikiCode | undefined;
	wikiName: string;
}): RiseopediaBreadcrumbItem[] {
	const detail = args.detail;
	const doc = detail.doc;
	const items: RiseopediaBreadcrumbItem[] = [
		{ label: args.wikiName, href: buildRiseopediaInfoPath({ family: "browse", wikiCode: args.wikiCode }) },
	];

	if (doc.sectionName && doc.sectionSlug) {
		pushBreadcrumbItem(items, {
			label: doc.sectionName,
			href: buildRiseopediaInfoPath({ family: "sections", slug: doc.sectionSlug, wikiCode: args.wikiCode }),
		});
	}

	if (doc.entityClassName) {
		pushBreadcrumbItem(items, {
			label: doc.entityClassName,
			href: doc.entityTypeCode === "asset" && doc.entityClassCode
				? buildRiseopediaInfoPath({ family: "classes", slug: doc.entityClassCode, wikiCode: args.wikiCode })
				: undefined,
		});
	}

	if (doc.entityCategoryName) {
		pushBreadcrumbItem(items, {
			label: doc.entityCategoryName,
			href: doc.entityCategorySlug
				? buildRiseopediaInfoPath({ family: "categories", slug: doc.entityCategorySlug, wikiCode: args.wikiCode })
				: undefined,
		});
	}

	if (doc.entitySubcategoryName) {
		pushBreadcrumbItem(items, {
			label: doc.entitySubcategoryName,
			href: doc.entitySubcategorySlug
				? buildRiseopediaInfoPath({ family: "subcategories", slug: doc.entitySubcategorySlug, wikiCode: args.wikiCode })
				: undefined,
		});
	}

	return items;
}

function RiseopediaVariantControls({
	variants,
	variantValues,
	variantSelectors,
	selectedVariant,
	onSelectVariant,
}: {
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
	selectedVariant: RiseopediaEntityVariant | null;
	onSelectVariant: (variantId: string) => void;
}): JSX.Element | null {
	if (variants.length === 0) {
		return null;
	}

	const selectorGroups = variantSelectorGroups({
		selectors: variantSelectors,
		variantValues,
	});

	if (selectorGroups.length === 0) {
		return null;
	}

	return (
		<div className="riseopedia-detail-hero__selectors">
			{selectorGroups.map((group) => {
				const options = variantSelectorOptions({
					variants,
					variantValues,
					group,
				});

				if (options.length === 0) {
					return null;
				}

				const selectedValueCode = selectedVariantValueCode({
					selectedVariant,
					variantValues,
					variantGroupCode: group.variantGroupCode,
				});

				return (
					<div className="riseopedia-detail-selector" key={group.variantGroupCode}>
						<div
							className="riseopedia-detail-selector__options"
							role="group"
							aria-label={group.selectorLabel}
						>
							{options.map((option) => {
								const active = selectedValueCode === option.variantValueCode;

								return (
									<button
										className={
											active
												? "riseopedia-state-toggle riseopedia-state-toggle--rarity is-active"
												: "riseopedia-state-toggle riseopedia-state-toggle--rarity"
										}
										data-rarity={option.toneCode ?? undefined}
										key={option.key}
										type="button"
										onClick={() => {
											const nextVariant = selectedVariantForSelectorOption({
												variants,
												variantValues,
												selectorGroups,
												selectedVariant,
												variantGroupCode: option.variantGroupCode,
												variantValueCode: option.variantValueCode,
											});

											if (nextVariant) {
												onSelectVariant(nextVariant.entityVariantId);
											}
										}}
									>
										{option.label}
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}


export default function RiseopediaEntityDetailClient({
	detail,
	wikiCode = "riseopedia",
	wikiName = "Riseopedia",
}: RiseopediaEntityDetailClientProps): JSX.Element {
	const orderedVariants = useMemo(
		() =>
			orderedVariantsForDisplay({
				variants: detail.variants,
				variantValues: detail.variantValues,
			}),
		[detail.variantValues, detail.variants],
	);
	const initialVariant = useMemo(
		() => selectedInitialVariant(orderedVariants),
		[orderedVariants],
	);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		initialVariant?.entityVariantId ?? null,
	);
	const selectedVariant = useMemo(
		() =>
			orderedVariants.find(
				(variant) => variant.entityVariantId === selectedVariantId,
			) ?? initialVariant,
		[initialVariant, orderedVariants, selectedVariantId],
	);
	const effectiveVariantId = selectedVariant?.entityVariantId ?? null;
	const selectedTone = selectedToneForVariant({
		variant: selectedVariant,
		variantValues: detail.variantValues,
		variantSelectors: detail.variantSelectors,
	});
	const headerMedia = selectedMediaForVariant({
		media: detail.media,
		selectedVariantId: effectiveVariantId,
	});
	const bodyRows = selectedElementsForSlot({
		rows: detail.profileElements,
		selectedVariantId: effectiveVariantId,
		displaySlotCode: "body",
	});
	const selectedOverviewRows = selectedElementsForSlot({
		rows: detail.profileElements,
		selectedVariantId: effectiveVariantId,
		displaySlotCode: "overview",
		preserveRepeatedValues: true,
	});
	const mediaLookup = mediaByFileId(detail.media);

	return (
		<RiseopediaDetailLayout
			breadcrumb={classificationBreadcrumb({ detail, wikiCode, wikiName })}
			title={detail.doc.entityName}
			media={
				<RiseopediaMediaFrame
					media={headerMedia}
					alt={headerMedia?.altText ?? detail.doc.entityName}
					placeholderLabel="No entity media"
					rarityCode={selectedTone}
				/>
			}
			controls={
				<RiseopediaVariantControls
					variants={orderedVariants}
					variantValues={detail.variantValues}
					variantSelectors={detail.variantSelectors}
					selectedVariant={selectedVariant}
					onSelectVariant={setSelectedVariantId}
				/>
			}
			selectedRarityCode={selectedTone}
			overview={
				<RiseopediaOverviewTable
					rows={overviewRows(selectedOverviewRows, wikiCode)}
					rarityCode={selectedTone}
				/>
			}
			body={
				<>
					{detail.doc.entityTypeCode === "recipe" ? (
						<RiseopediaEntityRecipeTree
							requirements={detail.recipeRequirements}
							outputs={detail.recipeOutputs}
							mediaByFileId={mediaLookup}
							wikiCode={wikiCode}
						/>
					) : null}
					<RiseopediaEntityBodyContent rows={bodyRows} wikiCode={wikiCode} />
				</>
			}
			bottom={
				<RiseopediaEntityFooterBlocks
					rows={detail.dependencyRows}
					patchNoteRows={detail.patchNoteRows}
					selectedVariantId={effectiveVariantId}
					wikiCode={wikiCode}
				/>
			}
		/>
	);
}
