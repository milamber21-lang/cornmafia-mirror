//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/CategoriesTable.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Small-list admin table for categories with local search and row-owned mutations                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";

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
import IconRender from "@/components/ui/IconRender";
import AdminSortableTH from "./AdminSortableTH";
import CategoriesPanel, { type CategoryItem } from "./CategoriesPanel";
import {
	formatRankPolicySummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";
import { readResponseMessage } from "@/lib/helpers/http-response";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";

type Row = CategoryItem;
type SortKey = "icon" | "title" | "slug" | "readPolicy" | "writePolicy";
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

function getIconSortLabel(row: Row): string {
	return row.iconKey?.label || row.iconKey?.key || "";
}

export default function CategoriesTable({
	initialRows = [],
}: {
	initialRows?: Row[];
}): React.JSX.Element {
	const [rows, setRows] = React.useState<Row[]>(initialRows);
	const [roles, setRoles] = React.useState<PolicyRoleRef[]>([]);
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [error, setError] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = React.useState<Row | null>(null);
	const [page, setPage] = React.useState<number>(1);
	const [pageSize, setPageSize] = React.useState<number>(20);
	const [sortKey, setSortKey] = React.useState<SortKey>("title");
	const [sortDirection, setSortDirection] =
		React.useState<SortDirection>("asc");

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

	const refreshFromServer = React.useCallback(async (): Promise<void> => {
		const response = await fetch("/api/admin/web/categories", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to load categories."),
			);
		}

		const payload = (await response.json()) as { rows?: Row[] };
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const fetchRoles = React.useCallback(async (): Promise<void> => {
		const response = await fetch("/api/admin/web/categories/meta", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to load category metadata."),
			);
		}

		const payload = (await response.json()) as { roles?: PolicyRoleRef[] };
		setRoles(Array.isArray(payload.roles) ? payload.roles : []);
	}, []);

	React.useEffect(() => {
		let active = true;

		void (async () => {
			try {
				await fetchRoles();
			} catch (errorValue: unknown) {
				if (!active) {
					return;
				}

				setError(
					errorValue instanceof Error
						? errorValue.message
						: "Failed to load category metadata.",
				);
				setRoles([]);
			}
		})();

		return () => {
			active = false;
		};
	}, [fetchRoles]);

	const filteredRows = React.useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const nextRows = normalizedSearch
			? rows.filter((row) => {
					const readSummary = formatRankPolicySummary(
						row.readPolicy,
						row.readMinRank,
						roles,
					).toLowerCase();
					const writeSummary = formatRankPolicySummary(
						row.writePolicy,
						row.writeMinRank,
						roles,
					).toLowerCase();

					return (
						row.title.toLowerCase().includes(normalizedSearch) ||
						row.slug.toLowerCase().includes(normalizedSearch) ||
						readSummary.includes(normalizedSearch) ||
						writeSummary.includes(normalizedSearch)
					);
				})
			: rows;

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "icon") {
				comparison = compareAdminText(
					getIconSortLabel(left),
					getIconSortLabel(right),
				);
			} else if (sortKey === "slug") {
				comparison = compareAdminText(left.slug, right.slug);
			} else if (sortKey === "readPolicy") {
				comparison = compareAdminText(
					formatRankPolicySummary(left.readPolicy, left.readMinRank, roles),
					formatRankPolicySummary(right.readPolicy, right.readMinRank, roles),
				);
			} else if (sortKey === "writePolicy") {
				comparison = compareAdminText(
					formatRankPolicySummary(left.writePolicy, left.writeMinRank, roles),
					formatRankPolicySummary(right.writePolicy, right.writeMinRank, roles),
				);
			} else {
				comparison = compareAdminText(left.title, right.title);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [roles, rows, search, sortDirection, sortKey]);

	React.useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	const paginatedRows = React.useMemo(() => {
		const startIndex = (page - 1) * pageSize;
		return filteredRows.slice(startIndex, startIndex + pageSize);
	}, [filteredRows, page, pageSize]);

	const openCreate = React.useCallback((): void => {
		setPanelMode("create");
		setSelectedRow(null);
		setPanelOpen(true);
	}, []);

	const openEdit = React.useCallback((row: Row): void => {
		setPanelMode("edit");
		setSelectedRow(row);
		setPanelOpen(true);
	}, []);

	const closePanel = React.useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const handleSaved = React.useCallback(async (): Promise<void> => {
		try {
			setError("");
			await refreshFromServer();
		} catch (errorValue: unknown) {
			setError(
				errorValue instanceof Error
					? errorValue.message
					: "Failed to refresh categories.",
			);
		}
	}, [refreshFromServer]);

	const toggleHidden = React.useCallback(
		async (row: Row): Promise<void> => {
			if (busyId) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/categories", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "toggle", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update category navigation visibility.",
						),
					);
				}

				await refreshFromServer();
			} catch (errorValue: unknown) {
				setError(
					errorValue instanceof Error
						? errorValue.message
						: "Failed to update category navigation visibility.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshFromServer],
	);

	const deleteRow = React.useCallback(
		async (row: Row): Promise<void> => {
			if (busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete category?",
				message: `Delete category "${row.title}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/categories", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete category."),
					);
				}

				await refreshFromServer();
			} catch (errorValue: unknown) {
				setError(
					errorValue instanceof Error
						? errorValue.message
						: "Failed to delete category.",
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
					<div className="admin-table-toolbar-spacer admin-table-toolbar-spacer--action" aria-hidden="true" />

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search by title, slug, or policy"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="green" onClick={openCreate}>
							New Category
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-18" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Icon"
									sortKey="icon"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
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
									label="Slug"
									sortKey="slug"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Read policy"
									sortKey="readPolicy"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Write policy"
									sortKey="writePolicy"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Nav</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>
						<TBody>
							{paginatedRows.length === 0 ? (
								<TR>
									<TD colSpan={8} className="admin-table-empty-cell">
										No categories found.
									</TD>
								</TR>
							) : (
								paginatedRows.map((row) => (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">
											<div className="admin-table-icon-cell">
												<IconRender
													iconKey={row.iconKey}
													iconColor={row.iconColor}
													size={24}
													mediaRouteScope="admin"
												/>
											</div>
										</TD>
										<TD className="admin-table-cell--center">{row.title}</TD>
										<TD className="admin-table-cell--center">/{row.slug}</TD>
										<TD className="admin-table-cell--center">
											{formatRankPolicySummary(row.readPolicy, row.readMinRank, roles)}
										</TD>
										<TD className="admin-table-cell--center">
											{formatRankPolicySummary(row.writePolicy, row.writeMinRank, roles)}
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant={row.navHidden ? "neutral" : "green"}
												onClick={() => void toggleHidden(row)}
												loading={busyId === row.id}
											>
												{row.navHidden ? "Hidden" : "Visible"}
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="accent"
												onClick={() => void deleteRow(row)}
												loading={busyId === row.id}
											>
												Delete
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="neutral"
												onClick={() => openEdit(row)}
												disabled={busyId !== null}
											>
												Edit
											</Button>
										</TD>
									</TR>
								))
							)}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={filteredRows.length}
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

			<CategoriesPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
