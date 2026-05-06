//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldOptionsTable.tsx                                         ////
//// Language: TSX                                                                                                 ////
//// Small-list admin table for template field options                                                             ////
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
import type {
	TemplateFieldListAdminItem,
	TemplateFieldOptionAdminItem,
} from "@/lib/data/templates";

import TemplateFieldOptionsPanel from "./TemplateFieldOptionsPanel";
import TemplatesAdminNav from "./TemplatesAdminNav";
import { readResponseMessage } from "@/lib/helpers/http-response";
import AdminSortableTH from "./AdminSortableTH";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

type Mode = "create" | "edit";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "order" | "field" | "optionKey" | "label";

export interface TemplateFieldOptionsTableProps {
	initialRows: TemplateFieldOptionAdminItem[];
	fieldList: TemplateFieldListAdminItem;
}

export default function TemplateFieldOptionsTable({
	initialRows,
	fieldList,
}: TemplateFieldOptionsTableProps): JSX.Element {
	const [rows, setRows] = useState<TemplateFieldOptionAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<Mode>("create");
	const [selectedRow, setSelectedRow] =
		useState<TemplateFieldOptionAdminItem | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("order");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	useEffect(() => {
		setRows(initialRows);
		setPage(1);
		setSearch("");
		setPanelOpen(false);
		setSelectedRow(null);
		setError("");
	}, [fieldList.id, initialRows]);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						row.fieldListLabel,
						row.fieldListCode,
						row.optionKey,
						row.label,
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "field") {
				comparison = compareAdminText(left.fieldListLabel, right.fieldListLabel);
			} else if (sortKey === "optionKey") {
				comparison = compareAdminText(left.optionKey, right.optionKey);
			} else if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else {
				comparison = compareAdminNumber(left.displayOrder, right.displayOrder);
			}

			if (comparison === 0) {
				comparison = compareAdminText(left.optionKey, right.optionKey);
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

		const response = await fetch(
			`/api/admin/web/templates/field-options?fieldListId=${encodeURIComponent(fieldList.id)}`,
			{
				cache: "no-store",
			},
		);
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh field options."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldOptionAdminItem[];
		};
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, [fieldList.id]);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh field options.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback(() => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: TemplateFieldOptionAdminItem) => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: TemplateFieldOptionAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-options", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: row.id,
						data: {
							fieldListId: row.fieldListId,
							optionKey: row.optionKey,
							label: row.label,
							displayOrder: String(row.displayOrder),
							enabled: !row.enabled,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update field option status.",
						),
					);
				}

				setRows((previousRows) =>
					previousRows.map((currentRow) =>
						currentRow.id === row.id
							? { ...currentRow, enabled: !currentRow.enabled }
							: currentRow,
					),
				);
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update field option status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId],
	);

	const deleteFieldOption = useCallback(
		async (row: TemplateFieldOptionAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete field option?",
				message: `Delete field option "${row.optionKey}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-options", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete field option."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete field option.",
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
						<TemplatesAdminNav
							active="field-options"
							contextualHref={`/admin/web/templates/field-options?fieldListId=${encodeURIComponent(fieldList.id)}`}
							contextualLabel="Options"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search field options..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action admin-table-toolbar-action--end">
						<Button onClick={openCreate} variant="green">
							New Field Option
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
								<AdminSortableTH label="Order" sortKey="order" activeSortKey={sortKey} sortDirection={sortDirection} onSortChange={handleSortChange} />
								<AdminSortableTH label="Field" sortKey="field" activeSortKey={sortKey} sortDirection={sortDirection} onSortChange={handleSortChange} />
								<AdminSortableTH label="Option Key" sortKey="optionKey" activeSortKey={sortKey} sortDirection={sortDirection} onSortChange={handleSortChange} />
								<AdminSortableTH label="Label" sortKey="label" activeSortKey={sortKey} sortDirection={sortDirection} onSortChange={handleSortChange} />
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={7} className="admin-table-empty-cell">
										No field options found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;
									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center">{row.displayOrder}</TD>
											<TD className="admin-table-cell--center">{row.fieldListLabel}</TD>
											<TD className="admin-table-cell--center admin-table-cell--strong">{row.optionKey}</TD>
											<TD className="admin-table-cell--center">{row.label}</TD>
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
													onClick={() => void deleteFieldOption(row)}
													variant="accent"
													disabled={disabled}
												>
													Delete
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													onClick={() => openEdit(row)}
													variant="neutral"
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

			<TemplateFieldOptionsPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				initialFieldListId={fieldList.id}
				fieldListLabel={fieldList.label}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
