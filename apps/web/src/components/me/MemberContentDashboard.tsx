//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberContentDashboard.tsx                                                  ////
//// Language: TSX                                                                                              ////
//// Client member content dashboard with collection, template, kind, status, search, sort, and pagination.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { BookOpen, Eye, FileText, FolderOpen, Pencil } from "lucide-react";

import MemberContentCreatePanel from "@/components/me/MemberContentCreatePanel";

import {
	AlertBanner,
	Button,
	ButtonLink,
	DropdownMenuSingle,
	Input,
	Pagination,
} from "@/components/ui";
import type { MemberAuthorableCollection } from "@/lib/data/member-authoring";
import type {
	MemberContentItem,
	MemberContentStatusCode,
} from "@/lib/data/member-content";

type SortCode = "newest" | "oldest" | "title" | "published";
type FilterOption = {
	value: string;
	label: string;
};

const ALL_FILTER_VALUE = "__all";
const PAGE_SIZE_OPTIONS = [9, 18, 36, 72] as const;
const SORT_OPTIONS: { value: SortCode; label: string }[] = [
	{ value: "newest", label: "Newest updated" },
	{ value: "oldest", label: "Oldest updated" },
	{ value: "published", label: "Recently published" },
	{ value: "title", label: "Title A-Z" },
];
const STATUS_OPTIONS: { value: typeof ALL_FILTER_VALUE | MemberContentStatusCode; label: string }[] = [
	{ value: ALL_FILTER_VALUE, label: "All statuses" },
	{ value: "draft", label: "Draft" },
	{ value: "published", label: "Published" },
	{ value: "archived", label: "Archived" },
];

function formatDate(value: string | null): string {
	if (!value) {
		return "-";
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function matchesSearch(row: MemberContentItem, search: string): boolean {
	const normalized = normalizeSearch(search);
	if (!normalized) {
		return true;
	}

	return [
		row.title,
		row.summary,
		row.templateLabel,
		row.contentKindLabel,
		row.categoryTitle,
		row.subcategoryTitle,
		row.seriesTitle ?? "",
	]
		.join(" ")
		.toLowerCase()
		.includes(normalized);
}

function matchesFilters(args: {
	row: MemberContentItem;
	categoryId: string;
	subcategoryId: string;
	statusCode: string;
	templateId: string;
	contentKindCode: string;
}): boolean {
	const categoryMatches = args.categoryId === ALL_FILTER_VALUE || args.row.categoryId === args.categoryId;
	const subcategoryMatches =
		args.subcategoryId === ALL_FILTER_VALUE || args.row.subcategoryId === args.subcategoryId;
	const statusMatches = args.statusCode === ALL_FILTER_VALUE || args.row.statusCode === args.statusCode;
	const templateMatches = args.templateId === ALL_FILTER_VALUE || args.row.templateId === args.templateId;
	const kindMatches =
		args.contentKindCode === ALL_FILTER_VALUE || args.row.contentKindCode === args.contentKindCode;

	return categoryMatches && subcategoryMatches && statusMatches && templateMatches && kindMatches;
}

function compareContent(left: MemberContentItem, right: MemberContentItem, sort: SortCode): number {
	if (sort === "title") {
		return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
	}

	const leftUpdated = new Date(left.updatedAt).getTime();
	const rightUpdated = new Date(right.updatedAt).getTime();
	const leftPublished = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
	const rightPublished = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

	if (sort === "published" && leftPublished !== rightPublished) {
		return rightPublished - leftPublished;
	}

	if (leftUpdated !== rightUpdated) {
		return sort === "oldest" ? leftUpdated - rightUpdated : rightUpdated - leftUpdated;
	}

	return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
}

function getPageRows<T>(rows: T[], page: number, pageSize: number): T[] {
	const start = (page - 1) * pageSize;
	return rows.slice(start, start + pageSize);
}

function uniqueSortedOptions(args: {
	collections: MemberAuthorableCollection[];
	getValue: (collection: MemberAuthorableCollection) => string;
	getLabel: (collection: MemberAuthorableCollection) => string;
	allLabel: string;
}): FilterOption[] {
	const byValue = new Map<string, string>();

	for (const collection of args.collections) {
		const value = args.getValue(collection).trim();
		const label = args.getLabel(collection).trim();
		if (value && label && !byValue.has(value)) {
			byValue.set(value, label);
		}
	}

	return [
		{ value: ALL_FILTER_VALUE, label: args.allLabel },
		...Array.from(byValue.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" })),
	];
}

function uniqueRowOptions(args: {
	rows: MemberContentItem[];
	getValue: (row: MemberContentItem) => string;
	getLabel: (row: MemberContentItem) => string;
	allLabel: string;
}): FilterOption[] {
	const byValue = new Map<string, string>();

	for (const row of args.rows) {
		const value = args.getValue(row).trim();
		const label = args.getLabel(row).trim();
		if (value && label && !byValue.has(value)) {
			byValue.set(value, label);
		}
	}

	return [
		{ value: ALL_FILTER_VALUE, label: args.allLabel },
		...Array.from(byValue.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" })),
	];
}

function getStatusClass(statusCode: MemberContentStatusCode): string {
	if (statusCode === "published") {
		return "member-card-status--published";
	}
	if (statusCode === "archived") {
		return "member-card-status--archived";
	}
	return "member-card-status--draft";
}

function getStatusLabel(statusCode: MemberContentStatusCode): string {
	if (statusCode === "published") {
		return "Published";
	}
	if (statusCode === "archived") {
		return "Archived";
	}
	return "Draft";
}

function getContentSummary(row: MemberContentItem): string {
	return row.summary || "No summary saved for this content yet.";
}

function buildCollectionManageHref(row: MemberContentItem): string {
	return `/me/content/${row.categorySlug}/${row.subcategorySlug}`;
}

export default function MemberContentDashboard({
	initialRows,
	initialCollections,
}: {
	initialRows: MemberContentItem[];
	initialCollections: MemberAuthorableCollection[];
}): React.JSX.Element {
	const rows = initialRows;
	const collections = initialCollections;
	const [categoryId, setCategoryId] = React.useState(ALL_FILTER_VALUE);
	const [subcategoryId, setSubcategoryId] = React.useState(ALL_FILTER_VALUE);
	const [statusCode, setStatusCode] = React.useState(ALL_FILTER_VALUE);
	const [templateId, setTemplateId] = React.useState(ALL_FILTER_VALUE);
	const [contentKindCode, setContentKindCode] = React.useState(ALL_FILTER_VALUE);
	const [search, setSearch] = React.useState("");
	const [sort, setSort] = React.useState<SortCode>("newest");
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(9);
	const [editContentId, setEditContentId] = React.useState<string | null>(null);

	const categoryOptions = React.useMemo(
		() =>
			uniqueSortedOptions({
				collections,
				getValue: (collection) => collection.categoryId,
				getLabel: (collection) => collection.categoryTitle,
				allLabel: "All categories",
			}),
		[collections],
	);
	const subcategoryOptions = React.useMemo(
		() =>
			uniqueSortedOptions({
				collections:
					categoryId === ALL_FILTER_VALUE
						? collections
						: collections.filter((collection) => collection.categoryId === categoryId),
				getValue: (collection) => collection.subcategoryId,
				getLabel: (collection) => collection.subcategoryTitle,
				allLabel: "All collections",
			}),
		[categoryId, collections],
	);
	const templateOptions = React.useMemo(
		() =>
			uniqueRowOptions({
				rows,
				getValue: (row) => row.templateId,
				getLabel: (row) => row.templateLabel,
				allLabel: "All templates",
			}),
		[rows],
	);
	const kindOptions = React.useMemo(
		() =>
			uniqueRowOptions({
				rows,
				getValue: (row) => row.contentKindCode,
				getLabel: (row) => row.contentKindLabel,
				allLabel: "All kinds",
			}),
		[rows],
	);
	const filteredRows = React.useMemo(
		() =>
			rows
				.filter((row) =>
					matchesFilters({
						row,
						categoryId,
						subcategoryId,
						statusCode,
						templateId,
						contentKindCode,
					}),
				)
				.filter((row) => matchesSearch(row, search))
				.sort((left, right) => compareContent(left, right, sort)),
		[categoryId, contentKindCode, rows, search, sort, statusCode, subcategoryId, templateId],
	);
	const visibleRows = React.useMemo(
		() => getPageRows(filteredRows, page, pageSize),
		[filteredRows, page, pageSize],
	);
	const publishedCount = React.useMemo(
		() => rows.filter((row) => row.statusCode === "published").length,
		[rows],
	);
	const draftCount = React.useMemo(
		() => rows.filter((row) => row.statusCode === "draft").length,
		[rows],
	);

	React.useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	return (
		<section className="card member-dashboard-main">
			<section className="member-hero">
				<div className="member-hero__main">
					<div className="member-hero__icon">
						<BookOpen className="member-icon member-icon--lg" aria-hidden />
					</div>
					<div>
						<h1 className="member-hero__title">My content</h1>
						<p className="member-hero__text">
							Manage content you authored where your current member permissions still allow authoring.
						</p>
					</div>
				</div>
				<div className="member-hero__actions">
					<ButtonLink href="/me" variant="neutral">
						Back to profile
					</ButtonLink>
				</div>
			</section>

			<section className="member-stat-grid member-stat-grid--three">
				<div className="member-stat-card">
					<div className="member-stat-card__label">Manageable</div>
					<div className="member-stat-card__value">{rows.length}</div>
				</div>
				<div className="member-stat-card">
					<div className="member-stat-card__label">Published</div>
					<div className="member-stat-card__value member-stat-card__value--success">{publishedCount}</div>
				</div>
				<div className="member-stat-card">
					<div className="member-stat-card__label">Drafts</div>
					<div className="member-stat-card__value member-stat-card__value--accent">{draftCount}</div>
				</div>
			</section>

			<section className="member-panel">
				<div className="member-filter-grid member-filter-grid--content">
					<DropdownMenuSingle
						options={categoryOptions}
						value={categoryId}
						onChange={(value) => {
							const nextCategoryId = value || ALL_FILTER_VALUE;
							setCategoryId(nextCategoryId);
							setSubcategoryId(ALL_FILTER_VALUE);
							setPage(1);
						}}
						ariaLabel="Filter by category"
						className="member-control-full"
					/>
					<DropdownMenuSingle
						options={subcategoryOptions}
						value={subcategoryId}
						onChange={(value) => {
							setSubcategoryId(value || ALL_FILTER_VALUE);
							setPage(1);
						}}
						ariaLabel="Filter by collection"
						className="member-control-full"
					/>
					<DropdownMenuSingle
						options={STATUS_OPTIONS}
						value={statusCode}
						onChange={(value) => {
							setStatusCode(value || ALL_FILTER_VALUE);
							setPage(1);
						}}
						ariaLabel="Filter by status"
						className="member-control-full"
					/>
					<DropdownMenuSingle
						options={templateOptions}
						value={templateId}
						onChange={(value) => {
							setTemplateId(value || ALL_FILTER_VALUE);
							setPage(1);
						}}
						ariaLabel="Filter by template"
						className="member-control-full"
					/>
					<DropdownMenuSingle
						options={kindOptions}
						value={contentKindCode}
						onChange={(value) => {
							setContentKindCode(value || ALL_FILTER_VALUE);
							setPage(1);
						}}
						ariaLabel="Filter by content kind"
						className="member-control-full"
					/>
					<Input
						type="search"
						value={search}
						onChange={(event) => {
							setSearch(event.currentTarget.value);
							setPage(1);
						}}
						placeholder="Search content..."
					/>
					<DropdownMenuSingle
						options={SORT_OPTIONS}
						value={sort}
						onChange={(value) => {
							setSort(value === "oldest" || value === "title" || value === "published" ? value : "newest");
							setPage(1);
						}}
						ariaLabel="Sort content"
						className="member-control-full"
					/>
				</div>

				{visibleRows.length > 0 ? (
					<div className="member-card-grid">
						{visibleRows.map((row) => (
							<article key={row.id} className="member-card">
								<div className="member-card__pill-row">
									<div className="member-card__pill">
										<FileText className="member-card__pill-icon" aria-hidden />
										<span className="member-truncate">{row.contentKindLabel}</span>
									</div>
									<span className={`member-card-status ${getStatusClass(row.statusCode)}`}>
										{getStatusLabel(row.statusCode)}
									</span>
								</div>
								<div className="member-card__eyebrow">
									{row.categoryTitle} / {row.subcategoryTitle}
								</div>
								<h2 className="member-card__title member-card__title--lg">
									{row.title}
								</h2>
								<p className="member-card__description">
									{getContentSummary(row)}
								</p>
								<div className="member-card__footer">
									<div className="member-card__meta-grid">
										<div>Template: {row.templateLabel}</div>
										{row.seriesTitle ? (
											<div>
												Series: {row.seriesTitle}{row.seriesPartNo ? ` #${row.seriesPartNo}` : ""}
											</div>
										) : null}
										<div>Updated {formatDate(row.updatedAt)}</div>
										{row.statusCode === "published" ? <div>Published {formatDate(row.publishedAt)}</div> : null}
									</div>
									<div className="member-card__actions">
										<ButtonLink href={buildCollectionManageHref(row)} size="sm" variant="neutral" leftIcon={<FolderOpen className="member-icon member-icon--sm" aria-hidden />}>
											Collection
										</ButtonLink>
										{row.publicHref && row.canViewPublic ? (
											<ButtonLink href={row.publicHref} size="sm" variant="neutral" leftIcon={<Eye className="member-icon member-icon--sm" aria-hidden />}>
												View
											</ButtonLink>
										) : (
											<Button type="button" size="sm" variant="neutral" disabled leftIcon={<Eye className="member-icon member-icon--sm" aria-hidden />}>
												View
											</Button>
										)}
										<Button
											type="button"
											size="sm"
											variant="neutral"
											leftIcon={<Pencil className="member-icon member-icon--sm" aria-hidden />}
											onClick={() => setEditContentId(row.id)}
										>
											Edit
										</Button>
									</div>
								</div>
							</article>
						))}
					</div>
				) : (
					<div className="member-empty-state">
						No manageable content found for the current filters.
					</div>
				)}

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
					pageSizeLabel=""
				/>
			</section>

			{collections.length === 0 ? (
				<AlertBanner tone="info">
					No authorable collections are currently available. The collection list now requires both live create permission and at least one public template valid for that exact category/subcategory.
				</AlertBanner>
			) : null}

			<MemberContentCreatePanel
				open={editContentId !== null}
				mode="edit"
				contentId={editContentId}
				collectionPath={null}
				memberManagePath={null}
				onClose={() => setEditContentId(null)}
			/>
		</section>
	);
}
