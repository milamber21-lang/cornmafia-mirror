//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ContentTable.tsx                                                     ////
//// Language: TSX                                                                                               ////
//// Server-driven admin content table with dependent filters, sorting, and parent-owned panel lifecycle           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AdminSortableTH from "./AdminSortableTH";
import ContentPanel from "@/components/admin/web/ContentPanel";
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
import DropdownMenuSingle, {
	type SingleOption,
} from "@/components/ui/basic-elements/DropdownMenuSingle";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type {
	ContentAdminItem,
	ContentAdminListPage,
	ContentAdminSortBy,
	ContentAdminSortDir,
	ContentCategoryOption,
	ContentStatusCode,
	ContentSubcategoryOption,
} from "@/lib/data/content";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { getNextSortDirection } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type PanelMode = "create" | "edit";

type Props = {
	initialPage: ContentAdminListPage;
	categories: ContentCategoryOption[];
	subcategories: ContentSubcategoryOption[];
};

type ApiListResponse = Partial<ContentAdminListPage> & {
	message?: unknown;
};

type QueryPatch = Partial<{
	search: string;
	page: number;
	pageSize: number;
	categoryId: string;
	subcategoryId: string;
	sortBy: ContentAdminSortBy;
	sortDir: ContentAdminSortDir;
}>;

type ButtonVariant = "neutral" | "accent" | "green";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const CONTENT_SORT_KEYS: readonly ContentAdminSortBy[] = [
	"title",
	"slug",
	"kind",
	"category",
	"subcategory",
	"template",
] as const;

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

function normalizeIdParam(value: string | null): string {
	if (typeof value !== "string") {
		return "";
	}

	const normalized = value.trim();
	return /^\d+$/.test(normalized) ? normalized : "";
}

function parseSortByParam(value: string | null): ContentAdminSortBy {
	return CONTENT_SORT_KEYS.find((sortKey) => sortKey === value) ?? "title";
}

function parseSortDirParam(value: string | null): ContentAdminSortDir {
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

function isContentAdminItem(value: unknown): value is ContentAdminItem {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const row = value as Partial<ContentAdminItem>;
	return (
		typeof row.id === "string" &&
		typeof row.title === "string" &&
		typeof row.slug === "string" &&
		typeof row.contentKindLabel === "string" &&
		typeof row.categoryTitle === "string" &&
		typeof row.templateLabel === "string"
	);
}

function getStatusLabel(statusCode: ContentStatusCode): string {
	if (statusCode === "published") {
		return "Published";
	}

	if (statusCode === "archived") {
		return "Archived";
	}

	return "Draft";
}

function getStatusVariant(statusCode: ContentStatusCode): ButtonVariant {
	if (statusCode === "published") {
		return "green";
	}

	if (statusCode === "archived") {
		return "accent";
	}

	return "neutral";
}

function getNextStatus(statusCode: ContentStatusCode): ContentStatusCode {
	if (statusCode === "draft") {
		return "published";
	}

	if (statusCode === "published") {
		return "archived";
	}

	return "draft";
}

function applyQueryValue(
	params: URLSearchParams,
	key: string,
	value: string,
): void {
	const normalized = value.trim();
	if (normalized.length > 0) {
		params.set(key, normalized);
	} else {
		params.delete(key);
	}
}

export default function ContentTable({
	initialPage,
	categories,
	subcategories,
}: Props): React.JSX.Element {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const searchParamsString = searchParams.toString();
	const loadedQueryRef = React.useRef(searchParamsString);

	const page = parsePositiveIntParam(searchParams.get("page"), initialPage.page);
	const pageSize = parsePositiveIntParam(
		searchParams.get("pageSize"),
		initialPage.pageSize,
	);
	const searchValue = (searchParams.get("search") ?? "").trim();
	const categoryId = normalizeIdParam(searchParams.get("categoryId"));
	const subcategoryId = normalizeIdParam(searchParams.get("subcategoryId"));
	const sortBy = parseSortByParam(searchParams.get("sortBy"));
	const sortDir = parseSortDirParam(searchParams.get("sortDir"));

	const [rows, setRows] = React.useState<ContentAdminItem[]>(initialPage.rows);
	const [totalDocs, setTotalDocs] = React.useState(initialPage.totalDocs);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [search, setSearch] = React.useState(searchValue);
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<PanelMode>("create");
	const [selectedId, setSelectedId] = React.useState<string | null>(null);

	React.useEffect(() => {
		setSearch(searchValue);
	}, [searchValue]);

	const visibleSubcategories = React.useMemo(() => {
		if (!categoryId) {
			return [];
		}

		return subcategories.filter((row) => row.categoryId === categoryId);
	}, [categoryId, subcategories]);

	const categoryOptions = React.useMemo<SingleOption[]>(
		() => [
			{ label: "All categories", value: "" },
			...sortAdminPickerOptions(
				categories.map((row) => ({
					label: row.title,
					value: row.id,
				})),
			),
		],
		[categories],
	);

	const subcategoryOptions = React.useMemo<SingleOption[]>(
		() => [
			{ label: "All subcategories", value: "" },
			...sortAdminPickerOptions(
				visibleSubcategories.map((row) => ({
					label: row.title,
					value: row.id,
				})),
			),
		],
		[visibleSubcategories],
	);

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
				applyQueryValue(params, "search", patch.search);
			}

			if (typeof patch.categoryId === "string") {
				applyQueryValue(params, "categoryId", patch.categoryId);
			}

			if (typeof patch.subcategoryId === "string") {
				applyQueryValue(params, "subcategoryId", patch.subcategoryId);
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
				{ scroll: false },
			);
		},
		[pathname, router, searchParamsString],
	);

	const refreshCurrentQuery = React.useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const url = new URL("/api/admin/web/content", window.location.origin);
			url.searchParams.set("page", String(page));
			url.searchParams.set("pageSize", String(pageSize));
			url.searchParams.set("sortBy", sortBy);
			url.searchParams.set("sortDir", sortDir);

			if (searchValue.length > 0) {
				url.searchParams.set("search", searchValue);
			}

			if (categoryId.length > 0) {
				url.searchParams.set("categoryId", categoryId);
			}

			if (subcategoryId.length > 0) {
				url.searchParams.set("subcategoryId", subcategoryId);
			}

			const response = await fetch(url.toString(), {
				cache: "no-store",
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to load content."),
				);
			}

			const payload = (await response.json()) as ApiListResponse;
			const nextRows = Array.isArray(payload.rows)
				? payload.rows.filter(isContentAdminItem)
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
				loadError instanceof Error
					? loadError.message
					: "Failed to load content.",
			);
			setRows([]);
			setTotalDocs(0);
		} finally {
			setLoading(false);
		}
	}, [
		categoryId,
		page,
		pageSize,
		searchValue,
		setParams,
		sortBy,
		sortDir,
		subcategoryId,
	]);

	React.useEffect(() => {
		if (loadedQueryRef.current === searchParamsString) {
			return;
		}

		loadedQueryRef.current = searchParamsString;
		void refreshCurrentQuery();
	}, [refreshCurrentQuery, searchParamsString]);

	const closePanel = React.useCallback((): void => {
		setPanelOpen(false);
		setPanelMode("create");
		setSelectedId(null);
	}, []);

	const handleSaved = React.useCallback((): void => {
		closePanel();
		void refreshCurrentQuery();
	}, [closePanel, refreshCurrentQuery]);

	const handleSortChange = React.useCallback(
		(nextSortBy: ContentAdminSortBy): void => {
			setParams({
				page: 1,
				sortBy: nextSortBy,
				sortDir: getNextSortDirection(nextSortBy === sortBy, sortDir),
			});
		},
		[setParams, sortBy, sortDir],
	);

	const handleStatusCycle = React.useCallback(
		async (row: ContentAdminItem): Promise<void> => {
			if (busyId !== null) {
				return;
			}

			const nextStatusCode = getNextStatus(row.statusCode);
			setBusyId(row.id);
			setError(null);

			try {
				const response = await fetch(`/api/admin/web/content/${row.id}`, {
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "status",
						data: { statusCode: nextStatusCode },
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to update content status.",
						),
					);
				}

				await refreshCurrentQuery();
			} catch (statusError: unknown) {
				setError(
					statusError instanceof Error
						? statusError.message
						: "Failed to update content status.",
				);
			} finally {
				setBusyId((currentBusyId) =>
					currentBusyId === row.id ? null : currentBusyId,
				);
			}
		},
		[busyId, refreshCurrentQuery],
	);

	const handleDelete = React.useCallback(
		async (row: ContentAdminItem): Promise<void> => {
			if (busyId !== null) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete content?",
				message: `Delete content "${row.title}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(row.id);
			setError(null);

			try {
				const response = await fetch(`/api/admin/web/content/${row.id}`, {
					method: "DELETE",
					credentials: "include",
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete content."),
					);
				}

				await refreshCurrentQuery();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete content.",
				);
			} finally {
				setBusyId((currentBusyId) =>
					currentBusyId === row.id ? null : currentBusyId,
				);
			}
		},
		[busyId, refreshCurrentQuery],
	);

	const mutationBusy = busyId !== null;

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar">
					<div className="admin-table-toolbar-filter admin-table-toolbar-filter--dual">
						<DropdownMenuSingle
							options={categoryOptions}
							value={categoryId}
							onChange={(value) =>
								setParams({
									categoryId: value,
									subcategoryId: "",
									page: 1,
								})
							}
							placeholder="All categories"
							ariaLabel="Filter by category"
							className="admin-table-filter-control admin-table-filter-control--compact"
						/>
						<DropdownMenuSingle
							options={subcategoryOptions}
							value={subcategoryId}
							onChange={(value) =>
								setParams({
									subcategoryId: value,
									page: 1,
								})
							}
							placeholder="All subcategories"
							ariaLabel="Filter by subcategory"
							className="admin-table-filter-control admin-table-filter-control--subcategory"
							disabled={!categoryId}
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
							placeholder="Search title, slug, category, template..."
							aria-label="Search content"
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button
							variant="green"
							onClick={() => {
								setPanelMode("create");
								setSelectedId(null);
								setPanelOpen(true);
							}}
							disabled={loading || mutationBusy}
						>
							New content
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
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
									label="Title"
									sortKey="title"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Slug"
									sortKey="slug"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<AdminSortableTH
									label="Kind"
									sortKey="kind"
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
									label="Template"
									sortKey="template"
									activeSortKey={sortBy}
									sortDirection={sortDir}
									onSortChange={handleSortChange}
									className="admin-table-cell--center"
								/>
								<TH className="admin-table-cell--center">Status</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Show</TH>
								<TH className="admin-table-cell--center">Actions</TH>
							</TR>
						</THead>

						<TBody>
							{loading && rows.length === 0 ? (
								<TR>
									<TD colSpan={10} className="admin-table-empty-cell admin-table-empty-cell--spacious">
										Loading...
									</TD>
								</TR>
							) : null}

							{!loading && rows.length === 0 ? (
								<TR>
									<TD colSpan={10} className="admin-table-empty-cell admin-table-empty-cell--spacious">
										No content matches your filters.
									</TD>
								</TR>
							) : null}

							{rows.map((row) => {
								const rowBusy = busyId === row.id;

								return (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">{row.title}</TD>
										<TD className="admin-table-cell--center">{row.slug}</TD>
										<TD className="admin-table-cell--center">{row.contentKindLabel}</TD>
										<TD className="admin-table-cell--center">{row.categoryTitle}</TD>
										<TD className="admin-table-cell--center">{row.subcategoryTitle ?? "-"}</TD>
										<TD className="admin-table-cell--center">{row.templateLabel}</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant={getStatusVariant(row.statusCode)}
												disabled={mutationBusy}
												loading={rowBusy}
												onClick={() => void handleStatusCycle(row)}
											>
												{getStatusLabel(row.statusCode)}
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="accent"
												disabled={mutationBusy}
												loading={rowBusy}
												onClick={() => void handleDelete(row)}
											>
												Delete
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<ButtonLink
												href={`/admin/web/content/${row.id}/show`}
												variant="neutral"
											>
												Show
											</ButtonLink>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="neutral"
												disabled={mutationBusy}
												onClick={() => {
													setPanelMode("edit");
													setSelectedId(row.id);
													setPanelOpen(true);
												}}
											>
												Edit
											</Button>
										</TD>
									</TR>
								);
							})}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={totalDocs}
					page={page}
					pageSize={pageSize}
					onPageChange={(nextPage) => setParams({ page: nextPage })}
					onPageSizeChange={(nextPageSize) =>
						setParams({
							page: 1,
							pageSize: nextPageSize,
						})
					}
					pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
				/>
			</div>

			<ContentPanel
				open={panelOpen}
				mode={panelMode}
				contentId={selectedId}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
