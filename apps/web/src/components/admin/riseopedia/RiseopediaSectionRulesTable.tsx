//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionRulesTable.tsx                             ////
//// Language: TSX                                                                                               ////
//// Riseopedia automatic section rules admin table and panel wrapper.                                          ////
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

export interface RiseopediaSectionRulesTableProps {
	initialRows: RiseopediaAdminRow[];
	sections: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

export default function RiseopediaSectionRulesTable({
	initialRows,
	sections,
	meta,
}: RiseopediaSectionRulesTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/section-rules"
			idKey="section_entity_rule_id"
			createLabel="Create Rule"
			titleCreate="Create Section Rule"
			titleEdit="Edit Section Rule"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete section rule?"
			deleteConfirmMessage={(row) => `Delete rule "${String(row.section_name ?? row.section_id)} / ${String(row.rule_value ?? "")}"?`}
			emptyText="No Riseopedia section rules match your search."
			searchPlaceholder="Search rules"
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
				{ rowKey: "rule_kind_code", label: "Rule" },
				{ rowKey: "rule_value", label: "Value" },
				{ rowKey: "matched_asset_class_name", label: "Match" },
				{ rowKey: "sort_order", label: "Sort", kind: "count" },
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
				{
					valueKey: "ruleKindCode",
					rowKey: "rule_kind_code",
					label: "Rule kind",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.ruleKinds ?? [], "rule_kind_code", "rule_kind_name"),
				},
				{ valueKey: "ruleValue", rowKey: "rule_value", label: "Rule value", type: "text", required: true, helpText: "Use asset class code, * for all, or a future rule value." },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
				{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
			]}
		/>
	);
}
