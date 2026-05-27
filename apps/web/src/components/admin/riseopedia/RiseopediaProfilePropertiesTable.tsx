//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfilePropertiesTable.tsx                        ////
//// Language: TSX                                                                                               ////
//// Riseopedia display profile property placement admin table and scoped panel wrapper.                         ////
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

export interface RiseopediaProfilePropertiesTableProps {
	initialRows: RiseopediaAdminRow[];
	displayProfiles: RiseopediaAdminRow[];
	propertyCatalog: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
}

function getScopedProfileId(displayProfile: RiseopediaAdminRow | null | undefined): string {
	return toDisplayText(displayProfile ? readRowValue(displayProfile, "display_profile_id") : null);
}

function findProfile(args: {
	displayProfiles: RiseopediaAdminRow[];
	displayProfile: RiseopediaAdminRow | null | undefined;
	values: { [key: string]: unknown };
}): RiseopediaAdminRow | null {
	if (args.displayProfile) {
		return args.displayProfile;
	}

	const profileId = toDisplayText(args.values.displayProfileId).trim();
	return args.displayProfiles.find(
		(row) => toDisplayText(readRowValue(row, "display_profile_id")) === profileId,
	) ?? null;
}

function isAlreadySelectedProperty(args: {
	row: RiseopediaAdminRow;
	displayProfileId: string;
	propertyCatalogId: string;
	currentId: string;
}): boolean {
	const rowId = toDisplayText(readRowValue(args.row, "display_profile_property_id"));
	if (rowId && rowId === args.currentId) {
		return false;
	}

	return (
		toDisplayText(readRowValue(args.row, "display_profile_id")) === args.displayProfileId &&
		toDisplayText(readRowValue(args.row, "property_catalog_id")) === args.propertyCatalogId
	);
}

function getPropertyLabel(property: RiseopediaAdminRow): string {
	const value = toDisplayText(readRowValue(property, "property_catalog_id")).trim();
	const label = toDisplayText(readRowValue(property, "property_name")).trim();
	const code = toDisplayText(readRowValue(property, "property_code")).trim();
	return code ? `${label || value} · ${code}` : label || value;
}

function buildPropertyOptions(args: {
	displayProfiles: RiseopediaAdminRow[];
	displayProfile: RiseopediaAdminRow | null | undefined;
	propertyCatalog: RiseopediaAdminRow[];
	rows: RiseopediaAdminRow[];
	values: { [key: string]: unknown };
	row: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
}): RiseopediaAdminOption[] {
	const profile = findProfile({
		displayProfiles: args.displayProfiles,
		displayProfile: args.displayProfile,
		values: args.values,
	});
	const displayProfileId = toDisplayText(profile ? readRowValue(profile, "display_profile_id") : args.values.displayProfileId).trim();
	const entityTypeCode = toDisplayText(profile ? readRowValue(profile, "entity_type_code") : null).trim();
	const currentId = toDisplayText(args.row ? readRowValue(args.row, "display_profile_property_id") : null);
	const currentPropertyId = args.row ? readRowValue(args.row, "property_catalog_id") : null;
	const currentPropertyLabel = args.row ? readRowValue(args.row, "property_name") : null;

	if (!displayProfileId || !entityTypeCode) {
		return ensureOption([], currentPropertyId, currentPropertyLabel);
	}

	const candidateProperties = (args.meta.profilePropertyOptions ?? []).filter(
		(property) =>
			toDisplayText(readRowValue(property, "display_profile_id")) === displayProfileId &&
			toDisplayText(readRowValue(property, "entity_type_code")) === entityTypeCode,
	);

	const baseOptions = candidateProperties
		.filter((property) => {
			const propertyCatalogId = toDisplayText(readRowValue(property, "property_catalog_id"));
			return !args.rows.some((candidate) =>
				isAlreadySelectedProperty({
					row: candidate,
					displayProfileId,
					propertyCatalogId,
					currentId,
				}),
			);
		})
		.map((property) => {
			const value = toDisplayText(readRowValue(property, "property_catalog_id")).trim();
			return value.length > 0 ? { value, label: getPropertyLabel(property) } : null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));

	return ensureOption(baseOptions, currentPropertyId, currentPropertyLabel);
}

function findPropertyCatalogRow(args: {
	propertyCatalog: RiseopediaAdminRow[];
	propertyCatalogId: unknown;
}): RiseopediaAdminRow | null {
	const selectedId = toDisplayText(args.propertyCatalogId).trim();
	if (!selectedId) {
		return null;
	}

	return args.propertyCatalog.find(
		(row) => toDisplayText(readRowValue(row, "property_catalog_id")) === selectedId,
	) ?? null;
}

function buildFields(args: {
	displayProfiles: RiseopediaAdminRow[];
	propertyCatalog: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
	displayProfile: RiseopediaAdminRow | null | undefined;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
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
			onChange: ({ setValue }) => setValue("propertyCatalogId", ""),
		},
		{
			valueKey: "propertyCatalogId",
			rowKey: "property_catalog_id",
			label: "Property",
			type: "select",
			required: true,
			helpText: "Only active properties available to this profile through its bindings are shown. Already-used properties are hidden.",
			options: (values) => buildPropertyOptions({
				displayProfiles: args.displayProfiles,
				displayProfile: args.displayProfile,
				propertyCatalog: args.propertyCatalog,
				rows: args.rows,
				values,
				row: args.row,
				meta: args.meta,
			}),
			onChange: ({ value, setValue }) => {
				const property = findPropertyCatalogRow({
					propertyCatalog: args.propertyCatalog,
					propertyCatalogId: value,
				});
				if (!property) {
					return;
				}

				const defaultSlot = toDisplayText(readRowValue(property, "default_display_slot_code")).trim();
				const defaultGroup = toDisplayText(readRowValue(property, "default_group_code")).trim();
				if (defaultSlot) {
					setValue("displaySlotCode", defaultSlot);
				}
				if (defaultGroup) {
					setValue("groupCode", defaultGroup);
				}
			},
		},
		{
			valueKey: "displaySlotCode",
			rowKey: "display_slot_code",
			label: "Display slot",
			type: "select",
			required: true,
			options: buildOptionsFromRows(args.meta.displaySlots ?? [], "display_slot_code", "display_slot_name"),
		},
		{ valueKey: "groupCode", rowKey: "group_code", label: "Group", type: "text", required: true, defaultValue: "general" },
		{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
		{ valueKey: "visible", rowKey: "visible_flag", label: "Visible", type: "checkbox", defaultValue: true },
		{ valueKey: "compact", rowKey: "compact_flag", label: "Compact", type: "checkbox", defaultValue: false },
		{ valueKey: "featured", rowKey: "featured_flag", label: "Featured", type: "checkbox", defaultValue: false },
		{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
		{ valueKey: "adminNote", rowKey: "admin_note", label: "Admin note", type: "textarea", textareaRows: 4 },
	];
}

export default function RiseopediaProfilePropertiesTable({
	initialRows,
	displayProfiles,
	propertyCatalog,
	meta,
	displayProfile = null,
}: RiseopediaProfilePropertiesTableProps): JSX.Element {
	const fieldsBuilder: RiseopediaAdminFieldsBuilder = ({ row, rows }) =>
		buildFields({ displayProfiles, propertyCatalog, meta, displayProfile, row, rows });

	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath={displayProfile ? `/api/admin/riseopedia/profile-properties?displayProfileId=${getScopedProfileId(displayProfile)}` : "/api/admin/riseopedia/profile-properties"}
			idKey="display_profile_property_id"
			createLabel="Create Placement"
			titleCreate="Create Profile Property Placement"
			titleEdit="Edit Profile Property Placement"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete profile property placement?"
			deleteConfirmMessage={(row) => `Delete property placement "${String(row.display_profile_name ?? row.display_profile_id)} / ${String(row.effective_label ?? row.property_name ?? "")}"?`}
			emptyText="No profile property placements match your search."
			searchPlaceholder="Search profile properties"
			defaultSortKey={displayProfile ? "display_slot_name" : "display_profile_name"}
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
			fields={buildFields({ displayProfiles, propertyCatalog, meta, displayProfile, row: null, rows: initialRows })}
			fieldsBuilder={fieldsBuilder}
		/>
	);
}
