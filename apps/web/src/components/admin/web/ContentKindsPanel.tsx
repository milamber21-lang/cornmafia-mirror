//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ContentKindsPanel.tsx                                                 ////
//// Language: TSX                                                                                                ////
//// Admin panel for content kind route and renderer controls                                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { ContentKindAdminItem } from "@/lib/data/content-kinds";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

const PUBLIC_ROUTE_PREFIX_OPTIONS = sortAdminPickerOptions([
	{ value: "", label: "Normal route (/category/subcategory/content)" },
	{ value: "app", label: "app (/app/category/subcategory/content)" },
	{ value: "custom", label: "custom (/custom/category/subcategory/content)" },
	{ value: "event", label: "event (/event/category/subcategory/content)" },
	{ value: "external", label: "external (navigation target only)" },
	{ value: "info", label: "info (/info/category/subcategory/content)" },
	{ value: "map", label: "map (/map/category/subcategory/content)" },
	{ value: "tool", label: "tool (/tool/category/subcategory/content)" },
	{ value: "video", label: "video (/video/category/subcategory/content)" },
]);

const RENDERER_OPTIONS = sortAdminPickerOptions([
	{ value: "app", label: "app" },
	{ value: "calendar", label: "calendar" },
	{ value: "custom", label: "custom" },
	{ value: "event", label: "event" },
	{ value: "external_link", label: "external_link" },
	{ value: "map", label: "map" },
	{ value: "page", label: "page" },
	{ value: "stream", label: "stream" },
	{ value: "tool", label: "tool" },
	{ value: "youtube", label: "youtube (video pages)" },
]);

export interface ContentKindsPanelProps {
	open: boolean;
	mode: Mode;
	row?: ContentKindAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function validateCode(value: unknown): string | undefined {
	const contentKindCode = String(value ?? "").trim();

	if (!contentKindCode) {
		return "Content kind code is required.";
	}

	if (!/^[a-z0-9._-]{1,64}$/.test(contentKindCode)) {
		return "Use a-z, 0-9, dot, dash, or underscore (max 64).";
	}

	return undefined;
}

function validateLabel(value: unknown): string | undefined {
	const label = String(value ?? "").trim();
	return label ? undefined : "Label is required.";
}

export default function ContentKindsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: ContentKindsPanelProps): JSX.Element {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				contentKindCode: row.contentKindCode,
				label: row.label,
				description: row.description ?? "",
				publicRoutePrefix: row.publicRoutePrefix ?? "",
				rendererCode: row.rendererCode,
				enabled: row.enabled,
			};
		}

		return {
			contentKindCode: "",
			label: "",
			description: "",
			publicRoutePrefix: "",
			rendererCode: "page",
			enabled: true,
		};
	}, [mode, row]);

	const fields: FieldDef[] = useMemo(
		() => [
			{
				type: "text",
				name: "contentKindCode",
				label: "Content Kind Code",
				placeholder: "e.g., page",
				readOnly: mode === "edit",
				validate: mode === "create" ? validateCode : undefined,
			},
			{
				type: "text",
				name: "label",
				label: "Label",
				placeholder: "Human readable name",
				validate: validateLabel,
			},
			{
				type: "select-single",
				name: "publicRoutePrefix",
				label: "Public Route Prefix",
				helpText:
					"Use video for official /video pages. External is reserved for navigation targets, not normal public content rendering.",
				allowClear: true,
				clearLabel: "Normal route",
				options: PUBLIC_ROUTE_PREFIX_OPTIONS,
			},
			{
				type: "select-single",
				name: "rendererCode",
				label: "Renderer",
				helpText:
					"Use youtube with the video prefix for embedded YouTube/video content pages.",
				options: RENDERER_OPTIONS,
			},
			{
				type: "textarea",
				name: "description",
				label: "Description",
				placeholder: "Optional admin-facing description",
				rows: 4,
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
		],
		[mode],
	);

	const rows: RowDef[] = useMemo(
		() => [
			[
				{ field: "contentKindCode", span: 6 },
				{ field: "label", span: 6 },
			],
			[
				{ field: "publicRoutePrefix", span: 6 },
				{ field: "rendererCode", span: 6 },
			],
			[{ field: "enabled" }],
			[{ field: "description" }],
		],
		[],
	);

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [open]);

	async function handleSubmit(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			if (mode === "edit" && !row) {
				throw new Error("Content kind was not found.");
			}

			const body =
				mode === "create"
					? {
							op: "create",
							data: {
								contentKindCode: String(values.contentKindCode ?? "").trim(),
								label: String(values.label ?? "").trim(),
								description: String(values.description ?? "").trim(),
								publicRoutePrefix: String(
									values.publicRoutePrefix ?? "",
								).trim(),
								rendererCode: String(values.rendererCode ?? "page").trim(),
								enabled: Boolean(values.enabled),
							},
						}
					: {
							op: "update",
							id: row?.id,
							data: {
								label: String(values.label ?? "").trim(),
								description: String(values.description ?? "").trim(),
								publicRoutePrefix: String(
									values.publicRoutePrefix ?? "",
								).trim(),
								rendererCode: String(values.rendererCode ?? "page").trim(),
								enabled: Boolean(values.enabled),
							},
						};

			const response = await fetch("/api/admin/web/content-kinds", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save content kind."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save content kind.";
			setTopError(message);
			throw new Error(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				onClose();
			}}
			title={mode === "create" ? "Create Content Kind" : "Edit Content Kind"}
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
