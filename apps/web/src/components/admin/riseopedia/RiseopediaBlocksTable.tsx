//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaBlocksTable.tsx                                    ////
//// Language: TSX                                                                                               ////
//// Riseopedia relationship, dependency, and changelog block admin table and panel wrapper.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable from "./RiseopediaAdminCrudTable";
import { buildOptionsFromRows } from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminMeta,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaBlocksTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaBlocksTable({
	initialRows,
	displayProfiles,
	meta,
}: RiseopediaBlocksTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/blocks"
			idKey="display_profile_relationship_block_id"
			createLabel="Create Block"
			titleCreate="Create Relationship Block"
			titleEdit="Edit Relationship Block"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete relationship block?"
			deleteConfirmMessage={(row) => `Delete block "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.effective_label ?? row.relationship_block_type_code ?? "")}"?`}
			emptyText="No relationship blocks match your search."
			searchPlaceholder="Search blocks"
			defaultSortKey="display_profile_name"
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "effective_label", label: "Label" },
				{ rowKey: "relationship_block_type_code", label: "Block type" },
				{ rowKey: "block_group_code", label: "Group" },
				{ rowKey: "sort_order", label: "Sort", kind: "count" },
				{ rowKey: "visible_flag", label: "Visible", kind: "boolean" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={[
				{
					valueKey: "displayProfileId",
					rowKey: "display_profile_id",
					label: "Display profile",
					type: "select",
					required: true,
					options: buildOptionsFromRows(displayProfiles, "display_profile_id", "display_profile_name"),
				},
				{
					valueKey: "relationshipBlockTypeCode",
					rowKey: "relationship_block_type_code",
					label: "Block type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.relationshipBlockTypes ?? [], "relationship_block_type_code", "relationship_block_type_name"),
				},
				{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "visible", rowKey: "visible_flag", label: "Visible", type: "checkbox", defaultValue: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
				{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
			]}
		/>
	);
}
