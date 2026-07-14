//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberCollectionContentDashboard.tsx                                       ////
//// Language: TSX                                                                                              ////
//// Client member content dashboard for one authorable category/subcategory collection.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { Eye, Pencil, Plus } from "lucide-react";

import MemberContentCreatePanel from "@/components/me/MemberContentCreatePanel";
import MemberManagementCard from "@/components/me/MemberManagementCard";

import {
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
	const statusMatches =
		args.statusCode === ALL_FILTER_VALUE ||
		args.row.statusCode === args.statusCode;
	const templateMatches =
		args.templateId === ALL_FILTER_VALUE ||
		args.row.templateId === args.templateId;
	const kindMatches =
		args.contentKindCode === ALL_FILTER_VALUE ||
		args.row.contentKindCode === args.contentKindCode;

	return statusMatches && templateMatches && kindMatches;
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
		<main className="member-dashboard-main member-browse-page">
			<BrowsePageHeader
				className="member-browse-header"
				breadcrumbs={[
					{ label: "Member", href: "/me" },
					{ label: "Content", href: "/me/content" },
					{ label: collection.categoryTitle },
					{ label: collection.subcategoryTitle },
				]}
				title={collection.subcategoryTitle}
				actions={<StatusPill tone="info">{rows.length} manageable</StatusPill>}
				description={
					<div className="member-browse-header__secondary-actions">
						<Button
							type="button"
							size="sm"
							variant="primary"
							leftIcon={<Plus aria-hidden />}
							onClick={() => setCreateOpen(true)}
						>
							Create
						</Button>
						<ButtonLink href={collectionHref} variant="secondary" size="sm">
							Public page
						</ButtonLink>
						<ButtonLink href="/me/content" variant="secondary" size="sm">
							All content
						</ButtonLink>
					</div>
				}
			/>

			<BrowseFilterPanel
				className="member-browse-filter-panel"
				aria-label={`${collection.subcategoryTitle} content filters`}
			>
				<div className="member-browse-filter-controls member-browse-filter-controls--collection-content">
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
						<label className="sr-only" htmlFor="member-collection-content-search">
							Search collection content
						</label>
						<Input
							id="member-collection-content-search"
							type="search"
							value={search}
							onChange={(event) => {
								setSearch(event.currentTarget.value);
								setPage(1);
							}}
							placeholder={`Search ${collection.subcategoryTitle.toLowerCase()}...`}
						/>
					</div>
					<div className="member-browse-filter__control">
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
				</div>
			</BrowseFilterPanel>

			<BrowseResultsPanel
				className="member-browse-results-panel"
				aria-label={`${collection.subcategoryTitle} content results`}
			>
				<BrowsePanelHeader
					title="Content"
					description={`Showing ${filteredRows.length} of ${rows.length} manageable items in this collection.`}
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
										<span>{row.contentKindLabel}</span>
										<StatusPill tone={getStatusTone(row.statusCode)} size="xs">
											{getStatusLabel(row.statusCode)}
										</StatusPill>
									</span>
								}
								title={row.title}
								summary={getContentSummary(row)}
								details={
									<span className="member-management-card__meta">
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
						description="No content in this collection matches the current filters."
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
		</main>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
