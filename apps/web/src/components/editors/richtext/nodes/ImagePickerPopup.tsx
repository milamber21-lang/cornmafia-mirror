//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/ImagePickerPopup.tsx                                    ////
//// Language: TSX                                                                                                 ////
//// RichText image picker with admin/member media context, stable paging, and drag/drop upload                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/basic-elements/Button";
import Checkbox from "@/components/ui/basic-elements/Checkbox";
import DropdownMenuSingle from "@/components/ui/basic-elements/DropdownMenuSingle";
import FilePreview from "@/components/ui/basic-elements/FilePreview";
import Input from "@/components/ui/basic-elements/Input";
import Label from "@/components/ui/basic-elements/Label";
import { Pagination } from "@/components/ui/basic-elements/Pagination";
import { readResponseMessage } from "@/lib/helpers/http-response";
import type { RichTextEditorMediaContext } from "../RichTextEditor";

type MediaItem = {
	id: string;
	alt?: string;
	filename?: string | null;
	url?: string | null;
	categoryId?: string | null;
	subcategoryId?: string | null;
	ownerUsername?: string;
	shared?: boolean | null;
	mimeType?: string | null;
	sizeBytes?: number | null;
	width?: number | null;
	height?: number | null;
	updatedAt?: string | null;
};

type MediaListResponse = {
	rows?: unknown[];
	page?: unknown;
	pageSize?: unknown;
	totalPages?: unknown;
	totalDocs?: unknown;
	sourceOptions?: unknown[];
};

type MediaSourceOption = {
	value: string;
	label: string;
};

type PickedImage = {
	id: string;
	url?: string | null;
	alt?: string | null;
	width?: number | null;
	height?: number | null;
};

type ImagePickerPopupProps = {
	open: boolean;
	onClose: () => void;
	onPick: (item: PickedImage) => void;
	categoryId: string;
	subcategoryId: string;
	accept?: string;
	maxSizeMB?: number;
	defaultShared?: boolean;
	mediaContext?: RichTextEditorMediaContext;
};

function isMediaItem(value: unknown): value is MediaItem {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const row = value as Record<string, unknown>;
	return typeof row.id === "string";
}

function isMediaSourceOption(value: unknown): value is MediaSourceOption {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const row = value as Record<string, unknown>;
	return typeof row.value === "string" && typeof row.label === "string";
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

function fmtBytes(value?: number | null): string {
	if (!value || value <= 0) {
		return "—";
	}

	const units = ["B", "KB", "MB", "GB"];
	let current = value;
	let index = 0;
	while (current >= 1024 && index < units.length - 1) {
		current /= 1024;
		index += 1;
	}

	return `${current.toFixed(1)} ${units[index]}`;
}

function getMediaTitle(row: MediaItem): string {
	return row.alt || row.filename || row.id;
}

function isInsertableImage(row: MediaItem): row is MediaItem & { url: string } {
	return (
		(row.mimeType || "").startsWith("image/") &&
		typeof row.url === "string" &&
		row.url.trim().length > 0
	);
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const EDITOR_PICKER_OPEN_ATTRIBUTE = "data-richtext-editor-picker-open";
const EDITOR_PICKER_CLOSE_EVENT = "richtext-editor-picker-close";

function markEditorPickerOpen(open: boolean): void {
	if (typeof document === "undefined") {
		return;
	}

	if (open) {
		document.body.setAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE, "true");
		return;
	}

	document.body.removeAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE);
}

function stopEscapeAtSource(event: KeyboardEvent): void {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}

function buildMediaListUrl(args: {
	mediaContext: RichTextEditorMediaContext;
	categoryId: string;
	subcategoryId: string;
	search: string;
	source: string;
	page: number;
	pageSize: number;
	refreshSeq: number;
}): string {
	const params = new URLSearchParams({
		page: String(args.page),
		pageSize: String(args.pageSize),
		kind: "image",
		_r: String(args.refreshSeq),
	});

	if (args.categoryId.trim().length > 0) {
		params.set("categoryId", args.categoryId.trim());
	}

	if (args.subcategoryId.trim().length > 0) {
		params.set("subcategoryId", args.subcategoryId.trim());
	}

	if (args.search.trim().length > 0) {
		params.set("search", args.search.trim());
	}

	if (args.mediaContext === "admin" && args.source.trim().length > 0) {
		params.set("source", args.source.trim());
	}

	const basePath = args.mediaContext === "member" ? "/api/me/media-picker" : "/api/admin/web/media";
	return `${basePath}?${params.toString()}`;
}

function useListMedia(
	mediaContext: RichTextEditorMediaContext,
	categoryId: string,
	subcategoryId: string,
	search: string,
	source: string,
	page: number,
	pageSize: number,
	refreshSeq: number,
) {
	const [rows, setRows] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [totalDocs, setTotalDocs] = useState<number>(0);
	const [resolvedPage, setResolvedPage] = useState<number>(page);
	const [sourceOptions, setSourceOptions] = useState<MediaSourceOption[]>([]);

	useEffect(() => {
		let cancelled = false;

		async function run(): Promise<void> {
			setLoading(true);
			setError("");

			try {
				const response = await fetch(
					buildMediaListUrl({
						mediaContext,
						categoryId,
						subcategoryId,
						search,
						source,
						page,
						pageSize,
						refreshSeq,
					}),
					{
						cache: "no-store",
						credentials: "include",
					},
				);
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load media."),
					);
				}

				const payload = (await response.json()) as MediaListResponse;
				if (cancelled) {
					return;
				}

				setRows(
					Array.isArray(payload.rows) ? payload.rows.filter(isMediaItem) : [],
				);
				setTotalDocs(toNonNegativeInt(payload.totalDocs));
				setResolvedPage(toPositiveInt(payload.page, page));
				setSourceOptions(
					Array.isArray(payload.sourceOptions)
						? payload.sourceOptions.filter(isMediaSourceOption)
						: [],
				);
			} catch (errorValue: unknown) {
				if (!cancelled) {
					setError(
						errorValue instanceof Error
							? errorValue.message
							: "Failed to load media.",
					);
					setRows([]);
					setTotalDocs(0);
					setResolvedPage(page);
					setSourceOptions([]);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void run();

		return () => {
			cancelled = true;
		};
	}, [categoryId, mediaContext, page, pageSize, refreshSeq, search, source, subcategoryId]);

	return { rows, loading, error, totalDocs, resolvedPage, sourceOptions };
}

export default function ImagePickerPopup({
	open,
	onClose,
	onPick,
	categoryId,
	subcategoryId,
	accept = "image/*",
	maxSizeMB = 10,
	defaultShared = false,
	mediaContext = "admin",
}: ImagePickerPopupProps) {
	const adminMediaContext = mediaContext === "admin";
	const [search, setSearch] = useState<string>("");
	const [source, setSource] = useState<string>(adminMediaContext && defaultShared ? "shared" : "");
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const [refreshSeq, setRefreshSeq] = useState(0);
	const { rows, loading, error, totalDocs, resolvedPage, sourceOptions } = useListMedia(
		mediaContext,
		categoryId,
		subcategoryId,
		search,
		source,
		page,
		pageSize,
		refreshSeq,
	);
	const [selectedId, setSelectedId] = useState<string>("");

	const selectedRow =
		rows.find((row) => row.id === selectedId && isInsertableImage(row)) ?? null;
	const pickerSourceOptions: MediaSourceOption[] = [
		{ value: "", label: "All sources" },
	];
	const hasSharedSourceOption = sourceOptions.some(
		(option) => option.value === "shared",
	);

	if (adminMediaContext && defaultShared && !hasSharedSourceOption) {
		pickerSourceOptions.push({ value: "shared", label: "Shared" });
	}

	for (const option of sourceOptions) {
		pickerSourceOptions.push(option);
	}

	const pickRow = useCallback(
		(row: MediaItem): void => {
			if (!isInsertableImage(row)) {
				return;
			}

			onPick({
				id: row.id,
				url: row.url || undefined,
				alt: row.alt || undefined,
				width: row.width ?? undefined,
				height: row.height ?? undefined,
			});
		},
		[onPick],
	);

	useEffect(() => {
		setPage(1);
	}, [search, source, categoryId, subcategoryId, pageSize]);

	useEffect(() => {
		if (resolvedPage !== page) {
			setPage(resolvedPage);
		}
	}, [page, resolvedPage]);

	useEffect(() => {
		if (
			selectedId.length > 0 &&
			!rows.some((row) => row.id === selectedId && isInsertableImage(row))
		) {
			setSelectedId("");
		}
	}, [rows, selectedId]);

	const [busy, setBusy] = useState<boolean>(false);
	const [localAlt, setLocalAlt] = useState<string>("");
	const [uploadShared, setUploadShared] = useState<boolean>(adminMediaContext && defaultShared);
	const [file, setFile] = useState<File | null>(null);
	const [draggingUpload, setDraggingUpload] = useState<boolean>(false);
	const [uploadError, setUploadError] = useState<string>("");
	const [closeWarning, setCloseWarning] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const maxBytes = Math.max(1, Math.floor(maxSizeMB * 1024 * 1024));
	const altMissing = localAlt.trim().length === 0;
	const hasUnsavedUploadChanges =
		Boolean(file) || localAlt.trim().length > 0 || uploadShared !== (adminMediaContext && defaultShared);
	const visibleError = closeWarning
		? "You have unsaved image upload changes. Click Close again or press Escape again to close without saving."
		: uploadError || error;

	useEffect(() => {
		markEditorPickerOpen(open);

		return () => markEditorPickerOpen(false);
	}, [open]);

	const setUploadFile = useCallback(
		(nextFile: File | null): void => {
			setUploadError("");

			if (!nextFile) {
				setUploadError("Drop a supported image file.");
				setFile(null);
				return;
			}

			if (!nextFile.type.startsWith("image/")) {
				setUploadError("Unsupported file type. Drop an image file.");
				setFile(null);
				return;
			}

			if (nextFile.size > maxBytes) {
				setUploadError(`Max size is ${maxSizeMB} MB.`);
				setFile(null);
				return;
			}

			setFile(nextFile);
		},
		[maxBytes, maxSizeMB],
	);

	useEffect(() => {
		if (open) {
			setSource(adminMediaContext && defaultShared ? "shared" : "");
			setUploadShared(adminMediaContext && defaultShared);
			setSelectedId("");
			setPage(1);
			setDraggingUpload(false);
			setCloseWarning(false);
		}
	}, [adminMediaContext, defaultShared, open]);

	const requestClose = useCallback(() => {
		if (busy) {
			return;
		}

		if (hasUnsavedUploadChanges && !closeWarning) {
			setCloseWarning(true);
			setUploadError("");
			return;
		}

		onClose();
	}, [busy, closeWarning, hasUnsavedUploadChanges, onClose]);

	const triggerSelect = useCallback(() => {
		setCloseWarning(false);
		fileInputRef.current?.click();
	}, []);

	const onFileInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setCloseWarning(false);
			setUploadFile(event.target.files ? (event.target.files[0] ?? null) : null);
		},
		[setUploadFile],
	);

	const onUploadDragOver = useCallback((event: DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		event.stopPropagation();
		setDraggingUpload(true);
	}, []);

	const onUploadDragLeave = useCallback((event: DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		event.stopPropagation();

		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setDraggingUpload(false);
	}, []);

	const onUploadDrop = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			event.stopPropagation();
			setDraggingUpload(false);

			const droppedFile = event.dataTransfer.files[0] ?? null;
			setCloseWarning(false);
			setUploadFile(droppedFile);
		},
		[setUploadFile],
	);

	const doUpload = useCallback(async (): Promise<void> => {
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setUploadError("Only images are allowed.");
			return;
		}

		if (file.size > maxBytes) {
			setUploadError(`Max size is ${maxSizeMB} MB.`);
			return;
		}

		if (!categoryId || !subcategoryId) {
			setUploadError("Category and Subcategory are required to upload.");
			return;
		}

		if (localAlt.trim().length === 0) {
			setUploadError("Alt text is required.");
			return;
		}

		setUploadError("");
		setBusy(true);
		try {
			const formData = new FormData();
			formData.set("file", file, file.name);
			formData.set("alt", localAlt.trim());

			const uploadPath = adminMediaContext ? "/api/admin/web/media/upload" : "/api/me/media";
			if (adminMediaContext) {
				formData.set("category", categoryId);
				formData.set("subcategory", subcategoryId);
				formData.set("shared", uploadShared ? "true" : "false");
			} else {
				formData.set("categoryId", categoryId);
				formData.set("subcategoryId", subcategoryId);
				formData.set("credit", "");
			}

			const response = await fetch(uploadPath, {
				method: "POST",
				body: formData,
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(await readResponseMessage(response, "Upload failed."));
			}

			setFile(null);
			setLocalAlt("");
			setCloseWarning(false);
			setSelectedId("");
			setSource(adminMediaContext && uploadShared ? "shared" : "");
			setPage(1);
			setRefreshSeq((current) => current + 1);
		} catch (errorValue: unknown) {
			setUploadError(
				errorValue instanceof Error ? errorValue.message : "Upload failed.",
			);
		} finally {
			setBusy(false);
		}
	}, [
		adminMediaContext,
		categoryId,
		file,
		localAlt,
		maxBytes,
		maxSizeMB,
		subcategoryId,
		uploadShared,
	]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				stopEscapeAtSource(event);
				window.dispatchEvent(new CustomEvent(EDITOR_PICKER_CLOSE_EVENT));
				requestClose();
			}
		};

		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
	}, [open, requestClose]);

	if (!open) {
		return null;
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Pick image"
			className="editor-image-picker-modal"
			onClick={requestClose}
		>
			<div
				className="editor-image-picker-modal__surface"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="editor-picker-header">
					<h3 className="editor-picker-title">
						Select an image
					</h3>
					<div className="editor-image-picker-filters">
						{adminMediaContext ? (
							<div>
								<Label className="editor-picker-label">Filter</Label>
								<DropdownMenuSingle
									className="editor-picker-control"
									options={pickerSourceOptions}
									value={source}
									onChange={setSource}
									placeholder="All sources"
									ariaLabel="Image source"
								/>
							</div>
						) : null}
						<div>
							<Label htmlFor="image-picker-search" className="editor-picker-label">
								Search
							</Label>
							<Input
								id="image-picker-search"
								value={search}
								placeholder="Search images..."
								onChange={(event) => setSearch(event.target.value)}
								size="md"
							/>
						</div>
						<div className="editor-picker-action-end">
							<Button
								size="md"
								variant="neutral"
								onClick={requestClose}
								aria-label="Close picker"
							>
								Close
							</Button>
						</div>
					</div>
				</div>

				<div className="editor-picker-body">
					{visibleError ? (
						<div className="editor-picker-error">
							{visibleError}
						</div>
					) : null}

					<section className="editor-picker-section editor-picker-section--media">
						<div className="editor-picker-section__header">
							<div>
								<h4 className="editor-picker-section__title">
									Available images
								</h4>
								<div className="editor-picker-muted">
									{totalDocs} images
								</div>
							</div>
							<div className="editor-picker-selected-row">
								{selectedRow ? (
									<div
										className="editor-picker-selected-row__label"
										title={getMediaTitle(selectedRow)}
									>
										Selected: {getMediaTitle(selectedRow)}
									</div>
								) : null}
								<Button
									size="sm"
									variant="accent"
									disabled={!selectedRow}
									onClick={() => {
										if (selectedRow) {
											pickRow(selectedRow);
										}
									}}
								>
									Insert selected
								</Button>
							</div>
						</div>

						<div className="editor-image-picker-grid-scroll">
							{loading ? (
								<div className="editor-picker-grid-state">
									Loading...
								</div>
							) : rows.length === 0 ? (
								<div className="editor-picker-grid-state">
									No images found.
								</div>
							) : (
								<div className="editor-image-picker-grid">
									{rows.map((row) => {
										const canInsert = isInsertableImage(row);
										const title = getMediaTitle(row);
										const isSelected = canInsert && row.id === selectedId;

										return (
											<button
												key={row.id}
												type="button"
												disabled={!canInsert}
												onClick={() => setSelectedId(row.id)}
												onDoubleClick={() => pickRow(row)}
												aria-pressed={isSelected}
												aria-disabled={!canInsert}
												className={[
													"editor-image-picker-card",
													canInsert ? "editor-image-picker-card--enabled" : "editor-image-picker-card--disabled",
													isSelected ? "editor-image-picker-card--selected" : "",
												].join(" ")}
												title={title || undefined}
											>
												<div className="editor-image-picker-card__preview">
													{canInsert ? (
														<img
															src={row.url || ""}
															alt={row.alt || ""}
															className="editor-image-picker-card__image"
															draggable={false}
														/>
													) : (
														<div className="editor-picker-muted">
															Unsupported media
														</div>
													)}
												</div>
												<div className="editor-image-picker-card__meta">
													<div className="editor-image-picker-card__title">
														{title}
													</div>
													<div className="editor-image-picker-card__size">
														{fmtBytes(row.sizeBytes)}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>

						<div className="editor-picker-pagination">
							<Pagination
								total={totalDocs}
								page={page}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={setPageSize}
								pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
								showEdges
							/>
						</div>
					</section>

					<div className="editor-picker-upload">
						<h4 className="editor-picker-upload__title">
							Upload new
						</h4>

						<input
							ref={fileInputRef}
							id="upload-file-hidden"
							type="file"
							accept={accept}
							className="editor-picker-file-input"
							onChange={onFileInputChange}
						/>

						<div
							className={[
								"editor-image-upload-dropzone",
								draggingUpload ? "editor-image-upload-dropzone--dragging" : "",
							].join(" ")}
							onDragOver={onUploadDragOver}
							onDragLeave={onUploadDragLeave}
							onDrop={onUploadDrop}
						>
							{!file ? (
								<div className="editor-image-upload-empty">
									<div className="editor-image-upload-preview-column">
										<div className="editor-image-upload-empty__drop-target">
											Drop image here
										</div>
									</div>
									<div className="editor-image-upload-body-column">
										<Button size="md" variant="accent" onClick={triggerSelect}>
											Select image
										</Button>
										<div className="editor-picker-help">
											Drag an image into this upload card or select one from your device. Max {maxSizeMB} MB.
										</div>
									</div>
								</div>
							) : (
								<div className="editor-image-upload-file">
									<div className="editor-image-upload-preview-column">
										<FilePreview file={file} width={260} />
										<div className="editor-picker-help">
											Drop another image here to replace this file.
										</div>
									</div>

									<div className="editor-image-upload-body-column">
										<Label className="editor-picker-label">Filename</Label>
										<div className="editor-image-upload-filename">
											{file.name}
										</div>
										<div className="editor-picker-help">
											Size: {fmtBytes(file.size)}
										</div>

										<Label htmlFor="upload-alt" className="editor-picker-label editor-picker-label--spaced">
											Alt text{" "}
											<span
												aria-hidden="true"
												className="editor-picker-required"
											>
												*
											</span>
										</Label>
										<Input
											id="upload-alt"
											type="search"
											value={localAlt}
											onChange={(event) => {
												setUploadError("");
												setCloseWarning(false);
												setLocalAlt(event.target.value);
											}}
											size="md"
											required
											aria-required="true"
											placeholder="Describe the image"
										/>
										<div className="editor-image-upload-actions">
											<div className="editor-picker-action-start">
												<Button
													size="md"
													variant="neutral"
													onClick={triggerSelect}
													className="editor-picker-action-button"
												>
													Change
												</Button>
											</div>
											{adminMediaContext ? (
												<div className="editor-picker-action-center">
													<Checkbox
														checked={uploadShared}
														onChange={(event) => {
															setCloseWarning(false);
															setUploadShared(event.currentTarget.checked);
														}}
														label="Shared"
														size="md"
													/>
												</div>
											) : null}
											<div className="editor-picker-action-end">
												<Button
													size="md"
													variant="accent"
													onClick={() => void doUpload()}
													disabled={busy || !file || altMissing}
													className="editor-picker-action-button"
												>
													{busy ? "Uploading..." : "Upload"}
												</Button>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
