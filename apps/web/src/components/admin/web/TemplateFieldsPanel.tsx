//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplateFieldsPanel.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Panel form for per-template field placements and renderer label behavior.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import { compareAdminText } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

type TemplateFieldLayoutWidthCode = "full" | "half" | "third";

type TemplateFieldLayoutAlignCode = "left" | "center" | "right" | "stretch";

type TemplateFieldLabelStyleCode = "title" | "label" | "text" | "muted";

type TemplateFieldLabelPositionCode = "above" | "inline";

type TemplateFieldLabelSeparatorCode = "none" | "colon" | "dash";

type TemplateFieldOption<TCode extends string> = {
	code: TCode;
	label: string;
};

const TEMPLATE_FIELD_LAYOUT_WIDTH_OPTIONS: Array<
	TemplateFieldOption<TemplateFieldLayoutWidthCode>
> = [
	{ code: "full", label: "Full row" },
	{ code: "half", label: "Half row" },
	{ code: "third", label: "Third row" },
];

const TEMPLATE_FIELD_LAYOUT_ALIGN_OPTIONS: Array<
	TemplateFieldOption<TemplateFieldLayoutAlignCode>
> = [
	{ code: "stretch", label: "Stretch" },
	{ code: "left", label: "Left" },
	{ code: "center", label: "Center" },
	{ code: "right", label: "Right" },
];

const TEMPLATE_FIELD_LABEL_STYLE_OPTIONS: Array<
	TemplateFieldOption<TemplateFieldLabelStyleCode>
> = [
	{ code: "title", label: "Title - H2" },
	{ code: "label", label: "Label - value text, bold" },
	{ code: "text", label: "Text - value text" },
	{ code: "muted", label: "Muted - value text, muted" },
];

const TEMPLATE_FIELD_LABEL_POSITION_OPTIONS: Array<
	TemplateFieldOption<TemplateFieldLabelPositionCode>
> = [
	{ code: "above", label: "Top" },
	{ code: "inline", label: "Same row" },
];

const TEMPLATE_FIELD_LABEL_SEPARATOR_OPTIONS: Array<
	TemplateFieldOption<TemplateFieldLabelSeparatorCode>
> = [
	{ code: "none", label: "None" },
	{ code: "colon", label: "Colon" },
	{ code: "dash", label: "Dash" },
];

type TemplateFieldAdminItem = {
	id: string;
	fieldListId: string;
	fieldListCode: string;
	fieldListLabel: string;
	fieldTypeLabel: string;
	labelOverride: string | null;
	helpTextOverride: string | null;
	displayOrder: number;
	required: boolean;
	enabled: boolean;
	layoutWidthCode: TemplateFieldLayoutWidthCode;
	layoutAlignCode: TemplateFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: TemplateFieldLabelStyleCode;
	labelPositionCode: TemplateFieldLabelPositionCode;
	labelSeparatorCode: TemplateFieldLabelSeparatorCode;
};

type TemplateFieldListAdminItem = {
	id: string;
	fieldListCode: string;
	label: string;
	fieldTypeLabel: string;
};

type TemplateFieldsMetaResponse = {
	fieldLists?: TemplateFieldListAdminItem[];
};

export interface TemplateFieldsPanelProps {
	open: boolean;
	mode: Mode;
	templateId: string;
	templateCode: string;
	row: TemplateFieldAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function isLabelVisible(values: Values): boolean {
	return values.showLabel === true;
}

function getLabelPositionCode(values: Values): TemplateFieldLabelPositionCode {
	return values.labelPositionCode === "inline" ? "inline" : "above";
}

function getLabelStyleCode(values: Values): TemplateFieldLabelStyleCode {
	const value = values.labelStyleCode;
	if (
		value === "title" ||
		value === "text" ||
		value === "muted" ||
		value === "label"
	) {
		return value;
	}

	return "label";
}

function getLabelSeparatorCode(
	values: Values,
): TemplateFieldLabelSeparatorCode {
	const value = values.labelSeparatorCode;
	if (value === "none" || value === "colon" || value === "dash") {
		return value;
	}

	return "colon";
}

function normalizeSubmitLabelStyle(args: {
	labelPositionCode: TemplateFieldLabelPositionCode;
	labelStyleCode: string;
}): TemplateFieldLabelStyleCode {
	if (args.labelStyleCode === "title") {
		return args.labelPositionCode === "above" ? "title" : "label";
	}

	if (
		args.labelStyleCode === "text" ||
		args.labelStyleCode === "muted" ||
		args.labelStyleCode === "label"
	) {
		return args.labelStyleCode;
	}

	return "label";
}

function normalizeSubmitLabelSeparator(args: {
	labelPositionCode: TemplateFieldLabelPositionCode;
	labelSeparatorCode: string;
}): TemplateFieldLabelSeparatorCode {
	if (
		args.labelSeparatorCode === "none" ||
		args.labelSeparatorCode === "colon"
	) {
		return args.labelSeparatorCode;
	}

	if (
		args.labelSeparatorCode === "dash" &&
		args.labelPositionCode === "inline"
	) {
		return "dash";
	}

	return "colon";
}

export default function TemplateFieldsPanel({
	open,
	mode,
	templateId,
	templateCode,
	row,
	onClose,
	onSaved,
}: TemplateFieldsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const [metaError, setMetaError] = useState("");
	const [fieldLists, setFieldLists] = useState<TemplateFieldListAdminItem[]>([]);
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
				const searchParams = new URLSearchParams();
				if (mode === "edit" && row?.fieldListId) {
					searchParams.set("currentFieldListId", row.fieldListId);
				}

				const queryString = searchParams.toString();
				const response = await fetch(
					`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields/meta${queryString ? `?${queryString}` : ""}`,
					{ cache: "no-store" },
				);
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to load template field metadata.",
						),
					);
				}

				const payload = (await response.json()) as TemplateFieldsMetaResponse;
				if (!cancelled) {
					setFieldLists(Array.isArray(payload.fieldLists) ? payload.fieldLists : []);
				}
			} catch (error: unknown) {
				if (!cancelled) {
					setMetaError(
						error instanceof Error
							? error.message
							: "Failed to load template field metadata.",
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
	}, [mode, open, row?.fieldListId, templateId]);

	const defaultValues = useMemo<Values>(() => {
		const labelPositionCode =
			row?.labelPositionCode === "inline" ? "inline" : "above";
		const labelStyleCode =
			labelPositionCode === "inline" && row?.labelStyleCode === "title"
				? "label"
				: (row?.labelStyleCode ?? "label");
		const labelSeparatorCode =
			labelPositionCode === "above" && row?.labelSeparatorCode === "dash"
				? "colon"
				: (row?.labelSeparatorCode ?? "colon");

		return {
			fieldListId: row?.fieldListId ?? "",
			labelOverride: row?.labelOverride ?? "",
			helpTextOverride: row?.helpTextOverride ?? "",
			displayOrder: row?.displayOrder != null ? String(row.displayOrder) : "0",
			required: row?.required ?? false,
			enabled: row?.enabled ?? true,
			layoutWidthCode: row?.layoutWidthCode ?? "full",
			layoutAlignCode: row?.layoutAlignCode ?? "stretch",
			showLabel: row?.showLabel ?? true,
			labelStyleCode,
			labelPositionCode,
			labelSeparatorCode,
		};
	}, [row]);

	const fieldListOptions = useMemo(() => {
		if (mode === "edit" && row) {
			return [
				{
					value: row.fieldListId,
					label: `${row.fieldListLabel} (${row.fieldListCode}) - ${row.fieldTypeLabel}`,
				},
			];
		}

		return fieldLists
			.map((fieldList) => ({
				value: fieldList.id,
				label: `${fieldList.label} (${fieldList.fieldListCode}) - ${fieldList.fieldTypeLabel}`,
			}))
			.sort((left, right) => compareAdminText(left.label, right.label));
	}, [fieldLists, mode, row]);

	const layoutWidthOptions = useMemo(
		() =>
			TEMPLATE_FIELD_LAYOUT_WIDTH_OPTIONS.map((option) => ({
				value: option.code,
				label: option.label,
			})),
		[],
	);

	const layoutAlignOptions = useMemo(
		() =>
			TEMPLATE_FIELD_LAYOUT_ALIGN_OPTIONS.map((option) => ({
				value: option.code,
				label: option.label,
			})),
		[],
	);

	const labelStyleOptions = useCallback((values: Values) => {
		const labelPositionCode = getLabelPositionCode(values);
		return TEMPLATE_FIELD_LABEL_STYLE_OPTIONS.filter(
			(option) => labelPositionCode === "above" || option.code !== "title",
		).map((option) => ({
			value: option.code,
			label: option.label,
		}));
	}, []);

	const labelPositionOptions = useMemo(
		() =>
			TEMPLATE_FIELD_LABEL_POSITION_OPTIONS.map((option) => ({
				value: option.code,
				label: option.label,
			})),
		[],
	);

	const labelSeparatorOptions = useCallback((values: Values) => {
		const labelPositionCode = getLabelPositionCode(values);
		return TEMPLATE_FIELD_LABEL_SEPARATOR_OPTIONS.filter(
			(option) => labelPositionCode === "inline" || option.code !== "dash",
		).map((option) => ({
			value: option.code,
			label: option.label,
		}));
	}, []);

	const fields = useMemo<FieldDef[]>(
		() => [
			{
				type: "select-single",
				name: "fieldListId",
				label: "Field List",
				options: fieldListOptions,
				readOnly: mode === "edit",
				helpText:
					mode === "edit"
						? "Field list is fixed for existing template-field rows."
						: "Already-selected field lists are hidden from this picker.",
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Field list is required.",
			},
			{
				type: "select-single",
				name: "layoutWidthCode",
				label: "Layout Width",
				options: layoutWidthOptions,
				helpText:
					"Controls how much horizontal room this field gets inside its destination.",
			},
			{
				type: "select-single",
				name: "layoutAlignCode",
				label: "Alignment",
				options: layoutAlignOptions,
				helpText: "Controls how this field aligns inside its layout width.",
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
				name: "required",
				label: "Required",
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
			{
				type: "checkbox",
				name: "showLabel",
				label: "Show label",
			},
			{
				type: "select-single",
				name: "labelPositionCode",
				label: "Label Position",
				options: labelPositionOptions,
				visible: isLabelVisible,
				onChange: ({ value, values, setValue }) => {
					if (value === "inline" && getLabelStyleCode(values) === "title") {
						setValue("labelStyleCode", "label");
					}

					if (value === "above" && getLabelSeparatorCode(values) === "dash") {
						setValue("labelSeparatorCode", "colon");
					}
				},
			},
			{
				type: "select-single",
				name: "labelSeparatorCode",
				label: "Inline Separator",
				options: labelSeparatorOptions,
				visible: isLabelVisible,
				helpText:
					"Top labels allow none or colon. Same-row labels also allow dash.",
			},
			{
				type: "select-single",
				name: "labelStyleCode",
				label: "Label Style",
				options: labelStyleOptions,
				visible: isLabelVisible,
				helpText: "Title is available only when the label position is Top.",
			},
			{
				type: "text",
				name: "labelOverride",
				label: "Label Override",
				placeholder: "Leave blank to use the field-list label",
				visible: isLabelVisible,
			},
			{
				type: "textarea",
				name: "helpTextOverride",
				label: "Help Text Override",
				rows: 3,
			},
		],
		[
			fieldListOptions,
			labelPositionOptions,
			labelSeparatorOptions,
			labelStyleOptions,
			layoutAlignOptions,
			layoutWidthOptions,
			mode,
		],
	);

	const rows = useMemo<RowDef[]>(
		() => [
			[{ field: "fieldListId", span: 12 }],
			[
				{ field: "layoutWidthCode", span: 6 },
				{ field: "layoutAlignCode", span: 6 },
			],
			[
				{ field: "displayOrder", span: 6 },
				{ field: "required", span: 6 },
			],
			[
				{ field: "enabled", span: 6 },
				{ field: "showLabel", span: 6 },
			],
			[
				{ field: "labelPositionCode", span: 6 },
				{ field: "labelSeparatorCode", span: 6 },
			],
			[
				{ field: "labelStyleCode", span: 6 },
				{ field: "labelOverride", span: 6 },
			],
			[{ field: "helpTextOverride", span: 12 }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const resolvedFieldListId =
					mode === "edit" && row?.fieldListId
						? row.fieldListId
						: String(values.fieldListId ?? "").trim();
				const labelPositionCode = getLabelPositionCode(values);
				const labelStyleCode = normalizeSubmitLabelStyle({
					labelPositionCode,
					labelStyleCode: String(values.labelStyleCode ?? "label").trim(),
				});
				const labelSeparatorCode = normalizeSubmitLabelSeparator({
					labelPositionCode,
					labelSeparatorCode: String(values.labelSeparatorCode ?? "colon").trim(),
				});

				const response = await fetch(
					`/api/admin/web/templates/${encodeURIComponent(templateId)}/fields`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							op: mode === "create" ? "create" : "update",
							id: row?.id,
							data: {
								fieldListId: resolvedFieldListId,
								labelOverride: String(values.labelOverride ?? "").trim(),
								helpTextOverride: String(values.helpTextOverride ?? "").trim(),
								displayOrder: String(values.displayOrder ?? "").trim(),
								required: values.required === true,
								enabled: values.enabled === true,
								layoutWidthCode: String(values.layoutWidthCode ?? "full").trim(),
								layoutAlignCode: String(values.layoutAlignCode ?? "stretch").trim(),
								showLabel: values.showLabel === true,
								labelStyleCode,
								labelPositionCode,
								labelSeparatorCode,
							},
						}),
					},
				);

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							`Failed to save template field for ${templateCode}.`,
						),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save template field.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[mode, row?.fieldListId, row?.id, templateCode, templateId],
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
			title={
				mode === "create"
					? `Add Field to ${templateCode}`
					: `Edit Field in ${templateCode}`
			}
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

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
