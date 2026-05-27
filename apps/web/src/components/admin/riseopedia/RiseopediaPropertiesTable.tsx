//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaPropertiesTable.tsx                               ////
//// Language: TSX                                                                                               ////
//// Riseopedia property catalog admin table and panel wrapper.                                                  ////
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

export interface RiseopediaPropertiesTableProps {
	initialRows: RiseopediaAdminRow[];
	meta: RiseopediaAdminMeta;
}

const dataTypeOptions = [
	{ value: "text", label: "Text" },
	{ value: "integer", label: "Integer" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "enum", label: "Enum" },
	{ value: "color", label: "Color" },
	{ value: "vector2", label: "Vector 2" },
	{ value: "vector3", label: "Vector 3" },
	{ value: "asset_ref", label: "Asset Reference" },
	{ value: "localized_text", label: "Localized Text" },
	{ value: "json", label: "JSON" },
];

export default function RiseopediaPropertiesTable({
	initialRows,
	meta,
}: RiseopediaPropertiesTableProps): JSX.Element {
	return (
		<RiseopediaAdminCrudTable
			initialRows={initialRows}
			apiPath="/api/admin/riseopedia/properties"
			idKey="property_catalog_id"
			createLabel="Create Property"
			titleCreate="Create Property Catalog Row"
			titleEdit="Edit Property Catalog Row"
			deleteLabel="Delete"
			deleteConfirmTitle="Delete property catalog row?"
			deleteConfirmMessage={(row) => `Delete property "${String(row.property_name ?? row.property_code ?? row.property_catalog_id)}"?`}
			emptyText="No Riseopedia properties match your search."
			searchPlaceholder="Search properties"
			defaultSortKey="property_name"
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
				{ rowKey: "property_name", label: "Property", strong: true },
				{ rowKey: "property_code", label: "Code" },
				{ rowKey: "entity_type_code", label: "Entity" },
				{ rowKey: "property_origin_name", label: "Origin" },
				{ rowKey: "source_property_code", label: "Source property" },
				{ rowKey: "source_column_name", label: "Source column" },
				{ rowKey: "default_display_slot_name", label: "Default slot" },
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
				{ valueKey: "propertyCode", rowKey: "property_code", label: "Property code", type: "text", required: true },
				{ valueKey: "propertyName", rowKey: "property_name", label: "Property name", type: "text", required: true },
				{
					valueKey: "propertyOriginCode",
					rowKey: "property_origin_code",
					label: "Origin",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.propertyOrigins ?? [], "property_origin_code", "property_origin_name"),
				},
				{ valueKey: "sourceColumnName", rowKey: "source_column_name", label: "Source column", type: "text", helpText: "Required for column-backed properties." },
				{ valueKey: "sourcePropertyCode", rowKey: "source_property_code", label: "Source property code", type: "text", helpText: "Required for imported asset property rows." },
				{ valueKey: "dataTypeCode", rowKey: "data_type_code", label: "Data type", type: "select", required: true, options: dataTypeOptions },
				{ valueKey: "unitCode", rowKey: "unit_code", label: "Unit", type: "text" },
				{
					valueKey: "defaultDisplaySlotCode",
					rowKey: "default_display_slot_code",
					label: "Default display slot",
					type: "select",
					required: true,
					options: buildOptionsFromRows(meta.displaySlots ?? [], "display_slot_code", "display_slot_name"),
				},
				{ valueKey: "defaultGroupCode", rowKey: "default_group_code", label: "Default group", type: "text", required: true, defaultValue: "general" },
				{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 4 },
				{ valueKey: "defaultVisible", rowKey: "default_visible_flag", label: "Default visible", type: "checkbox", defaultValue: false },
				{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000, required: true },
				{ valueKey: "active", rowKey: "active_flag", label: "Active", type: "checkbox", defaultValue: true },
			]}
		/>
	);
}
