//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldListTable.tsx                                            ////
//// Language: TSX                                                                                                 ////
//// Reusable template field definitions table with contextual option/tool access                                       ////
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
import type { TemplateFieldListAdminItem } from "@/lib/data/templates";
import { readResponseMessage } from "@/lib/helpers/http-response";

import TemplateFieldListPanel from "./TemplateFieldListPanel";
import TemplatesAdminNav from "./TemplatesAdminNav";
import AdminSortableTH from "./AdminSortableTH";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

export interface TemplateFieldListTableProps {
	initialRows: TemplateFieldListAdminItem[];
}

type Mode = "create" | "edit";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "code" | "label" | "type" | "destination" | "usage";

function formatDestination(code: string): string {
	const normalized = code.trim().toLowerCase();
	if (normalized === "seo") {
		return "SEO";
	}

	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function TemplateFieldListTable({
	initialRows,
}: TemplateFieldListTableProps): JSX.Element {
	const [rows, setRows] = useState<TemplateFieldListAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<Mode>("create");
	const [selectedRow, setSelectedRow] =
		useState<TemplateFieldListAdminItem | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("code");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						row.fieldListCode,
						row.label,
						row.fieldTypeCode,
						row.fieldTypeLabel,
						row.renderDestinationCode,
						formatDestination(row.renderDestinationCode),
						row.valueColumnName,
						row.helpText ?? "",
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "type") {
				comparison = compareAdminText(left.fieldTypeLabel, right.fieldTypeLabel);
			} else if (sortKey === "destination") {
				comparison = compareAdminText(
					formatDestination(left.renderDestinationCode),
					formatDestination(right.renderDestinationCode),
				);
			} else if (sortKey === "usage") {
				comparison = compareAdminNumber(
					left.templateUsageCount,
					right.templateUsageCount,
				);
			} else {
				comparison = compareAdminText(left.fieldListCode, right.fieldListCode);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [rows, search, sortDirection, sortKey]);

	const total = filteredRows.length;
	const startIndex = (page - 1) * pageSize;
	const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

	useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	const refreshFromServer = useCallback(async (): Promise<void> => {
		setError("");

		const response = await fetch("/api/admin/web/templates/field-list", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh field list."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldListAdminItem[];
		};
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh field list.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: TemplateFieldListAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: TemplateFieldListAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-list", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: row.id,
						data: {
							fieldListCode: row.fieldListCode,
							label: row.label,
							helpText: row.helpText,
							fieldTypeCode: row.fieldTypeCode,
							renderDestinationCode: row.renderDestinationCode,
							enabled: !row.enabled,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update field list status.",
						),
					);
				}

				setRows((previousRows) =>
					previousRows.map((previousRow) =>
						previousRow.id === row.id
							? { ...previousRow, enabled: !previousRow.enabled }
							: previousRow,
					),
				);
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update field list status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId],
	);

	const deleteFieldListItem = useCallback(
		async (row: TemplateFieldListAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete field list row?",
				message: `Delete field list row "${row.fieldListCode}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-list", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete field list row."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete field list row.",
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
					<div className="admin-table-toolbar-nav">
						<TemplatesAdminNav active="field-list" />
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search field list..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button onClick={openCreate} variant="primary">
							New Field Row
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Code"
									sortKey="code"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Label"
									sortKey="label"
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
									label="Destination"
									sortKey="destination"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Usage"
									sortKey="usage"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Options</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={9} className="admin-table-empty-cell">
										No field list rows found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;
									const canManageOptions =
										row.valueColumnName === "value_option_key" ||
										row.fieldTypeCode.toLowerCase().includes("option") ||
										row.supportsOptions;
									const canManageTools = row.supportsTools;

									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center admin-table-cell--strong">
												{row.fieldListCode}
											</TD>
											<TD className="admin-table-cell--center">{row.label}</TD>
											<TD className="admin-table-cell--center">{row.fieldTypeLabel}</TD>
											<TD className="admin-table-cell--center">
												{formatDestination(row.renderDestinationCode)}
											</TD>
											<TD className="admin-table-cell--center">
												{row.templateUsageCount}
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant={row.enabled ? "success" : "secondary"}
													disabled={disabled}
													onClick={() => void toggleEnabled(row)}
													aria-label={row.enabled ? "Enabled" : "Disabled"}
												>
													{row.enabled ? "Enabled" : "Disabled"}
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													onClick={() => void deleteFieldListItem(row)}
													variant="danger"
													disabled={disabled}
												>
													Delete
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												{canManageOptions ? (
													<ButtonLink
														href={`/admin/web/templates/field-options?fieldListId=${encodeURIComponent(row.id)}`}
														variant="secondary"
													>
														Options
													</ButtonLink>
												) : null}
												{!canManageOptions && canManageTools ? (
													<ButtonLink
														href={`/admin/web/templates/field-list-tools?fieldListId=${encodeURIComponent(row.id)}`}
														variant="secondary"
													>
														Tools
													</ButtonLink>
												) : null}
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													onClick={() => openEdit(row)}
													variant="secondary"
													disabled={disabled}
												>
													Edit
												</Button>
											</TD>
										</TR>
									);
								})
							)}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={total}
					page={page}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPage(1);
					}}
					pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
				/>
			</div>

			<TemplateFieldListPanel
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
