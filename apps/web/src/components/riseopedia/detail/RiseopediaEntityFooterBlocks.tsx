//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaEntityFooterBlocks.tsx                                ////
//// Language: TSX                                                                                            ////
//// Compact dependency and patch-note footer for public Riseopedia detail pages.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button, DropdownMenuSingle, Input, Pagination } from "@/components/ui";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import type {
	RiseopediaDependencyRow,
	RiseopediaPatchNoteRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityFooterBlocksProps = {
	rows: RiseopediaDependencyRow[];
	patchNoteRows: RiseopediaPatchNoteRow[];
	selectedVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type FooterBlockCode = "sources" | "used_by" | "patch_notes";
type SortDirection = "asc" | "desc";
type DependencySortKey = "name" | "details";
type PatchNoteSortKey = "patch" | "change" | "whatChanged" | "from" | "to";

type FilterState = {
	search: string;
	entityTypeCode: string;
	classCode: string;
	categoryCode: string;
	subcategoryCode: string;
};

type PatchNoteFilterState = {
	patchCode: string;
	changeTypeCode: string;
};

type FilterOption = {
	value: string;
	label: string;
};

type SortState<TKey extends string> = {
	key: TKey;
	direction: SortDirection;
};

const ALL_VALUE = "__all";
const PATCH_NOTES_BLOCK_CODE: FooterBlockCode = "patch_notes";
const REQUIRED_DEPENDENCY_BLOCK_CODES: FooterBlockCode[] = [
	"sources",
	"used_by",
];
const DEFAULT_PAGE_SIZE = 16;
const PAGE_SIZE_OPTIONS = [16, 32, 64];
const BLOCK_ORDER = new Map<FooterBlockCode, number>([
	["used_by", 10],
	["sources", 20],
	["patch_notes", 30],
]);
const BLOCK_LABELS = new Map<FooterBlockCode, string>([
	["used_by", "Used for"],
	["sources", "Obtained from"],
	["patch_notes", "Patch notes"],
]);

const INITIAL_FILTERS: FilterState = {
	search: "",
	entityTypeCode: ALL_VALUE,
	classCode: ALL_VALUE,
	categoryCode: ALL_VALUE,
	subcategoryCode: ALL_VALUE,
};

const INITIAL_PATCH_NOTE_FILTERS: PatchNoteFilterState = {
	patchCode: ALL_VALUE,
	changeTypeCode: ALL_VALUE,
};

const INITIAL_DEPENDENCY_SORT: SortState<DependencySortKey> = {
	key: "name",
	direction: "asc",
};

const INITIAL_PATCH_NOTE_SORT: SortState<PatchNoteSortKey> = {
	key: "patch",
	direction: "desc",
};

function isFooterBlockCode(value: string): value is FooterBlockCode {
	return value === "sources" || value === "used_by" || value === "patch_notes";
}

function blockSortOrder(value: FooterBlockCode): number {
	return BLOCK_ORDER.get(value) ?? 1000;
}

function isPatchNotesBlock(blockCode: FooterBlockCode | null): boolean {
	return blockCode === PATCH_NOTES_BLOCK_CODE;
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function hasValue(value: string | null | undefined): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function displayDash(value: string | null | undefined): string {
	return hasValue(value) ? value : "-";
}

function allOption(label: string): FilterOption {
	return { value: ALL_VALUE, label };
}

function titleCaseCode(value: string): string {
	return value
		.replaceAll("_", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionLabel(
	value: string | null,
	fallbackValue: string | null,
): string | null {
	if (hasValue(value)) {
		return value;
	}

	if (hasValue(fallbackValue)) {
		return titleCaseCode(fallbackValue);
	}

	return null;
}

function uniqueOptions(args: {
	rows: RiseopediaDependencyRow[];
	allLabel: string;
	valueForRow: (row: RiseopediaDependencyRow) => string | null;
	labelForRow: (row: RiseopediaDependencyRow) => string | null;
}): FilterOption[] {
	const byValue = new Map<string, string>();

	for (const row of args.rows) {
		const value = args.valueForRow(row);
		if (!hasValue(value)) {
			continue;
		}

		const label = args.labelForRow(row);
		byValue.set(value, label ?? titleCaseCode(value));
	}

	return [
		allOption(args.allLabel),
		...[...byValue.entries()]
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => left.label.localeCompare(right.label)),
	];
}

function uniquePatchNoteOptions(args: {
	rows: RiseopediaPatchNoteRow[];
	allLabel: string;
	valueForRow: (row: RiseopediaPatchNoteRow) => string | null;
	labelForRow: (row: RiseopediaPatchNoteRow) => string | null;
}): FilterOption[] {
	const byValue = new Map<string, string>();

	for (const row of args.rows) {
		const value = args.valueForRow(row);
		if (!hasValue(value)) {
			continue;
		}

		const label = args.labelForRow(row);
		byValue.set(value, label ?? titleCaseCode(value));
	}

	return [
		allOption(args.allLabel),
		...[...byValue.entries()]
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => left.label.localeCompare(right.label)),
	];
}

function compareText(
	left: string | null | undefined,
	right: string | null | undefined,
): number {
	return displayDash(left).localeCompare(displayDash(right), undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

function applyDirection(value: number, direction: SortDirection): number {
	return direction === "asc" ? value : value * -1;
}

function nextSortState<TKey extends string>(
	current: SortState<TKey>,
	key: TKey,
	defaultDirection: SortDirection,
): SortState<TKey> {
	if (current.key !== key) {
		return { key, direction: defaultDirection };
	}

	return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

function rowMatchesFilter(
	row: RiseopediaDependencyRow,
	filters: FilterState,
): boolean {
	if (
		filters.entityTypeCode !== ALL_VALUE &&
		row.relatedEntityTypeCode !== filters.entityTypeCode
	) {
		return false;
	}

	if (
		filters.classCode !== ALL_VALUE &&
		row.relatedClassCode !== filters.classCode
	) {
		return false;
	}

	if (
		filters.categoryCode !== ALL_VALUE &&
		row.relatedCategoryCode !== filters.categoryCode
	) {
		return false;
	}

	if (
		filters.subcategoryCode !== ALL_VALUE &&
		row.relatedSubcategoryCode !== filters.subcategoryCode
	) {
		return false;
	}

	const search = normalizeSearch(filters.search);
	if (!search) {
		return true;
	}

	return [
		row.relatedEntityName,
		row.relatedEntityVariantLabel,
		row.relatedEntityTypeName,
		row.relatedClassName,
		row.relatedCategoryName,
		row.relatedSubcategoryName,
		row.dependencyKindLabel,
		row.quantityText,
		row.noteText,
	]
		.filter(hasValue)
		.some((value) => value.toLowerCase().includes(search));
}

function rowMatchesPatchNoteFilter(
	row: RiseopediaPatchNoteRow,
	filters: PatchNoteFilterState,
): boolean {
	if (filters.patchCode !== ALL_VALUE && row.patchCode !== filters.patchCode) {
		return false;
	}

	if (
		filters.changeTypeCode !== ALL_VALUE &&
		row.changeTypeCode !== filters.changeTypeCode
	) {
		return false;
	}

	return true;
}

function dependencyRowMatchesSelectedVariant(
	row: RiseopediaDependencyRow,
	selectedVariantId: string | null,
): boolean {
	if (!selectedVariantId) {
		return true;
	}

	return (
		row.entityVariantId === null || row.entityVariantId === selectedVariantId
	);
}

function patchNoteRowMatchesSelectedVariant(
	row: RiseopediaPatchNoteRow,
	selectedVariantId: string | null,
): boolean {
	if (!selectedVariantId) {
		return true;
	}

	return (
		row.entityVariantId === null || row.entityVariantId === selectedVariantId
	);
}

function blockRows(
	rows: RiseopediaDependencyRow[],
	blockCode: FooterBlockCode,
): RiseopediaDependencyRow[] {
	if (blockCode === PATCH_NOTES_BLOCK_CODE) {
		return [];
	}

	return rows
		.filter((row) => row.dependencyBlockCode === blockCode)
		.sort((left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			return left.relatedEntityName.localeCompare(right.relatedEntityName);
		});
}

function dependencySortText(
	row: RiseopediaDependencyRow,
	key: DependencySortKey,
): string | null {
	switch (key) {
		case "name":
			return row.relatedEntityName;
		case "details":
			return (
				dependencyDetailItems(row)
					.map((item) => `${item.label} ${item.value}`)
					.join(" ") || null
			);
	}
}

function sortDependencyRows(
	rows: RiseopediaDependencyRow[],
	sortState: SortState<DependencySortKey>,
): RiseopediaDependencyRow[] {
	return [...rows].sort((left, right) => {
		const primary = applyDirection(
			compareText(
				dependencySortText(left, sortState.key),
				dependencySortText(right, sortState.key),
			),
			sortState.direction,
		);
		if (primary !== 0) {
			return primary;
		}

		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.relatedEntityName.localeCompare(right.relatedEntityName);
	});
}

function patchNoteSortText(
	row: RiseopediaPatchNoteRow,
	key: PatchNoteSortKey,
): string | null {
	switch (key) {
		case "patch":
			return row.patchLabel || row.patchCode;
		case "change":
			return row.changeLabel;
		case "whatChanged":
			return row.whatChangedLabel;
		case "from":
			return row.fromValueText;
		case "to":
			return row.toValueText;
	}
}

function sortPatchNoteRows(
	rows: RiseopediaPatchNoteRow[],
	sortState: SortState<PatchNoteSortKey>,
): RiseopediaPatchNoteRow[] {
	return [...rows].sort((left, right) => {
		if (
			sortState.key === "patch" &&
			left.patchSortOrder !== right.patchSortOrder
		) {
			return applyDirection(
				left.patchSortOrder - right.patchSortOrder,
				sortState.direction,
			);
		}

		const primary = applyDirection(
			compareText(
				patchNoteSortText(left, sortState.key),
				patchNoteSortText(right, sortState.key),
			),
			sortState.direction,
		);
		if (primary !== 0) {
			return primary;
		}

		if (left.patchSortOrder !== right.patchSortOrder) {
			return right.patchSortOrder - left.patchSortOrder;
		}

		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.patchNoteRowId.localeCompare(right.patchNoteRowId);
	});
}

function patchNoteChangeTone(row: RiseopediaPatchNoteRow): PatchNoteChangeTone {
	const normalizedCode = row.changeTypeCode.trim().toLowerCase();
	const normalizedLabel = row.changeLabel.trim().toLowerCase();

	if (
		normalizedCode.includes("introduced") ||
		normalizedLabel === "introduced"
	) {
		return "introduced";
	}

	if (normalizedCode.includes("added") || normalizedLabel === "added") {
		return "added";
	}

	if (normalizedCode.includes("removed") || normalizedLabel === "removed") {
		return "removed";
	}

	if (normalizedCode.includes("changed") || normalizedLabel === "changed") {
		return "changed";
	}

	return "neutral";
}

function patchNoteDetailItems(
	row: RiseopediaPatchNoteRow,
): PatchNoteDetailItem[] {
	const fromValue = hasValue(row.fromValueText)
		? row.fromValueText.trim()
		: null;
	const toValue = hasValue(row.toValueText) ? row.toValueText.trim() : null;
	const tone = patchNoteChangeTone(row);
	const detailItems: PatchNoteDetailItem[] = [];

	if (fromValue && toValue) {
		detailItems.push({ label: "From", value: fromValue });
		detailItems.push({ label: "To", value: toValue });
		return detailItems;
	}

	if (toValue) {
		detailItems.push({
			label: tone === "introduced" ? "Recorded" : "New value",
			value: toValue,
		});
		return detailItems;
	}

	if (fromValue) {
		detailItems.push({ label: "Previous value", value: fromValue });
		return detailItems;
	}

	if (tone === "introduced") {
		detailItems.push({
			label: "Status",
			value: "First recorded in this patch",
		});
	}

	return detailItems;
}

function groupPatchNoteRows(
	rows: RiseopediaPatchNoteRow[],
	sortState: SortState<PatchNoteSortKey>,
): PatchNoteGroup[] {
	const groupsByPatchId = new Map<string, PatchNoteGroup>();

	for (const row of rows) {
		const existingGroup = groupsByPatchId.get(row.patchId);
		if (existingGroup) {
			existingGroup.rows.push(row);
			continue;
		}

		groupsByPatchId.set(row.patchId, {
			patchId: row.patchId,
			patchLabel: row.patchLabel || row.patchCode,
			patchSortOrder: row.patchSortOrder,
			rows: [row],
		});
	}

	const patchDirection =
		sortState.key === "patch" ? sortState.direction : "desc";

	return [...groupsByPatchId.values()].sort((left, right) => {
		if (left.patchSortOrder !== right.patchSortOrder) {
			return applyDirection(
				left.patchSortOrder - right.patchSortOrder,
				patchDirection,
			);
		}

		return left.patchLabel.localeCompare(right.patchLabel);
	});
}

function blockLabel(blockCode: FooterBlockCode): string {
	return BLOCK_LABELS.get(blockCode) ?? titleCaseCode(blockCode);
}

function dependencyHref(
	row: RiseopediaDependencyRow,
	wikiCode: OpediaWikiCode | undefined,
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined,
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null,
): string | null {
	return buildRiseopediaEntityHref({
		entityTypeCode: row.relatedEntityTypeCode,
		entitySlug: row.relatedEntitySlug,
		targetEntityVariantKey: variantKeyFor(row.relatedEntityVariantId),
		wikiCode,
		releaseFilters,
	});
}

type DependencyDetailItem = {
	label: string;
	value: string;
};

type DependencyRelationshipTone =
	| "crafting"
	| "vendor"
	| "quest"
	| "combat"
	| "neutral";

type DependencyGroup = {
	code: string;
	label: string;
	tone: DependencyRelationshipTone;
	sortOrder: number;
	rows: RiseopediaDependencyRow[];
};

type PatchNoteChangeTone =
	| "introduced"
	| "added"
	| "changed"
	| "removed"
	| "neutral";

type PatchNoteDetailItem = {
	label: string;
	value: string;
};

type PatchNoteGroup = {
	patchId: string;
	patchLabel: string;
	patchSortOrder: number;
	rows: RiseopediaPatchNoteRow[];
};

function isTechnicalDependencyVariantLabel(value: string | null): boolean {
	if (!hasValue(value)) {
		return false;
	}

	const normalized = value.trim().toLowerCase();
	return normalized === "default" || normalized === "base";
}

function dependencyMetaText(row: RiseopediaDependencyRow): string | null {
	const variantLabel = isTechnicalDependencyVariantLabel(
		row.relatedEntityVariantLabel,
	)
		? null
		: row.relatedEntityVariantLabel;
	const className = row.relatedClassName;
	const classCode = row.relatedClassCode?.toLowerCase() ?? "";
	const entityTypeCode = row.relatedEntityTypeCode.toLowerCase();
	const values: string[] = [];

	if (entityTypeCode === "recipe") {
		values.push("Recipe");
	} else if (classCode.includes("quest")) {
		values.push("Quest");
	} else if (hasValue(className)) {
		values.push(className);
	} else if (hasValue(row.relatedEntityTypeName)) {
		values.push(row.relatedEntityTypeName);
	} else {
		values.push(titleCaseCode(row.relatedEntityTypeCode));
	}

	if (hasValue(variantLabel)) {
		values.push(variantLabel);
	}

	if (entityTypeCode === "recipe" && hasValue(className)) {
		values.push(className);
	}

	if (classCode.includes("quest") && hasValue(className)) {
		values.push(className);
	}

	if (hasValue(row.relatedCategoryName)) {
		values.push(row.relatedCategoryName);
	}

	if (hasValue(row.relatedSubcategoryName)) {
		values.push(row.relatedSubcategoryName);
	}

	const uniqueValues = [...new Set(values)];
	return uniqueValues.length > 0 ? uniqueValues.join(" · ") : null;
}

function normalizedDependencyNote(value: string | null): string | null {
	if (!hasValue(value)) {
		return null;
	}

	return value.trim();
}

function noteValueWithoutPrefix(
	value: string | null,
	prefix: string,
): string | null {
	const note = normalizedDependencyNote(value);
	if (!note) {
		return null;
	}

	return note.toLowerCase().startsWith(prefix.toLowerCase())
		? note.slice(prefix.length).trim()
		: note;
}

function dependencyDetailItems(
	row: RiseopediaDependencyRow,
): DependencyDetailItem[] {
	const quantity = normalizedDependencyNote(row.quantityText);
	const note = normalizedDependencyNote(row.noteText);
	const kind = row.dependencyKindCode;
	const detailItems: DependencyDetailItem[] = [];

	if (kind === "recipe_crafted_by") {
		if (quantity) {
			detailItems.push({ label: "Makes", value: quantity });
		}
		return detailItems;
	}

	if (kind === "recipe_used_in") {
		if (quantity) {
			detailItems.push({ label: "Requires", value: quantity });
		}
		const outputName = noteValueWithoutPrefix(note, "Creates ");
		if (outputName) {
			detailItems.push({ label: "Creates", value: outputName });
		}
		return detailItems;
	}

	if (kind === "recipe_catalyst_for") {
		detailItems.push({ label: "Catalyst", value: "Returned" });
		const outputName = noteValueWithoutPrefix(note, "Creates ");
		if (outputName) {
			detailItems.push({ label: "Creates", value: outputName });
		}
		return detailItems;
	}

	if (kind === "recipe_bench_for") {
		const outputName = noteValueWithoutPrefix(note, "Creates ");
		if (outputName) {
			detailItems.push({ label: "Crafts", value: outputName });
		}
		return detailItems;
	}

	if (kind.includes("sale_required_by_quest")) {
		detailItems.push({ label: "Objective", value: "Sell this item" });
	} else if (kind.includes("required_by_quest")) {
		detailItems.push({ label: "Objective", value: "Requires this item" });
	} else if (kind.includes("rewarded_by_quest")) {
		detailItems.push({ label: "Reward", value: "Item reward" });
	} else if (kind.includes("requires_quest")) {
		detailItems.push({ label: "Quest chain", value: "Prerequisite" });
	} else if (kind.includes("unlocks_quest")) {
		detailItems.push({ label: "Quest chain", value: "Unlocks next quest" });
	} else if (kind.includes("ammunition") || kind.includes("weapon")) {
		detailItems.push({ label: "Compatibility", value: "Weapon ammunition" });
	}

	if (quantity) {
		detailItems.push({ label: "Amount", value: quantity });
	}

	if (note) {
		detailItems.push({ label: "Details", value: note });
	}

	return detailItems;
}

function relationshipGroupTone(
	dependencyKindCode: string,
): DependencyRelationshipTone {
	if (dependencyKindCode.startsWith("recipe_")) {
		return "crafting";
	}

	if (dependencyKindCode.includes("vendor")) {
		return "vendor";
	}

	if (dependencyKindCode.includes("quest")) {
		return "quest";
	}

	if (
		dependencyKindCode.includes("weapon") ||
		dependencyKindCode.includes("ammunition")
	) {
		return "combat";
	}

	return "neutral";
}

function groupDependencyRows(
	rows: RiseopediaDependencyRow[],
): DependencyGroup[] {
	const groupsByCode = new Map<string, DependencyGroup>();

	for (const row of rows) {
		const existingGroup = groupsByCode.get(row.dependencyKindCode);
		if (existingGroup) {
			existingGroup.rows.push(row);
			existingGroup.sortOrder = Math.min(existingGroup.sortOrder, row.sortOrder);
			continue;
		}

		groupsByCode.set(row.dependencyKindCode, {
			code: row.dependencyKindCode,
			label: row.dependencyKindLabel,
			tone: relationshipGroupTone(row.dependencyKindCode),
			sortOrder: row.sortOrder,
			rows: [row],
		});
	}

	return [...groupsByCode.values()].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.label.localeCompare(right.label);
	});
}

function sortDirectionLabel(direction: SortDirection): string {
	return direction === "asc" ? "ascending" : "descending";
}

function SortHeader<TKey extends string>({
	label,
	sortKey,
	sortState,
	onSort,
	defaultDirection,
}: {
	label: string;
	sortKey: TKey;
	sortState: SortState<TKey>;
	onSort: (sortKey: TKey, defaultDirection: SortDirection) => void;
	defaultDirection: SortDirection;
}): JSX.Element {
	const active = sortState.key === sortKey;
	const marker = active ? (sortState.direction === "asc" ? "▲" : "▼") : "";

	return (
		<button
			className="riseopedia-dependency-table__sort-button"
			type="button"
			onClick={() => onSort(sortKey, defaultDirection)}
			aria-label={
				active
					? `${label}, sorted ${sortDirectionLabel(sortState.direction)}`
					: `Sort by ${label}`
			}
		>
			<span>{label}</span>
			<span className="riseopedia-dependency-table__sort-marker" aria-hidden>
				{marker}
			</span>
		</button>
	);
}

function DependencyIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaDependencyRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(
		row.relatedIconMediaFileId,
		wikiCode,
	);

	return (
		<span className="riseopedia-dependency-table__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-dependency-table__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Related entity"
					size="inline"
					decorative
				/>
			) : (
				<span className="riseopedia-dependency-table__icon-placeholder" />
			)}
		</span>
	);
}

function DependencyEmptyState({
	title,
	message,
}: {
	title: string;
	message: string;
}): JSX.Element {
	return (
		<div className="riseopedia-empty-state riseopedia-dependency-empty-state">
			<SearchX className="riseopedia-dependency-empty-state__icon" aria-hidden />
			<div className="riseopedia-dependency-empty-state__copy">
				<h3 className="riseopedia-empty-state__title">{title}</h3>
				<p className="riseopedia-empty-state__message">{message}</p>
			</div>
		</div>
	);
}

function DependencyFilterBar({
	rows,
	filters,
	onFiltersChange,
}: {
	rows: RiseopediaDependencyRow[];
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
}): JSX.Element {
	const entityTypeOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All entities",
				valueForRow: (row) => row.relatedEntityTypeCode,
				labelForRow: (row) =>
					optionLabel(row.relatedEntityTypeName, row.relatedEntityTypeCode),
			}),
		[rows],
	);
	const classOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All classes",
				valueForRow: (row) => row.relatedClassCode,
				labelForRow: (row) =>
					optionLabel(row.relatedClassName, row.relatedClassCode),
			}),
		[rows],
	);
	const categoryOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All categories",
				valueForRow: (row) => row.relatedCategoryCode,
				labelForRow: (row) =>
					optionLabel(row.relatedCategoryName, row.relatedCategoryCode),
			}),
		[rows],
	);
	const subcategoryOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All subcategories",
				valueForRow: (row) => row.relatedSubcategoryCode,
				labelForRow: (row) =>
					optionLabel(row.relatedSubcategoryName, row.relatedSubcategoryCode),
			}),
		[rows],
	);

	return (
		<div
			className="riseopedia-dependency-filterbar"
			aria-label="Filter dependency rows"
		>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={entityTypeOptions}
				value={filters.entityTypeCode}
				onChange={(entityTypeCode) =>
					onFiltersChange({ ...filters, entityTypeCode })
				}
				ariaLabel="Filter dependency rows by entity type"
			/>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={classOptions}
				value={filters.classCode}
				onChange={(classCode) => onFiltersChange({ ...filters, classCode })}
				ariaLabel="Filter dependency rows by class"
			/>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={categoryOptions}
				value={filters.categoryCode}
				onChange={(categoryCode) => onFiltersChange({ ...filters, categoryCode })}
				ariaLabel="Filter dependency rows by category"
			/>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={subcategoryOptions}
				value={filters.subcategoryCode}
				onChange={(subcategoryCode) =>
					onFiltersChange({ ...filters, subcategoryCode })
				}
				ariaLabel="Filter dependency rows by subcategory"
			/>
			<label
				className="public-collection-sr-label"
				htmlFor="riseopedia-dependency-search"
			>
				Search dependencies
			</label>
			<Input
				id="riseopedia-dependency-search"
				className="riseopedia-dependency-filterbar__search"
				size="sm"
				type="search"
				value={filters.search}
				onChange={(event) =>
					onFiltersChange({ ...filters, search: event.currentTarget.value })
				}
				placeholder="Search rows..."
			/>
		</div>
	);
}

function PatchNoteFilterBar({
	rows,
	filters,
	onFiltersChange,
}: {
	rows: RiseopediaPatchNoteRow[];
	filters: PatchNoteFilterState;
	onFiltersChange: (filters: PatchNoteFilterState) => void;
}): JSX.Element {
	const patchOptions = useMemo(
		() =>
			uniquePatchNoteOptions({
				rows,
				allLabel: "All patches",
				valueForRow: (row) => row.patchCode,
				labelForRow: (row) => row.patchLabel || row.patchCode,
			}),
		[rows],
	);
	const changeOptions = useMemo(
		() =>
			uniquePatchNoteOptions({
				rows,
				allLabel: "All changes",
				valueForRow: (row) => row.changeTypeCode,
				labelForRow: (row) => row.changeLabel || titleCaseCode(row.changeTypeCode),
			}),
		[rows],
	);

	return (
		<div
			className="riseopedia-dependency-filterbar riseopedia-dependency-filterbar--patch-notes"
			aria-label="Filter patch note rows"
		>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={patchOptions}
				value={filters.patchCode}
				onChange={(patchCode) => onFiltersChange({ ...filters, patchCode })}
				ariaLabel="Filter patch note rows by patch"
			/>
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={changeOptions}
				value={filters.changeTypeCode}
				onChange={(changeTypeCode) =>
					onFiltersChange({ ...filters, changeTypeCode })
				}
				ariaLabel="Filter patch note rows by change"
			/>
		</div>
	);
}

function DependencyTable({
	rows,
	page,
	pageSize,
	sortState,
	onSort,
	wikiCode,
	releaseFilters,
}: {
	rows: RiseopediaDependencyRow[];
	page: number;
	pageSize: number;
	sortState: SortState<DependencySortKey>;
	onSort: (sortKey: DependencySortKey, defaultDirection: SortDirection) => void;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
	const groups = useMemo(() => groupDependencyRows(visibleRows), [visibleRows]);

	if (groups.length === 0) {
		return (
			<div className="riseopedia-dependency-table-wrap">
				<table className="riseopedia-dependency-table">
					<tbody>
						<tr className="riseopedia-dependency-table__empty-row">
							<td colSpan={3}>
								<DependencyEmptyState
									title="No matching rows"
									message="Try a broader search or clear the footer filters."
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className="riseopedia-dependency-table-wrap">
			{groups.map((group) => (
				<section
					key={group.code}
					className="riseopedia-dependency-group"
					data-tone={group.tone}
				>
					<header className="riseopedia-dependency-group__header">
						<div className="riseopedia-dependency-group__title">
							<span className="riseopedia-dependency-group__marker" aria-hidden />
							<h3>{group.label}</h3>
						</div>
						<span className="riseopedia-dependency-group__count">
							{group.rows.length}
						</span>
					</header>

					<table className="riseopedia-dependency-table">
						<thead>
							<tr>
								<th className="riseopedia-dependency-table__icon-column" scope="col">
									<span className="public-collection-sr-label">Icon</span>
								</th>
								<th scope="col">
									<SortHeader
										label="Related entity"
										sortKey="name"
										sortState={sortState}
										onSort={onSort}
										defaultDirection="asc"
									/>
								</th>
								<th scope="col">
									<SortHeader
										label="Details"
										sortKey="details"
										sortState={sortState}
										onSort={onSort}
										defaultDirection="asc"
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{group.rows.map((row, index) => {
								const href = dependencyHref(
									row,
									wikiCode,
									releaseFilters,
									variantKeyFor,
								);
								const metaText = dependencyMetaText(row);
								const detailItems = dependencyDetailItems(row);

								return (
									<tr
										key={`${row.dependencyBlockCode}-${row.relationshipSourceCode}-${row.dependencyKindCode}-${row.entityVariantId ?? "entity"}-${row.relatedEntityId}-${row.relatedEntityVariantId ?? "entity"}-${row.sortOrder}-${index}`}
										data-tone={group.tone}
									>
										<td className="riseopedia-dependency-table__icon-cell">
											<DependencyIcon row={row} wikiCode={wikiCode} />
										</td>
										<td className="riseopedia-dependency-table__name">
											{href ? (
												<Link href={href}>{row.relatedEntityName}</Link>
											) : (
												<span>{row.relatedEntityName}</span>
											)}
											{metaText ? (
												<span className="riseopedia-dependency-table__name-meta">
													{metaText}
												</span>
											) : null}
										</td>
										<td
											className="riseopedia-dependency-table__details"
											data-empty={detailItems.length === 0 ? "true" : "false"}
										>
											{detailItems.length > 0 ? (
												<div className="riseopedia-dependency-table__detail-list">
													{detailItems.map((item) => (
														<span
															className="riseopedia-dependency-table__detail-item"
															key={`${item.label}-${item.value}`}
														>
															<span className="riseopedia-dependency-table__detail-label">
																{item.label}
															</span>
															<span className="riseopedia-dependency-table__detail-value">
																{item.value}
															</span>
														</span>
													))}
												</div>
											) : null}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</section>
			))}
		</div>
	);
}

function PatchNoteTable({
	rows,
	page,
	pageSize,
	sortState,
	onSort,
}: {
	rows: RiseopediaPatchNoteRow[];
	page: number;
	pageSize: number;
	sortState: SortState<PatchNoteSortKey>;
	onSort: (sortKey: PatchNoteSortKey, defaultDirection: SortDirection) => void;
}): JSX.Element {
	const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
	const groups = useMemo(
		() => groupPatchNoteRows(visibleRows, sortState),
		[sortState, visibleRows],
	);

	if (groups.length === 0) {
		return (
			<div className="riseopedia-dependency-table-wrap">
				<table className="riseopedia-dependency-table">
					<tbody>
						<tr className="riseopedia-dependency-table__empty-row">
							<td colSpan={3}>
								<DependencyEmptyState
									title="No patch notes"
									message="No patch-to-patch changes are available for this selection yet."
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className="riseopedia-dependency-table-wrap">
			{groups.map((group) => (
				<section
					key={group.patchId}
					className="riseopedia-dependency-group riseopedia-patch-note-group"
				>
					<header className="riseopedia-dependency-group__header">
						<div className="riseopedia-dependency-group__title">
							<span className="riseopedia-dependency-group__marker" aria-hidden />
							<h3>{group.patchLabel}</h3>
						</div>
						<span className="riseopedia-dependency-group__count">
							{group.rows.length}
						</span>
					</header>

					<table className="riseopedia-dependency-table riseopedia-patch-note-table">
						<thead>
							<tr>
								<th className="riseopedia-patch-note-table__change-column" scope="col">
									<SortHeader
										label="Change"
										sortKey="change"
										sortState={sortState}
										onSort={onSort}
										defaultDirection="asc"
									/>
								</th>
								<th scope="col">
									<SortHeader
										label="Changed field"
										sortKey="whatChanged"
										sortState={sortState}
										onSort={onSort}
										defaultDirection="asc"
									/>
								</th>
								<th scope="col">
									<SortHeader
										label="Details"
										sortKey="to"
										sortState={sortState}
										onSort={onSort}
										defaultDirection="asc"
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{group.rows.map((row) => {
								const tone = patchNoteChangeTone(row);
								const detailItems = patchNoteDetailItems(row);

								return (
									<tr
										key={`${row.patchId}-${row.patchNoteRowId}-${row.changeTypeCode}`}
										data-tone={tone}
									>
										<td className="riseopedia-patch-note-table__change-cell">
											<span
												className="riseopedia-patch-note-table__change"
												data-tone={tone}
											>
												{row.changeLabel}
											</span>
										</td>
										<td className="riseopedia-patch-note-table__field">
											{row.whatChangedLabel}
										</td>
										<td
											className="riseopedia-dependency-table__details riseopedia-patch-note-table__details"
											data-empty={detailItems.length === 0 ? "true" : "false"}
										>
											{detailItems.length > 0 ? (
												<div className="riseopedia-dependency-table__detail-list">
													{detailItems.map((item) => (
														<span
															className="riseopedia-dependency-table__detail-item"
															key={`${item.label}-${item.value}`}
														>
															<span className="riseopedia-dependency-table__detail-label">
																{item.label}
															</span>
															<span className="riseopedia-dependency-table__detail-value">
																{item.value}
															</span>
														</span>
													))}
												</div>
											) : null}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</section>
			))}
		</div>
	);
}

export default function RiseopediaEntityFooterBlocks({
	rows,
	patchNoteRows,
	selectedVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaEntityFooterBlocksProps): JSX.Element | null {
	const variantScopedRows = useMemo(
		() =>
			rows.filter((row) =>
				dependencyRowMatchesSelectedVariant(row, selectedVariantId),
			),
		[rows, selectedVariantId],
	);
	const variantScopedPatchNoteRows = useMemo(
		() =>
			patchNoteRows.filter((row) =>
				patchNoteRowMatchesSelectedVariant(row, selectedVariantId),
			),
		[patchNoteRows, selectedVariantId],
	);
	const blockCodes = useMemo<FooterBlockCode[]>(() => {
		const dependencyBlockCodes = [
			...REQUIRED_DEPENDENCY_BLOCK_CODES,
			...variantScopedRows.map((row) => row.dependencyBlockCode),
		]
			.filter(isFooterBlockCode)
			.filter((blockCode) => blockCode !== PATCH_NOTES_BLOCK_CODE);
		const nextBlockCodes: FooterBlockCode[] =
			variantScopedPatchNoteRows.length > 0
				? [...dependencyBlockCodes, PATCH_NOTES_BLOCK_CODE]
				: dependencyBlockCodes;

		return [...new Set(nextBlockCodes)].sort((left, right) => {
			const leftRank = blockSortOrder(left);
			const rightRank = blockSortOrder(right);
			return leftRank === rightRank
				? left.localeCompare(right)
				: leftRank - rightRank;
		});
	}, [variantScopedPatchNoteRows.length, variantScopedRows]);
	const [activeBlockCode, setActiveBlockCode] = useState<FooterBlockCode | null>(
		blockCodes[0] ?? null,
	);
	const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
	const [patchNoteFilters, setPatchNoteFilters] = useState<PatchNoteFilterState>(
		INITIAL_PATCH_NOTE_FILTERS,
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [dependencySort, setDependencySort] = useState<
		SortState<DependencySortKey>
	>(INITIAL_DEPENDENCY_SORT);
	const [patchNoteSort, setPatchNoteSort] = useState<
		SortState<PatchNoteSortKey>
	>(INITIAL_PATCH_NOTE_SORT);

	useEffect(() => {
		if (activeBlockCode && blockCodes.includes(activeBlockCode)) {
			return;
		}

		setActiveBlockCode(blockCodes[0] ?? null);
	}, [activeBlockCode, blockCodes]);

	function updateFilters(nextFilters: FilterState): void {
		setFilters(nextFilters);
		setPage(1);
	}

	function updatePatchNoteFilters(nextFilters: PatchNoteFilterState): void {
		setPatchNoteFilters(nextFilters);
		setPage(1);
	}

	function switchBlock(blockCode: FooterBlockCode): void {
		setActiveBlockCode(blockCode);
		setFilters(INITIAL_FILTERS);
		setPatchNoteFilters(INITIAL_PATCH_NOTE_FILTERS);
		setPage(1);
	}

	function updateDependencySort(
		sortKey: DependencySortKey,
		defaultDirection: SortDirection,
	): void {
		setDependencySort((current) =>
			nextSortState(current, sortKey, defaultDirection),
		);
		setPage(1);
	}

	function updatePatchNoteSort(
		sortKey: PatchNoteSortKey,
		defaultDirection: SortDirection,
	): void {
		setPatchNoteSort((current) =>
			nextSortState(current, sortKey, defaultDirection),
		);
		setPage(1);
	}

	const activeIsPatchNotes = isPatchNotesBlock(activeBlockCode);
	const rowsForActiveDependencyBlock = useMemo(
		() =>
			activeBlockCode && !activeIsPatchNotes
				? blockRows(variantScopedRows, activeBlockCode)
				: [],
		[activeBlockCode, activeIsPatchNotes, variantScopedRows],
	);
	const filteredRows = useMemo(
		() =>
			rowsForActiveDependencyBlock.filter((row) => rowMatchesFilter(row, filters)),
		[filters, rowsForActiveDependencyBlock],
	);
	const sortedDependencyRows = useMemo(
		() => sortDependencyRows(filteredRows, dependencySort),
		[dependencySort, filteredRows],
	);
	const filteredPatchNoteRows = useMemo(
		() =>
			variantScopedPatchNoteRows.filter((row) =>
				rowMatchesPatchNoteFilter(row, patchNoteFilters),
			),
		[patchNoteFilters, variantScopedPatchNoteRows],
	);
	const sortedPatchNoteRows = useMemo(
		() => sortPatchNoteRows(filteredPatchNoteRows, patchNoteSort),
		[filteredPatchNoteRows, patchNoteSort],
	);
	const activeRowsCount = activeIsPatchNotes
		? sortedPatchNoteRows.length
		: sortedDependencyRows.length;
	const totalPages = Math.max(1, Math.ceil(activeRowsCount / pageSize));
	const currentPage = Math.min(page, totalPages);
	const activeBlockLabel = activeBlockCode
		? blockLabel(activeBlockCode)
		: "Used for";

	if (!activeBlockCode) {
		return null;
	}

	return (
		<section
			className="riseopedia-dependency-footer"
			aria-label="Riseopedia dependency and patch notes explorer"
		>
			<div
				className="riseopedia-dependency-footer__tabs"
				role="tablist"
				aria-label="Footer blocks"
			>
				{blockCodes.map((blockCode) => (
					<Button
						key={blockCode}
						size="sm"
						variant={blockCode === activeBlockCode ? "primary" : "secondary"}
						type="button"
						onClick={() => switchBlock(blockCode)}
					>
						{blockLabel(blockCode)}
					</Button>
				))}
			</div>

			<article className="riseopedia-dependency-panel">
				<div className="riseopedia-dependency-panel__header">
					<h2 className="riseopedia-section-title">{activeBlockLabel}</h2>
					<p className="riseopedia-dependency-panel__summary">
						{activeRowsCount} matching row{activeRowsCount === 1 ? "" : "s"}
					</p>
				</div>

				{activeIsPatchNotes ? (
					<PatchNoteFilterBar
						rows={variantScopedPatchNoteRows}
						filters={patchNoteFilters}
						onFiltersChange={updatePatchNoteFilters}
					/>
				) : (
					<DependencyFilterBar
						rows={rowsForActiveDependencyBlock}
						filters={filters}
						onFiltersChange={updateFilters}
					/>
				)}

				{activeIsPatchNotes ? (
					<PatchNoteTable
						rows={sortedPatchNoteRows}
						page={currentPage}
						pageSize={pageSize}
						sortState={patchNoteSort}
						onSort={updatePatchNoteSort}
					/>
				) : (
					<DependencyTable
						rows={sortedDependencyRows}
						page={currentPage}
						pageSize={pageSize}
						sortState={dependencySort}
						onSort={updateDependencySort}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				)}

				<Pagination
					className="riseopedia-dependency-pagination"
					total={activeRowsCount}
					page={currentPage}
					pageSize={pageSize}
					pageSizeOptions={PAGE_SIZE_OPTIONS}
					pageSizeLabel="Rows"
					showEdges={false}
					onPageChange={setPage}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPage(1);
					}}
				/>
			</article>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
