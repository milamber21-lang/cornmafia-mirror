//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldOptionsPanel.tsx                                         ////
//// Language: TSX                                                                                                 ////
//// Panel form for template field options                                                                         ////
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
import type { TemplateFieldOptionAdminItem } from "@/lib/data/templates";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

export interface TemplateFieldOptionsPanelProps {
	open: boolean;
	mode: Mode;
	row: TemplateFieldOptionAdminItem | null;
	initialFieldListId?: string;
	fieldListLabel?: string | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function TemplateFieldOptionsPanel({
	open,
	mode,
	row,
	initialFieldListId,
	fieldListLabel,
	onClose,
	onSaved,
}: TemplateFieldOptionsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaultValues = useMemo<Values>(
		() => ({
			optionKey: row?.optionKey ?? "",
			label: row?.label ?? "",
			displayOrder: row?.displayOrder != null ? String(row.displayOrder) : "0",
			enabled: row?.enabled ?? true,
		}),
		[row],
	);

	const fields = useMemo<FieldDef[]>(() => {
		const codePattern = /^[a-z0-9._-]{1,64}$/;

		return [
			{
				type: "text",
				name: "optionKey",
				label: "Option Key",
				placeholder: "e.g. draft, published, active",
				validate: (value) => {
					const normalized = String(value ?? "")
						.trim()
						.toLowerCase();
					if (!normalized) {
						return "Option key is required.";
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
				placeholder: fieldListLabel
					? `${fieldListLabel} option label`
					: "Human readable option label",
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Label is required.",
			},
			{
				type: "text",
				name: "displayOrder",
				label: "Display Order",
				placeholder: "0",
				validate: (value) =>
					/^\d+$/.test(String(value ?? "").trim())
						? undefined
						: "Use a non-negative integer.",
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
		];
	}, [fieldListLabel]);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "optionKey", span: 6 },
				{ field: "label", span: 6 },
			],
			[
				{ field: "displayOrder", span: 6 },
				{ field: "enabled", span: 6 },
			],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const resolvedFieldListId = row?.fieldListId ?? initialFieldListId ?? "";
				if (!resolvedFieldListId) {
					throw new Error("Open field options from a Field List row.");
				}

				const response = await fetch("/api/admin/web/templates/field-options", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: mode === "create" ? "create" : "update",
						id: row?.id,
						data: {
							fieldListId: resolvedFieldListId,
							optionKey: String(values.optionKey ?? "")
								.trim()
								.toLowerCase(),
							label: String(values.label ?? "").trim(),
							displayOrder: String(values.displayOrder ?? "").trim(),
							enabled: values.enabled === true,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save field option."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save field option.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[initialFieldListId, mode, row?.fieldListId, row?.id],
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
			title={mode === "create" ? "Create Field Option" : "Edit Field Option"}
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
