//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplatesPanel.tsx                                                    ////
//// Language: TSX                                                                                                ////
//// Panel form for DB-first template rows with content metadata controls                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import IconRender from "@/components/ui/IconRender";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { ContentKindOption } from "@/lib/data/content-kinds";
import type { IconLookupItem } from "@/lib/data/icons";
import type { TemplateAdminItem } from "@/lib/data/templates";
import type { ThemeColorOption } from "@/lib/data/theme-colors";
import { compareAdminText } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

type SurfaceScopeOption = {
	code: "admin" | "public";
	label: string;
};

type TemplatesMetaResponse = {
	icons?: IconLookupItem[];
	colors?: ThemeColorOption[];
	contentKinds?: ContentKindOption[];
	surfaceScopes?: SurfaceScopeOption[];
	message?: unknown;
};

export interface TemplatesPanelProps {
	open: boolean;
	mode: Mode;
	row: TemplateAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function TemplatesPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: TemplatesPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const [metaError, setMetaError] = useState("");
	const [icons, setIcons] = useState<IconLookupItem[]>([]);
	const [colors, setColors] = useState<ThemeColorOption[]>([]);
	const [contentKinds, setContentKinds] = useState<ContentKindOption[]>([]);
	const [surfaceScopes, setSurfaceScopes] = useState<SurfaceScopeOption[]>([]);
	const [metaLoading, setMetaLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;

		async function loadMeta(): Promise<void> {
			try {
				setMetaLoading(true);
				setMetaError("");
				const response = await fetch("/api/admin/web/templates/meta", {
					cache: "no-store",
				});
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load template metadata."),
					);
				}

				const payload = (await response.json()) as TemplatesMetaResponse;
				if (cancelled) {
					return;
				}

				setIcons(Array.isArray(payload.icons) ? payload.icons : []);
				setColors(Array.isArray(payload.colors) ? payload.colors : []);
				setContentKinds(
					Array.isArray(payload.contentKinds) ? payload.contentKinds : [],
				);
				setSurfaceScopes(
					Array.isArray(payload.surfaceScopes) ? payload.surfaceScopes : [],
				);
			} catch (error: unknown) {
				if (!cancelled) {
					setMetaError(
						error instanceof Error
							? error.message
							: "Failed to load template metadata.",
					);
				}
			} finally {
				if (!cancelled) {
					setMetaLoading(false);
				}
			}
		}

		void loadMeta();

		return () => {
			cancelled = true;
		};
	}, [open]);

	const defaultValues = useMemo<Values>(
		() => ({
			templateCode: row?.templateCode ?? "",
			label: row?.label ?? "",
			description: row?.description ?? "",
			contentKindCode: row?.contentKindCode ?? "",
			surfaceScopeCode: row?.surfaceScopeCode ?? "admin",
			requiresSeries: row?.requiresSeries ?? false,
			defaultIconKeyId: row?.defaultIconKey?.id ?? "",
			defaultIconColorId: row?.defaultIconColor?.id ?? "",
			enabled: row?.enabled ?? true,
		}),
		[row],
	);

	const iconOptions = useMemo(
		() =>
			icons
				.map((icon) => ({
					value: icon.id,
					label: `${icon.label ?? icon.key ?? icon.id}${icon.key ? ` (${icon.key})` : ""}`,
				}))
				.sort((left, right) => compareAdminText(left.label, right.label)),
		[icons],
	);

	const colorOptions = useMemo(
		() =>
			colors
				.map((color) => ({
					value: color.id,
					label: `${color.label ?? color.key ?? color.id}${color.key ? ` (${color.key})` : ""}`,
				}))
				.sort((left, right) => compareAdminText(left.label, right.label)),
		[colors],
	);

	const contentKindOptions = useMemo(() => {
		const options = contentKinds.map((contentKind) => ({
			value: contentKind.code,
			label: `${contentKind.label} (${contentKind.code})`,
		}));

		if (
			row?.contentKindCode &&
			!options.some((option) => option.value === row.contentKindCode)
		) {
			options.push({
				value: row.contentKindCode,
				label: `${row.contentKindLabel} (${row.contentKindCode})`,
			});
		}

		return options.sort((left, right) => compareAdminText(left.label, right.label));
	}, [contentKinds, row?.contentKindCode, row?.contentKindLabel]);

	const surfaceScopeOptions = useMemo(
		() =>
			surfaceScopes
				.map((surfaceScope) => ({
					value: surfaceScope.code,
					label: surfaceScope.label,
				}))
				.sort((left, right) => compareAdminText(left.label, right.label)),
		[surfaceScopes],
	);

	const fields = useMemo<FieldDef[]>(() => {
		const codePattern = /^[a-z0-9._-]{1,64}$/;

		return [
			{
				type: "text",
				name: "templateCode",
				label: "Template Code",
				placeholder: "e.g. page, guide, video",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Template code is required.";
					}

					if (!codePattern.test(normalized)) {
						return "Use a-z, 0-9, dot, dash, underscore (max 64).";
					}

					return undefined;
				},
			},
			{
				type: "text",
				name: "label",
				label: "Label",
				placeholder: "Human readable name",
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Label is required.",
			},
			{
				type: "textarea",
				name: "description",
				label: "Description",
				rows: 3,
			},
			{
				type: "select-single",
				name: "contentKindCode",
				label: "Content Kind",
				options: contentKindOptions,
				helpText: "Broad content family for rows created from this template.",
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Content kind is required.",
			},
			{
				type: "select-single",
				name: "surfaceScopeCode",
				label: "Surface Scope",
				options: surfaceScopeOptions,
				helpText: "Authoring surface where this template may be used.",
				validate: (value) => {
					const surfaceScopeCode = String(value ?? "").trim();
					return surfaceScopeCode === "admin" || surfaceScopeCode === "public"
						? undefined
						: "Surface scope is required.";
				},
			},
			{
				type: "checkbox",
				name: "requiresSeries",
				label: "Requires Series",
			},
			{
				type: "select-single",
				name: "defaultIconKeyId",
				label: "Default Icon",
				options: iconOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Default icon is required.",
			},
			{
				type: "select-single",
				name: "defaultIconColorId",
				label: "Default Icon Color",
				options: colorOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Default icon color is required.",
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
			{
				type: "custom",
				name: "iconPreview",
				label: "Icon Preview",
				render: ({ values }) => {
					const selectedIconId = String(values.defaultIconKeyId ?? "").trim();
					const selectedColorId = String(values.defaultIconColorId ?? "").trim();
					const selectedIcon =
						icons.find((icon) => icon.id === selectedIconId) ??
						row?.defaultIconKey ??
						null;
					const selectedColor =
						colors.find((color) => color.id === selectedColorId) ??
						row?.defaultIconColor ??
						null;

					return (
						<div className="media-icon-preview-row">
							<div
								className="media-icon-preview-frame"
							>
								{selectedIcon && selectedColor ? (
									<IconRender
										iconKey={selectedIcon}
										iconColor={selectedColor}
										size={180}
										mediaRouteScope="admin"
									/>
								) : (
									<span className="media-icon-preview-empty">Choose icon and color</span>
								)}
							</div>
						</div>
					);
				},
			},
		];
	}, [
		colorOptions,
		colors,
		contentKindOptions,
		iconOptions,
		icons,
		row?.defaultIconColor,
		row?.defaultIconKey,
		surfaceScopeOptions,
	]);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "templateCode", span: 6 },
				{ field: "label", span: 6 },
			],
			[{ field: "description", span: 12 }],
			[
				{ field: "contentKindCode", span: 6 },
				{ field: "surfaceScopeCode", span: 6 },
			],
			[
				{ field: "requiresSeries", span: 6 },
				{ field: "enabled", span: 6 },
			],
			[
				{ field: "defaultIconKeyId", span: 6 },
				{ field: "defaultIconColorId", span: 6 },
			],
			[{ field: "iconPreview", span: 12 }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const response = await fetch("/api/admin/web/templates", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: mode === "create" ? "create" : "update",
						id: row?.id,
						data: {
							templateCode: String(values.templateCode ?? "")
								.trim()
								.toLowerCase(),
							label: String(values.label ?? "").trim(),
							description: String(values.description ?? "").trim(),
							contentKindCode: String(values.contentKindCode ?? "")
								.trim()
								.toLowerCase(),
							surfaceScopeCode: String(values.surfaceScopeCode ?? "")
								.trim()
								.toLowerCase(),
							requiresSeries: values.requiresSeries === true,
							defaultIconKeyId: String(values.defaultIconKeyId ?? "").trim(),
							defaultIconColorId: String(values.defaultIconColorId ?? "").trim(),
							enabled: values.enabled === true,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save template."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save template.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[mode, row?.id],
	);

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				setMetaError("");
				onClose();
			}}
			title={mode === "create" ? "Create Template" : "Edit Template"}
			width="50%"
			showSave={!metaLoading && !metaError}
			mode={mode}
			defaultValues={defaultValues}
			fields={fields}
			rows={rows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				setMetaError("");
				void onSaved();
				onClose();
			}}
			submitting={submitting}
			error={topError}
			metaError={metaError}
		/>
	);
}
