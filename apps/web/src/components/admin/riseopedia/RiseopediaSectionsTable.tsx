//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionsTable.tsx                                  ////
//// Language: TSX                                                                                               ////
//// Riseopedia sections admin table and panel wrapper with scoped section management links.                      ////
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

export interface RiseopediaSectionsTableProps {
	initialRows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

function sectionIdHref(row: RiseopediaAdminRow, suffix: string): string {
	return `/admin/riseopedia/sections/${toRowKey(readRowValue(row, "section_id"))}/${suffix}`;
}

export default function RiseopediaSectionsTable({
	initialRows,
	meta,
}: RiseopediaSectionsTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/sections"
			idKey="section_id"
			createLabel="Create Section"
			titleCreate="Create Riseopedia Section"
			titleEdit="Edit Riseopedia Section"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete Riseopedia section?"
			deleteConfirmMessage={(row) => `Delete section "${String(row.section_name ?? row.section_code ?? row.section_id)}"?`}
			emptyText="No Riseopedia sections match your search."
			searchPlaceholder="Search sections"
			defaultSortKey="sort_order"
			rowActions={[
				{
					label: "Rules",
					href: (row) => sectionIdHref(row, "rules"),
					variant: "neutral",
				},
				{
					label: "Overrides",
					href: (row) => sectionIdHref(row, "manual-overrides"),
					variant: "neutral",
				},
			]}
			columns={[
				{ rowKey: "section_name", label: "Name", strong: true },
				{ rowKey: "section_code", label: "Code" },
				{ rowKey: "section_slug", label: "Slug" },
				{ rowKey: "section_mode_name", label: "Mode" },
				{ rowKey: "public_item_count", label: "Items", kind: "count" },
				{ rowKey: "public_visible_flag", label: "Public", kind: "boolean" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={[
				{ valueKey: "sectionCode", rowKey: "section_code", label: "Code", type: "text", required: true },
				{ valueKey: "sectionSlug", rowKey: "section_slug", label: "Slug", type: "text", required: true },
				{ valueKey: "sectionName", rowKey: "section_name", label: "Name", type: "text", required: true },
				{
					valueKey: "sectionModeCode",
					rowKey: "section_mode_code",
					label: "Mode",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.sectionModes ?? [], "section_mode_code", "section_mode_name"),
				},
				{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 4 },
				{ valueKey: "publicVisible", rowKey: "public_visible_flag", label: "Publicly visible", type: "checkbox", defaultValue: true },
				{ valueKey: "showWhenEmpty", rowKey: "show_when_empty_flag", label: "Show when empty", type: "checkbox", defaultValue: false },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
			]}
		/>
	);
}
