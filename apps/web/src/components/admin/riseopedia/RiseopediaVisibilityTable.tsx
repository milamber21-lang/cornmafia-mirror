//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaVisibilityTable.tsx                               ////
//// Language: TSX                                                                                               ////
//// Riseopedia item visibility override admin table and panel wrapper.                                          ////
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

export interface RiseopediaVisibilityTableProps {
	initialRows: RiseopediaAdminRow[];
	entities: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

function isSameVisibilityOverride(args: {
	row: RiseopediaAdminRow;
	entityTypeCode: string;
	entityKey: string;
	currentId: string;
}): boolean {
	const rowId = toDisplayText(readRowValue(args.row, "visibility_override_id"));
	if (rowId && rowId === args.currentId) {
		return false;
	}

	return (
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
	const entityTypeCode = toDisplayText(args.values.entityTypeCode).trim();
	const currentId = toDisplayText(args.row ? readRowValue(args.row, "visibility_override_id") : null);
	const currentEntityKey = args.row ? readRowValue(args.row, "entity_key") : null;
	const currentEntityLabel = args.row ? readRowValue(args.row, "resolved_entity_name") : null;

	const baseOptions = buildEntityOptionsForType(args.entities, entityTypeCode).filter((option) =>
		!args.rows.some((candidate) =>
			isSameVisibilityOverride({
				row: candidate,
				entityTypeCode,
				entityKey: option.value,
				currentId,
			}),
		),
	);

	return ensureOption(baseOptions, currentEntityKey, currentEntityLabel);
}

function buildFields(args: {
	entities: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
}): RiseopediaAdminFieldConfig[] {
	return [
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
			helpText: "Choose a resolved Riseopedia entity. Existing active visibility overrides are hidden.",
			options: (values) => buildEntityOptions({ rows: args.rows, entities: args.entities, values, row: args.row }),
		},
		{
			valueKey: "visibilityStateCode",
			rowKey: "visibility_state_code",
			label: "Visibility state",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.visibilityStates ?? [], "visibility_state_code", "visibility_state_name"),
		},
		{ valueKey: "reason", rowKey: "reason", label: "Reason", type: "textarea", textareaRows: 4 },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
	];
}

export default function RiseopediaVisibilityTable({
	initialRows,
	entities,
	meta,
}: RiseopediaVisibilityTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row, rows }) =>
		buildFields({ entities, meta, row, rows });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/visibility"
			idKey="visibility_override_id"
			createLabel="Create Override"
			titleCreate="Create Item Visibility Override"
			titleEdit="Edit Item Visibility Override"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete visibility override?"
			deleteConfirmMessage={(row) => `Delete visibility override for "${String(row.resolved_entity_name ?? row.entity_key ?? row.visibility_override_id)}"?`}
			emptyText="No visibility overrides match your search."
			searchPlaceholder="Search visibility overrides"
			defaultSortKey="entity_type_code"
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
				{ rowKey: "entity_type_code", label: "Entity", strong: true },
				{ rowKey: "resolved_entity_name", label: "Resolved name" },
				{ rowKey: "entity_key", label: "Entity key" },
				{ rowKey: "visibility_state_name", label: "Visibility" },
				{ rowKey: "resolved_flag", label: "Resolved", kind: "boolean" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={buildFields({ entities, meta, row: null, rows: initialRows })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
