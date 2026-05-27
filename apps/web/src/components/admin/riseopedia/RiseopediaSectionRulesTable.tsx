//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionRulesTable.tsx                             ////
//// Language: TSX                                                                                               ////
//// Riseopedia automatic section rules admin table and scoped panel wrapper.                                    ////
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
	toDisplayText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaSectionRulesTableProps {
	initialRows: RiseopediaAdminRow[];
	sections: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	section?: RiseopediaAdminRow | null;
}

const ALL_OPTION: RiseopediaAdminOption = { value: "*", label: "All (*)" };

function getScopedSectionId(section: RiseopediaAdminRow | null | undefined): string {
	return toDisplayText(section ? readRowValue(section, "section_id") : null);
}

function buildRuleValueOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const ruleKindCode = toDisplayText(args.values.ruleKindCode).trim();
	if (ruleKindCode === "all") {
		return ensureOption([ALL_OPTION], readRowValue(args.row ?? {}, "rule_value"), readRowValue(args.row ?? {}, "rule_value"));
	}

	if (ruleKindCode === "asset_class") {
		return ensureOption(
			buildOptionsFromRows(args.meta.assetClasses ?? [], "asset_class_code", "asset_class_name"),
			readRowValue(args.row ?? {}, "rule_value"),
			readRowValue(args.row ?? {}, "rule_value"),
		);
	}

	return ensureOption([], readRowValue(args.row ?? {}, "rule_value"), readRowValue(args.row ?? {}, "rule_value"));
}

function buildFields(args: {
	sections: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	section: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminFieldConfig[] {
	const scopedSectionId = getScopedSectionId(args.section);
	const sectionOptions = args.section
		? buildOptionsFromRows([args.section], "section_id", "section_name")
		: buildOptionsFromRows(args.sections, "section_id", "section_name");

	return [
		{
			valueKey: "sectionId",
			rowKey: "section_id",
			label: "Section",
			type: "select",
			required: true,
			defaultValue: scopedSectionId,
			hidden: scopedSectionId.length > 0,
			options: sectionOptions,
		},
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.entityTypes ?? [], "entity_type_code", "entity_type_name"),
		},
		{
			valueKey: "ruleKindCode",
			rowKey: "rule_kind_code",
			label: "Rule kind",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.ruleKinds ?? [], "rule_kind_code", "rule_kind_name"),
			onChange: ({ value, setValue }) => {
				if (value === "all") {
					setValue("ruleValue", "*");
					return;
				}

				setValue("ruleValue", "");
			},
		},
		{
			valueKey: "ruleValue",
			rowKey: "rule_value",
			label: "Rule value",
			type: "select",
			required: true,
			helpText: "Choose * for all or a supported selector value for the selected rule kind.",
			options: (values) => buildRuleValueOptions({ meta: args.meta, values, row: args.row }),
		},
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
		{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
	];
}

export default function RiseopediaSectionRulesTable({
	initialRows,
	sections,
	meta,
	section = null,
}: RiseopediaSectionRulesTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row }) =>
		buildFields({ sections, meta, section, row });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={section ? `/api/admin/riseopedia/section-rules?sectionId=${getScopedSectionId(section)}` : "/api/admin/riseopedia/section-rules"}
			idKey="section_entity_rule_id"
			createLabel="Create Rule"
			titleCreate="Create Section Rule"
			titleEdit="Edit Section Rule"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete section rule?"
			deleteConfirmMessage={(row) => `Delete rule "${String(row.section_name ?? row.section_id)} / ${String(row.rule_value ?? "")}"?`}
			emptyText="No Riseopedia section rules match your search."
			searchPlaceholder="Search rules"
			defaultSortKey={section ? "sort_order" : "section_name"}
			filters={section ? [] : [
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
			fields={buildFields({ sections, meta, section, row: null })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
