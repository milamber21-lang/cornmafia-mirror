//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/SubcategoriesTable.tsx                                                ////
//// Language: TSX                                                                                                 ////
//// Subcategories table with local category filtering, search, and row-based panel lifecycle                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";

import {
	AlertBanner,
	Button,
	DropdownMenuSingle,
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
import { confirmAction } from "@/lib/client/confirm-dialog";
import type { SubcategoryAdminItem } from "@/lib/data/subcategories";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	applyAdminSortDirection,
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import {
	formatRankPolicySummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";

import SubcategoriesPanel from "./SubcategoriesPanel";

type Row = SubcategoryAdminItem;
type SortKey = "icon" | "title" | "category" | "read" | "write" | "navigation";
type CategoryFilterOption = {
	value: string;
	label: string;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

function getIconSortLabel(row: Row): string {
	return row.iconKey?.label || row.iconKey?.key || "";
}

function getCategoryFilterOptions(rows: Row[]): CategoryFilterOption[] {
	const byId = new Map<string, CategoryFilterOption>();

	for (const row of rows) {
		if (!byId.has(row.category.id)) {
			byId.set(row.category.id, {
				value: row.category.id,
				label: row.category.title || row.category.slug || row.category.id,
			});
		}
	}

	return sortAdminPickerOptions([...byId.values()]);
}

export default function SubcategoriesTable({
	initialRows = [],
}: {
	initialRows?: Row[];
}): React.JSX.Element {
	const [rows, setRows] = React.useState<Row[]>(initialRows);
	const [roles, setRoles] = React.useState<PolicyRoleRef[]>([]);
	const [error, setError] = React.useState("");
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [search, setSearch] = React.useState("");
	const [categoryFilter, setCategoryFilter] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState<number>(20);
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = React.useState<Row | null>(null);
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

	const refreshRows = React.useCallback(async (): Promise<void> => {
		setError("");

		const response = await fetch("/api/admin/web/subcategories", {
			cache: "no-store",
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to load subcategories."),
			);
		}

		const payload = (await response.json()) as { rows?: Row[] };
		setRows(Array.isArray(payload.rows) ? payload.rows : []);
	}, []);

	const loadRoles = React.useCallback(async (): Promise<void> => {
		const response = await fetch("/api/admin/web/subcategories/meta", {
			cache: "no-store",
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(
				await readResponseMessage(response, "Failed to load subcategory metadata."),
			);
		}

		const payload = (await response.json()) as { roles?: PolicyRoleRef[] };
		setRoles(Array.isArray(payload.roles) ? payload.roles : []);
	}, []);

	React.useEffect(() => {
		void loadRoles().catch((errorValue: unknown) => {
			setRoles([]);
			setError(
				errorValue instanceof Error
					? errorValue.message
					: "Failed to load subcategory metadata.",
			);
		});
	}, [loadRoles]);

	React.useEffect(() => {
		setPage(1);
	}, [categoryFilter, search]);

	const categoryOptions = React.useMemo(
		() => [
			{ value: "", label: "All categories" },
			...getCategoryFilterOptions(rows),
		],
		[rows],
	);

	const filteredRows = React.useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const normalizedCategoryFilter = categoryFilter.trim();
		const nextRows = rows.filter((row) => {
			if (
				normalizedCategoryFilter.length > 0 &&
				row.category.id !== normalizedCategoryFilter
			) {
				return false;
			}

			if (!normalizedSearch) {
				return true;
			}

			const title = row.title.toLowerCase();
			const slug = row.slug.toLowerCase();
			const categoryTitle = row.category.title.toLowerCase();
			const categorySlug = row.category.slug.toLowerCase();

			return (
				title.includes(normalizedSearch) ||
				slug.includes(normalizedSearch) ||
				categoryTitle.includes(normalizedSearch) ||
				categorySlug.includes(normalizedSearch)
			);
		});

		return nextRows.slice().sort((left, right) => {
			let comparison = 0;

			if (sortKey === "icon") {
				comparison = compareAdminText(
					getIconSortLabel(left),
					getIconSortLabel(right),
				);
			} else if (sortKey === "category") {
				comparison = compareAdminText(
					left.category.title,
					right.category.title,
				);
			} else if (sortKey === "read") {
				comparison = compareAdminText(
					formatRankPolicySummary(
						left.readEffectivePolicy,
						left.readEffectiveMinRank,
						roles,
					),
					formatRankPolicySummary(
						right.readEffectivePolicy,
						right.readEffectiveMinRank,
						roles,
					),
				);
			} else if (sortKey === "write") {
				comparison = compareAdminText(
					formatRankPolicySummary(
						left.writeEffectivePolicy,
						left.writeEffectiveMinRank,
						roles,
					),
					formatRankPolicySummary(
						right.writeEffectivePolicy,
						right.writeEffectiveMinRank,
						roles,
					),
				);
			} else if (sortKey === "navigation") {
				comparison = compareAdminText(
					left.navHiddenEffective ? "Hidden" : "Visible",
					right.navHiddenEffective ? "Hidden" : "Visible",
				);
			} else {
				comparison = compareAdminText(left.title, right.title);
			}

			return applyAdminSortDirection(comparison, sortDirection);
		});
	}, [categoryFilter, roles, rows, search, sortDirection, sortKey]);

	React.useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	const pageRows = React.useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredRows.slice(start, start + pageSize);
	}, [filteredRows, page, pageSize]);

	const closePanel = React.useCallback((): void => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

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

	const handleDelete = React.useCallback(
		async (row: Row): Promise<void> => {
			if (!row.id || busyId) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete subcategory?",
				message: `Delete subcategory "${row.title}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError("");

			try {
				const response = await fetch("/api/admin/web/subcategories", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete subcategory."),
					);
				}

				await refreshRows();
			} catch (errorValue: unknown) {
				setError(
					errorValue instanceof Error
						? errorValue.message
						: "Failed to delete subcategory.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, refreshRows],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-filter admin-table-toolbar-filter--category">
						<DropdownMenuSingle
							className="admin-table-filter-control"
							options={categoryOptions}
							value={categoryFilter}
							allowClear
							clearLabel="All categories"
							onChange={setCategoryFilter}
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							placeholder="Search by title, slug, or category"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button variant="green" onClick={openCreate}>
							New Subcategory
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-7" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-14" />
							<col className="table-col table-col--w-14" />
							<col className="table-col table-col--w-13" />
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
									label="Category"
									sortKey="category"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Read"
									sortKey="read"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Write"
									sortKey="write"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									className="admin-table-cell--center"
									label="Navigation"
									sortKey="navigation"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{pageRows.length === 0 ? (
								<TR>
									<TD colSpan={8} className="admin-table-empty-cell">
										No subcategories found.
									</TD>
								</TR>
							) : (
								pageRows.map((row) => {
									const rowBusy = busyId === row.id;

									return (
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
											<TD className="admin-table-cell--center">{row.category.title}</TD>
											<TD className="admin-table-cell--center">
												{formatRankPolicySummary(
													row.readEffectivePolicy,
													row.readEffectiveMinRank,
													roles,
												)}
											</TD>
											<TD className="admin-table-cell--center">
												{formatRankPolicySummary(
													row.writeEffectivePolicy,
													row.writeEffectiveMinRank,
													roles,
												)}
											</TD>
											<TD className="admin-table-cell--center">
												{row.navHiddenEffective ? "Hidden" : "Visible"}
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant="accent"
													onClick={() => void handleDelete(row)}
													disabled={rowBusy || busyId !== null}
												>
													{rowBusy ? "Deleting..." : "Delete"}
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
									);
								})
							)}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={filteredRows.length}
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

			<SubcategoriesPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				onSaved={() => {
					void refreshRows().catch((errorValue: unknown) => {
						setError(
							errorValue instanceof Error
								? errorValue.message
								: "Failed to refresh subcategories.",
						);
					});
				}}
			/>
		</>
	);
}
