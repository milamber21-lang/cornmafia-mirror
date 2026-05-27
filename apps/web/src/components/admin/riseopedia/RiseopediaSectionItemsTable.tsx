//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionItemsTable.tsx                             ////
//// Language: TSX                                                                                               ////
//// Riseopedia section manual override admin table and scoped panel wrapper.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable, {
	type RiseopediaAdminFieldsBuilder,
} from "./RiseopediaAdminCrudTable";
import {
	buildEntityOptionsForType,
	buildOptionsFromRows,
	ensureOption,
	readRowValue,
	toBoolean,
	toDisplayText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaSectionItemsTableProps {
	initialRows: RiseopediaAdminRow[];
	sections: RiseopediaAdminRow[];
	entities: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	section?: RiseopediaAdminRow | null;
}

function getScopedSectionId(section: RiseopediaAdminRow | null | undefined): string {
	return toDisplayText(section ? readRowValue(section, "section_id") : null);
}

function isSameManualOverride(args: {
	row: RiseopediaAdminRow;
	sectionId: string;
	entityTypeCode: string;
	entityKey: string;
	currentId: string;
}): boolean {
	const rowId = toDisplayText(readRowValue(args.row, "section_item_id"));
	if (rowId && rowId === args.currentId) {
		return false;
	}

	return (
		toDisplayText(readRowValue(args.row, "section_id")) === args.sectionId &&
		toDisplayText(readRowValue(args.row, "entity_type_code")) === args.entityTypeCode &&
		toDisplayText(readRowValue(args.row, "entity_key")) === args.entityKey &&
		toBoolean(readRowValue(args.row, "active_flag"))
	);
}

function buildEntityOptions(args: {
	rows: RiseopediaAdminRow[];
	entities: RiseopediaAdminRow[];
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const sectionId = toDisplayText(args.values.sectionId).trim();
	const entityTypeCode = toDisplayText(args.values.entityTypeCode).trim();
	const currentId = toDisplayText(args.row ? readRowValue(args.row, "section_item_id") : null);
	const currentEntityKey = args.row ? readRowValue(args.row, "entity_key") : null;
	const currentEntityLabel = args.row
		? readRowValue(args.row, "resolved_entity_name")
		: null;

	const baseOptions = buildEntityOptionsForType(args.entities, entityTypeCode).filter((option) =>
		!args.rows.some((candidate) =>
			isSameManualOverride({
				row: candidate,
				sectionId,
				entityTypeCode,
				entityKey: option.value,
				currentId,
			}),
		),
	);

	return ensureOption(baseOptions, currentEntityKey, currentEntityLabel);
}

function buildFields(args: {
	sections: RiseopediaAdminRow[];
	entities: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	section: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
}): RiseopediaAdminFieldConfig[] {
	const scopedSectionId = getScopedSectionId(args.section);
	const sectionOptions = args.section
		? buildOptionsFromRows([args.section], "section_id", "section_name")
		: buildOptionsFromRows(args.sections, "section_id", "section_name");

	return [
		{
			valueKey: "sectionId",
			rowKey: "section_id",
			label: "Section",
			type: "select",
			required: true,
			defaultValue: scopedSectionId,
			hidden: scopedSectionId.length > 0,
			options: sectionOptions,
		},
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
			onChange: ({ setValue }) => setValue("entityKey", ""),
		},
		{
			valueKey: "entityKey",
			rowKey: "entity_key",
			label: "Entity",
			type: "select",
			required: true,
			helpText: "Choose a resolved Riseopedia entity. Already overridden items are hidden.",
			options: (values) => buildEntityOptions({ rows: args.rows, entities: args.entities, values, row: args.row }),
		},
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
		{ valueKey: "pinned", rowKey: "pinned_flag", label: "Pinned", type: "checkbox", defaultValue: false },
		{ valueKey: "featured", rowKey: "featured_flag", label: "Featured", type: "checkbox", defaultValue: false },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
		{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
	];
}

export default function RiseopediaSectionItemsTable({
	initialRows,
	sections,
	entities,
	meta,
	section = null,
}: RiseopediaSectionItemsTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row, rows }) =>
		buildFields({ sections, entities, meta, section, row, rows });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={section ? `/api/admin/riseopedia/section-items?sectionId=${getScopedSectionId(section)}` : "/api/admin/riseopedia/section-items"}
			idKey="section_item_id"
			createLabel="Create Override"
			titleCreate="Create Section Manual Override"
			titleEdit="Edit Section Manual Override"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete section manual override?"
			deleteConfirmMessage={(row) => `Delete manual override "${String(row.resolved_entity_name ?? row.entity_key ?? row.section_item_id)}"?`}
			emptyText="No section manual overrides match your search."
			searchPlaceholder="Search manual overrides"
			defaultSortKey={section ? "sort_order" : "section_name"}
			filters={section ? [] : [
				{
					key: "section",
					rowKey: "section_id",
					label: "Filter section",
					clearLabel: "All sections",
					placeholder: "All sections",
					options: buildOptionsFromRows(sections, "section_id", "section_name"),
				},
			]}
			columns={[
				{ rowKey: "section_name", label: "Section", strong: true },
				{ rowKey: "entity_type_code", label: "Entity" },
				{ rowKey: "resolved_entity_name", label: "Resolved name" },
				{ rowKey: "entity_key", label: "Entity key" },
				{ rowKey: "resolved_flag", label: "Resolved", kind: "boolean" },
				{ rowKey: "pinned_flag", label: "Pinned", kind: "boolean" },
				{ rowKey: "featured_flag", label: "Featured", kind: "boolean" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={buildFields({ sections, entities, meta, section, row: null, rows: initialRows })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
