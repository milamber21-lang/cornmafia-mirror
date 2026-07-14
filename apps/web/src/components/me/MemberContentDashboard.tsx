//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberContentDashboard.tsx                                                  ////
//// Language: TSX                                                                                              ////
//// Client member content dashboard with collection, template, kind, status, search, sort, and pagination.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { Eye, FolderOpen, Pencil } from "lucide-react";

import MemberContentCreatePanel from "@/components/me/MemberContentCreatePanel";
import MemberManagementCard from "@/components/me/MemberManagementCard";

import {
	AlertBanner,
	BrowseFilterPanel,
	BrowsePageHeader,
	BrowsePanelHeader,
	BrowseResultsPanel,
	Button,
	ButtonLink,
	DropdownMenuSingle,
	IconVisual,
	Input,
	Pagination,
	StatusPill,
	SurfaceState,
} from "@/components/ui";
import {
	compareDisplayText,
	formatDisplayDate,
} from "@/lib/helpers/display-format";
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
const STATUS_OPTIONS: {
	value: typeof ALL_FILTER_VALUE | MemberContentStatusCode;
	label: string;
}[] = [
	{ value: ALL_FILTER_VALUE, label: "All statuses" },
	{ value: "draft", label: "Draft" },
	{ value: "published", label: "Published" },
	{ value: "archived", label: "Archived" },
];

function formatDate(value: string | null): string {
	return formatDisplayDate(value) ?? value ?? "-";
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
	const categoryMatches =
		args.categoryId === ALL_FILTER_VALUE ||
		args.row.categoryId === args.categoryId;
	const subcategoryMatches =
		args.subcategoryId === ALL_FILTER_VALUE ||
		args.row.subcategoryId === args.subcategoryId;
	const statusMatches =
		args.statusCode === ALL_FILTER_VALUE ||
		args.row.statusCode === args.statusCode;
	const templateMatches =
		args.templateId === ALL_FILTER_VALUE ||
		args.row.templateId === args.templateId;
	const kindMatches =
		args.contentKindCode === ALL_FILTER_VALUE ||
		args.row.contentKindCode === args.contentKindCode;

	return (
		categoryMatches &&
		subcategoryMatches &&
		statusMatches &&
		templateMatches &&
		kindMatches
	);
}

function compareContent(
	left: MemberContentItem,
	right: MemberContentItem,
	sort: SortCode,
): number {
	if (sort === "title") {
		return compareDisplayText(left.title, right.title);
	}

	const leftUpdated = new Date(left.updatedAt).getTime();
	const rightUpdated = new Date(right.updatedAt).getTime();
	const leftPublished = left.publishedAt
		? new Date(left.publishedAt).getTime()
		: 0;
	const rightPublished = right.publishedAt
		? new Date(right.publishedAt).getTime()
		: 0;

	if (sort === "published" && leftPublished !== rightPublished) {
		return rightPublished - leftPublished;
	}

	if (leftUpdated !== rightUpdated) {
		return sort === "oldest"
			? leftUpdated - rightUpdated
			: rightUpdated - leftUpdated;
	}

	return left.title.localeCompare(right.title, undefined, {
		sensitivity: "base",
	});
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
			.sort((left, right) => compareDisplayText(left.label, right.label)),
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
			.sort((left, right) => compareDisplayText(left.label, right.label)),
	];
}

function getStatusTone(
	statusCode: MemberContentStatusCode,
): "success" | "warning" | "muted" {
	if (statusCode === "published") {
		return "success";
	}
	if (statusCode === "archived") {
		return "muted";
	}
	return "warning";
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

function getContentSummary(row: MemberContentItem): string | null {
	const summary = row.summary.trim();
	return summary || null;
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
						: collections.filter(
								(collection) => collection.categoryId === categoryId,
							),
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
		[
			categoryId,
			contentKindCode,
			rows,
			search,
			sort,
			statusCode,
			subcategoryId,
			templateId,
		],
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
		<main className="member-dashboard-main member-browse-page">
			<BrowsePageHeader
				className="member-browse-header"
				breadcrumbs={[{ label: "Member", href: "/me" }, { label: "Content" }]}
				title="My content"
				actions={<StatusPill tone="info">{rows.length} manageable</StatusPill>}
				description={
					<div className="member-browse-header__secondary-actions">
						<ButtonLink href="/me" variant="secondary" size="sm">
							Back to profile
						</ButtonLink>
					</div>
				}
			/>

			<BrowseFilterPanel
				className="member-browse-filter-panel"
				aria-label="Member content filters"
			>
				<div className="member-browse-filter-controls member-browse-filter-controls--content">
					<div className="member-browse-filter__control">
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
					</div>
					<div className="member-browse-filter__control">
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
					</div>
					<div className="member-browse-filter__control">
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
					</div>
					<div className="member-browse-filter__control">
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
					</div>
					<div className="member-browse-filter__control">
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
					</div>
					<div className="member-browse-filter__search">
						<label className="sr-only" htmlFor="member-content-search">
							Search content
						</label>
						<Input
							id="member-content-search"
							type="search"
							value={search}
							onChange={(event) => {
								setSearch(event.currentTarget.value);
								setPage(1);
							}}
							placeholder="Search content..."
						/>
					</div>
					<div className="member-browse-filter__control">
						<DropdownMenuSingle
							options={SORT_OPTIONS}
							value={sort}
							onChange={(value) => {
								setSort(
									value === "oldest" || value === "title" || value === "published"
										? value
										: "newest",
								);
								setPage(1);
							}}
							ariaLabel="Sort content"
							className="member-control-full"
						/>
					</div>
				</div>
			</BrowseFilterPanel>

			<BrowseResultsPanel
				className="member-browse-results-panel"
				aria-label="Member content results"
			>
				<BrowsePanelHeader
					title="Content"
					description={`Showing ${filteredRows.length} of ${rows.length} manageable items.`}
					actions={
						<div className="member-browse-result-statuses">
							<StatusPill tone="success" size="xs">
								{publishedCount} published
							</StatusPill>
							<StatusPill tone="warning" size="xs">
								{draftCount} drafts
							</StatusPill>
						</div>
					}
				/>

				{visibleRows.length > 0 ? (
					<div className="member-management-grid">
						{visibleRows.map((row) => (
							<MemberManagementCard
								key={row.id}
								visual={
									<IconVisual
										iconKey={null}
										iconColor={null}
										fallback={{ lucideName: "FileText" }}
										mediaRouteScope="app"
										size="card"
										title={row.title}
									/>
								}
								eyebrow={
									<span className="member-management-card__eyebrow">
										<span>
											{row.categoryTitle} / {row.subcategoryTitle}
										</span>
										<StatusPill tone={getStatusTone(row.statusCode)} size="xs">
											{getStatusLabel(row.statusCode)}
										</StatusPill>
									</span>
								}
								title={row.title}
								summary={getContentSummary(row)}
								details={
									<span className="member-management-card__meta">
										<span>{row.contentKindLabel}</span>
										<span>{row.templateLabel}</span>
										{row.seriesTitle ? (
											<span>
												{row.seriesTitle}
												{row.seriesPartNo ? ` #${row.seriesPartNo}` : ""}
											</span>
										) : null}
										<span>Updated {formatDate(row.updatedAt)}</span>
									</span>
								}
								actions={
									<>
										<ButtonLink
											href={buildCollectionManageHref(row)}
											size="sm"
											variant="secondary"
											leftIcon={<FolderOpen aria-hidden />}
										>
											Collection
										</ButtonLink>
										{row.publicHref && row.canViewPublic ? (
											<ButtonLink
												href={row.publicHref}
												size="sm"
												variant="secondary"
												leftIcon={<Eye aria-hidden />}
											>
												View
											</ButtonLink>
										) : (
											<Button
												size="sm"
												variant="secondary"
												disabled
												leftIcon={<Eye aria-hidden />}
											>
												View
											</Button>
										)}
										<Button
											size="sm"
											variant="secondary"
											leftIcon={<Pencil aria-hidden />}
											onClick={() => setEditContentId(row.id)}
										>
											Edit
										</Button>
									</>
								}
							/>
						))}
					</div>
				) : (
					<SurfaceState
						kind="empty"
						title="No manageable content"
						description="No authored content matches the current filters."
					/>
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
			</BrowseResultsPanel>

			{collections.length === 0 ? (
				<AlertBanner tone="info">
					No authorable collections are currently available. The collection list now
					requires both live create permission and at least one public template valid
					for that exact category/subcategory.
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
		</main>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
