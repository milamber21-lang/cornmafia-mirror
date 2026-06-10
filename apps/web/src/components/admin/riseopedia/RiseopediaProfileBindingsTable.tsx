//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBindingsTable.tsx                     ////
//// Language: TSX                                                                                               ////
//// Table-owned Riseopedia profile binding admin list.                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { Dispatch, JSX, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { confirmAction as tableConfirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection as tableApplyAdminSortDirection,
	compareAdminText as tableCompareAdminText,
	getNextSortDirection as tableGetNextSortDirection,
	type SortDirection as TableSortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage as tableReadResponseMessage } from "@/lib/helpers/http-response";

import type {
	RiseopediaAdminMeta,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";
import RiseopediaProfileBindingsPanel from "./RiseopediaProfileBindingsPanel";
import {
	buildRiseopediaProfileBindingFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import {
	ADMIN_NOTE_FIELD,
	BOOLEAN_ACTIVE_FIELD,
	activeFilter,
	buildScopedProfileOptions,
	classificationFields,
	entityTypeFilter,
	idText,
} from "./RiseopediaAdminConfigHelpers";

import {
	buildInitialValues as tableBuildInitialValues,
	buildPayloadData as tableBuildPayloadData,
	readRowValue as tableReadRowValue,
	toBoolean as tableToBoolean,
	toDisplayText as tableToDisplayText,
	toRowKey as tableToRowKey,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminColumnConfig as TableColumnConfig,
	RiseopediaAdminFieldConfig as TableFieldConfig,
	RiseopediaAdminFieldsBuilder,
	RiseopediaAdminFilterConfig as TableFilterConfig,
	RiseopediaAdminFilterState as TableFilterState,
	RiseopediaAdminOption as TableOption,
	RiseopediaAdminRow as TableRow,
	RiseopediaAdminRowActionConfig as TableRowActionConfig,
} from "./RiseopediaAdminTypes";

export interface ProfileScopedProps {
	initialRows: RiseopediaAdminRows;
	displayProfiles: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
	allBindings?: RiseopediaAdminRows;
}

export default function RiseopediaProfileBindingsTable({ initialRows, displayProfiles, meta, displayProfile }: ProfileScopedProps): JSX.Element {
	const scopedProfileId = displayProfile ? idText(displayProfile.display_profile_id) : "";

	return (
		<ProfileBindingsTableBody
			initialRows={initialRows}
			apiPath={displayProfile ? `/api/admin/riseopedia/profile-bindings?displayProfileId=${scopedProfileId}` : "/api/admin/riseopedia/profile-bindings"}
			idKey="display_profile_binding_id"
			searchPlaceholder="Search profile bindings"
			createLabel="Create binding"
			deleteConfirmTitle="Delete profile binding"
			deleteConfirmMessage={() => "Delete this profile binding?"}
			emptyText="No profile bindings found."
			defaultSortKey="priority_order"
			filters={[entityTypeFilter(meta), activeFilter()]}
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "entity_type_name", label: "Type" },
				{ rowKey: "entity_class_name", label: "Class" },
				{ rowKey: "entity_category_name", label: "Category" },
				{ rowKey: "priority_order", label: "Priority" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={buildRiseopediaProfileBindingFields({ displayProfiles, displayProfile, meta })}
			renderPanel={({ open, mode, row, rows, onClose, onSaved }) => (
				<RiseopediaProfileBindingsPanel
					open={open}
					mode={mode}
					row={row}
						displayProfiles={displayProfiles}
						meta={meta}
						displayProfile={displayProfile}
					onClose={onClose}
					onSaved={onSaved}
				/>
			)}
		/>
	);
}

export { RiseopediaProfileBindingsTable };

type RiseopediaOwnedPanelMode = "create" | "edit";

type RiseopediaOwnedRowsResponse = {
	rows?: TableRow[];
};

type RiseopediaOwnedPanelRenderArgs = {
	open: boolean;
	mode: RiseopediaOwnedPanelMode;
	row: TableRow | null;
	rows: TableRow[];
	onClose: () => void;
	onSaved: () => void | Promise<void>;
};

interface ProfileBindingsTableBodyProps {
	initialRows: TableRow[];
	apiPath: string;
	idKey: string;
	columns: TableColumnConfig[];
	fields: TableFieldConfig[];
	searchPlaceholder: string;
	createLabel: string;
	deleteConfirmTitle: string;
	deleteConfirmMessage: (row: TableRow) => string;
	emptyText: string;
	upsertOp?: string;
	deleteOp?: string;
	defaultSortKey?: string;
	filters?: TableFilterConfig[];
	rowActions?: TableRowActionConfig[];
	fieldsBuilder?: RiseopediaAdminFieldsBuilder;
	toolbarLeft?: ReactNode;
	secondaryLeft?: ReactNode;
	secondaryCenter?: ReactNode;
	secondaryRight?: ReactNode;
	filtersPlacement?: "primaryLeft" | "secondaryLeft" | "secondaryCenter";
	renderPanel: (args: RiseopediaOwnedPanelRenderArgs) => JSX.Element | null;
}

const RISEOPEDIA_OWNED_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const RISEOPEDIA_OWNED_EMPTY_FILTERS: TableFilterConfig[] = [];

function getRiseopediaOwnedCellClassName(column: TableColumnConfig): string {
	return column.strong === true
		? "admin-table-cell--center admin-table-cell--strong"
		: "admin-table-cell--center";
}

function formatRiseopediaOwnedCell(row: TableRow, column: TableColumnConfig): string {
	const value = tableReadRowValue(row, column.rowKey);
	if (column.kind === "boolean") {
		return tableToBoolean(value) ? "Yes" : "No";
	}

	if (column.kind === "status") {
		return tableToBoolean(value) ? "Enabled" : "Disabled";
	}

	return tableToDisplayText(value);
}

function getRiseopediaOwnedStatusColumns(columns: TableColumnConfig[]): TableColumnConfig[] {
	return columns.filter((column) => column.kind === "status");
}

function getRiseopediaOwnedDataColumns(columns: TableColumnConfig[]): TableColumnConfig[] {
	return columns.filter((column) => column.kind !== "status");
}

function getRiseopediaOwnedColumnWidthClassName(column: TableColumnConfig): string {
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
	if (column.kind === "boolean" || column.kind === "count" || column.kind === "status") {
		return "table-col table-col--w-10";
	}

	if (column.strong === true || key.includes("name") || label.includes("name") || label.includes("profile")) {
		return "table-col table-col--w-18";
	}

	if (key.includes("code") || key.includes("slug") || key.includes("type")) {
		return "table-col table-col--w-12";
	}

	return "table-col";
}

function renderRiseopediaOwnedColGroup(args: {
	dataColumns: TableColumnConfig[];
	statusColumns: TableColumnConfig[];
	rowActions: TableRowActionConfig[];
}): JSX.Element {
	return (
		<colgroup>
			{args.dataColumns.map((column) => (
				<col key={`data-${column.rowKey}`} className={getRiseopediaOwnedColumnWidthClassName(column)} />
			))}
			{args.statusColumns.map((column) => (
				<col key={`status-${column.rowKey}`} className="table-col table-col--w-10" />
			))}
			<col className="table-col table-col--w-10" />
			{args.rowActions.map((action) => (
				<col key={`row-action-${action.label}`} className="table-col table-col--w-10" />
			))}
			<col className="table-col table-col--w-10" />
		</colgroup>
	);
}

function getRiseopediaOwnedRowSearchText(row: TableRow, columns: TableColumnConfig[]): string {
	return columns
		.filter((column) => column.searchable !== false)
		.map((column) => formatRiseopediaOwnedCell(row, column))
		.join(" ")
		.toLowerCase();
}

function buildRiseopediaOwnedInitialFilterState(filters: TableFilterConfig[]): TableFilterState {
	const state: TableFilterState = {};
	for (const filter of filters) {
		state[filter.key] = "";
	}
	return state;
}

function riseopediaOwnedFilterValueMatches(rowValue: unknown, selectedValue: string): boolean {
	if (!selectedValue) {
		return true;
	}

	if (typeof rowValue === "boolean") {
		const normalizedSelectedValue = selectedValue.trim().toLowerCase();
		if (rowValue) {
			return ["true", "yes", "enabled", "active", "1"].includes(normalizedSelectedValue);
		}

		return ["false", "no", "disabled", "inactive", "0"].includes(normalizedSelectedValue);
	}

	return tableToDisplayText(rowValue) === selectedValue;
}

function riseopediaOwnedMatchesFilters(
	row: TableRow,
	filters: TableFilterConfig[],
	filterState: TableFilterState,
): boolean {
	for (const filter of filters) {
		const selectedValue = filterState[filter.key] ?? "";
		if (!riseopediaOwnedFilterValueMatches(tableReadRowValue(row, filter.rowKey), selectedValue)) {
			return false;
		}
	}

	return true;
}

function getRiseopediaOwnedFilterOptions(
	filter: TableFilterConfig,
	filterState: TableFilterState,
): TableOption[] {
	return filter.optionsBuilder ? filter.optionsBuilder(filterState) : filter.options ?? [];
}

function renderRiseopediaOwnedFilterControlItems(args: {
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
			options={getRiseopediaOwnedFilterOptions(filter, args.filterState)}
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

function renderRiseopediaOwnedToolbarCluster(content: ReactNode): JSX.Element | null {
	if (!content) {
		return null;
	}

	return <div className="admin-table-toolbar-filter admin-table-toolbar-filter--riseopedia">{content}</div>;
}

function combineRiseopediaOwnedToolbarContent(primary: ReactNode, secondary: ReactNode): ReactNode {
	if (primary && secondary) {
		return renderRiseopediaOwnedToolbarCluster(
			<>
				{primary}
				{secondary}
			</>,
		);
	}

	return primary ?? renderRiseopediaOwnedToolbarCluster(secondary);
}

function ProfileBindingsTableBody({
	initialRows,
	apiPath,
	idKey,
	columns,
	fields,
	searchPlaceholder,
	createLabel,
	deleteConfirmTitle,
	deleteConfirmMessage,
	emptyText,
	upsertOp = "upsert",
	deleteOp = "delete",
	defaultSortKey,
	filters = RISEOPEDIA_OWNED_EMPTY_FILTERS,
	rowActions = [],
	fieldsBuilder,
	toolbarLeft,
	secondaryLeft,
	secondaryCenter,
	secondaryRight,
	filtersPlacement = "secondaryLeft",
	renderPanel,
}: ProfileBindingsTableBodyProps): JSX.Element {
	const [rows, setRows] = useState<TableRow[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filterState, setFilterState] = useState<TableFilterState>(() => buildRiseopediaOwnedInitialFilterState(filters));
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<RiseopediaOwnedPanelMode>("create");
	const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? columns[0]?.rowKey ?? idKey);
	const [sortDirection, setSortDirection] = useState<TableSortDirection>("asc");
	const rowActionColumnCount = rowActions.length;
	const statusColumns = useMemo(() => getRiseopediaOwnedStatusColumns(columns), [columns]);
	const dataColumns = useMemo(() => getRiseopediaOwnedDataColumns(columns), [columns]);
	const filterControlItems = renderRiseopediaOwnedFilterControlItems({ filters, filterState, setFilterState, setPage });
	const primaryLeft = filtersPlacement === "primaryLeft"
		? combineRiseopediaOwnedToolbarContent(toolbarLeft, filterControlItems)
		: toolbarLeft;
	const secondaryLeftContent = filtersPlacement === "secondaryLeft"
		? renderRiseopediaOwnedToolbarCluster(filterControlItems)
		: secondaryLeft;
	const secondaryCenterContent = filtersPlacement === "secondaryCenter"
		? renderRiseopediaOwnedToolbarCluster(filterControlItems)
		: secondaryCenter;
	const hasSecondaryToolbar = Boolean(secondaryLeftContent || secondaryCenterContent || secondaryRight);
	const secondaryToolbarClassName = filtersPlacement === "secondaryLeft"
		? "admin-table-toolbar admin-table-toolbar--secondary admin-table-toolbar--secondary-left"
		: "admin-table-toolbar admin-table-toolbar--secondary";

	const buildFieldsFor = useCallback(
		(mode: RiseopediaOwnedPanelMode, row: TableRow | null): TableFieldConfig[] =>
			fieldsBuilder ? fieldsBuilder({ mode, row, rows }) : fields,
		[fields, fieldsBuilder, rows],
	);


	useEffect(() => {
		setFilterState((currentState) => {
			const nextState = buildRiseopediaOwnedInitialFilterState(filters);
			for (const filter of filters) {
				nextState[filter.key] = currentState[filter.key] ?? "";
			}
			return nextState;
		});
	}, [filters]);

	const handleSortChange = useCallback(
		(nextSortKey: string): void => {
			setSortDirection((currentDirection) =>
				tableGetNextSortDirection(sortKey === nextSortKey, currentDirection),
			);
			setSortKey(nextSortKey);
			setPage(1);
		},
		[sortKey],
	);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = rows.filter((row) => {
			if (!riseopediaOwnedMatchesFilters(row, filters, filterState)) {
				return false;
			}

			return normalizedSearch
				? getRiseopediaOwnedRowSearchText(row, columns).includes(normalizedSearch)
				: true;
		});

		return nextRows.slice().sort((left, right) => {
			const comparison = tableCompareAdminText(
				formatRiseopediaOwnedCell(left, { rowKey: sortKey, label: sortKey }),
				formatRiseopediaOwnedCell(right, { rowKey: sortKey, label: sortKey }),
			);

			return tableApplyAdminSortDirection(comparison, sortDirection);
		});
	}, [columns, filterState, filters, rows, search, sortDirection, sortKey]);

	const total = filteredRows.length;

	const pageRows = useMemo(() => {
		const startIndex = (page - 1) * pageSize;
		return filteredRows.slice(startIndex, startIndex + pageSize);
	}, [filteredRows, page, pageSize]);

	useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	const refreshFromServer = useCallback(async (): Promise<void> => {
		setError("");

		const response = await fetch(apiPath, { cache: "no-store" });
		if (!response.ok) {
			throw new Error(
				await tableReadResponseMessage(response, "Failed to refresh Riseopedia rows."),
			);
		}

		const payload = (await response.json()) as RiseopediaOwnedRowsResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, [apiPath]);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh Riseopedia rows.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: TableRow): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleStatus = useCallback(
		async (row: TableRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const rowId = tableToRowKey(tableReadRowValue(row, idKey));
			const effectiveFields = buildFieldsFor("edit", row);
			const values = tableBuildInitialValues(effectiveFields, row);
			const currentEnabled = tableToBoolean(tableReadRowValue(row, "active_flag"));
			values.active = !currentEnabled;
			if (Object.prototype.hasOwnProperty.call(values, "publicationStatusCode")) {
				values.publicationStatusCode = currentEnabled ? "disabled" : "active";
			}

			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: upsertOp,
						id: tableReadRowValue(row, idKey),
						data: tableBuildPayloadData(effectiveFields, values),
					}),
				});

				if (!response.ok) {
					throw new Error(
						await tableReadResponseMessage(response, "Failed to update Riseopedia row status."),
					);
				}

				await refreshFromServer();
			} catch (statusError: unknown) {
				setError(
					statusError instanceof Error
						? statusError.message
						: "Failed to update Riseopedia row status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[apiPath, buildFieldsFor, busyId, idKey, refreshFromServer, upsertOp],
	);

	const deleteRow = useCallback(
		async (row: TableRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const rowId = tableToRowKey(tableReadRowValue(row, idKey));
			const confirmed = await tableConfirmAction({
				title: deleteConfirmTitle,
				message: deleteConfirmMessage(row),
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: deleteOp, id: tableReadRowValue(row, idKey) }),
				});

				if (!response.ok) {
					throw new Error(
						await tableReadResponseMessage(response, "Failed to delete Riseopedia row."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete Riseopedia row.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[apiPath, busyId, deleteConfirmMessage, deleteConfirmTitle, deleteOp, idKey, refreshFromServer],
	);

	const runColumnAction = useCallback(
		async (row: TableRow, column: TableColumnConfig): Promise<void> => {
			if (busyId || !column.actionOp) {
				return;
			}

			const rowId = tableToRowKey(tableReadRowValue(row, idKey));
			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: column.actionOp, id: tableReadRowValue(row, idKey) }),
				});

				if (!response.ok) {
					throw new Error(
						await tableReadResponseMessage(response, "Failed to update Riseopedia row."),
					);
				}

				await refreshFromServer();
			} catch (actionError: unknown) {
				setError(
					actionError instanceof Error
						? actionError.message
						: "Failed to update Riseopedia row.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[apiPath, busyId, idKey, refreshFromServer],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-nav">
						{primaryLeft ?? <div className="admin-table-toolbar-spacer admin-table-toolbar-spacer--action" aria-hidden="true" />}
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
						<TableButton variant="green" onClick={openCreate}>
							{createLabel}
						</TableButton>
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
						{renderRiseopediaOwnedColGroup({ dataColumns, statusColumns, rowActions })}
						<TableTHead>
							<TableTR>
								{dataColumns.map((column) =>
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
											onSortChange={handleSortChange}
										/>
									),
								)}
								{statusColumns.map((column) => (
									<TableTH key={column.rowKey} className="admin-table-cell--center">
										{column.label}
									</TableTH>
								))}
								<TableTH className="admin-table-cell--center">Delete</TableTH>
								{rowActions.map((action) => (
									<TableTH key={`action-${action.label}`} className="admin-table-cell--center">
										{action.label}
									</TableTH>
								))}
								<TableTH className="admin-table-cell--center">Action</TableTH>
							</TableTR>
						</TableTHead>

						<TableTBody>
							{pageRows.map((row) => {
								const rowId = tableToRowKey(tableReadRowValue(row, idKey));
								const disabled = busyId === rowId;

								return (
									<TableTR key={rowId}>
										{dataColumns.map((column) => (
											<TableTD key={column.rowKey} className={getRiseopediaOwnedCellClassName(column)}>
												{column.kind === "patchChannel" ? (
													<TableButton
														variant={tableToDisplayText(tableReadRowValue(row, "channel_code")).trim() === "stable" ? "green" : "neutral"}
														disabled={disabled}
														onClick={() => void runColumnAction(row, column)}
													>
														{formatRiseopediaOwnedCell(row, column)}
													</TableButton>
												) : (
													formatRiseopediaOwnedCell(row, column)
												)}
											</TableTD>
										))}
										{statusColumns.map((column) => {
											const enabled = tableToBoolean(tableReadRowValue(row, column.rowKey));
											return (
												<TableTD key={column.rowKey} className="admin-table-cell--center">
													<TableButton
														variant={enabled ? "green" : "neutral"}
														disabled={disabled}
														onClick={() => void toggleStatus(row)}
														aria-label={enabled ? "Enabled" : "Disabled"}
													>
														{enabled ? "Enabled" : "Disabled"}
													</TableButton>
												</TableTD>
											);
										})}
										<TableTD className="admin-table-cell--center">
											<TableButton
												variant="accent"
												disabled={disabled}
												loading={disabled}
												onClick={() => void deleteRow(row)}
											>
												Delete
											</TableButton>
										</TableTD>
										{rowActions.map((action) => (
											<TableTD key={`${rowId}-${action.label}`} className="admin-table-cell--center">
												<TableButtonLink
													href={action.href(row)}
													variant={action.variant ?? "neutral"}
												>
													{action.label}
												</TableButtonLink>
											</TableTD>
										))}
										<TableTD className="admin-table-cell--center">
											<TableButton
												variant="neutral"
												disabled={disabled}
												onClick={() => openEdit(row)}
											>
												Edit
											</TableButton>
										</TableTD>
									</TableTR>
								);
							})}

							{pageRows.length === 0 ? (
								<TableTR>
									<TableTD
										colSpan={columns.length + 2 + rowActionColumnCount}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										{emptyText}
									</TableTD>
								</TableTR>
							) : null}
						</TableTBody>
					</TableElement>
				</TableAdminTableFrame>

				<TablePagination
					total={total}
					page={page}
					pageSize={pageSize}
					onPageChange={(nextPage) => setPage(nextPage)}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPage(1);
					}}
					pageSizeOptions={[...RISEOPEDIA_OWNED_PAGE_SIZE_OPTIONS]}
				/>
			</div>

			{renderPanel({
				open: panelOpen,
				mode: panelMode,
				row: selectedRow,
				rows,
				onClose: closePanel,
				onSaved: handleSaved,
			})}
		</>
	);
}

