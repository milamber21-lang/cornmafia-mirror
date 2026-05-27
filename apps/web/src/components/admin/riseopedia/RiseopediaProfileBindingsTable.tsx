//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBindingsTable.tsx                          ////
//// Language: TSX                                                                                               ////
//// Riseopedia display profile bindings admin table and scoped panel wrapper.                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import RiseopediaAdminCrudTable, {
	type RiseopediaAdminFieldsBuilder,
} from "./RiseopediaAdminCrudTable";
import {
	buildOptionsFromRows,
	buildUniqueCodeOptions,
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

export interface RiseopediaProfileBindingsTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
}

const ALL_OPTION: RiseopediaAdminOption = { value: "*", label: "All (*)" };

function getScopedProfileId(displayProfile: RiseopediaAdminRow | null | undefined): string {
	return toDisplayText(displayProfile ? readRowValue(displayProfile, "display_profile_id") : null);
}

function getProfileEntityType(args: {
	displayProfiles: RiseopediaAdminRow[];
	displayProfile: RiseopediaAdminRow | null | undefined;
	values: { [key: string]: unknown };
}): string {
	if (args.displayProfile) {
		return toDisplayText(readRowValue(args.displayProfile, "entity_type_code"));
	}

	const profileId = toDisplayText(args.values.displayProfileId).trim();
	const profile = args.displayProfiles.find(
		(row) => toDisplayText(readRowValue(row, "display_profile_id")) === profileId,
	);
	return toDisplayText(profile ? readRowValue(profile, "entity_type_code") : null);
}

function buildSelectorValueOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const selectorKindCode = toDisplayText(args.values.profileSelectorKindCode).trim();
	const currentValue = args.row ? readRowValue(args.row, "selector_value") : null;

	if (selectorKindCode === "all") {
		return ensureOption([ALL_OPTION], currentValue, currentValue);
	}

	if (selectorKindCode === "asset_class") {
		return ensureOption(
			buildOptionsFromRows(args.meta.assetClasses ?? [], "asset_class_code", "asset_class_name"),
			currentValue,
			currentValue,
		);
	}

	if (selectorKindCode === "recipe_bench") {
		return ensureOption(
			buildUniqueCodeOptions(args.meta.recipeBenches ?? [], "bench_code", "bench_name"),
			currentValue,
			currentValue,
		);
	}

	return ensureOption([], currentValue, currentValue);
}

function buildFields(args: {
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
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
			onChange: ({ setValue, value }) => {
				const selectedProfile = args.displayProfiles.find(
					(row) => toDisplayText(readRowValue(row, "display_profile_id")) === value,
				);
				setValue("entityTypeCode", toDisplayText(selectedProfile ? readRowValue(selectedProfile, "entity_type_code") : ""));
				setValue("selectorValue", "");
			},
		},
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			required: true,
			defaultValue: args.displayProfile ? readRowValue(args.displayProfile, "entity_type_code") : undefined,
			options: (values) => {
				const profileEntityType = getProfileEntityType({ displayProfiles: args.displayProfiles, displayProfile: args.displayProfile, values });
				const options = buildOptionsFromRows(args.meta.entityTypes ?? [], "entity_type_code", "entity_type_name");
				return profileEntityType ? options.filter((option) => option.value === profileEntityType) : options;
			},
		},
		{
			valueKey: "profileSelectorKindCode",
			rowKey: "profile_selector_kind_code",
			label: "Selector kind",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.profileSelectorKinds ?? [], "profile_selector_kind_code", "profile_selector_kind_name"),
			onChange: ({ value, setValue }) => {
				if (value === "all") {
					setValue("selectorValue", "*");
					return;
				}

				setValue("selectorValue", "");
			},
		},
		{
			valueKey: "selectorValue",
			rowKey: "selector_value",
			label: "Selector value",
			type: "select",
			required: true,
			helpText: "Choose * for all or a supported value for the selector kind.",
			options: (values) => buildSelectorValueOptions({ meta: args.meta, values, row: args.row }),
		},
		{ valueKey: "priorityOrder", rowKey: "priority_order", label: "Priority", type: "number", defaultValue: 1000, required: true },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
		{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
	];
}

export default function RiseopediaProfileBindingsTable({
	initialRows,
	displayProfiles,
	meta,
	displayProfile = null,
}: RiseopediaProfileBindingsTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row }) =>
		buildFields({ displayProfiles, meta, displayProfile, row });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={displayProfile ? `/api/admin/riseopedia/profile-bindings?displayProfileId=${getScopedProfileId(displayProfile)}` : "/api/admin/riseopedia/profile-bindings"}
			idKey="display_profile_binding_id"
			createLabel="Create Binding"
			titleCreate="Create Profile Binding"
			titleEdit="Edit Profile Binding"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete profile binding?"
			deleteConfirmMessage={(row) => `Delete binding "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.selector_value ?? "")}"?`}
			emptyText="No profile bindings match your search."
			searchPlaceholder="Search profile bindings"
			defaultSortKey={displayProfile ? "priority_order" : "display_profile_name"}
			columns={[
				{ rowKey: "display_profile_name", label: "Profile", strong: true },
				{ rowKey: "entity_type_code", label: "Entity" },
				{ rowKey: "profile_selector_kind_name", label: "Selector" },
				{ rowKey: "selector_value", label: "Value" },
				{ rowKey: "selector_asset_class_name", label: "Asset class" },
				{ rowKey: "priority_order", label: "Priority", kind: "count" },
				{ rowKey: "active_flag", label: "Status", kind: "status" },
			]}
			fields={buildFields({ displayProfiles, meta, displayProfile, row: null })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
