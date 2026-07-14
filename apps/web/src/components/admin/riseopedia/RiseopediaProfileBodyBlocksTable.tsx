//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBodyBlocksTable.tsx                         ////
//// Language: TSX                                                                                              ////
//// Table-owned Riseopedia display profile block admin list.                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminSortableTH from "@/components/admin/common/AdminSortableTH";
import {
	AlertBanner,
	AdminTableFrame,
	AdminTableSearchInput,
	Button,
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

import { activeFilter, idText } from "./RiseopediaAdminConfigHelpers";
import {
	readRowValue,
	toBoolean,
	toDisplayText,
	toRowKey,
} from "./RiseopediaAdminHelpers";
import RiseopediaProfileBodyBlocksPanel from "./RiseopediaProfileBodyBlocksPanel";
import type {
	RiseopediaAdminFilterConfig,
	RiseopediaAdminFilterState,
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaProfileBodyBlocksTableProps {
	initialRows: RiseopediaAdminRows;
	displayProfiles: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
}

type RowsResponse = {
	rows?: RiseopediaAdminRow[];
};

type ColumnConfig = {
	rowKey: string;
	label: string;
	kind?: "text" | "boolean" | "count" | "status";
	strong?: boolean;
	width?: "compact" | "normal" | "wide" | "fluid";
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

const COLUMNS: ColumnConfig[] = [
	{
		rowKey: "display_profile_name",
		label: "Profile",
		strong: true,
		width: "wide",
	},
	{ rowKey: "body_block_label", label: "Block", strong: true, width: "wide" },
	{ rowKey: "body_block_code", label: "Code", width: "normal" },
	{ rowKey: "body_block_renderer_name", label: "Renderer", width: "wide" },
	{ rowKey: "body_block_data_source_name", label: "Datasource", width: "wide" },
	{ rowKey: "display_slot_name", label: "Placement", width: "normal" },
	{ rowKey: "sort_order", label: "Sort", kind: "count", width: "compact" },
	{
		rowKey: "visible_flag",
		label: "Visible",
		kind: "boolean",
		width: "compact",
	},
	{
		rowKey: "profile_element_count",
		label: "Elements",
		kind: "count",
		width: "compact",
	},
	{ rowKey: "active_flag", label: "Status", kind: "status", width: "compact" },
];

function buildInitialFilterState(
	filters: RiseopediaAdminFilterConfig[],
): RiseopediaAdminFilterState {
	const state: RiseopediaAdminFilterState = {};
	for (const filter of filters) {
		state[filter.key] = "";
	}
	return state;
}

function formatCell(row: RiseopediaAdminRow, column: ColumnConfig): string {
	const value = readRowValue(row, column.rowKey);
	if (column.kind === "boolean") {
		return toBoolean(value) ? "Yes" : "No";
	}

	if (column.kind === "status") {
		return toBoolean(value) ? "Enabled" : "Disabled";
	}

	return toDisplayText(value);
}

function filterValueMatches(rowValue: unknown, selectedValue: string): boolean {
	if (!selectedValue) {
		return true;
	}

	if (typeof rowValue === "boolean") {
		const normalized = selectedValue.trim().toLowerCase();
		return rowValue
			? ["true", "yes", "enabled", "active", "1"].includes(normalized)
			: ["false", "no", "disabled", "inactive", "0"].includes(normalized);
	}

	return toDisplayText(rowValue) === selectedValue;
}

function rowMatchesFilters(
	row: RiseopediaAdminRow,
	filters: RiseopediaAdminFilterConfig[],
	filterState: RiseopediaAdminFilterState,
): boolean {
	for (const filter of filters) {
		if (
			!filterValueMatches(
				readRowValue(row, filter.rowKey),
				filterState[filter.key] ?? "",
			)
		) {
			return false;
		}
	}

	return true;
}

function rowSearchText(row: RiseopediaAdminRow): string {
	return COLUMNS.map((column) => formatCell(row, column))
		.join(" ")
		.toLowerCase();
}

function getFilterOptions(
	filter: RiseopediaAdminFilterConfig,
	filterState: RiseopediaAdminFilterState,
): RiseopediaAdminOption[] {
	return filter.optionsBuilder
		? filter.optionsBuilder(filterState)
		: (filter.options ?? []);
}

function renderFilterControls(args: {
	filters: RiseopediaAdminFilterConfig[];
	filterState: RiseopediaAdminFilterState;
	setFilterState: (
		updater: (
			currentState: RiseopediaAdminFilterState,
		) => RiseopediaAdminFilterState,
	) => void;
	setPage: (page: number) => void;
}): ReactNode {
	return args.filters.map((filter) => (
		<DropdownMenuSingle
			key={filter.key}
			className="admin-table-filter-control admin-table-filter-control--compact admin-table-filter-control--flexible"
			options={getFilterOptions(filter, args.filterState)}
			value={args.filterState[filter.key] ?? ""}
			placeholder={filter.placeholder ?? filter.clearLabel}
			ariaLabel={filter.label}
			allowClear
			clearLabel={filter.clearLabel}
			onChange={(nextValue) => {
				args.setFilterState((currentState) => ({
					...currentState,
					[filter.key]: nextValue,
				}));
				args.setPage(1);
			}}
		/>
	));
}

function getColumnClassName(column: ColumnConfig): string {
	if (column.strong === true) {
		return "admin-table-cell--center admin-table-cell--strong";
	}

	return "admin-table-cell--center";
}

function getColumnWidthClassName(column: ColumnConfig): string {
	if (column.width === "compact") {
		return "table-col table-col--w-10";
	}

	if (column.width === "normal") {
		return "table-col table-col--w-12";
	}

	if (column.width === "wide") {
		return "table-col table-col--w-18";
	}

	return "table-col";
}

export default function RiseopediaProfileBodyBlocksTable({
	initialRows,
	displayProfiles,
	meta,
	displayProfile,
}: RiseopediaProfileBodyBlocksTableProps): JSX.Element {
	const scopedProfileId = displayProfile
		? idText(displayProfile.display_profile_id)
		: "";
	const apiPath = displayProfile
		? `/api/admin/riseopedia/profile-body-blocks?displayProfileId=${scopedProfileId}`
		: "/api/admin/riseopedia/profile-body-blocks";
	const filters = useMemo(() => [activeFilter()], []);
	const [rows, setRows] = useState<RiseopediaAdminRow[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filterState, setFilterState] = useState<RiseopediaAdminFilterState>(
		() => buildInitialFilterState(filters),
	);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<RiseopediaAdminPanelMode>("create");
	const [selectedRow, setSelectedRow] = useState<RiseopediaAdminRow | null>(
		null,
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [sortKey, setSortKey] = useState("sort_order");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return rows
			.filter((row) => rowMatchesFilters(row, filters, filterState))
			.filter((row) =>
				normalizedSearch ? rowSearchText(row).includes(normalizedSearch) : true,
			)
			.slice()
			.sort((left, right) => {
				const comparison = compareAdminText(
					formatCell(left, { rowKey: sortKey, label: sortKey }),
					formatCell(right, { rowKey: sortKey, label: sortKey }),
				);
				return applyAdminSortDirection(comparison, sortDirection);
			});
	}, [filterState, filters, rows, search, sortDirection, sortKey]);

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
				await readResponseMessage(response, "Failed to refresh blocks."),
			);
		}

		const payload = (await response.json()) as RowsResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, [apiPath]);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh blocks.",
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

			const rowId = toRowKey(readRowValue(row, "display_profile_body_block_id"));
			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: readRowValue(row, "display_profile_body_block_id"),
						data: {
							displayProfileId: readRowValue(row, "display_profile_id"),
							bodyBlockCode: readRowValue(row, "body_block_code"),
							bodyBlockLabel: readRowValue(row, "body_block_label"),
							bodyBlockRendererCode: readRowValue(row, "body_block_renderer_code"),
							bodyBlockDataSourceCode: readRowValue(
								row,
								"body_block_data_source_code",
							),
							sortOrder: readRowValue(row, "sort_order"),
							visible: readRowValue(row, "visible_flag"),
							emptyBehaviorCode: readRowValue(row, "empty_behavior_code"),
							active: !toBoolean(readRowValue(row, "active_flag")),
							adminNote: readRowValue(row, "admin_note"),
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update block status."),
					);
				}

				await refreshFromServer();
			} catch (statusError: unknown) {
				setError(
					statusError instanceof Error
						? statusError.message
						: "Failed to update block status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[apiPath, busyId, refreshFromServer],
	);

	const deleteRow = useCallback(
		async (row: RiseopediaAdminRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete block",
				message: `Delete block ${idText(row.body_block_label) || idText(row.body_block_code)}?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			const rowId = toRowKey(readRowValue(row, "display_profile_body_block_id"));
			setBusyId(rowId);
			setError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "delete",
						id: readRowValue(row, "display_profile_body_block_id"),
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete block."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete block.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[apiPath, busyId, refreshFromServer],
	);

	const filterControls = renderFilterControls({
		filters,
		filterState,
		setFilterState,
		setPage,
	});

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-nav">
						<div className="admin-table-toolbar-filter admin-table-toolbar-filter--riseopedia">
							{filterControls}
						</div>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search blocks"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="primary" onClick={openCreate}>
							Add block
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							{COLUMNS.map((column) => (
								<col key={column.rowKey} className={getColumnWidthClassName(column)} />
							))}
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								{COLUMNS.map((column) =>
									column.kind === "status" ? (
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
											onSortChange={(nextSortKey) => {
												setSortDirection((currentDirection) =>
													getNextSortDirection(sortKey === nextSortKey, currentDirection),
												);
												setSortKey(nextSortKey);
												setPage(1);
											}}
										/>
									),
								)}
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>
						<TBody>
							{pageRows.map((row) => {
								const rowId = toRowKey(
									readRowValue(row, "display_profile_body_block_id"),
								);
								const disabled = busyId === rowId;
								return (
									<TR key={rowId}>
										{COLUMNS.map((column) =>
											column.kind === "status" ? (
												<TD key={column.rowKey} className="admin-table-cell--center">
													<Button
														variant={
															toBoolean(readRowValue(row, column.rowKey))
																? "success"
																: "secondary"
														}
														disabled={disabled}
														onClick={() => void toggleStatus(row)}
													>
														{toBoolean(readRowValue(row, column.rowKey))
															? "Enabled"
															: "Disabled"}
													</Button>
												</TD>
											) : (
												<TD key={column.rowKey} className={getColumnClassName(column)}>
													{formatCell(row, column)}
												</TD>
											),
										)}
										<TD className="admin-table-cell--center">
											<Button
												variant="danger"
												disabled={disabled}
												loading={disabled}
												onClick={() => void deleteRow(row)}
											>
												Delete
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="secondary"
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
										colSpan={COLUMNS.length + 2}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No blocks found.
									</TD>
								</TR>
							) : null}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={filteredRows.length}
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

			<RiseopediaProfileBodyBlocksPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				displayProfiles={displayProfiles}
				meta={meta}
				displayProfile={displayProfile}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}

export { RiseopediaProfileBodyBlocksTable };

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
