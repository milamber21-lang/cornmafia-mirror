//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/navigation-designer/NavigationDesignerPickers.tsx                    ////
//// Language: TSX                                                                                              ////
//// Picker list components for navigation designer category, subcategory, and content selection.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import {
	DropdownMenuSingle,
	IconRender,
	Input,
	Pagination,
} from "@/components/ui";
import type {
	NavigationCategoryLookupItem,
	NavigationContentLookupItem,
	NavigationContentPickerPage,
	NavigationSubcategoryLookupItem,
} from "@/lib/data/navigation";
import { readResponseMessage } from "@/lib/helpers/http-response";

import { matchesSearch, normalizeSearch } from "./navigation-designer-helpers";

const CONTENT_PICKER_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface CategoryPickerProps {
	categories: NavigationCategoryLookupItem[];
	usedCategoryIds: Set<string>;
	onPick: (row: NavigationCategoryLookupItem) => void;
}

export function CategoryPicker({
	categories,
	usedCategoryIds,
	onPick,
}: CategoryPickerProps): JSX.Element {
	const [query, setQuery] = useState("");
	const normalizedSearch = normalizeSearch(query);
	const rows = useMemo(() => {
		return categories
			.filter((row) => row.isSelectable)
			.filter((row) => !usedCategoryIds.has(row.categoryId))
			.filter((row) => {
				return !normalizedSearch || matchesSearch(row.title, normalizedSearch);
			})
			.slice(0, 200);
	}, [categories, normalizedSearch, usedCategoryIds]);

	return (
		<div className="admin-picker-stack">
			<Input
				placeholder="Search category..."
				value={query}
				onChange={(event) => setQuery(event.target.value)}
			/>
			<div className="admin-picker-list">
				{rows.map((row) => (
					<button
						key={row.categoryId}
						type="button"
						className="admin-picker-list__row"
						onClick={() => onPick(row)}
					>
						<IconRender
							iconKey={row.iconKey}
							iconColor={row.iconColor}
							fallback={{ lucideName: "Folder" }}
							mediaRouteScope="admin"
							size={16}
						/>
						<span>{row.title}</span>
					</button>
				))}
				{rows.length === 0 ? (
					<div className="admin-picker-list__empty">
						No available categories match this search.
					</div>
				) : null}
			</div>
		</div>
	);
}

export interface SubcategoryPickerProps {
	categoryId: string;
	subcategories: NavigationSubcategoryLookupItem[];
	usedSubcategoryIds: Set<string>;
	onPick: (row: NavigationSubcategoryLookupItem) => void;
}

export function SubcategoryPicker({
	categoryId,
	subcategories,
	usedSubcategoryIds,
	onPick,
}: SubcategoryPickerProps): JSX.Element {
	const [query, setQuery] = useState("");
	const normalizedSearch = normalizeSearch(query);
	const rows = useMemo(() => {
		return subcategories
			.filter((row) => row.isSelectable)
			.filter((row) => row.categoryId === categoryId)
			.filter((row) => !usedSubcategoryIds.has(row.subcategoryId))
			.filter((row) => {
				return !normalizedSearch || matchesSearch(row.title, normalizedSearch);
			})
			.slice(0, 200);
	}, [categoryId, normalizedSearch, subcategories, usedSubcategoryIds]);

	return (
		<div className="admin-picker-stack">
			<Input
				placeholder="Search subcategory..."
				value={query}
				onChange={(event) => setQuery(event.target.value)}
			/>
			<div className="admin-picker-list">
				{rows.map((row) => (
					<button
						key={row.subcategoryId}
						type="button"
						className="admin-picker-list__row"
						onClick={() => onPick(row)}
					>
						<IconRender
							iconKey={row.iconKey}
							iconColor={row.iconColor}
							fallback={{ lucideName: "FolderOpen" }}
							mediaRouteScope="admin"
							size={16}
						/>
						<span>{row.title}</span>
					</button>
				))}
				{rows.length === 0 ? (
					<div className="admin-picker-list__empty">
						No subcategories match this search.
					</div>
				) : null}
			</div>
		</div>
	);
}

export interface ContentPickerProps {
	categoryId: string;
	subcategoryId: string;
	usedContentIds: Set<string>;
	onPick: (row: NavigationContentLookupItem) => void;
}

function buildExcludedIdsKey(ids: Set<string>): string {
	return Array.from(ids).sort().join(",");
}

function buildContentPickerUrl(args: {
	categoryId: string;
	subcategoryId: string;
	search: string;
	contentKindCode: string;
	statusCode: string;
	page: number;
	pageSize: number;
	excludedIdsKey: string;
}): string {
	const params = new URLSearchParams();
	params.set("categoryId", args.categoryId);
	params.set("subcategoryId", args.subcategoryId);
	params.set("page", String(args.page));
	params.set("pageSize", String(args.pageSize));

	if (args.search.trim()) {
		params.set("search", args.search.trim());
	}

	if (args.contentKindCode) {
		params.set("contentKindCode", args.contentKindCode);
	}

	if (args.statusCode) {
		params.set("statusCode", args.statusCode);
	}

	if (args.excludedIdsKey) {
		params.set("excludedContentIds", args.excludedIdsKey);
	}

	return `/api/admin/web/navigation-panels/content-picker?${params.toString()}`;
}

export function ContentPicker({
	categoryId,
	subcategoryId,
	usedContentIds,
	onPick,
}: ContentPickerProps): JSX.Element {
	const [query, setQuery] = useState("");
	const [contentKindCode, setContentKindCode] = useState("");
	const [statusCode, setStatusCode] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [payload, setPayload] = useState<NavigationContentPickerPage>({
		rows: [],
		contentKinds: [],
		statuses: [],
		page: 1,
		pageSize: 20,
		totalDocs: 0,
		totalPages: 1,
	});
	const excludedIdsKey = useMemo(
		() => buildExcludedIdsKey(usedContentIds),
		[usedContentIds],
	);

	useEffect(() => {
		const controller = new AbortController();
		const timeout = window.setTimeout(() => {
			setLoading(true);
			setError("");

			void (async () => {
				try {
					const response = await fetch(
						buildContentPickerUrl({
							categoryId,
							subcategoryId,
							search: query,
							contentKindCode,
							statusCode,
							page,
							pageSize,
							excludedIdsKey,
						}),
						{ cache: "no-store", signal: controller.signal },
					);

					if (!response.ok) {
						throw new Error(
							await readResponseMessage(
								response,
								"Failed to load content picker.",
							),
						);
					}

					const nextPayload = (await response.json()) as NavigationContentPickerPage;
					setPayload(nextPayload);
				} catch (loadError: unknown) {
					if (controller.signal.aborted) {
						return;
					}

					setError(
						loadError instanceof Error
							? loadError.message
							: "Failed to load content picker.",
					);
				} finally {
					if (!controller.signal.aborted) {
						setLoading(false);
					}
				}
			})();
		}, 180);

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [
		categoryId,
		contentKindCode,
		excludedIdsKey,
		page,
		pageSize,
		query,
		statusCode,
		subcategoryId,
	]);

	return (
		<div className="admin-picker-stack admin-picker-stack--spacious">
			<div className="admin-content-picker-filters">
				<DropdownMenuSingle
					options={payload.contentKinds}
					value={contentKindCode}
					onChange={(value) => {
						setContentKindCode(value);
						setPage(1);
					}}
					placeholder="All content types"
					ariaLabel="Filter by content type"
					allowClear
					clearLabel="All content types"
				/>
				<DropdownMenuSingle
					options={payload.statuses}
					value={statusCode}
					onChange={(value) => {
						setStatusCode(value);
						setPage(1);
					}}
					placeholder="All statuses"
					ariaLabel="Filter by status"
					allowClear
					clearLabel="All statuses"
				/>
				<Input
					placeholder="Search content..."
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setPage(1);
					}}
				/>
			</div>

			<div className="admin-content-picker-table">
				<div className="admin-content-picker-table__header">
					<div>Title</div>
					<div>Status</div>
					<div>Content type</div>
				</div>
				<div className="admin-content-picker-table__body">
					{payload.rows.map((row) => (
						<button
							key={row.contentId}
							type="button"
							className="admin-content-picker-table__row"
							onClick={() => onPick(row)}
						>
							<div className="admin-picker-title-cell">
								<IconRender
									iconKey={row.iconKey}
									iconColor={row.iconColor}
									fallback={{ lucideName: "FileText" }}
									mediaRouteScope="admin"
									size={16}
								/>
								<span className="admin-picker-title-cell__text">{row.title}</span>
							</div>
							<div className="admin-content-picker-table__muted-cell">
								{row.statusCode}
							</div>
							<div className="admin-content-picker-table__muted-cell">
								{row.contentKindLabel}
							</div>
						</button>
					))}
					{payload.rows.length === 0 ? (
						<div className="admin-picker-list__empty admin-picker-list__empty--spacious">
							{loading
								? "Loading content..."
								: error || "No content matches these filters."}
						</div>
					) : null}
				</div>
			</div>

			<Pagination
				total={payload.totalDocs}
				page={payload.page}
				pageSize={payload.pageSize}
				onPageChange={setPage}
				onPageSizeChange={(nextPageSize) => {
					setPageSize(nextPageSize);
					setPage(1);
				}}
				pageSizeOptions={[...CONTENT_PICKER_PAGE_SIZE_OPTIONS]}
				showEdges
			/>
		</div>
	);
}
