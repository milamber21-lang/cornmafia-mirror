//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldToolsPanel.tsx                                           ////
//// Language: TSX                                                                                                 ////
//// Panel form for template field editor tool catalog rows                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type {
	TemplateFieldToolAdminItem,
	TemplateFieldTypeAdminItem,
} from "@/lib/data/templates";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

export interface TemplateFieldToolsPanelProps {
	open: boolean;
	mode: Mode;
	row: TemplateFieldToolAdminItem | null;
	fieldTypes: TemplateFieldTypeAdminItem[];
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function TemplateFieldToolsPanel({
	open,
	mode,
	row,
	fieldTypes,
	onClose,
	onSaved,
}: TemplateFieldToolsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const fieldTypeOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				fieldTypes.map((fieldType) => ({
					value: fieldType.fieldTypeCode,
					label: `${fieldType.label} (${fieldType.fieldTypeCode})`,
				})),
			),
		[fieldTypes],
	);

	const defaultValues = useMemo<Values>(
		() => ({
			fieldToolCode: row?.fieldToolCode ?? "",
			fieldTypeCode: row?.fieldTypeCode ?? "",
			label: row?.label ?? "",
			toolGroupCode: row?.toolGroupCode ?? "",
			displayOrder: row ? String(row.displayOrder) : "100",
			description: row?.description ?? "",
			enabled: row?.enabled ?? true,
		}),
		[row],
	);

	const fields = useMemo<FieldDef[]>(() => {
		const codePattern = /^[a-z0-9._-]{1,64}$/;

		return [
			{
				type: "text",
				name: "fieldToolCode",
				label: "Tool Code",
				placeholder: "e.g. bold, image, link_toggle",
				readOnly: mode === "edit",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Tool code is required.";
					}

					if (!codePattern.test(normalized)) {
						return "Use a-z, 0-9, dot, dash, underscore (max 64).";
					}

					return undefined;
				},
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
				type: "text",
				name: "label",
				label: "Label",
				placeholder: "Human readable toolbar label",
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Label is required.",
			},
			{
				type: "text",
				name: "toolGroupCode",
				label: "Group Code",
				placeholder: "e.g. format, block, list, insert",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Group code is required.";
					}

					if (!codePattern.test(normalized)) {
						return "Use a-z, 0-9, dot, dash, underscore (max 64).";
					}

					return undefined;
				},
			},
			{
				type: "text",
				name: "displayOrder",
				label: "Display Order",
				placeholder: "100",
				validate: (value) => {
					const normalized = String(value ?? "").trim();
					if (!/^\d+$/.test(normalized)) {
						return "Display order must be a positive number.";
					}

					const parsed = Number(normalized);
					return Number.isInteger(parsed) && parsed > 0
						? undefined
						: "Display order must be a positive number.";
				},
			},
			{
				type: "textarea",
				name: "description",
				label: "Description",
				rows: 3,
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
		];
	}, [fieldTypeOptions, mode]);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "fieldToolCode", span: 6 },
				{ field: "fieldTypeCode", span: 6 },
			],
			[
				{ field: "label", span: 6 },
				{ field: "toolGroupCode", span: 6 },
			],
			[
				{ field: "displayOrder", span: 6 },
				{ field: "enabled", span: 6 },
			],
			[{ field: "description", span: 12 }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const response = await fetch("/api/admin/web/templates/field-tools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: mode === "create" ? "create" : "update",
						id: row?.id,
						data: {
							fieldToolCode: String(values.fieldToolCode ?? "")
								.trim()
								.toLowerCase(),
							fieldTypeCode: String(values.fieldTypeCode ?? "")
								.trim()
								.toLowerCase(),
							label: String(values.label ?? "").trim(),
							toolGroupCode: String(values.toolGroupCode ?? "")
								.trim()
								.toLowerCase(),
							displayOrder: String(values.displayOrder ?? "").trim(),
							description: String(values.description ?? "").trim(),
							enabled: values.enabled === true,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save field tool."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save field tool.";
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
				onClose();
			}}
			title={mode === "create" ? "Create Field Tool" : "Edit Field Tool"}
			width="50%"
			showSave={true}
			mode={mode}
			defaultValues={defaultValues}
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
		/>
	);
}
