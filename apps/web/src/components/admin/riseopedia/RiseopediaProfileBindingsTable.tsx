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
	allBindings?: RiseopediaAdminRow[];
}

const ALL_OPTION: RiseopediaAdminOption = { value: "*", label: "All (*)" };

function getSelectorKindEntityType(row: RiseopediaAdminRow): string {
	return toDisplayText(readRowValue(row, "entity_type_code")).trim();
}

function isSelectorKindAllowedForEntity(args: {
	selectorKindCode: string;
	selectorKindEntityTypeCode: string;
	entityTypeCode: string;
}): boolean {
	if (!args.selectorKindCode || !args.entityTypeCode) {
		return false;
	}

	if (args.selectorKindEntityTypeCode) {
		return args.selectorKindEntityTypeCode === args.entityTypeCode;
	}

	if (args.selectorKindCode === "all") {
		return true;
	}

	if (args.selectorKindCode === "asset_class") {
		return args.entityTypeCode === "asset";
	}

	if (args.selectorKindCode === "recipe_bench") {
		return args.entityTypeCode === "recipe";
	}

	return args.selectorKindCode.startsWith(`${args.entityTypeCode}_`);
}

function buildSelectorKindOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
}): RiseopediaAdminOption[] {
	const entityTypeCode = toDisplayText(args.values.entityTypeCode).trim();
	const currentValue = args.row
		? readRowValue(args.row, "profile_selector_kind_code")
		: null;

	if (!entityTypeCode) {
		return ensureOption([], currentValue, currentValue);
	}

	const optionsByValue = new Map<string, RiseopediaAdminOption>();
	const options = (args.meta.profileSelectorKinds ?? [])
		.filter((selectorKind) => {
			const selectorKindCode = toDisplayText(
				readRowValue(selectorKind, "profile_selector_kind_code"),
			).trim();
			const selectorKindEntityTypeCode = getSelectorKindEntityType(selectorKind);
			return isSelectorKindAllowedForEntity({
				selectorKindCode,
				selectorKindEntityTypeCode,
				entityTypeCode,
			});
		})
		.map((selectorKind) => {
			const value = toDisplayText(
				readRowValue(selectorKind, "profile_selector_kind_code"),
			).trim();
			const label = toDisplayText(
				readRowValue(selectorKind, "profile_selector_kind_name"),
			).trim();
			return value.length > 0 ? { value, label: label || value } : null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));

	for (const option of options) {
		if (!optionsByValue.has(option.value)) {
			optionsByValue.set(option.value, option);
		}
	}

	return ensureOption(
		Array.from(optionsByValue.values()),
		currentValue,
		currentValue,
	);
}

function getScopedProfileId(
	displayProfile: RiseopediaAdminRow | null | undefined,
): string {
	return toDisplayText(
		displayProfile ? readRowValue(displayProfile, "display_profile_id") : null,
	);
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
	return toDisplayText(
		profile ? readRowValue(profile, "entity_type_code") : null,
	);
}

function isBindingAlreadyUsed(args: {
	bindings: RiseopediaAdminRow[];
	currentBindingId: string;
	entityTypeCode: string;
	selectorKindCode: string;
	selectorValue: string;
}): boolean {
	if (!args.entityTypeCode || !args.selectorKindCode || !args.selectorValue) {
		return false;
	}

	return args.bindings.some((binding) => {
		const bindingId = toDisplayText(
			readRowValue(binding, "display_profile_binding_id"),
		).trim();
		if (bindingId && bindingId === args.currentBindingId) {
			return false;
		}

		return (
			toDisplayText(readRowValue(binding, "entity_type_code")).trim() ===
				args.entityTypeCode &&
			toDisplayText(readRowValue(binding, "profile_selector_kind_code")).trim() ===
				args.selectorKindCode &&
			toDisplayText(readRowValue(binding, "selector_value")).trim() ===
				args.selectorValue
		);
	});
}

function buildSelectorValueOptions(args: {
	meta: RiseopediaAdminMeta;
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
	bindings: RiseopediaAdminRow[];
}): RiseopediaAdminOption[] {
	const entityTypeCode = toDisplayText(args.values.entityTypeCode).trim();
	const selectorKindCode = toDisplayText(
		args.values.profileSelectorKindCode,
	).trim();
	const currentValue = args.row
		? readRowValue(args.row, "selector_value")
		: null;
	const currentBindingId = toDisplayText(
		args.row ? readRowValue(args.row, "display_profile_binding_id") : null,
	).trim();
	const selectorKind = (args.meta.profileSelectorKinds ?? []).find(
		(row) =>
			toDisplayText(readRowValue(row, "profile_selector_kind_code")).trim() ===
			selectorKindCode,
	);
	const selectorKindEntityTypeCode = selectorKind
		? getSelectorKindEntityType(selectorKind)
		: "";

	if (
		!isSelectorKindAllowedForEntity({
			selectorKindCode,
			selectorKindEntityTypeCode,
			entityTypeCode,
		})
	) {
		return ensureOption([], currentValue, currentValue);
	}

	if (selectorKindCode === "all") {
		const options = isBindingAlreadyUsed({
			bindings: args.bindings,
			currentBindingId,
			entityTypeCode,
			selectorKindCode,
			selectorValue: ALL_OPTION.value,
		})
			? []
			: [ALL_OPTION];

		return ensureOption(options, currentValue, currentValue);
	}

	if (selectorKindCode === "asset_class") {
		const options = buildOptionsFromRows(
			args.meta.assetClasses ?? [],
			"asset_class_code",
			"asset_class_name",
		).filter(
			(option) =>
				!isBindingAlreadyUsed({
					bindings: args.bindings,
					currentBindingId,
					entityTypeCode,
					selectorKindCode,
					selectorValue: option.value,
				}),
		);

		return ensureOption(options, currentValue, currentValue);
	}

	if (selectorKindCode === "recipe_bench") {
		const options = buildUniqueCodeOptions(
			args.meta.recipeBenches ?? [],
			"bench_code",
			"bench_name",
		).filter(
			(option) =>
				!isBindingAlreadyUsed({
					bindings: args.bindings,
					currentBindingId,
					entityTypeCode,
					selectorKindCode,
					selectorValue: option.value,
				}),
		);

		return ensureOption(options, currentValue, currentValue);
	}

	return ensureOption([], currentValue, currentValue);
}

function mergeBindingRows(args: {
	allBindings: RiseopediaAdminRow[] | undefined;
	currentRows: RiseopediaAdminRow[];
}): RiseopediaAdminRow[] {
	if (!args.allBindings) {
		return args.currentRows;
	}

	const rowsById = new Map<string, RiseopediaAdminRow>();
	for (const binding of args.allBindings) {
		const bindingId = toDisplayText(
			readRowValue(binding, "display_profile_binding_id"),
		).trim();
		if (bindingId) {
			rowsById.set(bindingId, binding);
		}
	}

	for (const binding of args.currentRows) {
		const bindingId = toDisplayText(
			readRowValue(binding, "display_profile_binding_id"),
		).trim();
		if (bindingId) {
			rowsById.set(bindingId, binding);
		}
	}

	return Array.from(rowsById.values());
}

function buildFields(args: {
	displayProfiles: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
	bindings: RiseopediaAdminRow[];
}): RiseopediaAdminFieldConfig[] {
	const scopedProfileId = getScopedProfileId(args.displayProfile);
	const profileOptions = args.displayProfile
		? buildOptionsFromRows(
				[args.displayProfile],
				"display_profile_id",
				"display_profile_name",
			)
		: buildOptionsFromRows(
				args.displayProfiles,
				"display_profile_id",
				"display_profile_name",
			);

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
				setValue(
					"entityTypeCode",
					toDisplayText(
						selectedProfile ? readRowValue(selectedProfile, "entity_type_code") : "",
					),
				);
				setValue("profileSelectorKindCode", "");
				setValue("selectorValue", "");
			},
		},
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			required: true,
			defaultValue: args.displayProfile
				? readRowValue(args.displayProfile, "entity_type_code")
				: undefined,
			options: (values) => {
				const profileEntityType = getProfileEntityType({
					displayProfiles: args.displayProfiles,
					displayProfile: args.displayProfile,
					values,
				});
				const options = buildOptionsFromRows(
					args.meta.entityTypes ?? [],
					"entity_type_code",
					"entity_type_name",
				);
				return profileEntityType
					? options.filter((option) => option.value === profileEntityType)
					: options;
			},
			onChange: ({ setValue }) => {
				setValue("profileSelectorKindCode", "");
				setValue("selectorValue", "");
			},
		},
		{
			valueKey: "profileSelectorKindCode",
			rowKey: "profile_selector_kind_code",
			label: "Selector kind",
			type: "select",
			required: true,
			options: (values) =>
				buildSelectorKindOptions({ meta: args.meta, values, row: args.row }),
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
			helpText:
				"Choose * for all or a supported value for the selector kind. Bindings already used by another profile are hidden.",
			options: (values) =>
				buildSelectorValueOptions({
					meta: args.meta,
					values,
					row: args.row,
					bindings: args.bindings,
				}),
		},
		{
			valueKey: "priorityOrder",
			rowKey: "priority_order",
			label: "Priority",
			type: "number",
			defaultValue: 1000,
			required: true,
		},
		{
			valueKey: "active",
			rowKey: "active_flag",
			label: "Active",
			type: "checkbox",
			defaultValue: true,
		},
		{
			valueKey: "adminNote",
			rowKey: "admin_note",
			label: "Admin note",
			type: "textarea",
			textareaRows: 4,
		},
	];
}

export default function RiseopediaProfileBindingsTable({
	initialRows,
	displayProfiles,
	meta,
	displayProfile = null,
	allBindings,
}: RiseopediaProfileBindingsTableProps): JSX.Element {
	const initialBindingRows = mergeBindingRows({
		allBindings,
		currentRows: initialRows,
	});
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row, rows }) =>
		buildFields({
			displayProfiles,
			meta,
			displayProfile,
			row,
			bindings: mergeBindingRows({ allBindings, currentRows: rows }),
		});

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={
				displayProfile
					? `/api/admin/riseopedia/profile-bindings?displayProfileId=${getScopedProfileId(displayProfile)}`
					: "/api/admin/riseopedia/profile-bindings"
			}
			idKey="display_profile_binding_id"
			createLabel="Create Binding"
			titleCreate="Create Profile Binding"
			titleEdit="Edit Profile Binding"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete profile binding?"
			deleteConfirmMessage={(row) =>
				`Delete binding "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.selector_value ?? "")}"?`
			}
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
			fields={buildFields({
				displayProfiles,
				meta,
				displayProfile,
				row: null,
				bindings: initialBindingRows,
			})}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
