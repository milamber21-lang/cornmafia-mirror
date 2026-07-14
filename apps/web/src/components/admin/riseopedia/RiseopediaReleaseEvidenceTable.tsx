//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaReleaseEvidenceTable.tsx                     ////
//// Language: TSX                                                                                               ////
//// Read-only Riseopedia release evidence admin diagnostics table.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { Dispatch, JSX, ReactNode, SetStateAction } from "react";
import { useCallback, useMemo, useState } from "react";

import AdminSortableTH from "@/components/admin/common/AdminSortableTH";
import {
	AlertBanner as TableAlertBanner,
	AdminTableFrame as TableAdminTableFrame,
	AdminTableSearchInput as TableAdminTableSearchInput,
	Button as TableButton,
	ButtonLink as TableButtonLink,
	DropdownMenuSingle as TableDropdownMenuSingle,
	Pagination as TablePagination,
	Table as TableElement,
	TBody as TableTBody,
	TD as TableTD,
	TH as TableTH,
	THead as TableTHead,
	TR as TableTR,
} from "@/components/ui";
import {
	applyAdminSortDirection as tableApplyAdminSortDirection,
	compareAdminText as tableCompareAdminText,
	getNextSortDirection as tableGetNextSortDirection,
	type SortDirection as TableSortDirection,
} from "@/lib/helpers/admin-table-sorting";

import type { RiseopediaAdminRows } from "./RiseopediaAdminTypes";

import {
	readRowValue as tableReadRowValue,
	toBoolean as tableToBoolean,
	toDisplayText as tableToDisplayText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminButtonVariant as TableButtonVariant,
	RiseopediaAdminColumnConfig as TableColumnConfig,
	RiseopediaAdminFilterConfig as TableFilterConfig,
	RiseopediaAdminFilterState as TableFilterState,
	RiseopediaAdminOption as TableOption,
	RiseopediaAdminReadOnlyActionContext as TableReadOnlyActionContext,
	RiseopediaAdminReadOnlyRowActionConfig as TableReadOnlyRowActionConfig,
	RiseopediaAdminRow as TableRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaReleaseEvidenceTableProps {
	initialRows: RiseopediaAdminRows;
}

export default function RiseopediaReleaseEvidenceTable({
	initialRows,
}: RiseopediaReleaseEvidenceTableProps): JSX.Element {
	return (
		<ReleaseEvidenceTableBody
			initialRows={initialRows}
			searchPlaceholder="Search release evidence"
			emptyText="No release evidence rows found."
			columns={[
				{ rowKey: "patch_code", label: "Patch" },
				{ rowKey: "entity_name", label: "Entity", strong: true },
				{ rowKey: "entity_type_code", label: "Type" },
				{ rowKey: "entity_class_name", label: "Class" },
				{ rowKey: "entity_category_name", label: "Category" },
				{ rowKey: "entity_subcategory_name", label: "Subcategory" },
				{ rowKey: "evidence_code", label: "Evidence" },
				{ rowKey: "severity_code", label: "Severity" },
				{ rowKey: "score_delta", label: "Score" },
			]}
		/>
	);
}

export { RiseopediaReleaseEvidenceTable };

interface ReleaseEvidenceTableBodyProps {
	initialRows: TableRow[];
	columns: TableColumnConfig[];
	searchPlaceholder: string;
	emptyText: string;
	defaultSortKey?: string;
	filters?: TableFilterConfig[];
	rowActions?: TableReadOnlyRowActionConfig[];
	toolbarLeft?: ReactNode;
	toolbarRight?: ReactNode;
	secondaryLeft?: ReactNode;
	secondaryCenter?: ReactNode;
	secondaryRight?: ReactNode;
	filtersPlacement?: "primaryLeft" | "secondaryLeft" | "secondaryCenter";
	initialSearch?: string;
	initialFilterState?: TableFilterState;
}

const RISEOPEDIA_OWNED_READ_ONLY_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const RISEOPEDIA_OWNED_READ_ONLY_EMPTY_FILTERS: TableFilterConfig[] = [];
const RISEOPEDIA_OWNED_READ_ONLY_EMPTY_ROW_ACTIONS: TableReadOnlyRowActionConfig[] =
	[];

function formatRiseopediaOwnedReadOnlyCell(
	row: TableRow,
	column: TableColumnConfig,
): string {
	const value = tableReadRowValue(row, column.rowKey);
	if (column.kind === "boolean") {
		return tableToBoolean(value) ? "Yes" : "No";
	}

	if (column.kind === "status") {
		return tableToBoolean(value) ? "Enabled" : "Disabled";
	}

	return tableToDisplayText(value);
}

function getRiseopediaOwnedReadOnlyColumnWidthClassName(
	column: TableColumnConfig,
): string {
	if (column.width === "narrow") {
		return "table-col table-col--w-8";
	}

	if (column.width === "compact") {
		return "table-col table-col--w-10";
	}

	if (column.width === "normal") {
		return "table-col table-col--w-12";
	}

	if (column.width === "wide") {
		return "table-col table-col--w-18";
	}

	if (column.width === "fluid") {
		return "table-col";
	}

	const key = column.rowKey.toLowerCase();
	const label = column.label.toLowerCase();
	if (
		column.kind === "boolean" ||
		column.kind === "count" ||
		column.kind === "status"
	) {
		return "table-col table-col--w-10";
	}

	if (
		column.strong === true ||
		key.includes("name") ||
		label.includes("name") ||
		label.includes("entity")
	) {
		return "table-col table-col--w-18";
	}

	if (key.includes("code") || key.includes("slug") || key.includes("type")) {
		return "table-col table-col--w-12";
	}

	return "table-col";
}

function renderRiseopediaOwnedReadOnlyColGroup(args: {
	columns: TableColumnConfig[];
	rowActions: TableReadOnlyRowActionConfig[];
}): JSX.Element {
	return (
		<colgroup>
			{args.columns.map((column) => (
				<col
					key={`data-${column.rowKey}`}
					className={getRiseopediaOwnedReadOnlyColumnWidthClassName(column)}
				/>
			))}
			{args.rowActions.map((action) => (
				<col
					key={`row-action-${action.columnLabel ?? (typeof action.label === "string" ? action.label : "row")}`}
					className="table-col table-col--w-10"
				/>
			))}
		</colgroup>
	);
}

function getRiseopediaOwnedReadOnlyRowSearchText(
	row: TableRow,
	columns: TableColumnConfig[],
): string {
	return columns
		.filter((column) => column.searchable !== false)
		.map((column) => formatRiseopediaOwnedReadOnlyCell(row, column))
		.join(" ")
		.toLowerCase();
}

function buildRiseopediaOwnedReadOnlyInitialFilterState(
	filters: TableFilterConfig[],
): TableFilterState {
	const state: TableFilterState = {};
	for (const filter of filters) {
		state[filter.key] = "";
	}
	return state;
}

function riseopediaOwnedReadOnlyFilterValueMatches(
	rowValue: unknown,
	selectedValue: string,
): boolean {
	if (!selectedValue) {
		return true;
	}

	if (typeof rowValue === "boolean") {
		const normalizedSelectedValue = selectedValue.trim().toLowerCase();
		if (rowValue) {
			return ["true", "yes", "enabled", "active", "1"].includes(
				normalizedSelectedValue,
			);
		}

		return ["false", "no", "disabled", "inactive", "0"].includes(
			normalizedSelectedValue,
		);
	}

	return tableToDisplayText(rowValue) === selectedValue;
}

function riseopediaOwnedReadOnlyMatchesFilters(
	row: TableRow,
	filters: TableFilterConfig[],
	filterState: TableFilterState,
): boolean {
	for (const filter of filters) {
		const selectedValue = filterState[filter.key] ?? "";
		if (
			!riseopediaOwnedReadOnlyFilterValueMatches(
				tableReadRowValue(row, filter.rowKey),
				selectedValue,
			)
		) {
			return false;
		}
	}

	return true;
}

function getRiseopediaOwnedReadOnlyFilterOptions(
	filter: TableFilterConfig,
	filterState: TableFilterState,
): TableOption[] {
	return filter.optionsBuilder
		? filter.optionsBuilder(filterState)
		: (filter.options ?? []);
}

function renderRiseopediaOwnedReadOnlyFilterControlItems(args: {
	filters: TableFilterConfig[];
	filterState: TableFilterState;
	setFilterState: Dispatch<SetStateAction<TableFilterState>>;
	setPage: Dispatch<SetStateAction<number>>;
}): ReactNode {
	if (args.filters.length === 0) {
		return null;
	}

	return args.filters.map((filter) => (
		<TableDropdownMenuSingle
			key={filter.key}
			className="admin-table-filter-control admin-table-filter-control--compact admin-table-filter-control--flexible"
			options={getRiseopediaOwnedReadOnlyFilterOptions(filter, args.filterState)}
			value={args.filterState[filter.key] ?? ""}
			placeholder={filter.placeholder ?? filter.clearLabel}
			ariaLabel={filter.label}
			allowClear
			clearLabel={filter.clearLabel}
			onChange={(nextValue) => {
				args.setFilterState((currentState) => {
					const nextState = {
						...currentState,
						[filter.key]: nextValue,
					};

					for (const key of filter.clearKeysOnChange ?? []) {
						nextState[key] = "";
					}

					return nextState;
				});
				args.setPage(1);
			}}
		/>
	));
}

function renderRiseopediaOwnedReadOnlyToolbarCluster(
	content: ReactNode,
): JSX.Element | null {
	if (!content) {
		return null;
	}

	return (
		<div className="admin-table-toolbar-filter admin-table-toolbar-filter--riseopedia">
			{content}
		</div>
	);
}

function combineRiseopediaOwnedReadOnlyToolbarContent(
	primary: ReactNode,
	secondary: ReactNode,
): ReactNode {
	if (primary && secondary) {
		return renderRiseopediaOwnedReadOnlyToolbarCluster(
			<>
				{primary}
				{secondary}
			</>,
		);
	}

	return primary ?? renderRiseopediaOwnedReadOnlyToolbarCluster(secondary);
}

function getRiseopediaOwnedReadOnlyStableRowKey(
	row: TableRow,
	index: number,
): string {
	const preferredKeys = [
		"release_decision_id",
		"release_evidence_id",
		"entity_release_override_id",
		"entity_id",
		"patch_id",
	] as const;

	const parts = preferredKeys
		.map((key) => tableToDisplayText(tableReadRowValue(row, key)).trim())
		.filter((value) => value.length > 0);

	return parts.length > 0 ? parts.join("-") : String(index);
}

function getRiseopediaOwnedReadOnlyActionVariant(
	action: TableReadOnlyRowActionConfig,
	row: TableRow,
): TableButtonVariant {
	return typeof action.variant === "function"
		? action.variant(row)
		: (action.variant ?? "secondary");
}

function ReleaseEvidenceTableBody({
	initialRows,
	columns,
	searchPlaceholder,
	emptyText,
	defaultSortKey,
	filters = RISEOPEDIA_OWNED_READ_ONLY_EMPTY_FILTERS,
	rowActions = RISEOPEDIA_OWNED_READ_ONLY_EMPTY_ROW_ACTIONS,
	toolbarLeft,
	toolbarRight,
	secondaryLeft,
	secondaryCenter,
	secondaryRight,
	filtersPlacement = "secondaryLeft",
	initialSearch = "",
	initialFilterState,
}: ReleaseEvidenceTableBodyProps): JSX.Element {
	const [search, setSearch] = useState(initialSearch);
	const [filterState, setFilterState] = useState<TableFilterState>(() => ({
		...buildRiseopediaOwnedReadOnlyInitialFilterState(filters),
		...(initialFilterState ?? {}),
	}));
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<string>(
		defaultSortKey ?? columns[0]?.rowKey ?? "row",
	);
	const [sortDirection, setSortDirection] = useState<TableSortDirection>("asc");
	const [busyRowKey, setBusyRowKey] = useState<string | null>(null);
	const [error, setError] = useState("");
	const filterControlItems = renderRiseopediaOwnedReadOnlyFilterControlItems({
		filters,
		filterState,
		setFilterState,
		setPage,
	});
	const primaryLeft =
		filtersPlacement === "primaryLeft"
			? combineRiseopediaOwnedReadOnlyToolbarContent(
					toolbarLeft,
					filterControlItems,
				)
			: toolbarLeft;
	const primaryRight = toolbarRight ?? null;
	const secondaryLeftContent =
		filtersPlacement === "secondaryLeft"
			? renderRiseopediaOwnedReadOnlyToolbarCluster(filterControlItems)
			: secondaryLeft;
	const secondaryCenterContent =
		filtersPlacement === "secondaryCenter"
			? renderRiseopediaOwnedReadOnlyToolbarCluster(filterControlItems)
			: secondaryCenter;
	const hasSecondaryToolbar = Boolean(
		secondaryLeftContent || secondaryCenterContent || secondaryRight,
	);
	const secondaryToolbarClassName =
		filtersPlacement === "secondaryLeft"
			? "admin-table-toolbar admin-table-toolbar--secondary admin-table-toolbar--secondary-left"
			: "admin-table-toolbar admin-table-toolbar--secondary";
	const actionContext = useMemo<TableReadOnlyActionContext>(
		() => ({
			search,
			filterState,
		}),
		[filterState, search],
	);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = initialRows.filter((row) => {
			if (!riseopediaOwnedReadOnlyMatchesFilters(row, filters, filterState)) {
				return false;
			}

			return normalizedSearch
				? getRiseopediaOwnedReadOnlyRowSearchText(row, columns).includes(
						normalizedSearch,
					)
				: true;
		});

		return nextRows.slice().sort((left, right) => {
			const comparison = tableCompareAdminText(
				formatRiseopediaOwnedReadOnlyCell(left, {
					rowKey: sortKey,
					label: sortKey,
				}),
				formatRiseopediaOwnedReadOnlyCell(right, {
					rowKey: sortKey,
					label: sortKey,
				}),
			);

			return tableApplyAdminSortDirection(comparison, sortDirection);
		});
	}, [
		columns,
		filterState,
		filters,
		initialRows,
		search,
		sortDirection,
		sortKey,
	]);

	const pageRows = useMemo(() => {
		const startIndex = (page - 1) * pageSize;
		return filteredRows.slice(startIndex, startIndex + pageSize);
	}, [filteredRows, page, pageSize]);

	const runRowAction = useCallback(
		async (
			row: TableRow,
			action: TableReadOnlyRowActionConfig,
			rowKey: string,
		): Promise<void> => {
			if (busyRowKey) {
				return;
			}

			setBusyRowKey(rowKey);
			setError("");

			if (!action.onClick) {
				setBusyRowKey(null);
				return;
			}

			try {
				await action.onClick(row);
			} catch (actionError: unknown) {
				setError(
					actionError instanceof Error
						? actionError.message
						: "Failed to run Riseopedia row action.",
				);
			} finally {
				setBusyRowKey(null);
			}
		},
		[busyRowKey],
	);

	return (
		<div className="admin-table-stack">
			<div className="admin-table-toolbar">
				<div className="admin-table-toolbar-nav">
					{primaryLeft ?? (
						<div
							className="admin-table-toolbar-spacer admin-table-toolbar-spacer--action"
							aria-hidden="true"
						/>
					)}
				</div>

				<div className="admin-table-toolbar-search">
					<TableAdminTableSearchInput
						placeholder={searchPlaceholder}
						value={search}
						onChange={(event) => {
							setSearch(event.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="admin-table-toolbar-action">
					{primaryRight ?? (
						<div
							className="admin-table-toolbar-spacer admin-table-toolbar-spacer--action"
							aria-hidden="true"
						/>
					)}
				</div>
			</div>

			{hasSecondaryToolbar ? (
				<div className={secondaryToolbarClassName}>
					<div className="admin-table-toolbar-nav">{secondaryLeftContent}</div>
					<div className="admin-table-toolbar-search">{secondaryCenterContent}</div>
					<div className="admin-table-toolbar-action">{secondaryRight}</div>
				</div>
			) : null}

			{error ? <TableAlertBanner tone="error">{error}</TableAlertBanner> : null}

			<TableAdminTableFrame>
				<TableElement className="admin-data-table">
					{renderRiseopediaOwnedReadOnlyColGroup({ columns, rowActions })}
					<TableTHead>
						<TableTR>
							{columns.map((column) =>
								column.sortable === false || column.kind === "status" ? (
									<TableTH key={column.rowKey} className="admin-table-cell--center">
										{column.label}
									</TableTH>
								) : (
									<AdminSortableTH
										key={column.rowKey}
										className="admin-table-cell--center"
										label={column.label}
										sortKey={column.rowKey}
										activeSortKey={sortKey}
										sortDirection={sortDirection}
										onSortChange={(nextSortKey) => {
											setSortDirection((currentDirection) =>
												tableGetNextSortDirection(
													sortKey === nextSortKey,
													currentDirection,
												),
											);
											setSortKey(nextSortKey);
											setPage(1);
										}}
									/>
								),
							)}
							{rowActions.map((action) => (
								<TableTH
									key={`action-${action.columnLabel ?? (typeof action.label === "string" ? action.label : "row")}`}
									className="admin-table-cell--center"
								>
									{action.columnLabel ?? "Action"}
								</TableTH>
							))}
						</TableTR>
					</TableTHead>
					<TableTBody>
						{pageRows.length > 0 ? (
							pageRows.map((row, index) => {
								const rowKey = getRiseopediaOwnedReadOnlyStableRowKey(row, index);
								const disabled = busyRowKey === rowKey;

								return (
									<TableTR key={rowKey}>
										{columns.map((column) => (
											<TableTD key={column.rowKey} className="admin-table-cell--center">
												{formatRiseopediaOwnedReadOnlyCell(row, column)}
											</TableTD>
										))}
										{rowActions.map((action) => {
											const label =
												typeof action.label === "function"
													? action.label(row)
													: action.label;
											const visible = action.isVisible ? action.isVisible(row) : true;
											return (
												<TableTD
													key={`${rowKey}-${action.columnLabel ?? label}`}
													className="admin-table-cell--center"
												>
													{visible ? (
														action.href ? (
															<TableButtonLink
																href={action.href(row, actionContext)}
																variant={getRiseopediaOwnedReadOnlyActionVariant(action, row)}
															>
																{label}
															</TableButtonLink>
														) : (
															<TableButton
																variant={getRiseopediaOwnedReadOnlyActionVariant(action, row)}
																disabled={disabled}
																onClick={() => void runRowAction(row, action, rowKey)}
																aria-label={action.ariaLabel ? action.ariaLabel(row) : label}
															>
																{label}
															</TableButton>
														)
													) : null}
												</TableTD>
											);
										})}
									</TableTR>
								);
							})
						) : (
							<TableTR>
								<TableTD
									colSpan={columns.length + rowActions.length}
									className="admin-table-empty-cell"
								>
									{emptyText}
								</TableTD>
							</TableTR>
						)}
					</TableTBody>
				</TableElement>
			</TableAdminTableFrame>

			<TablePagination
				page={page}
				pageSize={pageSize}
				total={filteredRows.length}
				pageSizeOptions={[...RISEOPEDIA_OWNED_READ_ONLY_PAGE_SIZE_OPTIONS]}
				onPageChange={setPage}
				onPageSizeChange={(nextPageSize) => {
					setPageSize(nextPageSize);
					setPage(1);
				}}
			/>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
