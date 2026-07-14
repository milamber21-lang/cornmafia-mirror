//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/YoutubeChannelsTable.tsx                                            ////
//// Language: TSX                                                                                              ////
//// Small-list admin table for managing YouTube channel allowlist rows                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	AdminTableFrame,
	AdminTableSearchInput,
	Button,
	Pagination,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type { YoutubeChannelAdminItem } from "@/lib/data/youtube-channels";
import {
	applyAdminSortDirection,
	compareAdminOptionalText,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";
import AdminSortableTH from "./AdminSortableTH";
import YoutubeChannelsPanel from "./YoutubeChannelsPanel";

type YoutubeChannelsApiResponse = {
	rows?: YoutubeChannelAdminItem[];
};

export interface YoutubeChannelsTableProps {
	initialRows: YoutubeChannelAdminItem[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "title" | "channelId" | "handle" | "url" | "comment" | "status";

function getChannelLabel(row: YoutubeChannelAdminItem): string {
	return row.channelHandle ?? row.channelTitle;
}

function getStatusLabel(row: YoutubeChannelAdminItem): string {
	return row.enabled ? "Enabled" : "Disabled";
}

export default function YoutubeChannelsTable({
	initialRows,
}: YoutubeChannelsTableProps): JSX.Element {
	const [rows, setRows] = useState<YoutubeChannelAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = useState<YoutubeChannelAdminItem | null>(
		null,
	);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("title");
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
					const channelHandle = row.channelHandle ?? "";
					const channelUrl = row.channelUrl ?? "";
					const comment = row.comment ?? "";

					return (
						row.channelExternalId.toLowerCase().includes(normalizedSearch) ||
						channelHandle.toLowerCase().includes(normalizedSearch) ||
						row.channelTitle.toLowerCase().includes(normalizedSearch) ||
						channelUrl.toLowerCase().includes(normalizedSearch) ||
						comment.toLowerCase().includes(normalizedSearch) ||
						getStatusLabel(row).toLowerCase().includes(normalizedSearch)
					);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "channelId") {
				comparison = compareAdminText(
					left.channelExternalId,
					right.channelExternalId,
				);
			} else if (sortKey === "handle") {
				comparison = compareAdminOptionalText(
					left.channelHandle,
					right.channelHandle,
				);
			} else if (sortKey === "url") {
				comparison = compareAdminOptionalText(left.channelUrl, right.channelUrl);
			} else if (sortKey === "comment") {
				comparison = compareAdminOptionalText(left.comment, right.comment);
			} else if (sortKey === "status") {
				comparison = compareAdminText(getStatusLabel(left), getStatusLabel(right));
			} else {
				comparison = compareAdminText(left.channelTitle, right.channelTitle);
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

		const response = await fetch("/api/admin/web/youtube-channels", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh YouTube channels."),
			);
		}

		const payload = (await response.json()) as YoutubeChannelsApiResponse;
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh YouTube channels.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: YoutubeChannelAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: YoutubeChannelAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/youtube-channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update YouTube channel."),
					);
				}

				await refreshFromServer();
			} catch (updateError: unknown) {
				setError(
					updateError instanceof Error
						? updateError.message
						: "Failed to update YouTube channel.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteYoutubeChannel = useCallback(
		async (row: YoutubeChannelAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete YouTube channel?",
				message: `Delete YouTube channel "${getChannelLabel(row)}"? Future validation will no longer allow new videos from this channel.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/youtube-channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete YouTube channel."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete YouTube channel.",
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
							placeholder="Search by title, handle, channel ID, or note"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="primary" onClick={openCreate}>
							Add YouTube Channel
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Title"
									sortKey="title"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Channel ID"
									sortKey="channelId"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Handle"
									sortKey="handle"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="URL"
									sortKey="url"
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
									label="Status"
									sortKey="status"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.map((row) => {
								const disabled = busyId === row.id;

								return (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">{row.channelTitle}</TD>
										<TD className="admin-table-cell--center">
											<span className="admin-table-break-all">
												{row.channelExternalId}
											</span>
										</TD>
										<TD className="admin-table-cell--center">
											{row.channelHandle ?? "-"}
										</TD>
										<TD className="admin-table-cell--center">
											{row.channelUrl ? (
												<a
													href={row.channelUrl}
													target="_blank"
													rel="noreferrer"
													className="admin-table-break-all"
												>
													{row.channelUrl}
												</a>
											) : (
												"-"
											)}
										</TD>
										<TD className="admin-table-cell--center">{row.comment ?? "-"}</TD>
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
												onClick={() => void deleteYoutubeChannel(row)}
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
										colSpan={8}
										className="admin-table-empty-cell admin-table-empty-cell--spacious"
									>
										No YouTube channels match your search.
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

			<YoutubeChannelsPanel
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
