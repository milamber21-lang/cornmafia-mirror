//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldListToolsPanel.tsx                                      ////
//// Language: TSX                                                                                                 ////
//// Panel form for adding selected editor tools to a template field-list row                                      ////
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
import type {
	TemplateFieldListAdminItem,
	TemplateFieldToolAdminItem,
} from "@/lib/data/templates";
import { compareAdminText } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Values = Record<string, unknown>;

export interface TemplateFieldListToolsPanelProps {
	open: boolean;
	fieldList: TemplateFieldListAdminItem;
	availableTools: TemplateFieldToolAdminItem[];
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function TemplateFieldListToolsPanel({
	open,
	fieldList,
	availableTools,
	onClose,
	onSaved,
}: TemplateFieldListToolsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const toolOptions = useMemo(
		() =>
			availableTools
				.map((tool) => ({
					value: tool.fieldToolCode,
					label: `${tool.label} (${tool.fieldToolCode})`,
				}))
				.sort((left, right) => compareAdminText(left.label, right.label)),
		[availableTools],
	);

	const defaultValues = useMemo<Values>(
		() => ({
			fieldToolCode: "",
		}),
		[],
	);

	const fields = useMemo<FieldDef[]>(
		() => [
			{
				type: "select-single",
				name: "fieldToolCode",
				label: "Tool",
				options: toolOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Field tool is required.",
			},
		],
		[toolOptions],
	);

	const rows = useMemo<RowDef[]>(
		() => [[{ field: "fieldToolCode", span: 12 }]],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const response = await fetch("/api/admin/web/templates/field-list-tools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "create",
						data: {
							fieldListId: fieldList.id,
							fieldToolCode: String(values.fieldToolCode ?? "")
								.trim()
								.toLowerCase(),
						},
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to add field tool."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to add field tool.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[fieldList.id],
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
			title={`Add Tool to ${fieldList.label}`}
			width="50%"
			showSave={true}
			mode="create"
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
