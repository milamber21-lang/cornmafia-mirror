//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaBlocksTable.tsx                                    ////
//// Language: TSX                                                                                               ////
//// Riseopedia relationship, dependency, and changelog block admin table and scoped panel wrapper.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable, {
	type RiseopediaAdminFieldsBuilder,
} from "./RiseopediaAdminCrudTable";
import {
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

export interface RiseopediaBlocksTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
}

function getScopedProfileId(displayProfile: RiseopediaAdminRow | null | undefined): string {
	return toDisplayText(displayProfile ? readRowValue(displayProfile, "display_profile_id") : null);
}

function isAlreadySelectedBlock(args: {
	row: RiseopediaAdminRow;
	displayProfileId: string;
	relationshipBlockTypeCode: string;
	currentId: string;
}): boolean {
	const rowId = toDisplayText(readRowValue(args.row, "display_profile_relationship_block_id"));
	if (rowId && rowId === args.currentId) {
		return false;
	}

	return (
		toDisplayText(readRowValue(args.row, "display_profile_id")) === args.displayProfileId &&
		toDisplayText(readRowValue(args.row, "relationship_block_type_code")) === args.relationshipBlockTypeCode &&
		toBoolean(readRowValue(args.row, "active_flag"))
	);
}

function buildBlockTypeOptions(args: {
	rows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const displayProfileId = toDisplayText(args.values.displayProfileId).trim();
	const currentId = toDisplayText(args.row ? readRowValue(args.row, "display_profile_relationship_block_id") : null);
	const currentBlockTypeCode = args.row ? readRowValue(args.row, "relationship_block_type_code") : null;
	const currentBlockLabel = args.row ? readRowValue(args.row, "relationship_block_type_name") : null;

	const baseOptions = buildOptionsFromRows(
		args.meta.relationshipBlockTypes ?? [],
		"relationship_block_type_code",
		"relationship_block_type_name",
	).filter((option) =>
		!args.rows.some((candidate) =>
			isAlreadySelectedBlock({
				row: candidate,
				displayProfileId,
				relationshipBlockTypeCode: option.value,
				currentId,
			}),
		),
	);

	return ensureOption(baseOptions, currentBlockTypeCode, currentBlockLabel);
}

function buildFields(args: {
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
}): RiseopediaAdminFieldConfig[] {
	const scopedProfileId = getScopedProfileId(args.displayProfile);
	const profileOptions = args.displayProfile
		? buildOptionsFromRows([args.displayProfile], "display_profile_id", "display_profile_name")
		: buildOptionsFromRows(args.displayProfiles, "display_profile_id", "display_profile_name");

	return [
		{
			valueKey: "displayProfileId",
			rowKey: "display_profile_id",
			label: "Display profile",
			type: "select",
			required: true,
			defaultValue: scopedProfileId,
			hidden: scopedProfileId.length > 0,
			options: profileOptions,
			onChange: ({ setValue }) => setValue("relationshipBlockTypeCode", ""),
		},
		{
			valueKey: "relationshipBlockTypeCode",
			rowKey: "relationship_block_type_code",
			label: "Block type",
			type: "select",
			required: true,
			helpText: "Already selected active block types for this profile are hidden.",
			options: (values) => buildBlockTypeOptions({ rows: args.rows, meta: args.meta, values, row: args.row }),
		},
		{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
		{ valueKey: "visible", rowKey: "visible_flag", label: "Visible", type: "checkbox", defaultValue: true },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
		{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
	];
}

export default function RiseopediaBlocksTable({
	initialRows,
	displayProfiles,
	meta,
	displayProfile = null,
}: RiseopediaBlocksTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row, rows }) =>
		buildFields({ displayProfiles, meta, displayProfile, row, rows });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={displayProfile ? `/api/admin/riseopedia/blocks?displayProfileId=${getScopedProfileId(displayProfile)}` : "/api/admin/riseopedia/blocks"}
			idKey="display_profile_relationship_block_id"
			createLabel="Create Block"
			titleCreate="Create Relationship Block"
			titleEdit="Edit Relationship Block"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete relationship block?"
			deleteConfirmMessage={(row) => `Delete block "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.effective_label ?? row.relationship_block_type_code ?? "")}"?`}
			emptyText="No relationship blocks match your search."
			searchPlaceholder="Search blocks"
			defaultSortKey={displayProfile ? "sort_order" : "display_profile_name"}
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "effective_label", label: "Label" },
				{ rowKey: "relationship_block_type_code", label: "Block type" },
				{ rowKey: "block_group_code", label: "Group" },
				{ rowKey: "sort_order", label: "Sort", kind: "count" },
				{ rowKey: "visible_flag", label: "Visible", kind: "boolean" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={buildFields({ displayProfiles, meta, displayProfile, row: null, rows: initialRows })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
