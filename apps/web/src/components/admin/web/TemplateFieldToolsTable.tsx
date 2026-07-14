//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldToolsTable.tsx                                           ////
//// Language: TSX                                                                                                 ////
//// Template field editor tool catalog table with admin actions                                                   ////
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
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type {
	TemplateFieldToolAdminItem,
	TemplateFieldTypeAdminItem,
} from "@/lib/data/templates";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminOptionalText,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

import AdminSortableTH from "./AdminSortableTH";
import TemplateFieldToolsPanel from "./TemplateFieldToolsPanel";
import TemplatesAdminNav from "./TemplatesAdminNav";

export interface TemplateFieldToolsTableProps {
	initialRows: TemplateFieldToolAdminItem[];
	fieldTypes: TemplateFieldTypeAdminItem[];
}

type Mode = "create" | "edit";
type SortKey = "tool" | "fieldType" | "label" | "group" | "order" | "usage";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

function formatGroupCode(code: string): string {
	const normalized = code.trim().toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function TemplateFieldToolsTable({
	initialRows,
	fieldTypes,
}: TemplateFieldToolsTableProps): JSX.Element {
	const [rows, setRows] = useState<TemplateFieldToolAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<Mode>("create");
	const [selectedRow, setSelectedRow] =
		useState<TemplateFieldToolAdminItem | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("fieldType");
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
					const haystack = [
						row.fieldToolCode,
						row.fieldTypeCode,
						row.fieldTypeLabel,
						row.label,
						row.toolGroupCode,
						formatGroupCode(row.toolGroupCode),
						row.description ?? "",
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "tool") {
				comparison = compareAdminText(left.fieldToolCode, right.fieldToolCode);
			} else if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "group") {
				comparison = compareAdminText(
					formatGroupCode(left.toolGroupCode),
					formatGroupCode(right.toolGroupCode),
				);
			} else if (sortKey === "order") {
				comparison = compareAdminNumber(left.displayOrder, right.displayOrder);
			} else if (sortKey === "usage") {
				comparison = compareAdminNumber(
					left.fieldListUsageCount,
					right.fieldListUsageCount,
				);
			} else {
				comparison = compareAdminOptionalText(
					left.fieldTypeLabel,
					right.fieldTypeLabel,
				);
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

		const response = await fetch("/api/admin/web/templates/field-tools", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh field tools."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldToolAdminItem[];
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
					: "Failed to refresh field tools.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((row: TemplateFieldToolAdminItem): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (row: TemplateFieldToolAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-tools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: row.id,
						data: {
							fieldToolCode: row.fieldToolCode,
							fieldTypeCode: row.fieldTypeCode,
							label: row.label,
							toolGroupCode: row.toolGroupCode,
							displayOrder: String(row.displayOrder),
							description: row.description,
							enabled: !row.enabled,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update field tool status.",
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
						: "Failed to update field tool status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId],
	);

	const deleteFieldTool = useCallback(
		async (row: TemplateFieldToolAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete field tool?",
				message: `Delete field tool "${row.fieldToolCode}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-tools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete field tool."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete field tool.",
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
					<div className="admin-table-toolbar-nav">
						<TemplatesAdminNav active="field-tools" />
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search field tools..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action admin-table-toolbar-action--end">
						<Button onClick={openCreate} variant="primary">
							New Field Tool
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-14" />
							<col className="table-col table-col--w-13" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Tool"
									sortKey="tool"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Field Type"
									sortKey="fieldType"
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
									label="Group"
									sortKey="group"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Order"
									sortKey="order"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Usage"
									sortKey="usage"
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
									<TD colSpan={9} className="admin-table-empty-cell">
										No field tools found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;

									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center admin-table-cell--strong">
												{row.fieldToolCode}
											</TD>
											<TD className="admin-table-cell--center">{row.fieldTypeLabel}</TD>
											<TD className="admin-table-cell--center">{row.label}</TD>
											<TD className="admin-table-cell--center">
												{formatGroupCode(row.toolGroupCode)}
											</TD>
											<TD className="admin-table-cell--center">{row.displayOrder}</TD>
											<TD className="admin-table-cell--center">
												{row.fieldListUsageCount}
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
													onClick={() => void deleteFieldTool(row)}
													variant="danger"
													disabled={disabled}
												>
													Delete
												</Button>
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

			<TemplateFieldToolsPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				fieldTypes={fieldTypes}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
