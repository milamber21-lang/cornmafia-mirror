//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldListToolsTable.tsx                                      ////
//// Language: TSX                                                                                                 ////
//// Small-list admin table for selected template field-list editor toolbar tools                                  ////
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
import AdminSortableTH from "./AdminSortableTH";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminNumber,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import type {
	TemplateFieldListAdminItem,
	TemplateFieldListToolAdminItem,
	TemplateFieldToolAdminItem,
} from "@/lib/data/templates";
import { readResponseMessage } from "@/lib/helpers/http-response";

import TemplateFieldListToolsPanel from "./TemplateFieldListToolsPanel";
import TemplatesAdminNav from "./TemplatesAdminNav";

export interface TemplateFieldListToolsTableProps {
	initialRows: TemplateFieldListToolAdminItem[];
	availableTools: TemplateFieldToolAdminItem[];
	fieldList: TemplateFieldListAdminItem;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type SortKey = "order" | "tool" | "label" | "group";

function formatGroupCode(code: string): string {
	const normalized = code.trim().toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function TemplateFieldListToolsTable({
	initialRows,
	availableTools,
	fieldList,
}: TemplateFieldListToolsTableProps): JSX.Element {
	const [rows, setRows] =
		useState<TemplateFieldListToolAdminItem[]>(initialRows);
	const [tools, setTools] =
		useState<TemplateFieldToolAdminItem[]>(availableTools);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [panelOpen, setPanelOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(20);
	const [sortKey, setSortKey] = useState<SortKey>("order");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	useEffect(() => {
		setRows(initialRows);
		setTools(availableTools);
		setPage(1);
		setSearch("");
		setPanelOpen(false);
		setError("");
	}, [availableTools, fieldList.id, initialRows]);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter((row) => {
					const haystack = [
						row.fieldListLabel,
						row.fieldListCode,
						row.fieldTypeCode,
						row.fieldToolCode,
						row.fieldToolLabel,
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
				comparison = compareAdminText(left.fieldToolLabel, right.fieldToolLabel);
			} else if (sortKey === "group") {
				comparison = compareAdminText(
					formatGroupCode(left.toolGroupCode),
					formatGroupCode(right.toolGroupCode),
				);
			} else {
				comparison = compareAdminNumber(left.displayOrder, right.displayOrder);
			}

			if (comparison === 0) {
				comparison = compareAdminText(left.fieldToolCode, right.fieldToolCode);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [rows, search, sortDirection, sortKey]);

	const selectedCodes = useMemo(
		() => new Set(rows.map((row) => row.fieldToolCode)),
		[rows],
	);

	const selectableTools = useMemo(
		() =>
			tools
				.filter((tool) => !selectedCodes.has(tool.fieldToolCode))
				.slice()
				.sort((left, right) =>
					compareAdminText(
						`${left.label} (${left.fieldToolCode})`,
						`${right.label} (${right.fieldToolCode})`,
					),
				),
		[selectedCodes, tools],
	);

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
			`/api/admin/web/templates/field-list-tools?fieldListId=${encodeURIComponent(fieldList.id)}`,
			{ cache: "no-store" },
		);
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to refresh field-list tools."),
			);
		}

		const payload = (await response.json()) as {
			rows?: TemplateFieldListToolAdminItem[];
			availableTools?: TemplateFieldToolAdminItem[];
		};
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
		setTools(Array.isArray(payload.availableTools) ? payload.availableTools : []);
	}, [fieldList.id]);

	const handleSaved = useCallback(async (): Promise<void> => {
		try {
			await refreshFromServer();
		} catch (refreshError: unknown) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to refresh field-list tools.",
			);
		}
	}, [refreshFromServer]);

	const openCreate = useCallback(() => {
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
	}, []);

	const removeFieldTool = useCallback(
		async (row: TemplateFieldListToolAdminItem): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Remove field tool?",
				message: `Remove tool "${row.fieldToolLabel}" from "${fieldList.label}"?`,
				confirmLabel: "Remove",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/templates/field-list-tools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "delete",
						id: row.fieldToolCode,
						data: { fieldListId: row.fieldListId },
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to remove field tool."),
					);
				}

				await refreshFromServer();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to remove field tool.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, fieldList.label, refreshFromServer],
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
							active="field-list-tools"
							contextualHref={`/admin/web/templates/field-list-tools?fieldListId=${encodeURIComponent(fieldList.id)}`}
							contextualLabel="Tools"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search selected tools..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action admin-table-toolbar-action--end">
						<Button
							onClick={openCreate}
							variant="primary"
							disabled={selectableTools.length === 0}
						>
							Add Tool
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-20" />
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
									label="Tool"
									sortKey="tool"
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
									label="Group"
									sortKey="group"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Remove</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={6} className="admin-table-empty-cell">
										No selected field tools found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const disabled = busyId === row.id;
									const active = row.enabled && row.fieldToolEnabled;

									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center">{row.displayOrder}</TD>
											<TD className="admin-table-cell--center admin-table-cell--strong">
												{row.fieldToolCode}
											</TD>
											<TD className="admin-table-cell--center">{row.fieldToolLabel}</TD>
											<TD className="admin-table-cell--center">
												{formatGroupCode(row.toolGroupCode)}
											</TD>
											<TD className="admin-table-cell--center">
												{active ? "Enabled" : "Disabled"}
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													onClick={() => void removeFieldTool(row)}
													variant="danger"
													disabled={disabled}
												>
													Remove
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

			<TemplateFieldListToolsPanel
				open={panelOpen}
				fieldList={fieldList}
				availableTools={selectableTools}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
