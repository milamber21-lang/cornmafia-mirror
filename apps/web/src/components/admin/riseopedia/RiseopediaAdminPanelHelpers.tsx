//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminPanelHelpers.tsx                              ////
//// Language: TSX                                                                                               ////
//// Shared low-level form helpers used by dedicated Riseopedia admin panels.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { FieldDef, RowDef } from "@/components/ui/PanelForm";

import { isNonNegativeIntegerText } from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminPanelMode,
} from "./RiseopediaAdminTypes";

export function buildRiseopediaPanelFieldDef(
	field: RiseopediaAdminFieldConfig,
	mode: RiseopediaAdminPanelMode,
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

export function buildRiseopediaPanelRows(fields: RiseopediaAdminFieldConfig[]): RowDef[] {
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
