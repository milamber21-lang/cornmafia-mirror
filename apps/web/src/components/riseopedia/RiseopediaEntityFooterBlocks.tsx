//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityFooterBlocks.tsx                                ////
//// Language: TSX                                                                                            ////
//// Compact dependency and patch-note footer for public Riseopedia detail pages.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";

import { Button, DropdownMenuSingle, Input, Pagination } from "@/components/ui";
import type {
	RiseopediaDependencyRow,
	RiseopediaPatchNoteRow,
} from "@/lib/data/riseopedia-entity-detail";
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
};

type FooterBlockCode = "sources" | "used_by" | "patch_notes";
type SortDirection = "asc" | "desc";
type DependencySortKey = "name" | "variant" | "entity" | "class" | "category" | "subcategory";
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
const REQUIRED_DEPENDENCY_BLOCK_CODES: FooterBlockCode[] = ["sources", "used_by"];
const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZE_OPTIONS = [8, 16, 32];
const BLOCK_ORDER = new Map<FooterBlockCode, number>([
	["sources", 10],
	["used_by", 20],
	["patch_notes", 30],
]);
const BLOCK_LABELS = new Map<FooterBlockCode, string>([
	["sources", "Obtained from"],
	["used_by", "Used for"],
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

function optionLabel(value: string | null, fallbackValue: string | null): string | null {
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

function compareText(left: string | null | undefined, right: string | null | undefined): number {
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

function rowMatchesFilter(row: RiseopediaDependencyRow, filters: FilterState): boolean {
	if (filters.entityTypeCode !== ALL_VALUE && row.relatedEntityTypeCode !== filters.entityTypeCode) {
		return false;
	}

	if (filters.classCode !== ALL_VALUE && row.relatedClassCode !== filters.classCode) {
		return false;
	}

	if (filters.categoryCode !== ALL_VALUE && row.relatedCategoryCode !== filters.categoryCode) {
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

	if (filters.changeTypeCode !== ALL_VALUE && row.changeTypeCode !== filters.changeTypeCode) {
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

	return row.entityVariantId === null || row.entityVariantId === selectedVariantId;
}

function patchNoteRowMatchesSelectedVariant(
	row: RiseopediaPatchNoteRow,
	selectedVariantId: string | null,
): boolean {
	if (!selectedVariantId) {
		return true;
	}

	return row.entityVariantId === null || row.entityVariantId === selectedVariantId;
}

function blockRows(rows: RiseopediaDependencyRow[], blockCode: FooterBlockCode): RiseopediaDependencyRow[] {
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

function dependencySortText(row: RiseopediaDependencyRow, key: DependencySortKey): string | null {
	switch (key) {
		case "name":
			return row.relatedEntityName;
		case "variant":
			return row.relatedEntityVariantLabel;
		case "entity":
			return row.relatedEntityTypeName ?? titleCaseCode(row.relatedEntityTypeCode);
		case "class":
			return row.relatedClassName;
		case "category":
			return row.relatedCategoryName;
		case "subcategory":
			return row.relatedSubcategoryName;
	}
}

function sortDependencyRows(
	rows: RiseopediaDependencyRow[],
	sortState: SortState<DependencySortKey>,
): RiseopediaDependencyRow[] {
	return [...rows].sort((left, right) => {
		const primary = applyDirection(
			compareText(dependencySortText(left, sortState.key), dependencySortText(right, sortState.key)),
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

function patchNoteSortText(row: RiseopediaPatchNoteRow, key: PatchNoteSortKey): string | null {
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
		if (sortState.key === "patch" && left.patchSortOrder !== right.patchSortOrder) {
			return applyDirection(left.patchSortOrder - right.patchSortOrder, sortState.direction);
		}

		const primary = applyDirection(
			compareText(patchNoteSortText(left, sortState.key), patchNoteSortText(right, sortState.key)),
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

function blockLabel(blockCode: FooterBlockCode): string {
	return BLOCK_LABELS.get(blockCode) ?? titleCaseCode(blockCode);
}

function dependencyHref(
	row: RiseopediaDependencyRow,
	wikiCode: OpediaWikiCode | undefined,
): string | null {
	return buildRiseopediaEntityHref({
		entityTypeCode: row.relatedEntityTypeCode,
		entitySlug: row.relatedEntitySlug,
		wikiCode,
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
			aria-label={active ? `${label}, sorted ${sortDirectionLabel(sortState.direction)}` : `Sort by ${label}`}
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
	const iconHref = buildRiseopediaMediaHref(row.relatedIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-dependency-table__icon" aria-hidden>
			{iconHref ? (
				<img
					className="riseopedia-dependency-table__icon-image"
					src={iconHref}
					alt=""
					width="32"
					height="32"
					loading="lazy"
				/>
			) : (
				<span className="riseopedia-dependency-table__icon-placeholder" />
			)}
		</span>
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
				labelForRow: (row) => optionLabel(row.relatedEntityTypeName, row.relatedEntityTypeCode),
			}),
		[rows],
	);
	const classOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All classes",
				valueForRow: (row) => row.relatedClassCode,
				labelForRow: (row) => optionLabel(row.relatedClassName, row.relatedClassCode),
			}),
		[rows],
	);
	const categoryOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All categories",
				valueForRow: (row) => row.relatedCategoryCode,
				labelForRow: (row) => optionLabel(row.relatedCategoryName, row.relatedCategoryCode),
			}),
		[rows],
	);
	const subcategoryOptions = useMemo(
		() =>
			uniqueOptions({
				rows,
				allLabel: "All subcategories",
				valueForRow: (row) => row.relatedSubcategoryCode,
				labelForRow: (row) => optionLabel(row.relatedSubcategoryName, row.relatedSubcategoryCode),
			}),
		[rows],
	);

	return (
		<div className="riseopedia-dependency-filterbar" aria-label="Filter dependency rows">
			<DropdownMenuSingle
				className="riseopedia-dependency-filterbar__control"
				size="sm"
				options={entityTypeOptions}
				value={filters.entityTypeCode}
				onChange={(entityTypeCode) => onFiltersChange({ ...filters, entityTypeCode })}
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
				onChange={(subcategoryCode) => onFiltersChange({ ...filters, subcategoryCode })}
				ariaLabel="Filter dependency rows by subcategory"
			/>
			<label className="public-collection-sr-label" htmlFor="riseopedia-dependency-search">
				Search dependencies
			</label>
			<Input
				id="riseopedia-dependency-search"
				className="riseopedia-dependency-filterbar__search"
				size="sm"
				type="search"
				value={filters.search}
				onChange={(event) => onFiltersChange({ ...filters, search: event.currentTarget.value })}
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
				onChange={(changeTypeCode) => onFiltersChange({ ...filters, changeTypeCode })}
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
}: {
	rows: RiseopediaDependencyRow[];
	page: number;
	pageSize: number;
	sortState: SortState<DependencySortKey>;
	onSort: (sortKey: DependencySortKey, defaultDirection: SortDirection) => void;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const offset = (page - 1) * pageSize;
	const visibleRows = rows.slice(offset, offset + pageSize);

	if (visibleRows.length === 0) {
		return (
			<div className="riseopedia-empty-state riseopedia-dependency-empty-state">
				<h3 className="riseopedia-empty-state__title">No matching rows</h3>
				<p className="riseopedia-empty-state__message">
					Try a broader search or clear the footer filters.
				</p>
			</div>
		);
	}

	return (
		<div className="riseopedia-dependency-table-wrap">
			<table className="riseopedia-dependency-table">
				<thead>
					<tr>
						<th scope="col">#</th>
						<th scope="col">
							<SortHeader label="Name" sortKey="name" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="Variant" sortKey="variant" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="Entity" sortKey="entity" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="Class" sortKey="class" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="Category" sortKey="category" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="Subcategory" sortKey="subcategory" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">Icon</th>
					</tr>
				</thead>
				<tbody>
					{visibleRows.map((row, index) => {
						const href = dependencyHref(row, wikiCode);

						return (
							<tr key={`${row.dependencyBlockCode}-${row.relationshipSourceCode}-${row.entityVariantId ?? "entity"}-${row.relatedEntityId}-${row.relatedEntityVariantId ?? "entity"}-${row.sortOrder}-${index}`}>
								<td className="riseopedia-dependency-table__number">
									{offset + index + 1}
								</td>
								<td className="riseopedia-dependency-table__name">
									{href ? (
										<Link href={href}>{row.relatedEntityName}</Link>
									) : (
										<span>{row.relatedEntityName}</span>
									)}
								</td>
								<td>{displayDash(row.relatedEntityVariantLabel)}</td>
								<td>{displayDash(row.relatedEntityTypeName ?? titleCaseCode(row.relatedEntityTypeCode))}</td>
								<td>{displayDash(row.relatedClassName)}</td>
								<td>{displayDash(row.relatedCategoryName)}</td>
								<td>{displayDash(row.relatedSubcategoryName)}</td>
								<td className="riseopedia-dependency-table__icon-cell">
									<DependencyIcon row={row} wikiCode={wikiCode} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
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
	const offset = (page - 1) * pageSize;
	const visibleRows = rows.slice(offset, offset + pageSize);

	if (visibleRows.length === 0) {
		return (
			<div className="riseopedia-empty-state riseopedia-dependency-empty-state">
				<h3 className="riseopedia-empty-state__title">No patch notes</h3>
				<p className="riseopedia-empty-state__message">
					No patch-to-patch changes are available for this selection yet.
				</p>
			</div>
		);
	}

	return (
		<div className="riseopedia-dependency-table-wrap">
			<table className="riseopedia-dependency-table">
				<thead>
					<tr>
						<th scope="col">#</th>
						<th scope="col">
							<SortHeader label="Patch" sortKey="patch" sortState={sortState} onSort={onSort} defaultDirection="desc" />
						</th>
						<th scope="col">
							<SortHeader label="Change" sortKey="change" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="What changed" sortKey="whatChanged" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="From" sortKey="from" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
						<th scope="col">
							<SortHeader label="To" sortKey="to" sortState={sortState} onSort={onSort} defaultDirection="asc" />
						</th>
					</tr>
				</thead>
				<tbody>
					{visibleRows.map((row, index) => (
						<tr key={`${row.patchId}-${row.patchNoteRowId}-${row.changeTypeCode}`}>
							<td className="riseopedia-dependency-table__number">
								{offset + index + 1}
							</td>
							<td>{row.patchLabel || row.patchCode}</td>
							<td>{row.changeLabel}</td>
							<td>{row.whatChangedLabel}</td>
							<td>{displayDash(row.fromValueText)}</td>
							<td>{displayDash(row.toValueText)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function RiseopediaEntityFooterBlocks({
	rows,
	patchNoteRows,
	selectedVariantId,
	wikiCode,
}: RiseopediaEntityFooterBlocksProps): JSX.Element | null {
	const variantScopedRows = useMemo(
		() => rows.filter((row) => dependencyRowMatchesSelectedVariant(row, selectedVariantId)),
		[rows, selectedVariantId],
	);
	const variantScopedPatchNoteRows = useMemo(
		() => patchNoteRows.filter((row) => patchNoteRowMatchesSelectedVariant(row, selectedVariantId)),
		[patchNoteRows, selectedVariantId],
	);
	const blockCodes = useMemo<FooterBlockCode[]>(() => {
		const dependencyBlockCodes = [
			...REQUIRED_DEPENDENCY_BLOCK_CODES,
			...variantScopedRows.map((row) => row.dependencyBlockCode),
		]
			.filter(isFooterBlockCode)
			.filter((blockCode) => blockCode !== PATCH_NOTES_BLOCK_CODE);
		const nextBlockCodes: FooterBlockCode[] = variantScopedPatchNoteRows.length > 0
			? [...dependencyBlockCodes, PATCH_NOTES_BLOCK_CODE]
			: dependencyBlockCodes;

		return [...new Set(nextBlockCodes)].sort((left, right) => {
			const leftRank = blockSortOrder(left);
			const rightRank = blockSortOrder(right);
			return leftRank === rightRank ? left.localeCompare(right) : leftRank - rightRank;
		});
	}, [variantScopedPatchNoteRows.length, variantScopedRows]);
	const [activeBlockCode, setActiveBlockCode] = useState<FooterBlockCode | null>(blockCodes[0] ?? null);
	const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
	const [patchNoteFilters, setPatchNoteFilters] = useState<PatchNoteFilterState>(INITIAL_PATCH_NOTE_FILTERS);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [dependencySort, setDependencySort] = useState<SortState<DependencySortKey>>(INITIAL_DEPENDENCY_SORT);
	const [patchNoteSort, setPatchNoteSort] = useState<SortState<PatchNoteSortKey>>(INITIAL_PATCH_NOTE_SORT);

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

	function updateDependencySort(sortKey: DependencySortKey, defaultDirection: SortDirection): void {
		setDependencySort((current) => nextSortState(current, sortKey, defaultDirection));
		setPage(1);
	}

	function updatePatchNoteSort(sortKey: PatchNoteSortKey, defaultDirection: SortDirection): void {
		setPatchNoteSort((current) => nextSortState(current, sortKey, defaultDirection));
		setPage(1);
	}

	const activeIsPatchNotes = isPatchNotesBlock(activeBlockCode);
	const rowsForActiveDependencyBlock = useMemo(
		() => activeBlockCode && !activeIsPatchNotes ? blockRows(variantScopedRows, activeBlockCode) : [],
		[activeBlockCode, activeIsPatchNotes, variantScopedRows],
	);
	const filteredRows = useMemo(
		() => rowsForActiveDependencyBlock.filter((row) => rowMatchesFilter(row, filters)),
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
	const activeRowsCount = activeIsPatchNotes ? sortedPatchNoteRows.length : sortedDependencyRows.length;
	const totalPages = Math.max(1, Math.ceil(activeRowsCount / pageSize));
	const currentPage = Math.min(page, totalPages);
	const activeBlockLabel = activeBlockCode ? blockLabel(activeBlockCode) : "Obtained from";

	if (!activeBlockCode) {
		return null;
	}

	return (
		<section className="riseopedia-dependency-footer" aria-label="Riseopedia dependency and patch notes explorer">
			<div className="riseopedia-dependency-footer__tabs" role="tablist" aria-label="Footer blocks">
				{blockCodes.map((blockCode) => (
					<Button
						key={blockCode}
						size="sm"
						variant={blockCode === activeBlockCode ? "accent" : "neutral"}
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
