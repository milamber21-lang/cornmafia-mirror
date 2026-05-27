//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminCrudPanel.tsx                                 ////
//// Language: TSX                                                                                               ////
//// Shared form panel for Riseopedia admin small-list configuration rows.                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	buildInitialValues,
	buildPayloadData,
	isNonNegativeIntegerText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

type Mode = "create" | "edit";

export interface RiseopediaAdminCrudPanelProps {
	open: boolean;
	mode: Mode;
	row: RiseopediaAdminRow | null;
	titleCreate: string;
	titleEdit: string;
	apiPath: string;
	idKey: string;
	upsertOp: string;
	fields: RiseopediaAdminFieldConfig[];
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function buildFieldDef(
	field: RiseopediaAdminFieldConfig,
	mode: Mode,
): FieldDef {
	const base = {
		name: field.valueKey,
		label: field.label,
		helpText: field.helpText,
		readOnly: mode === "edit" && field.readOnlyOnEdit === true,
		isDisabled: field.isDisabled,
		visible: field.visible,
		validate: (value: unknown): string | undefined => {
			if (field.required === true && String(value ?? "").trim().length === 0) {
				return `${field.label} is required.`;
			}

			if (
				field.type === "number" &&
				String(value ?? "").trim().length > 0 &&
				!isNonNegativeIntegerText(value)
			) {
				return `${field.label} must be a non-negative whole number.`;
			}

			return undefined;
		},
	};

	if (field.type === "textarea") {
		return {
			...base,
			type: "textarea",
			rows: field.textareaRows ?? 4,
		};
	}

	if (field.type === "checkbox") {
		return {
			...base,
			type: "checkbox",
		};
	}

	if (field.type === "select") {
		return {
			...base,
			type: "select-single",
			allowClear: field.required !== true,
			options: field.options ?? [],
			onChange: field.onChange,
		};
	}

	return {
		...base,
		type: "text",
	};
}

function buildRows(fields: RiseopediaAdminFieldConfig[]): RowDef[] {
	const rows: RowDef[] = [];
	let pending: RowDef = [];

	for (const field of fields) {
		if (field.hidden === true) {
			continue;
		}

		if (field.type === "textarea" || field.span === 12) {
			if (pending.length > 0) {
				rows.push(pending);
				pending = [];
			}
			rows.push([{ field: field.valueKey, span: 12 }]);
			continue;
		}

		pending.push({ field: field.valueKey, span: field.span ?? 6 });
		if (pending.length === 2) {
			rows.push(pending);
			pending = [];
		}
	}

	if (pending.length > 0) {
		rows.push(pending);
	}

	return rows;
}

export default function RiseopediaAdminCrudPanel({
	open,
	mode,
	row,
	titleCreate,
	titleEdit,
	apiPath,
	idKey,
	upsertOp,
	fields,
	onClose,
	onSaved,
}: RiseopediaAdminCrudPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const [metaError] = useState("");

	const defaultValues = useMemo(
		() => buildInitialValues(fields, row),
		[fields, row],
	);

	const visibleFields = useMemo(
		() => fields.filter((field) => field.hidden !== true),
		[fields],
	);

	const panelFields = useMemo(
		() => visibleFields.map((field) => buildFieldDef(field, mode)),
		[mode, visibleFields],
	);

	const panelRows = useMemo(() => buildRows(fields), [fields]);

	const handleSubmit = useCallback(
		async (values: { [key: string]: unknown }): Promise<void> => {
			setSubmitting(true);
			setTopError("");

			try {
				const response = await fetch(apiPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: upsertOp,
						id: mode === "edit" && row ? row[idKey] : null,
						data: buildPayloadData(fields, values),
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save Riseopedia row."),
					);
				}
			} catch (errorValue: unknown) {
				const message =
					errorValue instanceof Error
						? errorValue.message
						: "Failed to save Riseopedia row.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[apiPath, fields, idKey, mode, row, upsertOp],
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
			title={mode === "create" ? titleCreate : titleEdit}
			width="50%"
			showSave={true}
			mode={mode}
			defaultValues={defaultValues}
			fields={panelFields}
			rows={panelRows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				void onSaved();
				onClose();
			}}
			submitting={submitting}
			error={topError}
			metaError={metaError}
		/>
	);
}
