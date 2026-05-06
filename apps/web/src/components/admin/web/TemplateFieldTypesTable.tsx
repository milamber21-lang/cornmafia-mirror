//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldTypesTable.tsx                                           ////
//// Language: TSX                                                                                                 ////
//// Template field types table with admin actions                                                                 ////
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
import type { TemplateFieldTypeAdminItem } from "@/lib/data/templates";

import TemplateFieldTypesPanel from "./TemplateFieldTypesPanel";
import TemplatesAdminNav from "./TemplatesAdminNav";
import { readResponseMessage } from "@/lib/helpers/http-response";
import AdminSortableTH from "./AdminSortableTH";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

export interface TemplateFieldTypesTableProps {
	initialRows: TemplateFieldTypeAdminItem[];
}

type Mode = "create" | "edit";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "code" | "label" | "valueColumn";

export default function TemplateFieldTypesTable({
	initialRows,
}: TemplateFieldTypesTableProps): JSX.Element {
	const [rows, setRows] = useState<TemplateFieldTypeAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<Mode>("create");
	const [selectedRow, setSelectedRow] =
		useState<TemplateFieldTypeAdminItem | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("code");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextFieldTypes = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						row.fieldTypeCode,
						row.label,
						row.valueColumnName,
						row.description ?? "",
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextFieldTypes.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "valueColumn") {
				comparison = compareAdminText(left.valueColumnName, right.valueColumnName);
			} else {
				comparison = compareAdminText(left.fieldTypeCode, right.fieldTypeCode);
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

		const response = await fetch("/api/admin/web/templates/field-types", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh field types."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldTypeAdminItem[];
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
					: "Failed to refresh field types.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback(() => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((fieldType: TemplateFieldTypeAdminItem) => {
		setPanelMode("edit");
		setSelectedRow(fieldType);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (fieldType: TemplateFieldTypeAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(fieldType.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-types", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: fieldType.id,
						data: {
							fieldTypeCode: fieldType.fieldTypeCode,
							label: fieldType.label,
							valueColumnName: fieldType.valueColumnName,
							description: fieldType.description,
							enabled: !fieldType.enabled,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update field type status.",
						),
					);
				}

				setRows((previousRows) =>
					previousRows.map((row) =>
						row.id === fieldType.id ? { ...row, enabled: !row.enabled } : row,
					),
				);
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update field type status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId],
	);

	const deleteFieldType = useCallback(
		async (fieldType: TemplateFieldTypeAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete field type?",
				message: `Delete field type "${fieldType.fieldTypeCode}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(fieldType.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-types", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: fieldType.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete field type."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete field type.",
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
						<TemplatesAdminNav active="field-types" />
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search field types..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button onClick={openCreate} variant="green">
							New Field Type
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-25" />
							<col className="table-col table-col--w-25" />
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
									label="Value Column"
									sortKey="valueColumn"
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
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={6} className="admin-table-empty-cell">
										No field types found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;
									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center admin-table-cell--strong">{row.fieldTypeCode}</TD>
											<TD className="admin-table-cell--center">{row.label}</TD>
											<TD className="admin-table-cell--center">{row.valueColumnName}</TD>
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
													onClick={() => void deleteFieldType(row)}
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

			<TemplateFieldTypesPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
