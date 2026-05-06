//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ExternalLinkHostsTable.tsx                                          ////
//// Language: TSX                                                                                              ////
//// Small-list admin table for managing external link host and path whitelist rules                             ////
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
import { confirmAction } from "@/lib/client/confirm-dialog";
import type { ExternalLinkHostAdminItem } from "@/lib/data/external-link-hosts";
import {
	applyAdminSortDirection,
	compareAdminOptionalText,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";
import AdminSortableTH from "./AdminSortableTH";
import ExternalLinkHostsPanel from "./ExternalLinkHostsPanel";

type ExternalLinkHostsApiResponse = {
	rows?: ExternalLinkHostAdminItem[];
};

export interface ExternalLinkHostsTableProps {
	initialRows: ExternalLinkHostAdminItem[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey =
	| "host"
	| "hostMatch"
	| "path"
	| "pathMatch"
	| "surface"
	| "comment"
	| "validFrom"
	| "validTo";

function formatDate(value: string | null): string {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatHostMatchMode(value: string): string {
	return value === "exact_host" ? "Exact host" : value;
}

function formatPathMatchMode(value: string): string {
	if (value === "exact_path") {
		return "Exact path";
	}

	if (value === "path_prefix") {
		return "Path prefix";
	}

	return "Any path";
}

function formatSurfaceScope(value: string): string {
	if (value === "admin") {
		return "Admin";
	}

	if (value === "public") {
		return "Public";
	}

	return "All";
}

function getRuleLabel(row: ExternalLinkHostAdminItem): string {
	return `${row.hostPattern}${row.pathPattern}`;
}

export default function ExternalLinkHostsTable({
	initialRows,
}: ExternalLinkHostsTableProps): JSX.Element {
	const [rows, setRows] = useState<ExternalLinkHostAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] =
		useState<ExternalLinkHostAdminItem | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("host");
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
					const comment = row.comment ?? "";

					return (
						row.hostPattern.toLowerCase().includes(normalizedSearch) ||
						row.hostMatchModeCode.toLowerCase().includes(normalizedSearch) ||
						row.pathPattern.toLowerCase().includes(normalizedSearch) ||
						row.pathMatchModeCode.toLowerCase().includes(normalizedSearch) ||
						row.allowedSurfaceScopeCode
							.toLowerCase()
							.includes(normalizedSearch) ||
						comment.toLowerCase().includes(normalizedSearch)
					);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "hostMatch") {
				comparison = compareAdminText(
					formatHostMatchMode(left.hostMatchModeCode),
					formatHostMatchMode(right.hostMatchModeCode),
				);
			} else if (sortKey === "path") {
				comparison = compareAdminText(left.pathPattern, right.pathPattern);
			} else if (sortKey === "pathMatch") {
				comparison = compareAdminText(
					formatPathMatchMode(left.pathMatchModeCode),
					formatPathMatchMode(right.pathMatchModeCode),
				);
			} else if (sortKey === "surface") {
				comparison = compareAdminText(
					formatSurfaceScope(left.allowedSurfaceScopeCode),
					formatSurfaceScope(right.allowedSurfaceScopeCode),
				);
			} else if (sortKey === "comment") {
				comparison = compareAdminOptionalText(left.comment, right.comment);
			} else if (sortKey === "validFrom") {
				comparison = compareAdminText(
					formatDate(left.validFrom),
					formatDate(right.validFrom),
				);
			} else if (sortKey === "validTo") {
				comparison = compareAdminText(
					formatDate(left.validTo),
					formatDate(right.validTo),
				);
			} else {
				comparison = compareAdminText(left.hostPattern, right.hostPattern);
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

		const response = await fetch("/api/admin/web/external-link-hosts", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(
					response,
					"Failed to refresh external link rules.",
				),
			);
		}

		const payload = (await response.json()) as ExternalLinkHostsApiResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh external link rules.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: ExternalLinkHostAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: ExternalLinkHostAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/external-link-hosts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update external link rule.",
						),
					);
				}

				await refreshFromServer();
			} catch (updateError: unknown) {
				setError(
					updateError instanceof Error
						? updateError.message
						: "Failed to update external link rule.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteExternalLinkHost = useCallback(
		async (row: ExternalLinkHostAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete external link rule?",
				message: `Delete external link rule "${getRuleLabel(row)}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/external-link-hosts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to delete external link rule.",
						),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete external link rule.",
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
					<div className="admin-table-toolbar-spacer admin-table-toolbar-spacer--wide" aria-hidden="true" />

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search by host, path, mode, surface, or comment"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							width="wide"
						/>
					</div>

					<div className="admin-table-toolbar-action admin-table-toolbar-action--wide">
						<Button variant="green" onClick={openCreate}>
							Create External Link Rule
						</Button>
					</div>
				</div>

				<div className="admin-helper-note">
					These rules validate generic external links in rich text and URL fields. Embedded
					YouTube video content uses the YouTube Channels allowlist instead.
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Host"
									sortKey="host"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Host Match"
									sortKey="hostMatch"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Path"
									sortKey="path"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Path Match"
									sortKey="pathMatch"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Surface"
									sortKey="surface"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Comment"
									sortKey="comment"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Valid From"
									sortKey="validFrom"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Valid To"
									sortKey="validTo"
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
										<TD className="admin-table-cell--center">{row.hostPattern}</TD>
										<TD className="admin-table-cell--center">
											{formatHostMatchMode(row.hostMatchModeCode)}
										</TD>
										<TD className="admin-table-cell--center">{row.pathPattern}</TD>
										<TD className="admin-table-cell--center">
											{formatPathMatchMode(row.pathMatchModeCode)}
										</TD>
										<TD className="admin-table-cell--center">
											{formatSurfaceScope(row.allowedSurfaceScopeCode)}
										</TD>
										<TD className="admin-table-cell--center admin-table-cell--muted">
											{row.comment ?? "-"}
										</TD>
										<TD className="admin-table-cell--center">{formatDate(row.validFrom)}</TD>
										<TD className="admin-table-cell--center">{formatDate(row.validTo)}</TD>
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
												onClick={() => void deleteExternalLinkHost(row)}
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
										colSpan={11}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No external link rules match your search.
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

			<ExternalLinkHostsPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
