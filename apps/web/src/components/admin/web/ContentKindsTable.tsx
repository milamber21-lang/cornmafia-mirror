//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ContentKindsTable.tsx                                                 ////
//// Language: TSX                                                                                                ////
//// Small-list admin table for managing content kinds with route and renderer metadata                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	Button,
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
import type { ContentKindAdminItem } from "@/lib/data/content-kinds";
import {
	applyAdminSortDirection,
	compareAdminOptionalText,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";
import AdminSortableTH from "./AdminSortableTH";
import ContentKindsPanel from "./ContentKindsPanel";
import { confirmAction } from "@/lib/client/confirm-dialog";

type ContentKindsApiResponse = {
	rows?: ContentKindAdminItem[];
};

export interface ContentKindsTableProps {
	initialRows: ContentKindAdminItem[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "code" | "label" | "route" | "renderer" | "description";

function formatRoutePrefix(row: ContentKindAdminItem): string {
	return row.publicRoutePrefix ? `/${row.publicRoutePrefix}` : "Normal";
}

export default function ContentKindsTable({
	initialRows,
}: ContentKindsTableProps): JSX.Element {
	const [rows, setRows] = useState<ContentKindAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = useState<ContentKindAdminItem | null>(
		null,
	);
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
			? rows.filter((row) => {
					const description = row.description ?? "";
					const routePrefix = row.publicRoutePrefix ?? "normal";

					return (
						row.contentKindCode.toLowerCase().includes(normalizedSearch) ||
						row.label.toLowerCase().includes(normalizedSearch) ||
						description.toLowerCase().includes(normalizedSearch) ||
						routePrefix.toLowerCase().includes(normalizedSearch) ||
						row.rendererCode.toLowerCase().includes(normalizedSearch)
					);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "code") {
				comparison = compareAdminText(
					left.contentKindCode,
					right.contentKindCode,
				);
			} else if (sortKey === "route") {
				comparison = compareAdminText(
					formatRoutePrefix(left),
					formatRoutePrefix(right),
				);
			} else if (sortKey === "renderer") {
				comparison = compareAdminText(left.rendererCode, right.rendererCode);
			} else if (sortKey === "description") {
				comparison = compareAdminOptionalText(
					left.description,
					right.description,
				);
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

		const response = await fetch("/api/admin/web/content-kinds", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh content kinds."),
			);
		}

		const payload = (await response.json()) as ContentKindsApiResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh content kinds.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: ContentKindAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: ContentKindAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/content-kinds", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update content kind.",
						),
					);
				}

				await refreshFromServer();
			} catch (updateError: unknown) {
				setError(
					updateError instanceof Error
						? updateError.message
						: "Failed to update content kind.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteContentKind = useCallback(
		async (row: ContentKindAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete content kind?",
				message: `Delete content kind "${row.contentKindCode}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/content-kinds", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to delete content kind.",
						),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete content kind.",
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
							placeholder="Search by code, label, route, renderer, or description"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							width="wide"
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="green" onClick={openCreate}>
							Create Content Kind
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-14" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Code"
									sortKey="code"
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
									label="Route"
									sortKey="route"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Renderer"
									sortKey="renderer"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Description"
									sortKey="description"
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
								const disabled = busyId === row.id;

								return (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">
											{row.contentKindCode}
										</TD>
										<TD className="admin-table-cell--center">{row.label}</TD>
										<TD className="admin-table-cell--center">{formatRoutePrefix(row)}</TD>
										<TD className="admin-table-cell--center">{row.rendererCode}</TD>
										<TD className="admin-table-cell--center admin-table-cell--muted">
											{row.description ?? "-"}
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant={row.enabled ? "green" : "neutral"}
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
												variant="accent"
												disabled={disabled}
												loading={disabled}
												onClick={() => void deleteContentKind(row)}
											>
												Delete
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
										colSpan={8}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No content kinds match your search.
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

			<ContentKindsPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
