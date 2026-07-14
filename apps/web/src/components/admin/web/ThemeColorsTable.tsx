//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ThemeColorsTable.tsx                                                  ////
//// Language: TSX                                                                                                 ////
//// Small-list admin table for managing theme colors with local panel lifecycle                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	Button,
	AdminTableFrame,
	AdminTableSearchInput,
	Pagination,
	PillSwatch,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import ThemeColorsPanel from "./ThemeColorsPanel";
import AdminSortableTH from "./AdminSortableTH";
import { readResponseMessage } from "@/lib/helpers/http-response";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

type ThemeColor = {
	id: string | number;
	key: string;
	label: string;
	preview: string;
	enabled: boolean;
	createdAt?: string;
	updatedAt?: string;
};

type ThemeColorsApiResponse = {
	rows?: ThemeColor[];
};

export interface ThemeColorsTableProps {
	initialRows: ThemeColor[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "color" | "key" | "label" | "preview";

export default function ThemeColorsTable({
	initialRows,
}: ThemeColorsTableProps): JSX.Element {
	const [rows, setRows] = useState<ThemeColor[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = useState<ThemeColor | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("label");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter(
					(row) =>
						row.key.toLowerCase().includes(normalizedSearch) ||
						row.label.toLowerCase().includes(normalizedSearch),
				)
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "color" || sortKey === "preview") {
				comparison = compareAdminText(left.preview, right.preview);
			} else if (sortKey === "key") {
				comparison = compareAdminText(left.key, right.key);
			} else {
				comparison = compareAdminText(left.label, right.label);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [rows, search, sortDirection, sortKey]);

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

		const response = await fetch("/api/admin/web/theme-colors", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh theme colors."),
			);
		}

		const payload = (await response.json()) as ThemeColorsApiResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh theme colors.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: ThemeColor): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: ThemeColor): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(String(row.id));
			setError("");

			try {
				const response = await fetch("/api/admin/web/theme-colors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update theme color."),
					);
				}

				await refreshFromServer();
			} catch (updateError: unknown) {
				setError(
					updateError instanceof Error
						? updateError.message
						: "Failed to update theme color.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteColor = useCallback(
		async (row: ThemeColor): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete theme color?",
				message: `Delete theme color "${row.key}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(String(row.id));
			setError("");

			try {
				const response = await fetch("/api/admin/web/theme-colors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete theme color."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete theme color.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-spacer--action" aria-hidden="true" />

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search by key or label"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="primary" onClick={openCreate}>
							Create Theme Color
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Color"
									sortKey="color"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Key"
									sortKey="key"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Label"
									sortKey="label"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Preview"
									sortKey="preview"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.map((row) => {
								const disabled = busyId === String(row.id);

								return (
									<TR key={String(row.id)}>
										<TD className="admin-table-cell--center">
											<PillSwatch rawColor={row.preview} size="lg" />
										</TD>
										<TD className="admin-table-cell--center">{row.key}</TD>
										<TD className="admin-table-cell--center">{row.label}</TD>
										<TD className="admin-table-cell--center">
											<span className="admin-table-break-all">{row.preview}</span>
										</TD>
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
												onClick={() => void deleteColor(row)}
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
										colSpan={7}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No theme colors match your search.
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

			<ThemeColorsPanel
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
