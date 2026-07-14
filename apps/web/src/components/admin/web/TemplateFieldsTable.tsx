//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldsTable.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Per-template field placements table with admin actions                                                        ////
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
import type { TemplateFieldAdminItem } from "@/lib/data/templates";

import TemplateFieldsPanel from "./TemplateFieldsPanel";
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

export interface TemplateFieldsTableProps {
	templateId: string;
	templateLabel: string;
	templateCode: string;
	initialRows: TemplateFieldAdminItem[];
}

type Mode = "create" | "edit";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "order" | "template" | "field" | "label" | "type";

export default function TemplateFieldsTable({
	templateId,
	templateLabel,
	templateCode,
	initialRows,
}: TemplateFieldsTableProps): JSX.Element {
	const [rows, setRows] = useState<TemplateFieldAdminItem[]>(initialRows);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<Mode>("create");
	const [selectedRow, setSelectedRow] = useState<TemplateFieldAdminItem | null>(
		null,
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("order");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						templateCode,
						templateLabel,
						row.fieldListCode,
						row.fieldListLabel,
						row.labelOverride ?? "",
						row.helpTextOverride ?? "",
						row.fieldTypeCode,
						row.fieldTypeLabel,
						row.valueColumnName,
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "template") {
				comparison = compareAdminText(
					left.templateLabel || templateLabel,
					right.templateLabel || templateLabel,
				);
			} else if (sortKey === "field") {
				comparison = compareAdminText(left.fieldListLabel, right.fieldListLabel);
			} else if (sortKey === "label") {
				comparison = compareAdminText(
					left.labelOverride ?? left.fieldListLabel,
					right.labelOverride ?? right.fieldListLabel,
				);
			} else if (sortKey === "type") {
				comparison = compareAdminText(left.fieldTypeLabel, right.fieldTypeLabel);
			} else {
				comparison = compareAdminNumber(left.displayOrder, right.displayOrder);
			}

			if (comparison === 0) {
				comparison = compareAdminText(left.fieldListCode, right.fieldListCode);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [search, rows, sortDirection, sortKey, templateCode, templateLabel]);

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
			`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields`,
			{ cache: "no-store" },
		);
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh template fields."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldAdminItem[];
		};
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, [templateId]);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh template fields.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback(() => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((field: TemplateFieldAdminItem) => {
		setPanelMode("edit");
		setSelectedRow(field);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = useCallback(
		async (field: TemplateFieldAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(field.id);
			setError("");

			try {
				const response = await fetch(
					`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							op: "update",
							id: field.id,
							data: {
								fieldListId: field.fieldListId,
								labelOverride: field.labelOverride,
								helpTextOverride: field.helpTextOverride,
								displayOrder: String(field.displayOrder),
								required: field.required,
								enabled: !field.enabled,
							},
						}),
					},
				);

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update template field status.",
						),
					);
				}

				setRows((previousRows) =>
					previousRows.map((row) =>
						row.id === field.id ? { ...row, enabled: !row.enabled } : row,
					),
				);
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update template field status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, templateId],
	);

	const toggleRequired = useCallback(
		async (field: TemplateFieldAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(field.id);
			setError("");

			try {
				const response = await fetch(
					`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							op: "update",
							id: field.id,
							data: {
								fieldListId: field.fieldListId,
								labelOverride: field.labelOverride,
								helpTextOverride: field.helpTextOverride,
								displayOrder: String(field.displayOrder),
								required: !field.required,
								enabled: field.enabled,
							},
						}),
					},
				);

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update template field required status.",
						),
					);
				}

				setRows((previousRows) =>
					previousRows.map((row) =>
						row.id === field.id ? { ...row, required: !row.required } : row,
					),
				);
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update template field required status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, templateId],
	);

	const runDeleteTemplateField = useCallback(
		async (field: TemplateFieldAdminItem, force: boolean): Promise<void> => {
			const response = await fetch(
				`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: force ? "force-delete" : "delete",
						id: field.id,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(
						response,
						force
							? "Failed to force delete template field."
							: "Failed to delete template field.",
					),
				);
			}
		},
		[templateId],
	);

	const deleteTemplateField = useCallback(
		async (field: TemplateFieldAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete template field placement?",
				message: `Delete template field placement "${field.fieldListCode}" from ${templateCode}? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(field.id);
			setError("");

			try {
				try {
					await runDeleteTemplateField(field, false);
				} catch (deleteError: unknown) {
					const message =
						deleteError instanceof Error
							? deleteError.message
							: "Failed to delete template field.";
					const lowerMessage = message.toLowerCase();
					const canForceDelete =
						lowerMessage.includes("referenced") ||
						lowerMessage.includes("web_content_field_values");

					if (!canForceDelete) {
						throw new Error(message);
					}

					const forceConfirmed = await confirmAction({
						title: "Force delete used field placement?",
						message: `Template field placement "${field.fieldListCode}" is already used by content. Force delete it and remove existing values and registered external links for this field?`,
						confirmLabel: "Force delete",
						destructive: true,
					});
					if (!forceConfirmed) {
						throw new Error(message);
					}

					await runDeleteTemplateField(field, true);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete template field.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer, runDeleteTemplateField, templateCode],
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
							active="template-fields"
							contextualHref={`/admin/web/templates/${encodeURIComponent(templateId)}`}
							contextualLabel="Fields"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search template fields..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action admin-table-toolbar-action--end">
						<Button onClick={openCreate} variant="primary">
							New Template Field
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Order"
									sortKey="order"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Template Name"
									sortKey="template"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Field"
									sortKey="field"
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
								<TH className="admin-table-cell--center">Required</TH>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={9} className="admin-table-empty-cell">
										No template fields found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;
									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center">{row.displayOrder}</TD>
											<TD className="admin-table-cell--center">
												{row.templateLabel || templateLabel}
											</TD>
											<TD className="admin-table-cell--center">{row.fieldListLabel}</TD>
											<TD className="admin-table-cell--center">
												{row.labelOverride || row.fieldListLabel}
											</TD>
											<TD className="admin-table-cell--center">{row.fieldTypeLabel}</TD>
											<TD className="admin-table-cell--center">
												<Button
													type="button"
													variant={row.required ? "success" : "secondary"}
													className="admin-table-status-toggle"
													disabled={disabled}
													onClick={() => void toggleRequired(row)}
													aria-label={
														row.required ? "Set field as optional" : "Set field as required"
													}
												>
													{row.required ? "Yes" : "No"}
												</Button>
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
													onClick={() => void deleteTemplateField(row)}
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

			<TemplateFieldsPanel
				open={panelOpen}
				mode={panelMode}
				templateId={templateId}
				templateCode={templateCode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
