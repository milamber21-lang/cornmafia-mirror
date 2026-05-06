//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/IconsPanel.tsx                                                        ////
//// Language: TSX                                                                                                 ////
//// Admin panel for creating and editing web icons                                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type Option,
	type RowDef,
} from "@/components/ui/PanelForm";
import IconRender from "@/components/ui/IconRender";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";
import type { IconSourceCode } from "@/lib/helpers/icons";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

type MediaOption = {
	id: string;
	filename: string;
	alt?: string | null;
	url?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
};

type IconsMetaResponse = {
	svgMedia?: unknown[];
};

export type IconPanelRow = {
	id: string | number;
	key: string;
	label: string;
	enabled: boolean;
	source: IconSourceCode;
	lucideName?: string | null;
	iconMedia?: {
		id: string | number;
		url?: string | null;
		filename?: string | null;
		originalFilename?: string | null;
		mimeType?: string | null;
		storageRelPath?: string | null;
	} | null;
	createdAt?: string | null;
	updatedAt?: string | null;
};

export interface IconsPanelProps {
	open: boolean;
	mode: Mode;
	row?: IconPanelRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function toMediaOptionList(value: unknown): MediaOption[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const options: MediaOption[] = [];

	for (const item of value) {
		if (typeof item !== "object" || item === null) {
			continue;
		}

		const record = item as Record<string, unknown>;
		const id =
			typeof record.id === "string" || typeof record.id === "number"
				? String(record.id)
				: "";
		const filename = typeof record.filename === "string" ? record.filename : "";
		const mimeType = typeof record.mimeType === "string" ? record.mimeType : null;
		const storageRelPath =
			typeof record.storageRelPath === "string" ? record.storageRelPath : null;

		if (!id || !filename) {
			continue;
		}

		options.push({
			id,
			filename,
			alt: typeof record.alt === "string" ? record.alt : null,
			url: typeof record.url === "string" ? record.url : null,
			mimeType,
			storageRelPath,
		});
	}

	return options;
}

function getMediaOptionLabel(option: MediaOption): string {
	const alt = option.alt?.trim() ?? "";
	return alt.length > 0 ? alt : option.filename;
}

export default function IconsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: IconsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const [source, setSource] = useState<IconSourceCode>(
		row?.source === "media" ? "media" : "lucide",
	);
	const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
	const [mediaLoading, setMediaLoading] = useState(false);
	const [mediaError, setMediaError] = useState("");

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				key: row.key,
				label: row.label,
				enabled: row.enabled,
				source: row.source,
				lucideName: row.lucideName ?? "",
				mediaId: row.iconMedia?.id ? String(row.iconMedia.id) : "",
			};
		}

		return {
			key: "",
			label: "",
			enabled: true,
			source: "lucide" as const,
			lucideName: "",
			mediaId: "",
		};
	}, [mode, row]);

	const loadMeta = useCallback(async (): Promise<void> => {
		if (mediaLoading) {
			return;
		}

		setMediaLoading(true);
		setMediaError("");

		try {
			const currentIconId = mode === "edit" && row?.id ? String(row.id) : "";
			const query = currentIconId
				? `?currentIconId=${encodeURIComponent(currentIconId)}`
				: "";
			const response = await fetch(`/api/admin/web/icons/meta${query}`, {
				cache: "no-store",
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to load icon metadata."),
				);
			}

			const payload = (await response.json()) as IconsMetaResponse;
			setMediaOptions(toMediaOptionList(payload.svgMedia));
		} catch (error: unknown) {
			setMediaError(
				error instanceof Error ? error.message : "Failed to load SVG media.",
			);
		} finally {
			setMediaLoading(false);
		}
	}, [mediaLoading, mode, row?.id]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setTopError("");
		setMediaError("");
		setMediaOptions([]);
		setSource(row?.source === "media" ? "media" : "lucide");
	}, [open, row?.id, row?.source]);

	useEffect(() => {
		if (open && mediaOptions.length === 0) {
			void loadMeta();
		}
	}, [loadMeta, mediaOptions.length, open]);

	const mediaPickerOptions = useMemo<Option[]>(() => {
		if (mediaOptions.length === 0) {
			return [
				{
					value: "",
					label: mediaLoading ? "Loading..." : mediaError || "No SVG media found",
				},
			];
		}

		return sortAdminPickerOptions(
			mediaOptions.map((option) => ({
				value: option.id,
				label: getMediaOptionLabel(option),
			})),
		);
	}, [mediaError, mediaLoading, mediaOptions]);

	const fields: FieldDef[] = useMemo(() => {
		const keyPattern = /^[a-z0-9._-]{1,64}$/;

		const keyField: FieldDef = {
			type: "text",
			name: "key",
			label: "Key",
			placeholder: "e.g. help-circle, custom-corn",
			readOnly: mode === "edit",
			validate: (value) => {
				if (mode === "edit") {
					return undefined;
				}

				const normalized = String(value ?? "").trim();
				if (!normalized) {
					return "Key is required.";
				}

				if (!keyPattern.test(normalized)) {
					return "Use a-z, 0-9, dot, dash, underscore (max 64).";
				}

				return undefined;
			},
		};

		const labelField: FieldDef = {
			type: "text",
			name: "label",
			label: "Label",
			placeholder: "Human readable name",
			validate: (value) =>
				String(value ?? "").trim() ? undefined : "Label is required.",
		};

		const sourceField: FieldDef = {
			type: "custom",
			name: "source",
			label: "Source",
			render: ({ value, setValue, values }) => {
				const current =
					(typeof values.source === "string" ? values.source : value) === "media"
						? "media"
						: "lucide";

				function pick(nextSource: IconSourceCode): void {
					setSource(nextSource);
					setValue(nextSource);
					if (nextSource === "media" && mediaOptions.length === 0) {
						void loadMeta();
					}
				}

				return (
					<div className="admin-segmented-control">
						<button
							type="button"
							aria-pressed={current === "lucide"}
							className={`admin-segmented-control__button ${
								current === "lucide"
									? "admin-segmented-control__button--active"
									: ""
							}`}
							onClick={() => pick("lucide")}
						>
							Lucide
						</button>
						<button
							type="button"
							aria-pressed={current === "media"}
							className={`admin-segmented-control__button ${
								current === "media"
									? "admin-segmented-control__button--active"
									: ""
							}`}
							onClick={() => pick("media")}
						>
							Media (SVG)
						</button>
					</div>
				);
			},
		};

		const lucideField: FieldDef = {
			type: "text",
			name: "lucideName",
			label: "Lucide icon name",
			placeholder: "e.g. help-circle",
			visible: (values) =>
				(typeof values.source === "string" ? values.source : source) !== "media",
			validate: (value, values) => {
				const currentSource =
					(typeof values.source === "string" ? values.source : source) === "media"
						? "media"
						: "lucide";
				if (currentSource !== "lucide") {
					return undefined;
				}

				return String(value ?? "").trim()
					? undefined
					: "Lucide icon name is required.";
			},
		};

		const mediaField: FieldDef = {
			type: "select-single",
			name: "mediaId",
			label: "SVG media",
			options: mediaPickerOptions,
			isDisabled: () => mediaLoading,
			visible: (values) =>
				(typeof values.source === "string" ? values.source : source) === "media",
			validate: (value, values) => {
				const currentSource =
					(typeof values.source === "string" ? values.source : source) === "media"
						? "media"
						: "lucide";
				if (currentSource !== "media") {
					return undefined;
				}

				return typeof value === "string" && value.trim().length > 0
					? undefined
					: "SVG media is required.";
			},
		};

		const enabledField: FieldDef = {
			type: "checkbox",
			name: "enabled",
			label: "Enabled",
		};

		const previewField: FieldDef = {
			type: "custom",
			name: "iconPreview",
			render: ({ values }) => {
				const currentSource =
					(typeof values.source === "string" ? values.source : source) === "media"
						? "media"
						: "lucide";
				const selectedMediaId = String(values.mediaId ?? "").trim();
				const selectedOption =
					mediaOptions.find((option) => option.id === selectedMediaId) ?? null;
				const displayName =
					String(values.lucideName ?? "").trim() || String(values.key ?? "").trim();

				const iconKey =
					currentSource === "media"
						? selectedOption
							? {
									id: selectedOption.id,
									source: "media" as const,
									key: String(values.key ?? "").trim() || selectedOption.filename,
									label: selectedOption.alt ?? selectedOption.filename,
									iconMedia: {
										id: selectedOption.id,
										url: selectedOption.url ?? null,
										filename: selectedOption.filename,
										mimeType: selectedOption.mimeType ?? null,
										storageRelPath: selectedOption.storageRelPath ?? null,
									},
								}
							: null
						: {
								id: "preview-lucide",
								source: "lucide" as const,
								key: String(values.key ?? "").trim() || displayName,
								label:
									String(values.label ?? "").trim() ||
									String(values.key ?? "").trim() ||
									displayName,
								lucideName: displayName || null,
							};

				return (
					<div className="media-icon-preview-row">
						<div className="media-icon-preview-frame">
							{iconKey ? (
								<IconRender iconKey={iconKey} size={180} mediaRouteScope="admin" />
							) : (
								<span className="media-icon-preview-empty">Select an SVG from Media</span>
							)}
						</div>
					</div>
				);
			},
		};

		return [
			keyField,
			labelField,
			sourceField,
			lucideField,
			mediaField,
			enabledField,
			previewField,
		];
	}, [loadMeta, mediaLoading, mediaOptions, mediaPickerOptions, mode, source]);

	const rows: RowDef[] = useMemo(() => {
		const middleField = source === "media" ? "mediaId" : "lucideName";
		return [
			[{ field: "key" }],
			[{ field: "label" }],
			[
				{ field: "source", span: 3 },
				{ field: middleField, span: 6 },
				{ field: "enabled", span: 3 },
			],
			[{ field: "iconPreview" }],
		];
	}, [source]);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			setTopError("");
			setSubmitting(true);

			try {
				if (mode === "edit" && !row) {
					throw new Error("Icon was not found.");
				}

				const currentSource: IconSourceCode =
					(typeof values.source === "string" ? values.source : source) === "media"
						? "media"
						: "lucide";
				const key = String(values.key ?? "").trim();
				const label = String(values.label ?? "").trim();
				const enabled = Boolean(values.enabled);
				const lucideName = String(values.lucideName ?? "").trim();
				const mediaId = String(values.mediaId ?? "").trim();

				if (!label) {
					throw new Error("Label is required.");
				}

				if (currentSource === "lucide" && !lucideName && !key) {
					throw new Error("Lucide icon name is required.");
				}

				if (currentSource === "media" && !mediaId) {
					throw new Error("SVG media is required.");
				}

				const data: Record<string, unknown> = {
					label,
					enabled,
					source: currentSource,
					lucideName: currentSource === "lucide" ? lucideName || key : null,
					mediaId: currentSource === "media" ? Number(mediaId) : null,
				};

				const body =
					mode === "create"
						? {
								op: "create",
								data: {
									key,
									...data,
								},
							}
						: {
								op: "update",
								id: row?.id,
								data,
							};

				const response = await fetch("/api/admin/web/icons", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save icon."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save icon.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[mode, row, source],
	);

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				onClose();
			}}
			title={mode === "create" ? "Create Icon" : "Edit Icon"}
			width="50%"
			showSave
			mode={mode}
			defaultValues={defaults}
			fields={fields}
			rows={rows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				void onSaved();
				onClose();
			}}
			submitting={submitting}
			error={topError}
			dirtyGuard={false}
		/>
	);
}
