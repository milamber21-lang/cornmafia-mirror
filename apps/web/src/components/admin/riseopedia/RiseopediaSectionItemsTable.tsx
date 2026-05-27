//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionItemsTable.tsx                             ////
//// Language: TSX                                                                                               ////
//// Riseopedia manual section items admin table and panel wrapper.                                             ////
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

export interface RiseopediaSectionItemsTableProps {
	initialRows: RiseopediaAdminRow[];
	sections: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaSectionItemsTable({
	initialRows,
	sections,
	meta,
}: RiseopediaSectionItemsTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/section-items"
			idKey="section_item_id"
			createLabel="Create Manual Item"
			titleCreate="Create Manual Section Item"
			titleEdit="Edit Manual Section Item"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete manual section item?"
			deleteConfirmMessage={(row) => `Delete manual item "${String(row.resolved_entity_name ?? row.entity_key ?? row.section_item_id)}"?`}
			emptyText="No manual section items match your search."
			searchPlaceholder="Search manual items"
			defaultSortKey="section_name"
			filters={[
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
			fields={[
				{
					valueKey: "sectionId",
					rowKey: "section_id",
					label: "Section",
					type: "select",
					required: true,
					options: buildOptionsFromRows(sections, "section_id", "section_name"),
				},
				{
					valueKey: "entityTypeCode",
					rowKey: "entity_type_code",
					label: "Entity type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
				},
				{ valueKey: "entityKey", rowKey: "entity_key", label: "Entity key", type: "text", required: true },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "pinned", rowKey: "pinned_flag", label: "Pinned", type: "checkbox", defaultValue: false },
				{ valueKey: "featured", rowKey: "featured_flag", label: "Featured", type: "checkbox", defaultValue: false },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
				{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
			]}
		/>
	);
}
