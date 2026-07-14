//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/NavigationPanelsTable.tsx                                             ////
//// Language: TSX                                                                                                ////
//// Small-list admin table for DB-first navigation panel definitions                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	Button,
	ButtonLink,
	DropdownMenuSingle,
	AdminTableFrame,
	AdminTableSearchInput,
	Pagination,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import AdminSortableTH from "./AdminSortableTH";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import type { NavigationPanelAdminItem } from "@/lib/data/navigation";
import { readResponseMessage } from "@/lib/helpers/http-response";
import NavigationPanelsPanel from "./NavigationPanelsPanel";

type NavigationPanelsApiResponse = {
	rows?: NavigationPanelAdminItem[];
};

export interface NavigationPanelsTableProps {
	initialRows: NavigationPanelAdminItem[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "label" | "slot" | "type" | "policy" | "order" | "limit";

function formatPolicy(row: NavigationPanelAdminItem): string {
	if (row.readPolicyCode === "public") {
		return "public";
	}

	return `${row.readPolicyCode}:${row.readRank ?? "-"}`;
}

function formatLimits(row: NavigationPanelAdminItem): string {
	return [
		row.maxCategories ?? "-",
		row.maxSubcategoriesPerCategory ?? "-",
		row.maxTargetsPerSubcategory ?? "-",
	].join(" / ");
}

export default function NavigationPanelsTable({
	initialRows,
}: NavigationPanelsTableProps): JSX.Element {
	const [rows, setRows] = useState<NavigationPanelAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] =
		useState<NavigationPanelAdminItem | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("slot");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const typeOptions = useMemo(() => {
		const panelTypeOptions = Array.from(
			new Set(rows.map((row) => row.panelTypeCode)),
		)
			.sort((left, right) => compareAdminText(left, right))
			.map((typeCode) => ({
				value: typeCode,
				label: typeCode,
			}));

		return [{ label: "All types", value: "" }, ...panelTypeOptions];
	}, [rows]);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = rows.filter((row) => {
			const matchesType = !typeFilter || row.panelTypeCode === typeFilter;
			const matchesText =
				!normalizedSearch ||
				row.panelKey.toLowerCase().includes(normalizedSearch) ||
				row.label.toLowerCase().includes(normalizedSearch) ||
				row.panelSlotCode.toLowerCase().includes(normalizedSearch) ||
				row.readPolicyCode.toLowerCase().includes(normalizedSearch);

			return matchesType && matchesText;
		});

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "type") {
				comparison = compareAdminText(left.panelTypeCode, right.panelTypeCode);
			} else if (sortKey === "policy") {
				comparison = compareAdminText(formatPolicy(left), formatPolicy(right));
			} else if (sortKey === "order") {
				comparison = compareAdminNumber(left.selectionOrder, right.selectionOrder);
			} else if (sortKey === "limit") {
				comparison = compareAdminText(formatLimits(left), formatLimits(right));
			} else {
				comparison = compareAdminText(left.panelSlotCode, right.panelSlotCode);
			}

			if (comparison === 0) {
				comparison = compareAdminText(left.panelKey, right.panelKey);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [rows, search, sortDirection, sortKey, typeFilter]);

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

		const response = await fetch("/api/admin/web/navigation-panels", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh navigation panels."),
			);
		}

		const payload = (await response.json()) as NavigationPanelsApiResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh navigation panels.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: NavigationPanelAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: NavigationPanelAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/navigation-panels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.panelKey }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update navigation panel."),
					);
				}

				await refreshFromServer();
			} catch (updateError: unknown) {
				setError(
					updateError instanceof Error
						? updateError.message
						: "Failed to update navigation panel.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deletePanel = useCallback(
		async (row: NavigationPanelAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete navigation panel?",
				message: `Delete navigation panel "${row.panelKey}"? Its saved tree will be removed by database integrity rules.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/navigation-panels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.panelKey }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete navigation panel."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete navigation panel.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const handleSortChange = useCallback(
		(nextSortKey: SortKey): void => {
			setSortDirection((currentDirection) =>
				getNextSortDirection(sortKey === nextSortKey, currentDirection),
			);
			setSortKey(nextSortKey);
			setPage(1);
		},
		[sortKey],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-filter admin-table-toolbar-filter--type">
						<DropdownMenuSingle
							options={typeOptions}
							value={typeFilter}
							onChange={(value) => {
								setTypeFilter(value);
								setPage(1);
							}}
							placeholder="All types"
							ariaLabel="Filter by type"
							className="admin-table-filter-control"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search by key, label, slot, or policy"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							width="wide"
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="primary" onClick={openCreate}>
							Create Panel
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-7" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									label="Label"
									sortKey="label"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Slot"
									sortKey="slot"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Type"
									sortKey="type"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Policy"
									sortKey="policy"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Order"
									sortKey="order"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Limit"
									sortKey="limit"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Design</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.map((row) => {
								const disabled = busyId === row.id;

								return (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">{row.label}</TD>
										<TD className="admin-table-cell--center">{row.panelSlotCode}</TD>
										<TD className="admin-table-cell--center">{row.panelTypeCode}</TD>
										<TD className="admin-table-cell--center">{formatPolicy(row)}</TD>
										<TD className="admin-table-cell--center">{row.selectionOrder}</TD>
										<TD className="admin-table-cell--center">{formatLimits(row)}</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant={row.enabled ? "success" : "secondary"}
												disabled={disabled}
												loading={disabled}
												onClick={() => void toggleEnabled(row)}
												aria-label={row.enabled ? "Enabled" : "Disabled"}
											>
												{row.enabled ? "Enabled" : "Disabled"}
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="danger"
												disabled={disabled}
												loading={disabled}
												onClick={() => void deletePanel(row)}
											>
												Delete
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<ButtonLink
												variant="secondary"
												href={`/admin/web/navigation/${encodeURIComponent(row.panelKey)}`}
											>
												Manage
											</ButtonLink>
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
										colSpan={10}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No navigation panels match your search.
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

			<NavigationPanelsPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
