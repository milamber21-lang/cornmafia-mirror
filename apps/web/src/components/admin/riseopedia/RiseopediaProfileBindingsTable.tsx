//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBindingsTable.tsx                          ////
//// Language: TSX                                                                                               ////
//// Riseopedia display profile bindings admin table and panel wrapper.                                         ////
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

export interface RiseopediaProfileBindingsTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaProfileBindingsTable({
	initialRows,
	displayProfiles,
	meta,
}: RiseopediaProfileBindingsTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/profile-bindings"
			idKey="display_profile_binding_id"
			createLabel="Create Binding"
			titleCreate="Create Profile Binding"
			titleEdit="Edit Profile Binding"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete profile binding?"
			deleteConfirmMessage={(row) => `Delete binding "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.selector_value ?? "")}"?`}
			emptyText="No profile bindings match your search."
			searchPlaceholder="Search profile bindings"
			defaultSortKey="display_profile_name"
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "entity_type_code", label: "Entity" },
				{ rowKey: "profile_selector_kind_name", label: "Selector" },
				{ rowKey: "selector_value", label: "Value" },
				{ rowKey: "selector_asset_class_name", label: "Asset class" },
				{ rowKey: "priority_order", label: "Priority", kind: "count" },
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
					valueKey: "entityTypeCode",
					rowKey: "entity_type_code",
					label: "Entity type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
				},
				{
					valueKey: "profileSelectorKindCode",
					rowKey: "profile_selector_kind_code",
					label: "Selector kind",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.profileSelectorKinds ?? [], "profile_selector_kind_code", "profile_selector_kind_name"),
				},
				{ valueKey: "selectorValue", rowKey: "selector_value", label: "Selector value", type: "text", required: true },
				{ valueKey: "priorityOrder", rowKey: "priority_order", label: "Priority", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
				{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
			]}
		/>
	);
}
