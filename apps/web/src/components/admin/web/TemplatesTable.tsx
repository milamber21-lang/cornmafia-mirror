//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplatesTable.tsx                                                    ////
//// Language: TSX                                                                                                ////
//// Templates table with content metadata columns and shared icon rendering                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import type { JSX } from "react";

import AdminSortableTH from "./AdminSortableTH";
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
import IconRender from "@/components/ui/IconRender";
import type { TemplateAdminItem } from "@/lib/data/templates";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

import TemplatesAdminNav from "./TemplatesAdminNav";
import TemplatesPanel from "./TemplatesPanel";
import { confirmAction } from "@/lib/client/confirm-dialog";

export interface TemplatesTableProps {
	initialRows: TemplateAdminItem[];
}

type Mode = "create" | "edit";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey =
	| "icon"
	| "code"
	| "label"
	| "contentKind"
	| "surface"
	| "series"
	| "fieldCount"
	| "version";

function formatSurfaceScope(surfaceScopeCode: string): string {
	if (surfaceScopeCode === "admin") {
		return "Admin";
	}

	if (surfaceScopeCode === "public") {
		return "Public";
	}

	return surfaceScopeCode;
}

export default function TemplatesTable({
	initialRows,
}: TemplatesTableProps): JSX.Element {
	const [rows, setRows] = React.useState<TemplateAdminItem[]>(initialRows);
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [error, setError] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<Mode>("create");
	const [selectedRow, setSelectedRow] = React.useState<TemplateAdminItem | null>(
		null,
	);
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState<number>(20);
	const [sortKey, setSortKey] = React.useState<SortKey>("code");
	const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

	const filteredRows = React.useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextTemplates = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						row.templateCode,
						row.label,
						row.contentKindCode,
						row.contentKindLabel,
						row.surfaceScopeCode,
						row.allowsSeries ? "series allowed" : "series unavailable",
						row.description ?? "",
					]
						.join(" ")
						.toLowerCase();

					return haystack.includes(normalizedSearch);
				})
			: rows;

		return nextTemplates.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "icon") {
				comparison = compareAdminText(
					left.defaultIconKey?.label ?? left.defaultIconKey?.key ?? "",
					right.defaultIconKey?.label ?? right.defaultIconKey?.key ?? "",
				);
			} else if (sortKey === "label") {
				comparison = compareAdminText(left.label, right.label);
			} else if (sortKey === "contentKind") {
				comparison = compareAdminText(
					left.contentKindLabel,
					right.contentKindLabel,
				);
			} else if (sortKey === "surface") {
				comparison = compareAdminText(
					formatSurfaceScope(left.surfaceScopeCode),
					formatSurfaceScope(right.surfaceScopeCode),
				);
			} else if (sortKey === "series") {
				comparison = compareAdminText(
					left.allowsSeries ? "Yes" : "No",
					right.allowsSeries ? "Yes" : "No",
				);
			} else if (sortKey === "fieldCount") {
				comparison = compareAdminNumber(left.fieldCount, right.fieldCount);
			} else if (sortKey === "version") {
				comparison = compareAdminNumber(
					left.schemaVersionNo,
					right.schemaVersionNo,
				);
			} else {
				comparison = compareAdminText(left.templateCode, right.templateCode);
			}

			if (comparison === 0) {
				comparison = compareAdminText(left.templateCode, right.templateCode);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [search, rows, sortDirection, sortKey]);

	const total = filteredRows.length;
	const startIndex = (page - 1) * pageSize;
	const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

	React.useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	const refreshFromServer = React.useCallback(async (): Promise<void> => {
		setError("");

		const response = await fetch("/api/admin/web/templates", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh templates."),
			);
		}

		const payload = (await response.json()) as { rows?: TemplateAdminItem[] };
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const handleSaved = React.useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh templates.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = React.useCallback(() => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = React.useCallback((template: TemplateAdminItem) => {
		setPanelMode("edit");
		setSelectedRow(template);
		setPanelOpen(true);
	}, []);

	const closePanel = React.useCallback(() => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const toggleEnabled = React.useCallback(
		async (template: TemplateAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(template.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: template.id,
						data: {
							templateCode: template.templateCode,
							label: template.label,
							description: template.description,
							contentKindCode: template.contentKindCode,
							surfaceScopeCode: template.surfaceScopeCode,
							allowsSeries: template.allowsSeries,
							defaultIconKeyId: template.defaultIconKey?.id ?? "",
							defaultIconColorId: template.defaultIconColor?.id ?? "",
							enabled: !template.enabled,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to update template status."),
					);
				}

				await refreshFromServer();
			} catch (toggleError: unknown) {
				setError(
					toggleError instanceof Error
						? toggleError.message
						: "Failed to update template status.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteTemplate = React.useCallback(
		async (template: TemplateAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete template?",
				message: `Delete template "${template.templateCode}"? This cannot be undone.`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(template.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: template.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete template."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete template.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const handleSortChange = React.useCallback(
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
						<TemplatesAdminNav active="templates" />
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search templates..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button onClick={openCreate} variant="primary">
							New Template
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-6" />
							<col className="table-col table-col--w-9" />
							<col className="table-col table-col--w-11" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-7" />
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-5" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Icon"
									sortKey="icon"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
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
									label="Content Kind"
									sortKey="contentKind"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Surface"
									sortKey="surface"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Series"
									sortKey="series"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Field #"
									sortKey="fieldCount"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Version"
									sortKey="version"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Fields</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={12} className="admin-table-empty-cell">
										No templates found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;

									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center">
												<div className="admin-table-icon-cell">
													<IconRender
														iconKey={row.defaultIconKey}
														iconColor={row.defaultIconColor}
														size={24}
														mediaRouteScope="admin"
													/>
												</div>
											</TD>
											<TD className="admin-table-cell--center admin-table-cell--strong">
												{row.templateCode}
											</TD>
											<TD className="admin-table-cell--center">{row.label}</TD>
											<TD className="admin-table-cell--center">
												<div className="admin-table-cell--strong">
													{row.contentKindLabel}
												</div>
											</TD>
											<TD className="admin-table-cell--center">
												{formatSurfaceScope(row.surfaceScopeCode)}
											</TD>
											<TD className="admin-table-cell--center">
												{row.allowsSeries ? "Yes" : "No"}
											</TD>
											<TD className="admin-table-cell--center">{row.fieldCount}</TD>
											<TD className="admin-table-cell--center">{row.schemaVersionNo}</TD>
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
													onClick={() => void deleteTemplate(row)}
													variant="danger"
													disabled={disabled}
												>
													Delete
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<ButtonLink
													href={`/admin/web/templates/${row.id}`}
													variant="secondary"
												>
													Manage
												</ButtonLink>
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

			<TemplatesPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={() => {
					void handleSaved();
				}}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
