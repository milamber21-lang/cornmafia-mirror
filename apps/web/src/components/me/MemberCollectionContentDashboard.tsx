//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberCollectionContentDashboard.tsx                                       ////
//// Language: TSX                                                                                              ////
//// Client member content dashboard for one authorable category/subcategory collection.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { BookOpen, Eye, FileText, Pencil, Plus } from "lucide-react";

import MemberContentCreatePanel from "@/components/me/MemberContentCreatePanel";

import {
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
		row.seriesTitle ?? "",
	]
		.join(" ")
		.toLowerCase()
		.includes(normalized);
}

function matchesFilters(args: {
	row: MemberContentItem;
	statusCode: string;
	templateId: string;
	contentKindCode: string;
}): boolean {
	const statusMatches = args.statusCode === ALL_FILTER_VALUE || args.row.statusCode === args.statusCode;
	const templateMatches = args.templateId === ALL_FILTER_VALUE || args.row.templateId === args.templateId;
	const kindMatches =
		args.contentKindCode === ALL_FILTER_VALUE || args.row.contentKindCode === args.contentKindCode;

	return statusMatches && templateMatches && kindMatches;
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

function buildCollectionHref(collection: MemberAuthorableCollection): string {
	return `/${collection.categorySlug}/${collection.subcategorySlug}`;
}

function getSortValue(value: string): SortCode {
	if (value === "oldest" || value === "title" || value === "published") {
		return value;
	}
	return "newest";
}

export default function MemberCollectionContentDashboard({
	collection,
	initialRows,
}: {
	collection: MemberAuthorableCollection;
	initialRows: MemberContentItem[];
}): React.JSX.Element {
	const rows = initialRows;
	const collectionHref = buildCollectionHref(collection);
	const [statusCode, setStatusCode] = React.useState(ALL_FILTER_VALUE);
	const [templateId, setTemplateId] = React.useState(ALL_FILTER_VALUE);
	const [contentKindCode, setContentKindCode] = React.useState(ALL_FILTER_VALUE);
	const [search, setSearch] = React.useState("");
	const [sort, setSort] = React.useState<SortCode>("newest");
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(9);
	const [createOpen, setCreateOpen] = React.useState(false);
	const [editContentId, setEditContentId] = React.useState<string | null>(null);

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
						statusCode,
						templateId,
						contentKindCode,
					}),
				)
				.filter((row) => matchesSearch(row, search))
				.sort((left, right) => compareContent(left, right, sort)),
		[contentKindCode, rows, search, sort, statusCode, templateId],
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
			<section className="member-hero member-hero--wide">
				<div className="member-hero__main">
					<div className="member-hero__icon">
						<BookOpen className="member-icon member-icon--lg" aria-hidden />
					</div>
					<div>
						<div className="member-card__eyebrow">
							{collection.categoryTitle}
						</div>
						<h1 className="member-hero__title">
							{collection.subcategoryTitle}
						</h1>
						<p className="member-hero__text">
							Manage your content in this collection. Access is checked against your current member permissions.
						</p>
					</div>
				</div>
				<div className="member-hero__actions">
					<Button
						type="button"
						variant="green"
						leftIcon={<Plus className="member-icon member-icon--sm" aria-hidden />}
						onClick={() => setCreateOpen(true)}
					>
						Create
					</Button>
					<ButtonLink href={collectionHref} variant="neutral">
						Public page
					</ButtonLink>
					<ButtonLink href="/me/content" variant="neutral">
						All content
					</ButtonLink>
				</div>
			</section>

			<section className="member-stat-grid member-stat-grid--three">
				<div className="member-stat-card">
					<div className="member-stat-card__label">Manageable here</div>
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
				<div className="member-filter-header">
					<div>
						<h2 className="member-filter-title">Filters</h2>
						<p className="member-hero__text">
							Showing {filteredRows.length} of {rows.length} manageable items in this collection.
						</p>
					</div>
				</div>

				<div className="member-filter-grid member-filter-grid--collection-content">
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
						placeholder={`Search ${collection.subcategoryTitle.toLowerCase()}...`}
					/>
					<DropdownMenuSingle
						options={SORT_OPTIONS}
						value={sort}
						onChange={(value) => {
							setSort(getSortValue(value));
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
									<div className="member-card-action-grid member-card-action-grid--two">
										{row.publicHref && row.canViewPublic ? (
											<ButtonLink
												href={row.publicHref}
												size="sm"
												variant="neutral"
												block
												leftIcon={<Eye className="member-icon member-icon--sm" aria-hidden />}
											>
												View
											</ButtonLink>
										) : (
											<Button
												type="button"
												size="sm"
												variant="neutral"
												disabled
												block
												leftIcon={<Eye className="member-icon member-icon--sm" aria-hidden />}
											>
												View
											</Button>
										)}
										<Button
											type="button"
											size="sm"
											variant="neutral"
											block
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
						No manageable content found in this collection for the current filters.
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

			<MemberContentCreatePanel
				open={createOpen}
				mode="create"
				categorySlug={collection.categorySlug}
				subcategorySlug={collection.subcategorySlug}
				collectionPath={null}
				memberManagePath={null}
				onClose={() => setCreateOpen(false)}
			/>

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
