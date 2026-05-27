//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaPropertiesTable.tsx                               ////
//// Language: TSX                                                                                               ////
//// Riseopedia property catalog admin table and panel wrapper with DB-backed source selectors.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable from "./RiseopediaAdminCrudTable";
import {
	buildOptionsFromRows,
	ensureOption,
	readRowValue,
	toBoolean,
	toDisplayText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaPropertiesTableProps {
	initialRows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

const SOURCE_SELECTOR_COLUMN = "source_column";
const SOURCE_SELECTOR_PROPERTY = "source_property";

const fallbackDataTypeOptions: RiseopediaAdminOption[] = [
	{ value: "text", label: "Text" },
	{ value: "integer", label: "Integer" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "enum", label: "Enum" },
	{ value: "color", label: "Color" },
	{ value: "vector2", label: "Vector 2" },
	{ value: "vector3", label: "Vector 3" },
	{ value: "asset_ref", label: "Asset Reference" },
	{ value: "localized_text", label: "Localized Text" },
	{ value: "json", label: "JSON" },
];

function getValue(values: { [key: string]: unknown }, key: string): string {
	return toDisplayText(values[key]).trim();
}

function getEntityTypeCode(values: { [key: string]: unknown }): string {
	return getValue(values, "entityTypeCode");
}

function getOriginCode(values: { [key: string]: unknown }): string {
	return getValue(values, "propertyOriginCode");
}

function inferSelectorKind(originCode: string): string {
	return originCode === "asset_property" ? SOURCE_SELECTOR_PROPERTY : SOURCE_SELECTOR_COLUMN;
}

function getSelectedOriginOption(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
}): RiseopediaAdminRow | null {
	const entityTypeCode = getEntityTypeCode(args.values);
	const originCode = getOriginCode(args.values);
	if (!originCode) {
		return null;
	}

	const scopedOption = (args.meta.propertyOriginOptions ?? []).find(
		(option) =>
			toDisplayText(readRowValue(option, "entity_type_code")) === entityTypeCode &&
			toDisplayText(readRowValue(option, "property_origin_code")) === originCode,
	);
	if (scopedOption) {
		return scopedOption;
	}

	const fallbackOrigin = (args.meta.propertyOrigins ?? []).find(
		(option) => toDisplayText(readRowValue(option, "property_origin_code")) === originCode,
	);
	if (!fallbackOrigin) {
		return null;
	}

	return {
		...fallbackOrigin,
		entity_type_code: entityTypeCode,
		source_selector_kind_code: inferSelectorKind(originCode),
	};
}

function getSelectorKind(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
}): string {
	const selectedOrigin = getSelectedOriginOption(args);
	return toDisplayText(readRowValue(selectedOrigin ?? {}, "source_selector_kind_code")).trim();
}

function isSourceBacked(meta: RiseopediaAdminMeta, values: { [key: string]: unknown }): boolean {
	const selectorKind = getSelectorKind({ meta, values });
	return selectorKind === SOURCE_SELECTOR_COLUMN || selectorKind === SOURCE_SELECTOR_PROPERTY;
}

function buildDataTypeOptions(meta: RiseopediaAdminMeta): RiseopediaAdminOption[] {
	const dbOptions = buildOptionsFromRows(
		meta.propertyDataTypes ?? [],
		"data_type_code",
		"data_type_name",
	);
	return dbOptions.length > 0 ? dbOptions : fallbackDataTypeOptions;
}

function getCurrentPropertyCatalogId(row: RiseopediaAdminRow | null): string {
	return row ? toDisplayText(readRowValue(row, "property_catalog_id")).trim() : "";
}

function isCurrentSourceOption(args: {
	row: RiseopediaAdminRow | null;
	option: RiseopediaAdminRow;
}): boolean {
	const currentId = getCurrentPropertyCatalogId(args.row);
	const optionId = toDisplayText(readRowValue(args.option, "property_catalog_id")).trim();
	return currentId.length > 0 && optionId.length > 0 && currentId === optionId;
}

function isCatalogedByAnotherProperty(args: {
	row: RiseopediaAdminRow | null;
	option: RiseopediaAdminRow;
}): boolean {
	return toBoolean(readRowValue(args.option, "cataloged_flag")) && !isCurrentSourceOption(args);
}

function hasAvailableSourceOption(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
	originCode: string;
	sourceSelectorKindCode: string;
}): boolean {
	const entityTypeCode = getEntityTypeCode(args.values);
	if (!entityTypeCode || !args.originCode || !args.sourceSelectorKindCode) {
		return false;
	}

	return (args.meta.propertySourceOptions ?? []).some(
		(option) =>
			toDisplayText(readRowValue(option, "entity_type_code")) === entityTypeCode &&
			toDisplayText(readRowValue(option, "property_origin_code")) === args.originCode &&
			toDisplayText(readRowValue(option, "source_selector_kind_code")) === args.sourceSelectorKindCode &&
			!isCatalogedByAnotherProperty({ row: args.row, option }),
	);
}

function buildOriginOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const entityTypeCode = getEntityTypeCode(args.values);
	const currentValue = args.row ? readRowValue(args.row, "property_origin_code") : null;
	if (!entityTypeCode) {
		return ensureOption([], currentValue, currentValue);
	}

	const seen = new Set<string>();
	const options: RiseopediaAdminOption[] = [];

	for (const option of args.meta.propertyOriginOptions ?? []) {
		if (toDisplayText(readRowValue(option, "entity_type_code")) !== entityTypeCode) {
			continue;
		}

		const originCode = toDisplayText(readRowValue(option, "property_origin_code")).trim();
		const selectorKindCode = toDisplayText(readRowValue(option, "source_selector_kind_code")).trim();
		if (!originCode || seen.has(originCode)) {
			continue;
		}

		if (!hasAvailableSourceOption({
			meta: args.meta,
			values: args.values,
			row: args.row,
			originCode,
			sourceSelectorKindCode: selectorKindCode,
		})) {
			continue;
		}

		seen.add(originCode);
		options.push({
			value: originCode,
			label: toDisplayText(readRowValue(option, "property_origin_name")) || originCode,
		});
	}

	return ensureOption(
		options.sort((left, right) => left.label.localeCompare(right.label)),
		currentValue,
		currentValue,
	);
}

function formatSourceOptionLabel(row: RiseopediaAdminRow): string {
	const sourceLabel = toDisplayText(readRowValue(row, "source_label")).trim();
	const sourceValue = toDisplayText(readRowValue(row, "source_value")).trim();
	const groupName = toDisplayText(readRowValue(row, "entity_group_name")).trim();
	const sampleValue = toDisplayText(readRowValue(row, "sample_value")).trim();
	const base = sourceLabel || sourceValue;
	const metaParts = [groupName, sampleValue ? `sample: ${sampleValue}` : ""].filter((part) => part.length > 0);
	return metaParts.length > 0 ? `${base} · ${metaParts.join(" · ")}` : base;
}

function getCurrentSourceValue(row: RiseopediaAdminRow | null): unknown {
	if (!row) {
		return null;
	}

	const sourceDisplayValue = readRowValue(row, "source_display_value");
	if (toDisplayText(sourceDisplayValue).trim()) {
		return sourceDisplayValue;
	}

	const sourcePropertyCode = readRowValue(row, "source_property_code");
	if (toDisplayText(sourcePropertyCode).trim()) {
		return sourcePropertyCode;
	}

	return readRowValue(row, "source_column_name");
}

function buildSourceOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const entityTypeCode = getEntityTypeCode(args.values);
	const originCode = getOriginCode(args.values);
	const selectorKindCode = getSelectorKind({ meta: args.meta, values: args.values });
	const currentValue = getCurrentSourceValue(args.row);
	const seen = new Set<string>();
	const options: RiseopediaAdminOption[] = [];

	for (const row of args.meta.propertySourceOptions ?? []) {
		if (toDisplayText(readRowValue(row, "entity_type_code")) !== entityTypeCode) {
			continue;
		}

		if (toDisplayText(readRowValue(row, "property_origin_code")) !== originCode) {
			continue;
		}

		if (toDisplayText(readRowValue(row, "source_selector_kind_code")) !== selectorKindCode) {
			continue;
		}

		if (isCatalogedByAnotherProperty({ row: args.row, option: row })) {
			continue;
		}

		const value = toDisplayText(readRowValue(row, "source_value")).trim();
		if (!value || seen.has(value)) {
			continue;
		}

		seen.add(value);
		options.push({ value, label: formatSourceOptionLabel(row) });
	}

	return ensureOption(
		options.sort((left, right) => left.label.localeCompare(right.label)),
		currentValue,
		currentValue,
	);
}

function findSourceOption(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	value: string;
}): RiseopediaAdminRow | null {
	const entityTypeCode = getEntityTypeCode(args.values);
	const originCode = getOriginCode(args.values);
	const selectorKindCode = getSelectorKind({ meta: args.meta, values: args.values });

	return (args.meta.propertySourceOptions ?? []).find(
		(row) =>
			toDisplayText(readRowValue(row, "entity_type_code")) === entityTypeCode &&
			toDisplayText(readRowValue(row, "property_origin_code")) === originCode &&
			toDisplayText(readRowValue(row, "source_selector_kind_code")) === selectorKindCode &&
			toDisplayText(readRowValue(row, "source_value")) === args.value,
	) ?? null;
}

function applySourceOption(args: {
	row: RiseopediaAdminRow;
	selectorKindCode: string;
	setValue: (name: string, value: unknown) => void;
}): void {
	const sourceValue = toDisplayText(readRowValue(args.row, "source_value"));
	args.setValue("sourceColumnName", args.selectorKindCode === SOURCE_SELECTOR_COLUMN ? sourceValue : "");
	args.setValue("sourcePropertyCode", args.selectorKindCode === SOURCE_SELECTOR_PROPERTY ? sourceValue : "");
	args.setValue("propertyCode", toDisplayText(readRowValue(args.row, "property_code")));
	args.setValue("propertyName", toDisplayText(readRowValue(args.row, "property_name")));
	args.setValue("dataTypeCode", toDisplayText(readRowValue(args.row, "data_type_code")));
	args.setValue("unitCode", toDisplayText(readRowValue(args.row, "unit_code")));
	args.setValue("defaultDisplaySlotCode", toDisplayText(readRowValue(args.row, "default_display_slot_code")) || "hidden");
	args.setValue("defaultGroupCode", toDisplayText(readRowValue(args.row, "default_group_code")) || "general");
}

function clearSourceValues(setValue: (name: string, value: unknown) => void): void {
	setValue("sourceValue", "");
	setValue("sourceColumnName", "");
	setValue("sourcePropertyCode", "");
}

function clearSourceDerivedValues(setValue: (name: string, value: unknown) => void): void {
	clearSourceValues(setValue);
	setValue("propertyCode", "");
	setValue("propertyName", "");
	setValue("dataTypeCode", "");
	setValue("unitCode", "");
	setValue("defaultDisplaySlotCode", "hidden");
	setValue("defaultGroupCode", "general");
}

export default function RiseopediaPropertiesTable({
	initialRows,
	meta,
}: RiseopediaPropertiesTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/properties"
			idKey="property_catalog_id"
			createLabel="Create Property"
			titleCreate="Create Property Catalog Row"
			titleEdit="Edit Property Catalog Row"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete property catalog row?"
			deleteConfirmMessage={(row) => `Delete property "${String(row.property_name ?? row.property_code ?? row.property_catalog_id)}"? This also removes its profile placements.`}
			emptyText="No Riseopedia properties match your search."
			searchPlaceholder="Search properties"
			defaultSortKey="property_name"
			filters={[
				{
					key: "entity",
					rowKey: "entity_type_code",
					label: "Filter entity",
					clearLabel: "All entities",
					placeholder: "All entities",
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
				},
			]}
			columns={[
				{ rowKey: "property_name", label: "Property", strong: true },
				{ rowKey: "property_code", label: "Code" },
				{ rowKey: "entity_type_code", label: "Entity" },
				{ rowKey: "property_origin_name", label: "Origin" },
				{ rowKey: "source_display_value", label: "Source" },
				{ rowKey: "default_display_slot_name", label: "Default slot" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fieldsBuilder={({ row }) => [
				{
					valueKey: "entityTypeCode",
					rowKey: "entity_type_code",
					label: "Entity type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
					onChange: ({ setValue }) => {
						setValue("propertyOriginCode", "");
						clearSourceDerivedValues(setValue);
					},
				},
				{
					valueKey: "propertyOriginCode",
					rowKey: "property_origin_code",
					label: "Origin",
					type: "select",
					required: true,
					options: (values) => buildOriginOptions({ meta, values, row }),
					onChange: ({ setValue }) => {
						clearSourceDerivedValues(setValue);
					},
				},
				{
					valueKey: "sourceValue",
					rowKey: "source_display_value",
					label: "Source",
					type: "select",
					required: true,
					span: 12,
					helpText: "DB-backed source field for this property. Already cataloged sources are hidden from create mode.",
					visible: (values) => isSourceBacked(meta, values),
					options: (values) => buildSourceOptions({ meta, values, row }),
					onChange: ({ value, values, setValue }) => {
						clearSourceValues(setValue);
						const selectorKindCode = getSelectorKind({ meta, values });
						const sourceOption = findSourceOption({ meta, values, value });
						if (sourceOption) {
							applySourceOption({ row: sourceOption, selectorKindCode, setValue });
						}
					},
				},
				{
					valueKey: "sourceColumnName",
					rowKey: "source_column_name",
					label: "Source column",
					type: "text",
					hidden: true,
				},
				{
					valueKey: "sourcePropertyCode",
					rowKey: "source_property_code",
					label: "Source property",
					type: "text",
					hidden: true,
				},
				{
					valueKey: "propertyCode",
					rowKey: "property_code",
					label: "Property code",
					type: "text",
					required: true,
					isDisabled: (values) => isSourceBacked(meta, values),
				},
				{
					valueKey: "propertyName",
					rowKey: "property_name",
					label: "Property name",
					type: "text",
					required: true,
					isDisabled: (values) => isSourceBacked(meta, values),
				},
				{
					valueKey: "dataTypeCode",
					rowKey: "data_type_code",
					label: "Data type",
					type: "select",
					required: true,
					options: buildDataTypeOptions(meta),
					isDisabled: (values) => isSourceBacked(meta, values),
				},
				{
					valueKey: "unitCode",
					rowKey: "unit_code",
					label: "Unit",
					type: "text",
					isDisabled: (values) => isSourceBacked(meta, values),
				},
				{
					valueKey: "defaultDisplaySlotCode",
					rowKey: "default_display_slot_code",
					label: "Default display slot",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.displaySlots ?? [], "display_slot_code", "display_slot_name"),
				},
				{ valueKey: "defaultGroupCode", rowKey: "default_group_code", label: "Default group", type: "text", required: true, defaultValue: "general" },
				{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 4 },
				{ valueKey: "defaultVisible", rowKey: "default_visible_flag", label: "Default visible", type: "checkbox", defaultValue: false },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
			]}
			fields={[]}
		/>
	);
}
