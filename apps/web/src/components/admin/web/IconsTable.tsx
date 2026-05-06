//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/IconsTable.tsx                                                        ////
//// Language: TSX                                                                                                 ////
//// Small-list admin table for managing web icons with local panel lifecycle                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	Button,
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
import IconRender from "@/components/ui/IconRender";
import AdminSortableTH from "./AdminSortableTH";
import { readResponseMessage } from "@/lib/helpers/http-response";

import IconsPanel, { type IconPanelRow } from "./IconsPanel";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

type IconMediaRow = {
	id: string;
	filename?: string | null;
	originalFilename?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
	url?: string | null;
	thumbnailURL?: string | null;
};

type IconRow = {
	id: string;
	key: string;
	label: string;
	source: "lucide" | "media";
	lucideName?: string | null;
	iconMedia?: IconMediaRow | null;
	enabled: boolean;
	createdAt?: string | null;
	updatedAt?: string | null;
};

type IconsApiResponse = {
	rows?: unknown[];
};

export interface IconsTableProps {
	initialRows: unknown[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "preview" | "key" | "label" | "source";

function normalizeIconMedia(value: unknown): IconMediaRow | null {
	if (typeof value === "string" || typeof value === "number") {
		return { id: String(value) };
	}

	if (!value || typeof value !== "object") {
		return null;
	}

	const media = value as Record<string, unknown>;
	const rawId = media.id;
	const id =
		typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : "";

	if (!id) {
		return null;
	}

	return {
		id,
		filename: typeof media.filename === "string" ? media.filename : null,
		originalFilename:
			typeof media.originalFilename === "string" ? media.originalFilename : null,
		mimeType: typeof media.mimeType === "string" ? media.mimeType : null,
		storageRelPath:
			typeof media.storageRelPath === "string" ? media.storageRelPath : null,
		url: typeof media.url === "string" ? media.url : null,
		thumbnailURL:
			typeof media.thumbnailURL === "string" ? media.thumbnailURL : null,
	};
}

function normalizeRow(value: unknown): IconRow | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const rawId = record.id;
	const id =
		typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : "";

	if (!id) {
		return null;
	}

	const rawSource = typeof record.source === "string" ? record.source : "lucide";
	const source: "lucide" | "media" = rawSource === "media" ? "media" : "lucide";

	return {
		id,
		key: String(record.key ?? ""),
		label: String(record.label ?? ""),
		source,
		lucideName: typeof record.lucideName === "string" ? record.lucideName : null,
		iconMedia: normalizeIconMedia(record.iconMedia),
		enabled: Boolean(record.enabled),
		createdAt: typeof record.createdAt === "string" ? record.createdAt : null,
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
	};
}

function isIconRow(value: IconRow | null): value is IconRow {
	return value !== null;
}

export default function IconsTable({
	initialRows,
}: IconsTableProps): JSX.Element {
	const [rows, setRows] = useState<IconRow[]>(() =>
		initialRows.map(normalizeRow).filter(isIconRow),
	);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [sourceFilter, setSourceFilter] = useState<"all" | "lucide" | "media">(
		"all",
	);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = useState<IconRow | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("key");
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
		const nextRows = rows.filter((row) => {
			const matchesSource =
				sourceFilter === "all" ? true : row.source === sourceFilter;
			if (!matchesSource) {
				return false;
			}

			if (!normalizedSearch) {
				return true;
			}

			const mediaName = row.iconMedia?.filename?.toLowerCase() ?? "";
			const mediaOriginalName =
				row.iconMedia?.originalFilename?.toLowerCase() ?? "";
			const lucideName = row.lucideName?.toLowerCase() ?? "";

			return (
				row.key.toLowerCase().includes(normalizedSearch) ||
				row.label.toLowerCase().includes(normalizedSearch) ||
				lucideName.includes(normalizedSearch) ||
				mediaName.includes(normalizedSearch) ||
				mediaOriginalName.includes(normalizedSearch)
			);
		});

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "preview") {
				comparison = compareAdminText(
					left.label || left.key,
					right.label || right.key,
				);
			} else if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "source") {
				comparison = compareAdminText(
					left.source === "media" ? "Media" : "Lucide",
					right.source === "media" ? "Media" : "Lucide",
				);
			} else {
				comparison = compareAdminText(left.key, right.key);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [rows, search, sortDirection, sortKey, sourceFilter]);

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

		const response = await fetch("/api/admin/web/icons", { cache: "no-store" });
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh icons."),
			);
		}

		const payload = (await response.json()) as IconsApiResponse;
		const nextRows = Array.isArray(payload.rows)
			? payload.rows.map(normalizeRow).filter(isIconRow)
			: [];
		setRows(nextRows);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh icons.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: IconRow): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: IconRow): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/icons", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update icon status."),
					);
				}

				await refreshFromServer();
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update icon status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteRow = useCallback(
		async (row: IconRow): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete icon?",
				message: `Delete icon "${row.key}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/icons", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete icon."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete icon.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const panelRow = useMemo<IconPanelRow | null>(() => {
		if (!selectedRow) {
			return null;
		}

		return {
			id: selectedRow.id,
			key: selectedRow.key,
			label: selectedRow.label,
			enabled: selectedRow.enabled,
			source: selectedRow.source,
			lucideName: selectedRow.lucideName ?? null,
			iconMedia: selectedRow.iconMedia
				? {
						id: selectedRow.iconMedia.id,
						url: selectedRow.iconMedia.url ?? null,
						filename: selectedRow.iconMedia.filename ?? null,
						originalFilename: selectedRow.iconMedia.originalFilename ?? null,
						mimeType: selectedRow.iconMedia.mimeType ?? null,
						storageRelPath: selectedRow.iconMedia.storageRelPath ?? null,
					}
				: null,
			createdAt: selectedRow.createdAt ?? null,
			updatedAt: selectedRow.updatedAt ?? null,
		};
	}, [selectedRow]);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-filter">
						<DropdownMenuSingle
							ariaLabel="Filter by source"
							value={sourceFilter}
							onChange={(value: string) => {
								const nextValue =
									value === "lucide" || value === "media" ? value : "all";
								setSourceFilter(nextValue);
								setPage(1);
							}}
							options={[
								{ value: "all", label: "All sources" },
								{ value: "lucide", label: "Lucide" },
								{ value: "media", label: "Media" },
							]}
							size="md"
							className="admin-table-filter-control admin-table-filter-control--compact"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search key / label / lucide / filename"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button onClick={openCreate} variant="green" aria-label="Create Icon">
							New Icon
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-25" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Preview"
									sortKey="preview"
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
									label="Source"
									sortKey="source"
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
											<span className="admin-table-icon-preview">
												<IconRender
													iconKey={{
														id: row.id,
														key: row.key,
														label: row.label,
														source: row.source,
														lucideName: row.lucideName ?? null,
														iconMedia: row.iconMedia
															? {
																	id: row.iconMedia.id,
																	url: row.iconMedia.url ?? null,
																	filename: row.iconMedia.filename ?? null,
																	originalFilename: row.iconMedia.originalFilename ?? null,
																	mimeType: row.iconMedia.mimeType ?? null,
																	storageRelPath: row.iconMedia.storageRelPath ?? null,
																	thumbnailURL: row.iconMedia.thumbnailURL ?? null,
																}
															: null,
													}}
													mediaRouteScope="admin"
													size={24}
													title={row.label || row.key}
												/>
											</span>
										</TD>
										<TD className="admin-table-cell--center admin-table-cell--mono">{row.key}</TD>
										<TD className="admin-table-cell--center">{row.label}</TD>
										<TD className="admin-table-cell--center">
											{row.source === "media" ? "Media" : "Lucide"}
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant={row.enabled ? "green" : "neutral"}
												disabled={disabled}
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
												onClick={() => void deleteRow(row)}
												aria-label={`Delete ${row.key}`}
											>
												Delete
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="neutral"
												disabled={disabled}
												onClick={() => openEdit(row)}
												aria-label={`Edit ${row.key}`}
											>
												Edit
											</Button>
										</TD>
									</TR>
								);
							})}

							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={7} className="admin-table-empty-cell admin-table-empty-cell--spacious">
										No icons match your current filters.
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

			<IconsPanel
				open={panelOpen}
				mode={panelMode}
				row={panelRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
