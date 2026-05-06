//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberMediaDashboard.tsx                                                    ////
//// Language: TSX                                                                                              ////
//// Client member media dashboard with R6B layout, member-safe upload, filters, sorting, and metadata edits.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { Clapperboard, Pencil, Plus, Trash2 } from "lucide-react";

import {
	AlertBanner,
	Button,
	ButtonLink,
	DropdownMenuSingle,
	FilePreview,
	Input,
	Pagination,
	Textarea,
	Upload,
} from "@/components/ui";
import Panel from "@/components/ui/Panel";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type { MemberAuthorableCollection } from "@/lib/data/member-authoring";
import type { MemberMediaItem } from "@/lib/data/member-media";
import { readResponseMessage } from "@/lib/helpers/http-response";

type PanelMode = "upload" | "edit";
type SortCode = "newest" | "filename" | "oldest";

type MediaApiResponse = {
	rows?: unknown;
	collections?: unknown;
};

type FilterOption = {
	value: string;
	label: string;
};

const ALL_FILTER_VALUE = "__all";
const PAGE_SIZE_OPTIONS = [9, 18, 36, 72] as const;
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const SORT_OPTIONS: { value: SortCode; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "filename", label: "File name A-Z" },
	{ value: "oldest", label: "Oldest" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCollection(value: unknown): value is MemberAuthorableCollection {
	return (
		isRecord(value) &&
		typeof value.categoryId === "string" &&
		typeof value.subcategoryId === "string" &&
		typeof value.label === "string"
	);
}

function isMediaItem(value: unknown): value is MemberMediaItem {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.originalFilename === "string" &&
		typeof value.storageRelPath === "string"
	);
}

function formatDate(value: string): string {
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

function formatBytes(value: number): string {
	if (!Number.isFinite(value) || value <= 0) {
		return "-";
	}

	const units = ["B", "KB", "MB", "GB"];
	let nextValue = value;
	let unitIndex = 0;
	while (nextValue >= 1024 && unitIndex < units.length - 1) {
		nextValue /= 1024;
		unitIndex += 1;
	}
	return `${nextValue.toFixed(1)} ${units[unitIndex]}`;
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function matchesSearch(row: MemberMediaItem, search: string): boolean {
	const normalized = normalizeSearch(search);
	if (!normalized) {
		return true;
	}

	return [
		row.originalFilename,
		row.alt,
		row.credit,
		row.categoryTitle,
		row.subcategoryTitle,
	]
		.join(" ")
		.toLowerCase()
		.includes(normalized);
}

function matchesFilters(args: {
	row: MemberMediaItem;
	categoryId: string;
	subcategoryId: string;
}): boolean {
	const categoryMatches =
		args.categoryId === ALL_FILTER_VALUE || args.row.categoryId === args.categoryId;
	const subcategoryMatches =
		args.subcategoryId === ALL_FILTER_VALUE || args.row.subcategoryId === args.subcategoryId;

	return categoryMatches && subcategoryMatches;
}

function compareMedia(left: MemberMediaItem, right: MemberMediaItem, sort: SortCode): number {
	if (sort === "filename") {
		return left.originalFilename.localeCompare(right.originalFilename, undefined, {
			sensitivity: "base",
		});
	}

	const leftDate = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
	const rightDate = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

	if (leftDate !== rightDate) {
		return sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
	}

	return left.originalFilename.localeCompare(right.originalFilename, undefined, {
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
			.sort((left, right) =>
				left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
			),
	];
}

function buildCollectionOptions(collections: MemberAuthorableCollection[]): FilterOption[] {
	return collections.map((collection) => ({
		value: `${collection.categoryId}:${collection.subcategoryId}`,
		label: collection.label,
	}));
}

export default function MemberMediaDashboard({
	initialRows,
	initialCollections,
}: {
	initialRows: MemberMediaItem[];
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
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelMode, setPanelMode] = React.useState<PanelMode>("upload");
	const [selectedRow, setSelectedRow] = React.useState<MemberMediaItem | null>(null);
	const [collectionValue, setCollectionValue] = React.useState("");
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [alt, setAlt] = React.useState("");
	const [credit, setCredit] = React.useState("");
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
						: collections.filter((collection) => collection.categoryId === categoryId),
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
				.sort((left, right) => compareMedia(left, right, sort)),
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

	function openUploadPanel(): void {
		setPanelMode("upload");
		setSelectedRow(null);
		setCollectionValue(collectionOptions[0]?.value ?? "");
		setSelectedFile(null);
		setAlt("");
		setCredit("");
		setTopError("");
		setPanelOpen(true);
	}

	function openEditPanel(row: MemberMediaItem): void {
		setPanelMode("edit");
		setSelectedRow(row);
		setCollectionValue(`${row.categoryId}:${row.subcategoryId}`);
		setSelectedFile(null);
		setAlt(row.alt);
		setCredit(row.credit);
		setTopError("");
		setPanelOpen(true);
	}

	async function refreshFromPayload(payload: MediaApiResponse): Promise<void> {
		if (Array.isArray(payload.rows)) {
			setRows(payload.rows.filter(isMediaItem));
		}
		if (Array.isArray(payload.collections)) {
			setCollections(payload.collections.filter(isCollection));
		}
	}

	async function submitPanel(): Promise<void> {
		const normalizedAlt = alt.trim();
		if (!normalizedAlt) {
			setTopError("Alt text is required.");
			return;
		}

		setSubmitting(true);
		setTopError("");
		try {
			let response: Response;
			if (panelMode === "upload") {
				const [nextCategoryId = "", nextSubcategoryId = ""] = collectionValue.split(":");
				if (!nextCategoryId || !nextSubcategoryId) {
					setTopError("Collection is required.");
					setSubmitting(false);
					return;
				}
				if (!selectedFile) {
					setTopError("Image file is required.");
					setSubmitting(false);
					return;
				}

				const formData = new FormData();
				formData.set("file", selectedFile);
				formData.set("categoryId", nextCategoryId);
				formData.set("subcategoryId", nextSubcategoryId);
				formData.set("alt", normalizedAlt);
				formData.set("credit", credit.trim());

				response = await fetch("/api/me/media", {
					method: "POST",
					body: formData,
					credentials: "include",
				});
			} else {
				response = await fetch("/api/me/media", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: selectedRow?.id ?? "",
						data: { alt: normalizedAlt, credit: credit.trim() },
					}),
					credentials: "include",
				});
			}

			if (!response.ok) {
				throw new Error(await readResponseMessage(response, "Failed to save media."));
			}
			await refreshFromPayload((await response.json()) as MediaApiResponse);
			setPanelOpen(false);
		} catch (submitError: unknown) {
			setTopError(submitError instanceof Error ? submitError.message : "Failed to save media.");
		} finally {
			setSubmitting(false);
		}
	}

	async function deleteRow(row: MemberMediaItem): Promise<void> {
		const confirmed = await confirmAction({
			title: "Delete media?",
			message: `Delete ${row.originalFilename}? This is allowed only when the media is not referenced by content.`,
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!confirmed) {
			return;
		}

		setError("");
		try {
			const response = await fetch("/api/me/media", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ op: "delete", id: row.id }),
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(await readResponseMessage(response, "Failed to delete media."));
			}
			await refreshFromPayload((await response.json()) as MediaApiResponse);
		} catch (deleteError: unknown) {
			setError(deleteError instanceof Error ? deleteError.message : "Failed to delete media.");
		}
	}

	const dirtyGuard =
		panelMode === "upload"
			? Boolean(selectedFile) || alt.trim().length > 0 || credit.trim().length > 0
			: alt !== (selectedRow?.alt ?? "") || credit !== (selectedRow?.credit ?? "");

	return (
		<main className="card member-dashboard-main">
			<section className="member-hero">
				<div className="member-hero__main">
					<div className="member-hero__icon">
						<Clapperboard className="member-icon member-icon--lg" aria-hidden />
					</div>
					<div>
						<h1 className="member-hero__title">My media</h1>
						<p className="member-hero__text">Manage image uploads that can be attached to your public/member content.</p>
					</div>
				</div>
				<div className="member-hero__actions">
					<Button type="button" variant="green" onClick={openUploadPanel} leftIcon={<Plus className="member-icon member-icon--sm" aria-hidden />}>Upload image</Button>
					<ButtonLink href="/me" variant="neutral">Back to profile</ButtonLink>
				</div>
			</section>

			{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

			<section className="member-panel">
				<div className="member-filter-grid member-filter-grid--media">
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
					<Input
						type="search"
						value={search}
						onChange={(event) => {
							setSearch(event.currentTarget.value);
							setPage(1);
						}}
						placeholder="Search media..."
					/>
					<DropdownMenuSingle
						options={SORT_OPTIONS}
						value={sort}
						onChange={(value) => {
							setSort(value === "filename" || value === "oldest" ? value : "newest");
							setPage(1);
						}}
						ariaLabel="Sort media"
						className="member-control-full"
					/>
				</div>

				{visibleRows.length > 0 ? (
					<div className="member-card-grid">
						{visibleRows.map((row) => (
							<article key={row.id} className="member-card">
								<div className="member-card__media">
									<FilePreview
										src={row.url}
										filename={row.originalFilename}
										mimeType={row.mimeType}
										sizeBytes={row.sizeBytes}
										alt={row.alt || row.originalFilename}
										width={260}
										showMeta={false}
									/>
								</div>
								<div className="member-card__eyebrow">{row.categoryTitle} / {row.subcategoryTitle}</div>
								<h2 className="member-card__title">{row.originalFilename}</h2>
								<p className="member-card__description member-card__description--short">{row.alt || "Alt text missing."}</p>
								<div className="member-card__footer">
									<div className="member-card__meta-row">
										<span>{formatBytes(row.sizeBytes)}</span>
										<span>{row.width && row.height ? `${row.width} x ${row.height}` : "Image"}</span>
										<span>Updated {formatDate(row.updatedAt)}</span>
									</div>
									<div className="member-card__actions">
										<Button type="button" size="sm" variant="neutral" onClick={() => openEditPanel(row)} leftIcon={<Pencil className="member-icon member-icon--sm" aria-hidden />}>Edit</Button>
										<Button type="button" size="sm" variant="accent" onClick={() => void deleteRow(row)} leftIcon={<Trash2 className="member-icon member-icon--sm" aria-hidden />}>Delete</Button>
									</div>
								</div>
							</article>
						))}
					</div>
				) : (
					<div className="member-empty-state">No manageable media found.</div>
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

			<Panel
				open={panelOpen}
				onClose={() => setPanelOpen(false)}
				title={panelMode === "upload" ? "Upload image" : "Edit media"}
				width="50%"
				loading={submitting}
				dirtyGuard={dirtyGuard}
				renderSave={() => (
					<Button type="button" variant="green" loading={submitting} onClick={() => void submitPanel()}>Save</Button>
				)}
			>
				<div className="member-panel-form-stack">
					{topError ? <AlertBanner tone="error">{topError}</AlertBanner> : null}
					{panelMode === "upload" ? (
						<>
							<div>
								<label className="member-panel-field-label">Collection</label>
								<DropdownMenuSingle options={collectionOptions} value={collectionValue} onChange={setCollectionValue} placeholder="Select collection" />
							</div>
							<Upload
								accept={ACCEPTED_IMAGE_TYPES}
								multiple={false}
								selected={selectedFile}
								onFilesSelected={(files) => setSelectedFile(files[0] ?? null)}
								title="Upload image"
								description="JPEG, PNG, WEBP, or GIF. SVG is intentionally not allowed here."
								buttonText="Choose image"
							/>
						</>
					) : selectedRow ? (
						<div className="member-panel-preview">
							<FilePreview src={selectedRow.url} filename={selectedRow.originalFilename} mimeType={selectedRow.mimeType} sizeBytes={selectedRow.sizeBytes} alt={selectedRow.alt || selectedRow.originalFilename} width={320} />
						</div>
					) : null}
					<div>
						<label className="member-panel-field-label">Alt text</label>
						<Input value={alt} onChange={(event) => setAlt(event.currentTarget.value)} />
					</div>
					<div>
						<label className="member-panel-field-label">Credit</label>
						<Textarea rows={4} value={credit} onChange={(event) => setCredit(event.currentTarget.value)} />
					</div>
				</div>
			</Panel>
		</main>
	);
}
