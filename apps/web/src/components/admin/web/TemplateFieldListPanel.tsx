//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldListPanel.tsx                                            ////
//// Language: TSX                                                                                                 ////
//// Panel form for reusable template field definitions                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type {
	TemplateFieldListAdminItem,
	TemplateFieldTypeAdminItem,
} from "@/lib/data/templates";
import { compareAdminText } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

type RenderDestinationOption = {
	code: string;
	label: string;
};

type FieldListMetaResponse = {
	fieldTypes?: TemplateFieldTypeAdminItem[];
	renderDestinations?: RenderDestinationOption[];
};

export interface TemplateFieldListPanelProps {
	open: boolean;
	mode: Mode;
	row: TemplateFieldListAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

const fallbackRenderDestinations: RenderDestinationOption[] = [
	{ code: "seo", label: "SEO" },
	{ code: "hero", label: "Hero" },
	{ code: "top", label: "Top" },
	{ code: "left", label: "Left" },
	{ code: "main", label: "Main" },
	{ code: "right", label: "Right" },
	{ code: "bottom", label: "Bottom" },
	{ code: "hidden", label: "Hidden" },
];

export default function TemplateFieldListPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: TemplateFieldListPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const [metaError, setMetaError] = useState("");
	const [fieldTypes, setFieldTypes] = useState<TemplateFieldTypeAdminItem[]>([]);
	const [renderDestinations, setRenderDestinations] = useState<RenderDestinationOption[]>(
		fallbackRenderDestinations,
	);
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
				const response = await fetch("/api/admin/web/templates/field-list/meta", {
					cache: "no-store",
				});
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to load field list metadata.",
						),
					);
				}

				const payload = (await response.json()) as FieldListMetaResponse;
				if (!cancelled) {
					setFieldTypes(Array.isArray(payload.fieldTypes) ? payload.fieldTypes : []);
					setRenderDestinations(
						Array.isArray(payload.renderDestinations) &&
							payload.renderDestinations.length > 0
							? payload.renderDestinations
							: fallbackRenderDestinations,
					);
				}
			} catch (error: unknown) {
				if (!cancelled) {
					setMetaError(
						error instanceof Error
							? error.message
							: "Failed to load field list metadata.",
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
			fieldListCode: row?.fieldListCode ?? "",
			label: row?.label ?? "",
			helpText: row?.helpText ?? "",
			fieldTypeCode: row?.fieldTypeCode ?? "",
			renderDestinationCode: row?.renderDestinationCode ?? "main",
			enabled: row?.enabled ?? true,
		}),
		[row],
	);

	const fieldTypeOptions = useMemo(
		() =>
			fieldTypes
				.map((fieldType) => ({
					value: fieldType.fieldTypeCode,
					label: `${fieldType.label} (${fieldType.fieldTypeCode}) - ${fieldType.valueColumnName}`,
				}))
				.sort((left, right) => compareAdminText(left.label, right.label)),
		[fieldTypes],
	);

	const renderDestinationOptions = useMemo(
		() =>
			renderDestinations.map((destination) => ({
				value: destination.code,
				label: destination.label,
			})),
		[renderDestinations],
	);

	const fields = useMemo<FieldDef[]>(() => {
		const codePattern = /^[a-z0-9._-]{1,64}$/;

		return [
			{
				type: "text",
				name: "fieldListCode",
				label: "Field List Code",
				placeholder: "e.g. summary, hero-image, status",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Field list code is required.";
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
				placeholder: "Human readable field label",
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Label is required.",
			},
			{
				type: "select-single",
				name: "fieldTypeCode",
				label: "Field Type",
				options: fieldTypeOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Field type is required.",
			},
			{
				type: "select-single",
				name: "renderDestinationCode",
				label: "Destination",
				options: renderDestinationOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Destination is required.",
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
			{
				type: "textarea",
				name: "helpText",
				label: "Help Text",
				rows: 3,
			},
		];
	}, [fieldTypeOptions, renderDestinationOptions]);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "fieldListCode", span: 6 },
				{ field: "label", span: 6 },
			],
			[
				{ field: "fieldTypeCode", span: 6 },
				{ field: "renderDestinationCode", span: 6 },
			],
			[{ field: "enabled", span: 12 }],
			[{ field: "helpText", span: 12 }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const response = await fetch("/api/admin/web/templates/field-list", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: mode === "create" ? "create" : "update",
						id: row?.id,
						data: {
							fieldListCode: String(values.fieldListCode ?? "")
								.trim()
								.toLowerCase(),
							label: String(values.label ?? "").trim(),
							helpText: String(values.helpText ?? "").trim(),
							fieldTypeCode: String(values.fieldTypeCode ?? "")
								.trim()
								.toLowerCase(),
							renderDestinationCode: String(values.renderDestinationCode ?? "main")
								.trim()
								.toLowerCase(),
							enabled: values.enabled === true,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save field list row."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save field list row.";
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
			title={mode === "create" ? "Create Field List Row" : "Edit Field List Row"}
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
