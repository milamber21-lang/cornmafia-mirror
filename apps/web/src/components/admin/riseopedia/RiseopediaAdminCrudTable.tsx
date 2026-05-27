//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminCrudTable.tsx                                 ////
//// Language: TSX                                                                                               ////
//// Shared small-list table for Riseopedia admin configuration families.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminSortableTH from "@/components/admin/common/AdminSortableTH";
import {
	AlertBanner,
	AdminTableFrame,
	AdminTableSearchInput,
	Button,
	ButtonLink,
	DropdownMenuSingle,
	Pagination,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	buildInitialValues,
	buildPayloadData,
	readRowValue,
	toBoolean,
	toDisplayText,
	toRowKey,
} from "./RiseopediaAdminHelpers";
import RiseopediaAdminCrudPanel from "./RiseopediaAdminCrudPanel";
import type {
	RiseopediaAdminColumnConfig,
	RiseopediaAdminFieldConfig,
	RiseopediaAdminFilterConfig,
	RiseopediaAdminRow,
	RiseopediaAdminRowActionConfig,
} from "./RiseopediaAdminTypes";

type PanelMode = "create" | "edit";

type RiseopediaRowsResponse = {
	rows?: RiseopediaAdminRow[];
};

type FilterState = {
	[key: string]: string;
};

export type RiseopediaAdminFieldsBuilder = (args: {
	mode: PanelMode;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
}) => RiseopediaAdminFieldConfig[];

export interface RiseopediaAdminCrudTableProps {
	initialRows: RiseopediaAdminRow[];
	apiPath: string;
	idKey: string;
	columns: RiseopediaAdminColumnConfig[];
	fields: RiseopediaAdminFieldConfig[];
	searchPlaceholder: string;
	createLabel: string;
	titleCreate: string;
	titleEdit: string;
	deleteLabel: string;
	deleteConfirmTitle: string;
	deleteConfirmMessage: (row: RiseopediaAdminRow) => string;
	emptyText: string;
	upsertOp?: string;
	deleteOp?: string;
	defaultSortKey?: string;
	filters?: RiseopediaAdminFilterConfig[];
	rowActions?: RiseopediaAdminRowActionConfig[];
	fieldsBuilder?: RiseopediaAdminFieldsBuilder;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const EMPTY_FILTERS: RiseopediaAdminFilterConfig[] = [];

function getCellClassName(column: RiseopediaAdminColumnConfig): string {
	return column.strong === true
		? "admin-table-cell--center admin-table-cell--strong"
		: "admin-table-cell--center";
}

function formatCell(row: RiseopediaAdminRow, column: RiseopediaAdminColumnConfig): string {
	const value = readRowValue(row, column.rowKey);
	if (column.kind === "boolean") {
		return toBoolean(value) ? "Yes" : "No";
	}

	if (column.kind === "status") {
		return toBoolean(value) ? "Active" : "Inactive";
	}

	return toDisplayText(value);
}

function getRowSearchText(
	row: RiseopediaAdminRow,
	columns: RiseopediaAdminColumnConfig[],
): string {
	return columns
		.filter((column) => column.searchable !== false)
		.map((column) => formatCell(row, column))
		.join(" ")
		.toLowerCase();
}

function buildInitialFilterState(filters: RiseopediaAdminFilterConfig[]): FilterState {
	const state: FilterState = {};
	for (const filter of filters) {
		state[filter.key] = "";
	}
	return state;
}

function matchesFilters(
	row: RiseopediaAdminRow,
	filters: RiseopediaAdminFilterConfig[],
	filterState: FilterState,
): boolean {
	for (const filter of filters) {
		const selectedValue = filterState[filter.key] ?? "";
		if (!selectedValue) {
			continue;
		}

		if (toDisplayText(readRowValue(row, filter.rowKey)) !== selectedValue) {
			return false;
		}
	}

	return true;
}

export default function RiseopediaAdminCrudTable({
	initialRows,
	apiPath,
	idKey,
	columns,
	fields,
	searchPlaceholder,
	createLabel,
	titleCreate,
	titleEdit,
	deleteLabel,
	deleteConfirmTitle,
	deleteConfirmMessage,
	emptyText,
	upsertOp = "upsert",
	deleteOp = "delete",
	defaultSortKey,
	filters = EMPTY_FILTERS,
	rowActions = [],
	fieldsBuilder,
}: RiseopediaAdminCrudTableProps): JSX.Element {
	const [rows, setRows] = useState<RiseopediaAdminRow[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filterState, setFilterState] = useState<FilterState>(() => buildInitialFilterState(filters));
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<PanelMode>("create");
	const [selectedRow, setSelectedRow] = useState<RiseopediaAdminRow | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? columns[0]?.rowKey ?? idKey);
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const rowActionColumnCount = rowActions.length;

	const buildFieldsFor = useCallback(
		(mode: PanelMode, row: RiseopediaAdminRow | null): RiseopediaAdminFieldConfig[] =>
			fieldsBuilder ? fieldsBuilder({ mode, row, rows }) : fields,
		[fields, fieldsBuilder, rows],
	);

	const panelFields = useMemo(
		() => buildFieldsFor(panelMode, selectedRow),
		[buildFieldsFor, panelMode, selectedRow],
	);

	useEffect(() => {
		setFilterState((currentState) => {
			const nextState = buildInitialFilterState(filters);
			for (const filter of filters) {
				nextState[filter.key] = currentState[filter.key] ?? "";
			}
			return nextState;
		});
	}, [filters]);

	const handleSortChange = useCallback(
		(nextSortKey: string): void => {
			setSortDirection((currentDirection) =>
				getNextSortDirection(sortKey === nextSortKey, currentDirection),
			);
			setSortKey(nextSortKey);
			setPage(1);
		},
		[sortKey],
	);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = rows.filter((row) => {
			if (!matchesFilters(row, filters, filterState)) {
				return false;
			}

			return normalizedSearch
				? getRowSearchText(row, columns).includes(normalizedSearch)
				: true;
		});

		return nextRows.slice().sort((left, right) => {
			const comparison = compareAdminText(
				formatCell(left, { rowKey: sortKey, label: sortKey }),
				formatCell(right, { rowKey: sortKey, label: sortKey }),
			);

			return applyAdminSortDirection(comparison, sortDirection);
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
				await readResponseMessage(response, "Failed to refresh Riseopedia rows."),
			);
		}

		const payload = (await response.json()) as RiseopediaRowsResponse;
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

	const openEdit = useCallback((row: RiseopediaAdminRow): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleStatus = useCallback(
		async (row: RiseopediaAdminRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const rowId = toRowKey(readRowValue(row, idKey));
			const effectiveFields = buildFieldsFor("edit", row);
			const values = buildInitialValues(effectiveFields, row);
			values.active = !toBoolean(readRowValue(row, "active_flag"));

			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: upsertOp,
						id: readRowValue(row, idKey),
						data: buildPayloadData(effectiveFields, values),
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update Riseopedia row status."),
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
		async (row: RiseopediaAdminRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const rowId = toRowKey(readRowValue(row, idKey));
			const confirmed = await confirmAction({
				title: deleteConfirmTitle,
				message: deleteConfirmMessage(row),
				confirmLabel: deleteLabel,
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
					body: JSON.stringify({ op: deleteOp, id: readRowValue(row, idKey) }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete Riseopedia row."),
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
		[apiPath, busyId, deleteConfirmMessage, deleteConfirmTitle, deleteLabel, deleteOp, idKey, refreshFromServer],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					{filters.length > 0 ? (
						<div className="admin-table-toolbar-filter admin-table-toolbar-filter--riseopedia">
							{filters.map((filter) => (
								<DropdownMenuSingle
									key={filter.key}
									className="admin-table-filter-control admin-table-filter-control--flexible"
									options={filter.options}
									value={filterState[filter.key] ?? ""}
									placeholder={filter.placeholder ?? filter.clearLabel}
									ariaLabel={filter.label}
									allowClear
									clearLabel={filter.clearLabel}
									onChange={(nextValue) => {
										setFilterState((currentState) => ({
											...currentState,
											[filter.key]: nextValue,
										}));
										setPage(1);
									}}
								/>
							))}
						</div>
					) : (
						<div
							className="admin-table-toolbar-spacer admin-table-toolbar-spacer--action"
							aria-hidden="true"
						/>
					)}

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder={searchPlaceholder}
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="green" onClick={openCreate}>
							{createLabel}
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<THead>
							<TR>
								{columns.map((column) =>
									column.sortable === false || column.kind === "status" ? (
										<TH key={column.rowKey} className="admin-table-cell--center">
											{column.label}
										</TH>
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
								{rowActions.map((action) => (
									<TH key={`action-${action.label}`} className="admin-table-cell--center">
										{action.label}
									</TH>
								))}
								<TH className="admin-table-cell--center">{deleteLabel}</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.map((row) => {
								const rowId = toRowKey(readRowValue(row, idKey));
								const disabled = busyId === rowId;

								return (
									<TR key={rowId}>
										{columns.map((column) => {
											if (column.kind === "status") {
												const enabled = toBoolean(readRowValue(row, column.rowKey));
												return (
													<TD key={column.rowKey} className="admin-table-cell--center">
														<Button
															variant={enabled ? "green" : "neutral"}
															disabled={disabled}
															loading={disabled}
															onClick={() => void toggleStatus(row)}
															aria-label={enabled ? "Active" : "Inactive"}
														>
															{enabled ? "Active" : "Inactive"}
														</Button>
													</TD>
												);
											}

											return (
												<TD key={column.rowKey} className={getCellClassName(column)}>
													<span className="admin-table-break-all">{formatCell(row, column)}</span>
												</TD>
											);
										})}
										{rowActions.map((action) => (
											<TD key={`${rowId}-${action.label}`} className="admin-table-cell--center">
												<ButtonLink
													href={action.href(row)}
													variant={action.variant ?? "neutral"}
													size="sm"
												>
													Manage
												</ButtonLink>
											</TD>
										))}
										<TD className="admin-table-cell--center">
											<Button
												variant="accent"
												disabled={disabled}
												loading={disabled}
												onClick={() => void deleteRow(row)}
											>
												{deleteLabel}
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="neutral"
												disabled={disabled}
												onClick={() => openEdit(row)}
											>
												Edit
											</Button>
										</TD>
									</TR>
								);
							})}

							{pageRows.length === 0 ? (
								<TR>
									<TD
										colSpan={columns.length + 2 + rowActionColumnCount}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										{emptyText}
									</TD>
								</TR>
							) : null}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={total}
					page={page}
					pageSize={pageSize}
					onPageChange={(nextPage) => setPage(nextPage)}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPage(1);
					}}
					pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
				/>
			</div>

			<RiseopediaAdminCrudPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				titleCreate={titleCreate}
				titleEdit={titleEdit}
				apiPath={apiPath}
				idKey={idKey}
				upsertOp={upsertOp}
				fields={panelFields}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
