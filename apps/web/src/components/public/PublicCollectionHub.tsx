//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicCollectionHub.tsx                                                  ////
//// Language: TSX                                                                                                 ////
//// Public collection hub using the shared browse header, external filters, result cards, and member actions.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import * as React from "react";
import { LibraryBig, Plus, SearchX, Settings } from "lucide-react";

import MemberContentCreatePanel from "@/components/me/MemberContentCreatePanel";
import PublicContentCard from "@/components/public/PublicContentCard";
import {
	BrowseFilterPanel,
	BrowsePageHeader,
	BrowseResultsPanel,
	ButtonLink,
	DropdownMenuSingle,
	Input,
	Pagination,
	StatusPill,
	SurfaceState,
} from "@/components/ui";
import type {
	PublicCollectionContentCard,
	PublicCollectionResult,
} from "@/lib/data/public-content";
import {
	compareDisplayText,
	formatDisplayInteger,
} from "@/lib/helpers/display-format";

export type PublicCollectionSortCode = "newest" | "title";

type PublicCollectionHubProps = {
	collection: PublicCollectionResult;
	initialPage: number;
	initialSearch: string;
	initialSort: PublicCollectionSortCode;
	initialPageSize: number;
	initialCreateOpen: boolean;
};

type FilterOption = {
	value: string;
	label: string;
};

const ALL_FILTER_VALUE = "__all";
const DEFAULT_PAGE_SIZE = 9;
const PAGE_SIZE_OPTIONS = [9, 18, 36, 72];

const SORT_OPTIONS: { value: PublicCollectionSortCode; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "title", label: "Title A-Z" },
];

function formatCount(value: number, singular: string, plural: string): string {
	return `${formatDisplayInteger(value)} ${value === 1 ? singular : plural}`;
}

function normalizeSearchText(value: string): string {
	return value.trim().toLowerCase();
}

function cardMatchesSearch(
	card: PublicCollectionContentCard,
	search: string,
): boolean {
	const normalizedSearch = normalizeSearchText(search);
	if (!normalizedSearch) {
		return true;
	}

	const haystack = [
		card.title,
		card.summary ?? "",
		card.templateLabel,
		card.contentKindLabel,
	]
		.join(" ")
		.toLowerCase();

	return haystack.includes(normalizedSearch);
}

function cardMatchesFilters(args: {
	card: PublicCollectionContentCard;
	contentKindCode: string;
	templateId: string;
}): boolean {
	const contentKindMatches =
		args.contentKindCode === ALL_FILTER_VALUE ||
		args.card.contentKindCode === args.contentKindCode;
	const templateMatches =
		args.templateId === ALL_FILTER_VALUE ||
		args.card.templateId === args.templateId;

	return contentKindMatches && templateMatches;
}

function compareCards(
	left: PublicCollectionContentCard,
	right: PublicCollectionContentCard,
	sort: PublicCollectionSortCode,
): number {
	if (sort === "title") {
		return compareDisplayText(left.title, right.title);
	}

	const leftDate = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
	const rightDate = right.publishedAt
		? new Date(right.publishedAt).getTime()
		: 0;

	if (leftDate !== rightDate) {
		return rightDate - leftDate;
	}

	return compareDisplayText(left.title, right.title);
}

function buildCollectionPath(collection: PublicCollectionResult): string {
	return `/${collection.category.slug}/${collection.collection.slug}`;
}

function buildMemberManagePath(collection: PublicCollectionResult): string {
	return `/me/content/${collection.category.slug}/${collection.collection.slug}`;
}

function clampPage(page: number, total: number, pageSize: number): number {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	return Math.min(Math.max(1, page), pageCount);
}

function getSortValue(value: string): PublicCollectionSortCode {
	return value === "title" ? "title" : "newest";
}

function getPageSizeValue(value: number): number {
	return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE;
}

function uniqueSortedOptions(args: {
	cards: PublicCollectionContentCard[];
	getValue: (card: PublicCollectionContentCard) => string;
	getLabel: (card: PublicCollectionContentCard) => string;
	allLabel: string;
}): FilterOption[] {
	const byValue = new Map<string, string>();

	for (const card of args.cards) {
		const value = args.getValue(card).trim();
		const label = args.getLabel(card).trim();
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

function hasCompatibleCard(args: {
	cards: PublicCollectionContentCard[];
	contentKindCode: string;
	templateId: string;
}): boolean {
	return args.cards.some((card) =>
		cardMatchesFilters({
			card,
			contentKindCode: args.contentKindCode,
			templateId: args.templateId,
		}),
	);
}

function PublicCollectionControls({
	collectionTitle,
	contentKindCode,
	contentKindOptions,
	search,
	sort,
	templateId,
	templateOptions,
	onContentKindChange,
	onSearchChange,
	onSortChange,
	onTemplateChange,
}: {
	collectionTitle: string;
	contentKindCode: string;
	contentKindOptions: FilterOption[];
	search: string;
	sort: PublicCollectionSortCode;
	templateId: string;
	templateOptions: FilterOption[];
	onContentKindChange: (value: string) => void;
	onSearchChange: (value: string) => void;
	onSortChange: (value: PublicCollectionSortCode) => void;
	onTemplateChange: (value: string) => void;
}): JSX.Element {
	return (
		<div className="public-collection-controls">
			<DropdownMenuSingle
				options={contentKindOptions}
				value={contentKindCode}
				onChange={onContentKindChange}
				ariaLabel="Filter by content kind"
				className="public-collection-control"
			/>

			<DropdownMenuSingle
				options={templateOptions}
				value={templateId}
				onChange={onTemplateChange}
				ariaLabel="Filter by template"
				className="public-collection-control"
			/>

			<div className="public-browse-filter-search">
				<label className="public-collection-sr-label" htmlFor="collection-search">
					Search
				</label>
				<Input
					id="collection-search"
					type="search"
					value={search}
					onChange={(event) => onSearchChange(event.currentTarget.value)}
					placeholder={`Search ${collectionTitle.toLowerCase()}...`}
				/>
			</div>

			<DropdownMenuSingle
				options={SORT_OPTIONS}
				value={sort}
				onChange={(value) => onSortChange(getSortValue(value))}
				ariaLabel="Sort collection content"
				className="public-collection-control"
			/>
		</div>
	);
}

function PublicCollectionEmptyState({
	canCreate,
	hasActiveFilters,
	hasContent,
}: {
	canCreate: boolean;
	hasActiveFilters: boolean;
	hasContent: boolean;
}): JSX.Element {
	if (hasContent && hasActiveFilters) {
		return (
			<SurfaceState
				kind="empty"
				align="center"
				icon={<SearchX aria-hidden />}
				title="No content matches these filters"
				description="Try another search term or reset one of the selected filters."
			/>
		);
	}

	return (
		<SurfaceState
			kind="empty"
			align="center"
			icon={<LibraryBig aria-hidden />}
			title="No visible content here yet"
			description={
				canCreate
					? "You can create the first entry for this collection when authoring is enabled."
					: "New content will appear here when it is published and visible to your role."
			}
		/>
	);
}

export default function PublicCollectionHub({
	collection,
	initialPage,
	initialSearch,
	initialSort,
	initialPageSize,
	initialCreateOpen,
}: PublicCollectionHubProps): JSX.Element {
	const collectionPath = buildCollectionPath(collection);
	const memberManagePath = buildMemberManagePath(collection);
	const [contentKindCode, setContentKindCode] = React.useState(ALL_FILTER_VALUE);
	const [search, setSearch] = React.useState(initialSearch);
	const [sort, setSort] = React.useState<PublicCollectionSortCode>(initialSort);
	const [templateId, setTemplateId] = React.useState(ALL_FILTER_VALUE);
	const [page, setPage] = React.useState(initialPage);
	const [pageSize, setPageSize] = React.useState(() =>
		getPageSizeValue(initialPageSize),
	);
	const [createOpen, setCreateOpen] = React.useState(
		initialCreateOpen && collection.actions.canCreate,
	);

	React.useEffect(() => {
		setCreateOpen(initialCreateOpen && collection.actions.canCreate);
	}, [collection.actions.canCreate, initialCreateOpen]);

	const templateOptions = React.useMemo(
		() =>
			uniqueSortedOptions({
				cards:
					contentKindCode === ALL_FILTER_VALUE
						? collection.content
						: collection.content.filter(
								(card) => card.contentKindCode === contentKindCode,
							),
				getValue: (card) => card.templateId,
				getLabel: (card) => card.templateLabel,
				allLabel: "All templates",
			}),
		[collection.content, contentKindCode],
	);

	const contentKindOptions = React.useMemo(
		() =>
			uniqueSortedOptions({
				cards:
					templateId === ALL_FILTER_VALUE
						? collection.content
						: collection.content.filter((card) => card.templateId === templateId),
				getValue: (card) => card.contentKindCode,
				getLabel: (card) => card.contentKindLabel,
				allLabel: "All kinds",
			}),
		[collection.content, templateId],
	);

	const filteredCards = React.useMemo(
		() =>
			collection.content
				.filter((card) =>
					cardMatchesFilters({
						card,
						contentKindCode,
						templateId,
					}),
				)
				.filter((card) => cardMatchesSearch(card, search))
				.sort((left, right) => compareCards(left, right, sort)),
		[collection.content, contentKindCode, search, sort, templateId],
	);

	const currentPage = clampPage(page, filteredCards.length, pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const visibleCards = filteredCards.slice(startIndex, startIndex + pageSize);
	const hasActiveFilters =
		normalizeSearchText(search).length > 0 ||
		contentKindCode !== ALL_FILTER_VALUE ||
		templateId !== ALL_FILTER_VALUE;

	React.useEffect(() => {
		const nextPage = clampPage(page, filteredCards.length, pageSize);
		if (nextPage !== page) {
			setPage(nextPage);
		}
	}, [filteredCards.length, page, pageSize]);

	const headerActions = (
		<div className="public-overview-header-actions">
			<StatusPill tone="muted">
				{formatCount(filteredCards.length, "matching entry", "matching entries")}
			</StatusPill>
			{collection.actions.hasManageableContent ? (
				<ButtonLink
					href={memberManagePath}
					variant="secondary"
					leftIcon={
						<Settings className="public-collection-action-icon" aria-hidden />
					}
				>
					Manage
				</ButtonLink>
			) : null}

			{collection.actions.canCreate ? (
				<ButtonLink
					href={`${collectionPath}?action=create`}
					variant="primary"
					leftIcon={<Plus className="public-collection-action-icon" aria-hidden />}
					onClick={() => setCreateOpen(true)}
				>
					Create
				</ButtonLink>
			) : null}
		</div>
	);

	return (
		<section className="public-collection-shell">
			<div className="public-collection-page">
				<BrowsePageHeader
					className="public-overview-header"
					breadcrumbs={[
						{
							label: collection.category.title,
							href: `/${collection.category.slug}`,
						},
						{ label: collection.collection.title },
					]}
					title={collection.collection.title}
					actions={headerActions}
				/>

				<BrowseFilterPanel
					className="public-collection-filter-panel"
					aria-label={`${collection.collection.title} content filters`}
				>
					<PublicCollectionControls
						collectionTitle={collection.collection.title}
						contentKindCode={contentKindCode}
						contentKindOptions={contentKindOptions}
						search={search}
						sort={sort}
						templateId={templateId}
						templateOptions={templateOptions}
						onContentKindChange={(value) => {
							const nextContentKindCode = value || ALL_FILTER_VALUE;
							setContentKindCode(nextContentKindCode);
							setPage(1);
							if (
								templateId !== ALL_FILTER_VALUE &&
								!hasCompatibleCard({
									cards: collection.content,
									contentKindCode: nextContentKindCode,
									templateId,
								})
							) {
								setTemplateId(ALL_FILTER_VALUE);
							}
						}}
						onSearchChange={(value) => {
							setSearch(value);
							setPage(1);
						}}
						onSortChange={(value) => {
							setSort(value);
							setPage(1);
						}}
						onTemplateChange={(value) => {
							const nextTemplateId = value || ALL_FILTER_VALUE;
							setTemplateId(nextTemplateId);
							setPage(1);
							if (
								contentKindCode !== ALL_FILTER_VALUE &&
								!hasCompatibleCard({
									cards: collection.content,
									contentKindCode,
									templateId: nextTemplateId,
								})
							) {
								setContentKindCode(ALL_FILTER_VALUE);
							}
						}}
					/>
				</BrowseFilterPanel>

				<BrowseResultsPanel
					className="public-collection-results-panel"
					aria-label={`${collection.collection.title} content results`}
				>
					{visibleCards.length > 0 ? (
						<>
							<div className="public-collection-grid">
								{visibleCards.map((card) => (
									<PublicContentCard key={card.id} card={card} />
								))}
							</div>

							<Pagination
								total={filteredCards.length}
								page={currentPage}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={(nextPageSize) => {
									setPageSize(getPageSizeValue(nextPageSize));
									setPage(1);
								}}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								pageSizeLabel=""
								className="public-collection-pagination"
							/>
						</>
					) : (
						<PublicCollectionEmptyState
							canCreate={collection.actions.canCreate}
							hasActiveFilters={hasActiveFilters}
							hasContent={collection.content.length > 0}
						/>
					)}
				</BrowseResultsPanel>
			</div>

			<MemberContentCreatePanel
				open={createOpen}
				categorySlug={collection.category.slug}
				subcategorySlug={collection.collection.slug}
				collectionPath={collectionPath}
				memberManagePath={memberManagePath}
				onClose={() => setCreateOpen(false)}
			/>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
