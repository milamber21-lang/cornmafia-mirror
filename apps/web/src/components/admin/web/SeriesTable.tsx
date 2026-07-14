//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/SeriesTable.tsx                                                       ////
//// Language: TSX                                                                                                 ////
//// Series table with server-driven query state and parent-owned panel lifecycle                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AdminSortableTH from "./AdminSortableTH";
import SeriesPanel, {
	type SeriesItem,
	type SeriesMetaBundle,
} from "@/components/admin/web/SeriesPanel";
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
import { confirmAction } from "@/lib/client/confirm-dialog";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { getNextSortDirection } from "@/lib/helpers/admin-table-sorting";
import type { SortDirection } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";
import { formatRankPolicySummary } from "@/lib/helpers/rank-policy";

type SeriesIconMedia = {
	id: string;
	url: string | null;
	filename: string | null;
	originalFilename: string | null;
	mimeType: string | null;
	storageRelPath: string | null;
} | null;

type SeriesIconRef = {
	id: string;
	key: string;
	label: string;
	source: "lucide" | "media";
	lucideName: string | null;
	iconMedia: SeriesIconMedia;
} | null;

type SeriesIconColorRef = {
	id: string;
	key: string;
	label: string;
	preview: string;
} | null;

type Row = SeriesItem & {
	id: string;
	categoryTitle?: string | null;
	subcategoryTitle?: string | null;
	iconKey?: SeriesIconRef;
	iconColor?: SeriesIconColorRef;
};

type SeriesResponse = {
	rows?: unknown[];
	page?: unknown;
	pageSize?: unknown;
	totalDocs?: unknown;
};

type SortKey =
	| "icon"
	| "title"
	| "category"
	| "subcategory"
	| "read"
	| "write"
	| "author";

type QueryPatch = Partial<{
	search: string;
	page: number;
	pageSize: number;
	categoryId: string;
	subcategoryId: string;
	sortBy: SortKey;
	sortDir: SortDirection;
}>;

type CategoryFilterOption = {
	value: string;
	label: string;
};

type SubcategoryFilterOption = {
	value: string;
	label: string;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const SORT_KEYS: readonly SortKey[] = [
	"icon",
	"title",
	"category",
	"subcategory",
	"read",
	"write",
	"author",
] as const;

function isSeriesRow(value: unknown): value is Row {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { id?: unknown }).id === "string" &&
		typeof (value as { title?: unknown }).title === "string"
	);
}

function parsePositiveIntParam(value: string | null, fallback: number): number {
	if (typeof value !== "string") {
		return fallback;
	}

	const normalized = value.trim();
	if (!/^\d+$/.test(normalized)) {
		return fallback;
	}

	const parsed = Number(normalized);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSortKeyParam(value: string | null): SortKey {
	return SORT_KEYS.find((sortKey) => sortKey === value) ?? "title";
}

function parseSortDirectionParam(value: string | null): SortDirection {
	return value === "desc" ? "desc" : "asc";
}

function toPositiveInt(value: unknown, fallback: number): number {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
	}

	return fallback;
}

function toNonNegativeInt(value: unknown): number {
	if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
	}

	return 0;
}

function buildCategoryOptions(meta: SeriesMetaBundle): CategoryFilterOption[] {
	return sortAdminPickerOptions(
		meta.categories.map((category) => ({
			value: category.id,
			label: category.title || category.slug || category.id,
		})),
	);
}

function buildSubcategoryOptions(
	meta: SeriesMetaBundle,
	categoryId: string,
): SubcategoryFilterOption[] {
	if (categoryId.length === 0) {
		return [];
	}

	return sortAdminPickerOptions(
		meta.subcategories
			.filter((subcategory) => subcategory.categoryId === categoryId)
			.map((subcategory) => ({
				value: subcategory.id,
				label: subcategory.title || subcategory.id,
			})),
	);
}

export default function SeriesTable({
	meta,
}: {
	meta: SeriesMetaBundle;
}): React.JSX.Element {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const searchParamsString = searchParams.toString();

	const page = parsePositiveIntParam(searchParams.get("page"), 1);
	const pageSize = parsePositiveIntParam(searchParams.get("pageSize"), 20);
	const searchValue = (searchParams.get("search") ?? "").trim();
	const categoryFilter = (searchParams.get("categoryId") ?? "").trim();
	const subcategoryFilter = (searchParams.get("subcategoryId") ?? "").trim();
	const sortBy = parseSortKeyParam(searchParams.get("sortBy"));
	const sortDir = parseSortDirectionParam(searchParams.get("sortDir"));

	const [rows, setRows] = React.useState<Row[]>([]);
	const roles = meta.roles;
	const [totalDocs, setTotalDocs] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const metaError = meta.error;
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [search, setSearch] = React.useState(searchValue);
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<"create" | "edit">("create");
	const [selectedRow, setSelectedRow] = React.useState<SeriesItem | null>(null);

	const categoryOptions = React.useMemo(
		() => buildCategoryOptions(meta),
		[meta],
	);
	const subcategoryOptions = React.useMemo(
		() => buildSubcategoryOptions(meta, categoryFilter),
		[categoryFilter, meta],
	);

	React.useEffect(() => {
		setSearch(searchValue);
	}, [searchValue]);

	const setParams = React.useCallback(
		(patch: QueryPatch): void => {
			const params = new URLSearchParams(searchParamsString);

			if (typeof patch.page === "number") {
				params.set("page", String(patch.page));
			}

			if (typeof patch.pageSize === "number") {
				params.set("pageSize", String(patch.pageSize));
			}

			if (typeof patch.search === "string") {
				if (patch.search.trim().length > 0) {
					params.set("search", patch.search.trim());
				} else {
					params.delete("search");
				}
			}

			if (typeof patch.categoryId === "string") {
				if (patch.categoryId.trim().length > 0) {
					params.set("categoryId", patch.categoryId.trim());
				} else {
					params.delete("categoryId");
				}
			}

			if (typeof patch.subcategoryId === "string") {
				if (patch.subcategoryId.trim().length > 0) {
					params.set("subcategoryId", patch.subcategoryId.trim());
				} else {
					params.delete("subcategoryId");
				}
			}

			if (typeof patch.sortBy === "string") {
				params.set("sortBy", patch.sortBy);
			}

			if (typeof patch.sortDir === "string") {
				params.set("sortDir", patch.sortDir);
			}

			const queryString = params.toString();
			router.replace(
				queryString.length > 0 ? `${pathname}?${queryString}` : pathname,
			);
		},
		[pathname, router, searchParamsString],
	);

	React.useEffect(() => {
		if (subcategoryFilter.length === 0) {
			return;
		}

		const validSubcategory = subcategoryOptions.some(
			(option) => option.value === subcategoryFilter,
		);
		if (!validSubcategory) {
			setParams({ subcategoryId: "", page: 1 });
		}
	}, [setParams, subcategoryFilter, subcategoryOptions]);

	const refreshCurrentQuery = React.useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const url = new URL("/api/admin/web/series", window.location.origin);
			url.searchParams.set("page", String(page));
			url.searchParams.set("pageSize", String(pageSize));
			url.searchParams.set("sortBy", sortBy);
			url.searchParams.set("sortDir", sortDir);

			if (searchValue.length > 0) {
				url.searchParams.set("search", searchValue);
			}

			if (categoryFilter.length > 0) {
				url.searchParams.set("categoryId", categoryFilter);
			}

			if (subcategoryFilter.length > 0) {
				url.searchParams.set("subcategoryId", subcategoryFilter);
			}

			const response = await fetch(url.toString(), {
				cache: "no-store",
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to load series."),
				);
			}

			const payload = (await response.json()) as SeriesResponse;
			const nextRows = Array.isArray(payload.rows)
				? payload.rows.filter(isSeriesRow)
				: [];
			const nextPage = toPositiveInt(payload.page, page);
			const nextPageSize = toPositiveInt(payload.pageSize, pageSize);
			const nextTotalDocs = toNonNegativeInt(payload.totalDocs);

			setRows(nextRows);
			setTotalDocs(nextTotalDocs);

			if (nextPage !== page || nextPageSize !== pageSize) {
				setParams({ page: nextPage, pageSize: nextPageSize });
			}
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error ? loadError.message : "Failed to load series.",
			);
			setRows([]);
			setTotalDocs(0);
		} finally {
			setLoading(false);
		}
	}, [
		categoryFilter,
		page,
		pageSize,
		searchValue,
		setParams,
		sortBy,
		sortDir,
		subcategoryFilter,
	]);

	React.useEffect(() => {
		void refreshCurrentQuery();
	}, [refreshCurrentQuery]);

	const closePanel = React.useCallback((): void => {
		setPanelOpen(false);
		setPanelMode("create");
		setSelectedRow(null);
	}, []);

	const handleSaved = React.useCallback((): void => {
		closePanel();
		void refreshCurrentQuery();
	}, [closePanel, refreshCurrentQuery]);

	const handleSortChange = React.useCallback(
		(nextSortKey: SortKey): void => {
			const nextSortDirection = getNextSortDirection(
				sortBy === nextSortKey,
				sortDir,
			);
			setParams({ sortBy: nextSortKey, sortDir: nextSortDirection, page: 1 });
		},
		[setParams, sortBy, sortDir],
	);

	const handleDelete = React.useCallback(
		async (row: Row): Promise<void> => {
			if (busyId !== null) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete series?",
				message: `Delete series "${row.title}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError(null);

			try {
				const response = await fetch("/api/admin/web/series", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: row.id }),
				});

				if (!response.ok) {
					throw new Error(await readResponseMessage(response, "Delete failed."));
				}

				await refreshCurrentQuery();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error ? deleteError.message : "Delete failed.",
				);
			} finally {
				setBusyId((currentBusyId) =>
					currentBusyId === row.id ? null : currentBusyId,
				);
			}
		},
		[busyId, refreshCurrentQuery],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-filter admin-table-toolbar-filter--dual">
						<DropdownMenuSingle
							className="admin-table-filter-control admin-table-filter-control--compact"
							options={categoryOptions}
							value={categoryFilter}
							placeholder="All categories"
							ariaLabel="Filter series by category"
							allowClear
							clearLabel="All categories"
							onChange={(nextCategoryId) => {
								setParams({
									categoryId: nextCategoryId,
									subcategoryId: "",
									page: 1,
								});
							}}
						/>
						<DropdownMenuSingle
							className="admin-table-filter-control admin-table-filter-control--compact"
							options={subcategoryOptions}
							value={subcategoryFilter}
							placeholder="All subcategories"
							ariaLabel="Filter series by subcategory"
							allowClear
							clearLabel="All subcategories"
							disabled={categoryFilter.length === 0}
							onChange={(nextSubcategoryId) => {
								setParams({ subcategoryId: nextSubcategoryId, page: 1 });
							}}
						/>
					</div>
					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							value={search}
							onChange={(event) => {
								const nextSearch = event.target.value;
								setSearch(nextSearch);
								setParams({ search: nextSearch, page: 1 });
							}}
							placeholder="Search title or slug"
							aria-label="Search series"
						/>
					</div>
					<div className="admin-table-toolbar-action admin-table-toolbar-action--end">
						<Button
							onClick={() => {
								setPanelMode("create");
								setSelectedRow(null);
								setPanelOpen(true);
							}}
							variant="primary"
							aria-label="Create series"
						>
							New Series
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
				{metaError ? <AlertBanner tone="error">{metaError}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-8" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Icon"
									sortKey="icon"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Title"
									sortKey="title"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Category"
									sortKey="category"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Subcategory"
									sortKey="subcategory"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Read policy"
									sortKey="read"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Write policy"
									sortKey="write"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Author"
									sortKey="author"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>
						<TBody>
							{loading ? (
								<TR>
									<TD colSpan={9} className="admin-table-cell--center">
										Loading...
									</TD>
								</TR>
							) : rows.length === 0 ? (
								<TR>
									<TD colSpan={9} className="admin-table-empty-cell">
										No series found.
									</TD>
								</TR>
							) : (
								rows.map((row) => {
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
											<TD className="admin-table-cell--center">
												{row.categoryTitle || "-"}
											</TD>
											<TD className="admin-table-cell--center">
												{row.subcategoryTitle || "-"}
											</TD>
											<TD className="admin-table-cell--center">
												{formatRankPolicySummary(
													row.readEffectivePolicy ?? "public",
													row.readEffectiveMinRank,
													roles,
												)}
											</TD>
											<TD className="admin-table-cell--center">
												{formatRankPolicySummary(
													row.writeEffectivePolicy ?? "rank_at_least",
													row.writeEffectiveMinRank,
													roles,
												)}
											</TD>
											<TD className="admin-table-cell--center">
												{row.authorUsername || "-"}
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant="danger"
													onClick={() => {
														void handleDelete(row);
													}}
													disabled={busyId !== null}
												>
													{rowBusy ? "Deleting..." : "Delete"}
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant="secondary"
													onClick={() => {
														setPanelMode("edit");
														setSelectedRow(row);
														setPanelOpen(true);
													}}
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
					total={totalDocs}
					page={page}
					pageSize={pageSize}
					onPageChange={(nextPage) => {
						setParams({ page: nextPage });
					}}
					onPageSizeChange={(nextPageSize) => {
						setParams({ page: 1, pageSize: nextPageSize });
					}}
					pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
				/>
			</div>

			<SeriesPanel
				open={panelOpen}
				mode={panelMode}
				row={selectedRow}
				onClose={closePanel}
				meta={meta}
				onSaved={handleSaved}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
