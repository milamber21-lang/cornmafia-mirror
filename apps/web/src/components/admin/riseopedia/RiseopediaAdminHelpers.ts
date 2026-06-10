//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminHelpers.ts                                    ////
//// Language: TS                                                                                                ////
//// Pure helpers for Riseopedia admin tables, panel defaults, labels, and option lists.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export function readRowValue(row: RiseopediaAdminRow, key: string): unknown {
	return row[key];
}

export function toDisplayText(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	if (typeof value === "boolean") {
		return value ? "Yes" : "No";
	}

	if (typeof value === "number" || typeof value === "bigint") {
		return String(value);
	}

	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(toDisplayText).filter(Boolean).join(", ");
	}

	return "";
}

export function toRowKey(value: unknown): string {
	const text = toDisplayText(value).trim();
	return text.length > 0 ? text : "missing";
}

export function toBoolean(value: unknown): boolean {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		return normalized === "true" || normalized === "yes" || normalized === "1";
	}

	return false;
}

export function buildOptionsFromRows(
	rows: RiseopediaAdminRows,
	valueKey: string,
	labelKey: string,
): RiseopediaAdminOption[] {
	return rows
		.map((row) => {
			const value = toDisplayText(readRowValue(row, valueKey)).trim();
			const label = toDisplayText(readRowValue(row, labelKey)).trim();
			return value.length > 0
				? {
						value,
						label: label.length > 0 ? label : value,
				  }
				: null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildInitialValues(
	fields: RiseopediaAdminFieldConfig[],
	row: RiseopediaAdminRow | null,
): { [key: string]: unknown } {
	const values: { [key: string]: unknown } = {};

	for (const field of fields) {
		const rowValue = row ? field.readValue?.(row) ?? readRowValue(row, field.rowKey) : undefined;
		if (field.type === "checkbox") {
			values[field.valueKey] = rowValue === undefined ? Boolean(field.defaultValue) : toBoolean(rowValue);
			continue;
		}

		if (rowValue !== null && rowValue !== undefined) {
			values[field.valueKey] = toDisplayText(rowValue);
			continue;
		}

		if (field.defaultValue !== null && field.defaultValue !== undefined) {
			values[field.valueKey] = toDisplayText(field.defaultValue);
			continue;
		}

		values[field.valueKey] = "";
	}

	return values;
}

export function buildPayloadData(
	fields: RiseopediaAdminFieldConfig[],
	values: { [key: string]: unknown },
): { [key: string]: unknown } {
	const data: { [key: string]: unknown } = {};

	for (const field of fields) {
		data[field.valueKey] = values[field.valueKey];
	}

	return data;
}

export function isNonNegativeIntegerText(value: unknown): boolean {
	if (typeof value === "number") {
		return Number.isInteger(value) && value >= 0;
	}

	if (typeof value !== "string") {
		return false;
	}

	return /^\d+$/.test(value.trim());
}

export function ensureOption(
	options: RiseopediaAdminOption[],
	value: unknown,
	label: unknown,
): RiseopediaAdminOption[] {
	const optionValue = toDisplayText(value).trim();
	if (!optionValue) {
		return options;
	}

	if (options.some((option) => option.value === optionValue)) {
		return options;
	}

	const optionLabel = toDisplayText(label).trim();
	return [
		...options,
		{
			value: optionValue,
			label: optionLabel.length > 0 ? optionLabel : optionValue,
		},
	].sort((left, right) => left.label.localeCompare(right.label));
}

export function buildEntityOptionsForType(
	rows: RiseopediaAdminRows,
	entityTypeCode: unknown,
): RiseopediaAdminOption[] {
	const selectedType = toDisplayText(entityTypeCode).trim();
	if (!selectedType) {
		return [];
	}

	return rows
		.filter((row) => toDisplayText(readRowValue(row, "entity_type_code")) === selectedType)
		.map((row) => {
			const value = toDisplayText(readRowValue(row, "entity_key")).trim();
			const name = toDisplayText(readRowValue(row, "entity_name")).trim();
			const subtitle = toDisplayText(readRowValue(row, "entity_subtitle")).trim();
			const labelParts = [name.length > 0 ? name : value, subtitle]
				.filter((part) => part.length > 0);

			return value.length > 0
				? {
						value,
						label: labelParts.join(" · "),
				  }
				: null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildUniqueCodeOptions(
	rows: RiseopediaAdminRows,
	valueKey: string,
	labelKey: string,
): RiseopediaAdminOption[] {
	const seen = new Set<string>();
	const options: RiseopediaAdminOption[] = [];

	for (const row of rows) {
		const value = toDisplayText(readRowValue(row, valueKey)).trim();
		if (!value || seen.has(value)) {
			continue;
		}

		seen.add(value);
		const label = toDisplayText(readRowValue(row, labelKey)).trim();
		options.push({ value, label: label.length > 0 ? label : value });
	}

	return options.sort((left, right) => left.label.localeCompare(right.label));
}
