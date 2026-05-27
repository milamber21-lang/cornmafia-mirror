//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaVisibilityTable.tsx                               ////
//// Language: TSX                                                                                               ////
//// Riseopedia entity visibility override admin table and panel wrapper.                                       ////
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

export interface RiseopediaVisibilityTableProps {
	initialRows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaVisibilityTable({
	initialRows,
	meta,
}: RiseopediaVisibilityTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/visibility"
			idKey="visibility_override_id"
			createLabel="Create Override"
			titleCreate="Create Visibility Override"
			titleEdit="Edit Visibility Override"
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
			fields={[
				{
					valueKey: "entityTypeCode",
					rowKey: "entity_type_code",
					label: "Entity type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
				},
				{ valueKey: "entityKey", rowKey: "entity_key", label: "Entity key", type: "text", required: true },
				{
					valueKey: "visibilityStateCode",
					rowKey: "visibility_state_code",
					label: "Visibility state",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.visibilityStates ?? [], "visibility_state_code", "visibility_state_name"),
				},
				{ valueKey: "reason", rowKey: "reason", label: "Reason", type: "textarea", textareaRows: 4 },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
			]}
		/>
	);
}
