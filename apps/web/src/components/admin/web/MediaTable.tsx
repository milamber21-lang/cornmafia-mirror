//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/MediaTable.tsx                                                        ////
//// Language: TSX                                                                                                 ////
//// Admin media table with server-driven query state and parent-owned panel lifecycle                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import MediaPanel, {
	type MediaPanelMode,
} from "@/components/admin/web/MediaPanel";
import AdminSortableTH from "@/components/admin/web/AdminSortableTH";
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
import DropdownMenuSingle, {
	type SingleOption,
} from "@/components/ui/basic-elements/DropdownMenuSingle";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	compareAdminText,
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type MediaRow = {
	id: string;
	alt: string;
	originalFilename: string;
	categoryId?: string | null;
	categoryName?: string | null;
	subcategoryId?: string | null;
	subcategoryName?: string | null;
	ownerUsername?: string | null;
	ownerGlobalName?: string | null;
	userDiscordId?: string | null;
	shared?: boolean;
};

type MediaListResponse = {
	rows?: unknown[];
	page?: unknown;
	pageSize?: unknown;
	totalPages?: unknown;
	totalDocs?: unknown;
};

type CategoryOption = {
	id: string | number;
	name: string;
};

type SubcategoryOption = {
	id: string | number;
	name: string;
	categoryId: string | number;
};

type Props = {
	categories?: CategoryOption[];
	subcategories?: SubcategoryOption[];
};

type SortKey = "alt" | "originalFilename" | "category" | "subcategory" | "owner";

type QueryPatch = Partial<{
	page: number;
	pageSize: number;
	search: string;
	categoryId: string;
	subcategoryId: string;
	sortBy: SortKey;
	sortDir: SortDirection;
}>;

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const SORT_KEYS = new Set<SortKey>([
	"alt",
	"originalFilename",
	"category",
	"subcategory",
	"owner",
]);

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


function readSortKeyParam(value: string | null): SortKey {
	return value && SORT_KEYS.has(value as SortKey) ? (value as SortKey) : "alt";
}

function readSortDirectionParam(value: string | null): SortDirection {
	return value === "desc" ? "desc" : "asc";
}

function isMediaRow(value: unknown): value is MediaRow {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const row = value as Record<string, unknown>;
	return typeof row.id === "string" && typeof row.originalFilename === "string";
}

function buildOwnerLabel(row: MediaRow): string {
	if (row.shared) {
		return "Shared";
	}

	if (
		typeof row.ownerGlobalName === "string" &&
		row.ownerGlobalName.trim().length > 0
	) {
		return row.ownerGlobalName.trim();
	}

	if (
		typeof row.ownerUsername === "string" &&
		row.ownerUsername.trim().length > 0
	) {
		return row.ownerUsername.trim();
	}

	if (
		typeof row.userDiscordId === "string" &&
		row.userDiscordId.trim().length > 0
	) {
		return row.userDiscordId.trim();
	}

	return "—";
}

export default function MediaTable({
	categories = [],
	subcategories = [],
}: Props): React.JSX.Element {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const searchParamsString = searchParams.toString();

	const page = parsePositiveIntParam(searchParams.get("page"), 1);
	const pageSize = parsePositiveIntParam(searchParams.get("pageSize"), 20);
	const searchValue = (searchParams.get("search") ?? "").trim();
	const categoryId = (searchParams.get("categoryId") ?? "").trim();
	const subcategoryId = (searchParams.get("subcategoryId") ?? "").trim();
	const sortKey = readSortKeyParam(searchParams.get("sortBy"));
	const sortDirection = readSortDirectionParam(searchParams.get("sortDir"));

	const [rows, setRows] = React.useState<MediaRow[]>([]);
	const [totalDocs, setTotalDocs] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [busyId, setBusyId] = React.useState<string | null>(null);
	const [search, setSearch] = React.useState(searchValue);
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<MediaPanelMode>("create");
	const [panelMediaId, setPanelMediaId] = React.useState<string | null>(null);

	React.useEffect(() => {
		setSearch(searchValue);
	}, [searchValue]);

	const visibleSubcategories = React.useMemo(() => {
		if (!categoryId) {
			return [];
		}

		return subcategories
			.filter((row) => String(row.categoryId) === categoryId)
			.slice()
			.sort((left, right) => compareAdminText(left.name, right.name));
	}, [categoryId, subcategories]);

	const categoryOptions = React.useMemo<SingleOption[]>(
		() => [
			{ label: "All categories", value: "" },
			...categories
				.slice()
				.sort((left, right) => compareAdminText(left.name, right.name))
				.map((row) => ({ label: row.name, value: String(row.id) })),
		],
		[categories],
	);

	const subcategoryOptions = React.useMemo<SingleOption[]>(
		() => [
			{ label: "All subcategories", value: "" },
			...visibleSubcategories.map((row) => ({
				label: row.name,
				value: String(row.id),
			})),
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

	const refreshCurrentQuery = React.useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const url = new URL("/api/admin/web/media", window.location.origin);
			url.searchParams.set("page", String(page));
			url.searchParams.set("pageSize", String(pageSize));

			if (searchValue.length > 0) {
				url.searchParams.set("search", searchValue);
			}

			if (categoryId.length > 0) {
				url.searchParams.set("categoryId", categoryId);
			}

			if (subcategoryId.length > 0) {
				url.searchParams.set("subcategoryId", subcategoryId);
			}

			url.searchParams.set("sortBy", sortKey);
			url.searchParams.set("sortDir", sortDirection);

			const response = await fetch(url.toString(), {
				cache: "no-store",
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to load media."),
				);
			}

			const payload = (await response.json()) as MediaListResponse;
			const nextRows = Array.isArray(payload.rows)
				? payload.rows.filter(isMediaRow)
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
				loadError instanceof Error ? loadError.message : "Failed to load media.",
			);
			setRows([]);
			setTotalDocs(0);
		} finally {
			setLoading(false);
		}
	}, [categoryId, page, pageSize, searchValue, setParams, sortDirection, sortKey, subcategoryId]);

	React.useEffect(() => {
		void refreshCurrentQuery();
	}, [refreshCurrentQuery]);

	const closePanel = React.useCallback((): void => {
		setPanelOpen(false);
		setPanelMode("create");
		setPanelMediaId(null);
	}, []);

	const handleSaved = React.useCallback((): void => {
		closePanel();
		void refreshCurrentQuery();
	}, [closePanel, refreshCurrentQuery]);

	const handleDelete = React.useCallback(
		async (id: string): Promise<void> => {
			if (busyId !== null) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete media file?",
				message: "Delete this media file?",
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(id);
			setError(null);

			try {
				const response = await fetch("/api/admin/web/media", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id }),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to delete media."),
					);
				}

				await refreshCurrentQuery();
			} catch (deleteError: unknown) {
				setError(
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete media.",
				);
			} finally {
				setBusyId((currentBusyId) => (currentBusyId === id ? null : currentBusyId));
			}
		},
		[busyId, refreshCurrentQuery],
	);


	const handleSortChange = React.useCallback(
		(nextSortKey: SortKey): void => {
			const nextSortDirection = getNextSortDirection(
				sortKey === nextSortKey,
				sortDirection,
			);
			setParams({
				page: 1,
				sortBy: nextSortKey,
				sortDir: nextSortDirection,
			});
		},
		[setParams, sortDirection, sortKey],
	);

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
							placeholder={categoryId ? "All subcategories" : "Select category first"}
							disabled={!categoryId}
							ariaLabel="Filter by subcategory"
							className="admin-table-filter-control admin-table-filter-control--subcategory"
						/>
					</div>

					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							value={search}
							onChange={(event) => {
								const nextSearch = event.target.value;
								setSearch(nextSearch);
								setParams({
									search: nextSearch,
									page: 1,
								});
							}}
							placeholder="Search alt, filename, user..."
							aria-label="Search media"
						/>
					</div>

					<div className="admin-table-toolbar-action">
						<Button
							variant="green"
							aria-label="Upload media"
							onClick={() => {
								setPanelMode("create");
								setPanelMediaId(null);
								setPanelOpen(true);
							}}
						>
							Upload media
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-18" />
							<col className="table-col table-col--w-18" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-20" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Alt"
									sortKey="alt"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Original filename"
									sortKey="originalFilename"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Category"
									sortKey="category"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Subcategory"
									sortKey="subcategory"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Owner"
									sortKey="owner"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>
						<TBody>
							{loading && rows.length === 0 ? (
								<TR>
									<TD colSpan={7} className="admin-table-empty-cell admin-table-empty-cell--spacious">
										Loading...
									</TD>
								</TR>
							) : null}

							{!loading && rows.length === 0 ? (
								<TR>
									<TD colSpan={7} className="admin-table-empty-cell admin-table-empty-cell--spacious">
										No media matches your filters.
									</TD>
								</TR>
							) : null}

							{rows.map((row) => {
								const rowBusy = busyId === row.id;

								return (
									<TR key={row.id}>
										<TD className="admin-table-cell--center">{row.alt || "—"}</TD>
										<TD className="admin-table-cell--center admin-table-break-all">
											{row.originalFilename || "—"}
										</TD>
										<TD className="admin-table-cell--center">{row.categoryName || "—"}</TD>
										<TD className="admin-table-cell--center">{row.subcategoryName || "—"}</TD>
										<TD className="admin-table-cell--center">{buildOwnerLabel(row)}</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="accent"
												onClick={() => void handleDelete(row.id)}
												disabled={busyId !== null}
											>
												{rowBusy ? "Deleting..." : "Delete"}
											</Button>
										</TD>
										<TD className="admin-table-cell--center">
											<Button
												variant="neutral"
												disabled={busyId !== null}
												onClick={() => {
													setPanelMode("edit");
													setPanelMediaId(row.id);
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

			<MediaPanel
				open={panelOpen}
				mode={panelMode}
				mediaId={panelMediaId}
				categories={categories
					.slice()
					.sort((left, right) => compareAdminText(left.name, right.name))
					.map((row) => ({
						id: String(row.id),
						name: row.name,
					}))}
				subcategories={subcategories
					.slice()
					.sort((left, right) => compareAdminText(left.name, right.name))
					.map((row) => ({
						id: String(row.id),
						name: row.name,
						categoryId: String(row.categoryId),
					}))}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
