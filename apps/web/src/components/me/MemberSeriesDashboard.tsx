//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberSeriesDashboard.tsx                                                   ////
//// Language: TSX                                                                                              ////
//// Shared member series dashboard with browse filters, management cards, delete guard, and safe actions.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
	Textarea,
} from "@/components/ui";
import MemberManagementCard from "@/components/me/MemberManagementCard";
import Panel from "@/components/ui/Panel";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	compareDisplayText,
	formatDisplayDate,
} from "@/lib/helpers/display-format";
import type { MemberAuthorableCollection } from "@/lib/data/member-authoring";
import type {
	MemberSeriesDeleteBlocker,
	MemberSeriesItem,
} from "@/lib/data/member-series";
import { readResponseMessage } from "@/lib/helpers/http-response";

type PanelMode = "create" | "edit";
type SortCode = "newest" | "title" | "oldest";

type SeriesApiResponse = {
	rows?: unknown;
	collections?: unknown;
};

type SeriesMutationPayload = {
	op: "create" | "update" | "delete";
	id?: string;
	data?: {
		title?: string;
		description?: string;
		categoryId?: string;
		subcategoryId?: string;
	};
};

type DeleteError = {
	message: string;
	blockers: MemberSeriesDeleteBlocker[];
};

type FilterOption = {
	value: string;
	label: string;
};

const ALL_FILTER_VALUE = "__all";
const PAGE_SIZE_OPTIONS = [9, 18, 36, 72] as const;
const SORT_OPTIONS: { value: SortCode; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "title", label: "Title A-Z" },
	{ value: "oldest", label: "Oldest" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeriesItem(value: unknown): value is MemberSeriesItem {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.title === "string"
	);
}

function isCollection(value: unknown): value is MemberAuthorableCollection {
	return (
		isRecord(value) &&
		typeof value.categoryId === "string" &&
		typeof value.subcategoryId === "string" &&
		typeof value.label === "string"
	);
}

function isDeleteBlocker(value: unknown): value is MemberSeriesDeleteBlocker {
	return (
		isRecord(value) &&
		typeof value.contentId === "string" &&
		typeof value.title === "string"
	);
}

function formatDate(value: string): string {
	return formatDisplayDate(value) ?? (value || "-");
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function matchesSearch(row: MemberSeriesItem, search: string): boolean {
	const normalized = normalizeSearch(search);
	if (!normalized) {
		return true;
	}

	return [row.title, row.description, row.categoryTitle, row.subcategoryTitle]
		.join(" ")
		.toLowerCase()
		.includes(normalized);
}

function matchesFilters(args: {
	row: MemberSeriesItem;
	categoryId: string;
	subcategoryId: string;
}): boolean {
	const categoryMatches =
		args.categoryId === ALL_FILTER_VALUE ||
		args.row.categoryId === args.categoryId;
	const subcategoryMatches =
		args.subcategoryId === ALL_FILTER_VALUE ||
		args.row.subcategoryId === args.subcategoryId;

	return categoryMatches && subcategoryMatches;
}

function compareSeries(
	left: MemberSeriesItem,
	right: MemberSeriesItem,
	sort: SortCode,
): number {
	if (sort === "title") {
		return compareDisplayText(left.title, right.title);
	}

	const leftDate = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
	const rightDate = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

	if (leftDate !== rightDate) {
		return sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
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
		{ value: ALL_FILTER_VALUE, label: "All" },
		...Array.from(byValue.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => compareDisplayText(left.label, right.label)),
	];
}

function buildCollectionOptions(
	collections: MemberAuthorableCollection[],
): FilterOption[] {
	return collections.map((collection) => ({
		value: `${collection.categoryId}:${collection.subcategoryId}`,
		label: collection.label,
	}));
}

function readDeleteBlockers(payload: unknown): MemberSeriesDeleteBlocker[] {
	if (!isRecord(payload) || !Array.isArray(payload.blockers)) {
		return [];
	}

	return payload.blockers.filter(isDeleteBlocker);
}

async function readDeleteError(response: Response): Promise<DeleteError> {
	const text = await response.text();
	if (!text) {
		return {
			message: `Failed to delete series (${response.status}).`,
			blockers: [],
		};
	}

	try {
		const parsed = JSON.parse(text) as unknown;
		const message =
			isRecord(parsed) && typeof parsed.message === "string"
				? parsed.message
				: "Failed to delete series.";
		return {
			message,
			blockers: readDeleteBlockers(parsed),
		};
	} catch {
		return { message: text, blockers: [] };
	}
}

function SeriesDependencyList({
	error,
}: {
	error: DeleteError;
}): React.JSX.Element {
	return (
		<AlertBanner tone="error">
			<div className="member-dependency-list">
				<div>{error.message}</div>
				{error.blockers.length > 0 ? (
					<ul className="member-dependency-list__items">
						{error.blockers.map((blocker) => (
							<li key={blocker.contentId}>
								<span className="member-dependency-list__title">{blocker.title}</span>
								<span className="member-dependency-list__meta">
									{" "}
									- {blocker.categoryTitle} / {blocker.subcategoryTitle} /{" "}
									{blocker.statusCode}
								</span>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</AlertBanner>
	);
}

export default function MemberSeriesDashboard({
	initialRows,
	initialCollections,
}: {
	initialRows: MemberSeriesItem[];
	initialCollections: MemberAuthorableCollection[];
}): React.JSX.Element {
	const [rows, setRows] = React.useState(initialRows);
	const [collections, setCollections] = React.useState(initialCollections);
	const [categoryId, setCategoryId] = React.useState(ALL_FILTER_VALUE);
	const [subcategoryId, setSubcategoryId] = React.useState(ALL_FILTER_VALUE);
	const [search, setSearch] = React.useState("");
	const [sort, setSort] = React.useState<SortCode>("newest");
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(9);
	const [error, setError] = React.useState("");
	const [deleteError, setDeleteError] = React.useState<DeleteError | null>(null);
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<PanelMode>("create");
	const [selectedRow, setSelectedRow] = React.useState<MemberSeriesItem | null>(
		null,
	);
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [collectionValue, setCollectionValue] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [topError, setTopError] = React.useState("");

	const categoryOptions = React.useMemo(
		() =>
			uniqueSortedOptions({
				collections,
				getValue: (collection) => collection.categoryId,
				getLabel: (collection) => collection.categoryTitle,
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
			}),
		[categoryId, collections],
	);
	const filteredRows = React.useMemo(
		() =>
			rows
				.filter((row) => matchesFilters({ row, categoryId, subcategoryId }))
				.filter((row) => matchesSearch(row, search))
				.sort((left, right) => compareSeries(left, right, sort)),
		[categoryId, rows, search, sort, subcategoryId],
	);
	const visibleRows = React.useMemo(
		() => getPageRows(filteredRows, page, pageSize),
		[filteredRows, page, pageSize],
	);
	const collectionOptions = React.useMemo(
		() => buildCollectionOptions(collections),
		[collections],
	);

	React.useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
		if (page > pageCount) {
			setPage(pageCount);
		}
	}, [filteredRows.length, page, pageSize]);

	function openCreatePanel(): void {
		setPanelMode("create");
		setSelectedRow(null);
		setTitle("");
		setDescription("");
		setCollectionValue(collectionOptions[0]?.value ?? "");
		setTopError("");
		setPanelOpen(true);
	}

	function openEditPanel(row: MemberSeriesItem): void {
		setPanelMode("edit");
		setSelectedRow(row);
		setTitle(row.title);
		setDescription(row.description);
		setCollectionValue(`${row.categoryId}:${row.subcategoryId}`);
		setTopError("");
		setPanelOpen(true);
	}

	async function refreshFromPayload(payload: SeriesApiResponse): Promise<void> {
		if (Array.isArray(payload.rows)) {
			setRows(payload.rows.filter(isSeriesItem));
		}
		if (Array.isArray(payload.collections)) {
			setCollections(payload.collections.filter(isCollection));
		}
	}

	async function submitPanel(): Promise<void> {
		const normalizedTitle = title.trim();
		if (!normalizedTitle) {
			setTopError("Series title is required.");
			return;
		}

		const [nextCategoryId = "", nextSubcategoryId = ""] =
			collectionValue.split(":");
		if (panelMode === "create" && (!nextCategoryId || !nextSubcategoryId)) {
			setTopError("Collection is required.");
			return;
		}

		const payload: SeriesMutationPayload =
			panelMode === "create"
				? {
						op: "create",
						data: {
							title: normalizedTitle,
							description: description.trim(),
							categoryId: nextCategoryId,
							subcategoryId: nextSubcategoryId,
						},
					}
				: {
						op: "update",
						id: selectedRow?.id ?? "",
						data: {
							title: normalizedTitle,
							description: description.trim(),
						},
					};

		setSubmitting(true);
		setTopError("");
		setError("");
		setDeleteError(null);
		try {
			const response = await fetch("/api/me/series", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save series."),
				);
			}
			const responsePayload = (await response.json()) as SeriesApiResponse;
			await refreshFromPayload(responsePayload);
			setPanelOpen(false);
		} catch (submitError: unknown) {
			setTopError(
				submitError instanceof Error
					? submitError.message
					: "Failed to save series.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function deleteRow(row: MemberSeriesItem): Promise<void> {
		const confirmed = await confirmAction({
			title: "Delete series?",
			message: `Delete ${row.title}? This works only when no content is attached to the series.`,
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!confirmed) {
			return;
		}

		setError("");
		setDeleteError(null);
		try {
			const response = await fetch("/api/me/series", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					op: "delete",
					id: row.id,
				} satisfies SeriesMutationPayload),
				credentials: "include",
			});
			if (!response.ok) {
				const dependencyError = await readDeleteError(response);
				if (dependencyError.blockers.length > 0) {
					setDeleteError(dependencyError);
				} else {
					setError(dependencyError.message);
				}
				return;
			}
			await refreshFromPayload((await response.json()) as SeriesApiResponse);
		} catch (deleteErrorValue: unknown) {
			setError(
				deleteErrorValue instanceof Error
					? deleteErrorValue.message
					: "Failed to delete series.",
			);
		}
	}

	const dirtyGuard =
		panelMode === "create"
			? title.trim().length > 0 || description.trim().length > 0
			: title !== (selectedRow?.title ?? "") ||
				description !== (selectedRow?.description ?? "");

	return (
		<main className="member-dashboard-main member-browse-page">
			<BrowsePageHeader
				className="member-browse-header"
				breadcrumbs={[{ label: "Member", href: "/me" }, { label: "Series" }]}
				title="My series"
				actions={<StatusPill tone="info">{rows.length} manageable</StatusPill>}
				description={
					<div className="member-browse-header__secondary-actions">
						<Button
							type="button"
							size="sm"
							variant="primary"
							onClick={openCreatePanel}
							leftIcon={<Plus aria-hidden />}
						>
							Create series
						</Button>
						<ButtonLink href="/me" variant="secondary" size="sm">
							Back to profile
						</ButtonLink>
					</div>
				}
			/>

			{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
			{deleteError ? <SeriesDependencyList error={deleteError} /> : null}

			<BrowseFilterPanel
				className="member-browse-filter-panel"
				aria-label="Member series filters"
			>
				<div className="member-browse-filter-controls member-browse-filter-controls--series">
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
					<div className="member-browse-filter__search">
						<label className="sr-only" htmlFor="member-series-search">
							Search series
						</label>
						<Input
							id="member-series-search"
							type="search"
							value={search}
							onChange={(event) => {
								setSearch(event.currentTarget.value);
								setPage(1);
							}}
							placeholder="Search series..."
						/>
					</div>
					<div className="member-browse-filter__control">
						<DropdownMenuSingle
							options={SORT_OPTIONS}
							value={sort}
							onChange={(value) => {
								setSort(value === "title" || value === "oldest" ? value : "newest");
								setPage(1);
							}}
							ariaLabel="Sort series"
							className="member-control-full"
						/>
					</div>
				</div>
			</BrowseFilterPanel>

			<BrowseResultsPanel
				className="member-browse-results-panel"
				aria-label="Member series results"
			>
				<BrowsePanelHeader
					title="Series"
					description={`Showing ${filteredRows.length} of ${rows.length} manageable series.`}
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
										fallback={{ lucideName: "Layers3" }}
										mediaRouteScope="app"
										size="card"
										title={row.title}
									/>
								}
								eyebrow={`${row.categoryTitle} / ${row.subcategoryTitle}`}
								title={row.title}
								summary={row.description.trim() || null}
								details={
									<span className="member-management-card__meta">
										<span>Updated {formatDate(row.updatedAt)}</span>
									</span>
								}
								actions={
									<>
										<Button
											type="button"
											size="sm"
											variant="secondary"
											onClick={() => openEditPanel(row)}
											leftIcon={<Pencil aria-hidden />}
										>
											Edit
										</Button>
										<Button
											type="button"
											size="sm"
											variant="danger"
											onClick={() => void deleteRow(row)}
											leftIcon={<Trash2 aria-hidden />}
										>
											Delete
										</Button>
									</>
								}
							/>
						))}
					</div>
				) : (
					<SurfaceState
						kind="empty"
						title="No manageable series"
						description="No series match the current filters."
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

			<Panel
				open={panelOpen}
				onClose={() => setPanelOpen(false)}
				title={panelMode === "create" ? "Create series" : "Edit series"}
				width="50%"
				loading={submitting}
				dirtyGuard={dirtyGuard}
				renderSave={() => (
					<Button
						type="button"
						variant="primary"
						loading={submitting}
						onClick={() => void submitPanel()}
					>
						Save
					</Button>
				)}
			>
				<div className="member-panel-form-stack">
					{topError ? <AlertBanner tone="error">{topError}</AlertBanner> : null}
					{panelMode === "create" ? (
						<div>
							<label className="member-panel-field-label">Collection</label>
							<DropdownMenuSingle
								options={collectionOptions}
								value={collectionValue}
								onChange={setCollectionValue}
								placeholder="Select collection"
							/>
						</div>
					) : null}
					<div>
						<label className="member-panel-field-label">Title</label>
						<Input
							value={title}
							onChange={(event) => setTitle(event.currentTarget.value)}
						/>
					</div>
					<div>
						<label className="member-panel-field-label">Description</label>
						<Textarea
							rows={6}
							value={description}
							onChange={(event) => setDescription(event.currentTarget.value)}
						/>
					</div>
				</div>
			</Panel>
		</main>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
