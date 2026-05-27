//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaDisplayProfilesTable.tsx                          ////
//// Language: TSX                                                                                               ////
//// Riseopedia display profiles admin table and panel wrapper with scoped child management links.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable from "./RiseopediaAdminCrudTable";
import {
	buildOptionsFromRows,
	readRowValue,
	toRowKey,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminMeta,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaDisplayProfilesTableProps {
	initialRows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

function profileIdHref(row: RiseopediaAdminRow, suffix: string): string {
	return `/admin/riseopedia/display-profiles/${toRowKey(readRowValue(row, "display_profile_id"))}/${suffix}`;
}

export default function RiseopediaDisplayProfilesTable({
	initialRows,
	meta,
}: RiseopediaDisplayProfilesTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/display-profiles"
			idKey="display_profile_id"
			createLabel="Create Profile"
			titleCreate="Create Display Profile"
			titleEdit="Edit Display Profile"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete display profile?"
			deleteConfirmMessage={(row) => `Delete display profile "${String(row.display_profile_name ?? row.display_profile_code ?? row.display_profile_id)}"?`}
			emptyText="No display profiles match your search."
			searchPlaceholder="Search display profiles"
			defaultSortKey="display_profile_name"
			rowActions={[
				{
					label: "Bindings",
					href: (row) => profileIdHref(row, "bindings"),
					variant: "neutral",
				},
				{
					label: "Properties",
					href: (row) => profileIdHref(row, "properties"),
					variant: "neutral",
				},
				{
					label: "Blocks",
					href: (row) => profileIdHref(row, "blocks"),
					variant: "neutral",
				},
			]}
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "display_profile_code", label: "Code" },
				{ rowKey: "entity_type_name", label: "Entity" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={[
				{ valueKey: "displayProfileCode", rowKey: "display_profile_code", label: "Code", type: "text", required: true },
				{ valueKey: "displayProfileName", rowKey: "display_profile_name", label: "Name", type: "text", required: true },
				{
					valueKey: "entityTypeCode",
					rowKey: "entity_type_code",
					label: "Entity type",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
				},
				{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 4 },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
			]}
		/>
	);
}
