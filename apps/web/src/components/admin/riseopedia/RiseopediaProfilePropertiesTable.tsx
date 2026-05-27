//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfilePropertiesTable.tsx                        ////
//// Language: TSX                                                                                               ////
//// Riseopedia display profile property placement admin table and panel wrapper.                               ////
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

export interface RiseopediaProfilePropertiesTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	propertyCatalog: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaProfilePropertiesTable({
	initialRows,
	displayProfiles,
	propertyCatalog,
	meta,
}: RiseopediaProfilePropertiesTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/profile-properties"
			idKey="display_profile_property_id"
			createLabel="Create Placement"
			titleCreate="Create Profile Property Placement"
			titleEdit="Edit Profile Property Placement"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete profile property placement?"
			deleteConfirmMessage={(row) => `Delete property placement "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.effective_label ?? row.property_name ?? "")}"?`}
			emptyText="No profile property placements match your search."
			searchPlaceholder="Search profile properties"
			defaultSortKey="display_profile_name"
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "effective_label", label: "Label" },
				{ rowKey: "property_code", label: "Property" },
				{ rowKey: "display_slot_name", label: "Slot" },
				{ rowKey: "group_code", label: "Group" },
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
					valueKey: "propertyCatalogId",
					rowKey: "property_catalog_id",
					label: "Property",
					type: "select",
					required: true,
					options: buildOptionsFromRows(propertyCatalog, "property_catalog_id", "property_name"),
				},
				{
					valueKey: "displaySlotCode",
					rowKey: "display_slot_code",
					label: "Display slot",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.displaySlots ?? [], "display_slot_code", "display_slot_name"),
				},
				{ valueKey: "groupCode", rowKey: "group_code", label: "Group", type: "text", required: true, defaultValue: "general" },
				{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "visible", rowKey: "visible_flag", label: "Visible", type: "checkbox", defaultValue: true },
				{ valueKey: "compact", rowKey: "compact_flag", label: "Compact", type: "checkbox", defaultValue: false },
				{ valueKey: "featured", rowKey: "featured_flag", label: "Featured", type: "checkbox", defaultValue: false },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
				{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
			]}
		/>
	);
}
