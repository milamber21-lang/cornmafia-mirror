//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ThemeColorsPanel.tsx                                                  ////
//// Language: TSX                                                                                                 ////
//// Admin panel for creating and editing theme colors                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import { validateThemeColorPreviewValue } from "@/lib/helpers/icon-color";
import { readResponseMessage } from "@/lib/helpers/http-response";

type ThemeColor = {
	id: string | number;
	key: string;
	label: string;
	preview: string;
	enabled: boolean;
	createdAt?: string;
	updatedAt?: string;
};

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

export interface ThemeColorsPanelProps {
	open: boolean;
	mode: Mode;
	row?: ThemeColor | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function ThemeColorsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: ThemeColorsPanelProps): JSX.Element {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				key: row.key,
				label: row.label,
				preview: row.preview,
				enabled: row.enabled,
			};
		}

		return {
			key: "",
			label: "",
			preview: "",
			enabled: true,
		};
	}, [mode, row]);

	const fields: FieldDef[] = useMemo(() => {
		const keyPattern = /^[a-z0-9._-]{1,64}$/;

		return [
			{
				type: "text",
				name: "key",
				label: "Key",
				placeholder: "e.g., color.primary",
				readOnly: mode === "edit",
				validate: (value) => {
					if (mode === "edit") {
						return undefined;
					}

					const key = String(value ?? "").trim();
					if (!key) {
						return "Key is required.";
					}

					if (!keyPattern.test(key)) {
						return "Use a-z, 0-9, dot, dash, or underscore (max 64).";
					}

					return undefined;
				},
			},
			{
				type: "text",
				name: "label",
				label: "Label",
				placeholder: "Human readable name",
				validate: (value) => {
					const label = String(value ?? "").trim();
					return label ? undefined : "Label is required.";
				},
			},
			{
				type: "text",
				name: "preview",
				label: "Preview",
				placeholder:
					"#CC262D, currentColor, --color-accent, or var(--color-accent)",
				validate: validateThemeColorPreviewValue,
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
				readOnly: false,
			},
		];
	}, [mode]);

	const rows: RowDef[] = useMemo(
		() => [
			[{ field: "key" }],
			[
				{ field: "label", span: 6 },
				{ field: "preview", span: 6 },
			],
			[{ field: "enabled" }],
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
				throw new Error("Theme color was not found.");
			}

			const preview = String(values.preview ?? "").trim();
			const body =
				mode === "create"
					? {
							op: "create",
							data: {
								key: String(values.key ?? "").trim(),
								label: String(values.label ?? "").trim(),
								preview,
								enabled: Boolean(values.enabled),
							},
						}
					: {
							op: "update",
							id: row?.id,
							data: {
								label: String(values.label ?? "").trim(),
								preview,
								enabled: Boolean(values.enabled),
							},
						};

			const response = await fetch("/api/admin/web/theme-colors", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save theme color."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save theme color.";
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
			title={mode === "create" ? "Create Theme Color" : "Edit Theme Color"}
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

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
