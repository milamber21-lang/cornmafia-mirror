//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldTypesPanel.tsx                                           ////
//// Language: TSX                                                                                                 ////
//// Panel form for template field types                                                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { TemplateFieldTypeAdminItem } from "@/lib/data/templates";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

const VALUE_COLUMN_OPTIONS = [
	{ value: "value_text", label: "value_text" },
	{ value: "value_long_text", label: "value_long_text" },
	{ value: "value_integer", label: "value_integer" },
	{ value: "value_numeric", label: "value_numeric" },
	{ value: "value_boolean", label: "value_boolean" },
	{ value: "value_date", label: "value_date" },
	{ value: "value_timestamp", label: "value_timestamp" },
	{ value: "value_discord_id", label: "value_discord_id" },
	{ value: "value_media_id", label: "value_media_id" },
	{ value: "value_content_id", label: "value_content_id" },
	{ value: "value_option_key", label: "value_option_key" },
	{ value: "value_rich_text_json", label: "value_rich_text_json" },
];

export interface TemplateFieldTypesPanelProps {
	open: boolean;
	mode: Mode;
	row: TemplateFieldTypeAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function TemplateFieldTypesPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: TemplateFieldTypesPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaultValues = useMemo<Values>(
		() => ({
			fieldTypeCode: row?.fieldTypeCode ?? "",
			label: row?.label ?? "",
			valueColumnName: row?.valueColumnName ?? "",
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
				name: "fieldTypeCode",
				label: "Field Type Code",
				placeholder: "e.g. text, rich-text, select",
				readOnly: mode === "edit",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Field type code is required.";
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
				type: "select-single",
				name: "valueColumnName",
				label: "Value Column Name",
				options: VALUE_COLUMN_OPTIONS,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Value column name is required.",
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
	}, [mode]);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "fieldTypeCode", span: 6 },
				{ field: "label", span: 6 },
			],
			[
				{ field: "valueColumnName", span: 6 },
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

				const response = await fetch("/api/admin/web/templates/field-types", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: mode === "create" ? "create" : "update",
						id: row?.id,
						data: {
							fieldTypeCode: String(values.fieldTypeCode ?? "")
								.trim()
								.toLowerCase(),
							label: String(values.label ?? "").trim(),
							valueColumnName: String(values.valueColumnName ?? "")
								.trim()
								.toLowerCase(),
							description: String(values.description ?? "").trim(),
							enabled: values.enabled === true,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save field type."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save field type.";
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
			title={mode === "create" ? "Create Field Type" : "Edit Field Type"}
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

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
