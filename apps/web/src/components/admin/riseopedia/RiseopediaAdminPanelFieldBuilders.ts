//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminPanelFieldBuilders.ts                          ////
//// Language: TS                                                                                                ////
//// Dedicated Riseopedia admin panel field builders owned by each table family.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
	ADMIN_NOTE_FIELD,
	BOOLEAN_ACTIVE_FIELD,
	COMPACT_FIELD,
	VISIBLE_FIELD,
	buildBuiltinFieldOptions,
	buildEntityOptions,
	buildOptionsFromRows,
	buildOverviewCardSlotOptions,
	buildPatchOptions,
	buildPropertyOptions,
	buildRuleSetOptions,
	buildScopedProfileOptions,
	buildSectionOptions,
	buildRenderingChannelOptions,
	classificationFields,
	displaySourceTypeField,
	filterOverviewCardPropertyRows,
	filterProfilePropertyRows,
	idText,
	isBuiltinSourceType,
	isPropertySourceType,
	optionRows,
	overviewCardRuleSetFields,
} from "./RiseopediaAdminConfigHelpers";
import {
	readRowValue,
	toDisplayText,
} from "./RiseopediaAdminHelpers";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export function buildRiseopediaDisplayProfileFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: "channelCode", rowKey: "channel_code", label: "Channel", type: "select", required: true, defaultValue: "riseopedia", options: buildRenderingChannelOptions(meta) },
		{ valueKey: "displayProfileCode", rowKey: "display_profile_code", label: "Code", type: "text", required: true, readOnlyOnEdit: true },
		{ valueKey: "displayProfileName", rowKey: "display_profile_name", label: "Name", type: "text", required: true },
		{ valueKey: "entityTypeCode", rowKey: "entity_type_code", label: "Entity type", type: "select", required: true, options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name") },
		{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 3, span: 12 },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000 },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaProfileBindingFields(args: {
	displayProfiles: RiseopediaAdminRows;
	displayProfile?: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
}): RiseopediaAdminFieldConfig[] {
	const scopedProfileId = args.displayProfile ? idText(args.displayProfile.display_profile_id) : "";
	return [
		{
			valueKey: "displayProfileId",
			rowKey: "display_profile_id",
			label: "Display profile",
			type: "select",
			required: true,
			defaultValue: scopedProfileId,
			readOnlyOnEdit: Boolean(args.displayProfile),
			options: buildScopedProfileOptions(args.displayProfiles, args.displayProfile),
			isDisabled: () => Boolean(args.displayProfile),
		},
		...classificationFields(args.meta),
		{ valueKey: "priorityOrder", rowKey: "priority_order", label: "Priority", type: "number", defaultValue: 1000 },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaProfileElementFields(args: {
	displayProfiles: RiseopediaAdminRows;
	displayProfile?: RiseopediaAdminRow | null;
	allBindings?: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRows;
}): RiseopediaAdminFieldConfig[] {
	const scopedProfileId = args.displayProfile ? idText(args.displayProfile.display_profile_id) : "";
	return [
		{
			valueKey: "displayProfileId",
			rowKey: "display_profile_id",
			label: "Display profile",
			type: "select",
			required: true,
			defaultValue: scopedProfileId,
			readOnlyOnEdit: Boolean(args.displayProfile),
			options: buildScopedProfileOptions(args.displayProfiles, args.displayProfile),
			isDisabled: () => Boolean(args.displayProfile),
		},
		{ valueKey: "displaySlotCode", rowKey: "display_slot_code", label: "Display slot", type: "select", required: true, options: buildOptionsFromRows(args.meta.displaySlots ?? [], "display_slot_code", "display_slot_name") },
		displaySourceTypeField(args.meta),
		{
			valueKey: "sourceValue",
			rowKey: "property_code",
			readValue: (sourceRow) => isBuiltinSourceType(sourceRow.source_type_code) ? sourceRow.builtin_field_code : sourceRow.property_code,
			label: "Property",
			type: "select",
			required: true,
			options: (values) => isBuiltinSourceType(values.sourceTypeCode)
				? buildBuiltinFieldOptions({ rows: args.meta.builtinDisplayFields, usedRows: args.rows, currentRow: args.row, ownerKey: "display_profile_id", ownerValue: values.displayProfileId })
				: buildPropertyOptions({ rows: filterProfilePropertyRows({ propertyRows: args.meta.propertyOptions, displayProfiles: args.displayProfiles, bindings: args.allBindings, displayProfileId: values.displayProfileId }), usedRows: args.rows, currentRow: args.row, ownerKey: "display_profile_id", ownerValue: values.displayProfileId, usedKey: "property_code" }),
		},
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sorting order", type: "number", defaultValue: 1000 },
		{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
		VISIBLE_FIELD,
		BOOLEAN_ACTIVE_FIELD,
		{ valueKey: "featured", rowKey: "featured_flag", label: "Featured", type: "checkbox", defaultValue: false },
		COMPACT_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaProfileVariantSelectorFields(args: {
	displayProfiles: RiseopediaAdminRows;
	displayProfile?: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRows;
}): RiseopediaAdminFieldConfig[] {
	const scopedProfileId = args.displayProfile ? idText(args.displayProfile.display_profile_id) : "";
	const currentValue = args.row ? idText(args.row.variant_group_code) : "";
	const used = new Set(
		args.rows
			.filter((usedRow) => !scopedProfileId || idText(usedRow.display_profile_id) === scopedProfileId)
			.map((usedRow) => idText(usedRow.variant_group_code))
			.filter((value) => value && value !== currentValue),
	);

	return [
		{
			valueKey: "displayProfileId",
			rowKey: "display_profile_id",
			label: "Display profile",
			type: "select",
			required: true,
			defaultValue: scopedProfileId,
			readOnlyOnEdit: Boolean(args.displayProfile),
			options: buildScopedProfileOptions(args.displayProfiles, args.displayProfile),
			isDisabled: () => Boolean(args.displayProfile),
		},
		{
			valueKey: "variantGroupCode",
			rowKey: "variant_group_code",
			label: "Variant group",
			type: "select",
			required: true,
			options: optionRows(args.meta.variantGroups)
				.filter((variantGroup) => !used.has(idText(variantGroup.variant_group_code)))
				.map((variantGroup) => ({
					value: idText(variantGroup.variant_group_code),
					label: idText(variantGroup.variant_group_name) || idText(variantGroup.variant_group_code),
				})),
		},
		{ valueKey: "selectorLabelOverride", rowKey: "selector_label_override", label: "Label override", type: "text" },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000 },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaSectionFields(): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: "sectionCode", rowKey: "section_code", label: "Code", type: "text", required: true, readOnlyOnEdit: true },
		{ valueKey: "sectionSlug", rowKey: "section_slug", label: "Slug", type: "text", required: true },
		{ valueKey: "sectionName", rowKey: "section_name", label: "Name", type: "text", required: true },
		{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 3, span: 12 },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000 },
		BOOLEAN_ACTIVE_FIELD,
	];
}

export function buildRiseopediaSectionRuleFields(args: {
	sections: RiseopediaAdminRows;
	section?: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
}): RiseopediaAdminFieldConfig[] {
	const scopedSectionId = args.section ? idText(args.section.section_id) : "";
	return [
		{ valueKey: "sectionId", rowKey: "section_id", label: "Section", type: "select", required: true, defaultValue: scopedSectionId, readOnlyOnEdit: Boolean(args.section), options: buildSectionOptions(args.sections) },
		...classificationFields(args.meta),
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000 },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaOverviewCardRuleSetFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return overviewCardRuleSetFields(meta);
}

export function buildRiseopediaOverviewCardRuleElementFields(args: {
	ruleSets: RiseopediaAdminRows;
	ruleSet?: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRows;
}): RiseopediaAdminFieldConfig[] {
	const scopedRuleSetId = args.ruleSet ? idText(args.ruleSet.overview_card_rule_set_id) : "";
	return [
		{ valueKey: "overviewCardRuleSetId", rowKey: "overview_card_rule_set_id", label: "Rule set", type: "select", required: true, defaultValue: scopedRuleSetId, readOnlyOnEdit: Boolean(args.ruleSet), options: args.ruleSet ? buildRuleSetOptions([args.ruleSet]) : buildRuleSetOptions(args.ruleSets), isDisabled: () => Boolean(args.ruleSet) },
		{ valueKey: "displaySlotCode", rowKey: "display_slot_code", label: "Display slot", type: "select", required: true, options: (values) => buildOverviewCardSlotOptions({ rows: args.meta.overviewCardDisplaySlots, ruleSet: args.ruleSet ?? args.ruleSets.find((candidate) => idText(candidate.overview_card_rule_set_id) === idText(values.overviewCardRuleSetId)) ?? null, usedRows: args.rows, currentRow: args.row, ownerValue: values.overviewCardRuleSetId }) },
		displaySourceTypeField(args.meta),
		{ valueKey: "propertyCode", rowKey: "property_code", label: "Property", type: "select", required: true, visible: (values) => isPropertySourceType(values.sourceTypeCode), options: (values) => buildPropertyOptions({ rows: filterOverviewCardPropertyRows({ propertyRows: args.meta.propertyOptions, ruleSet: args.ruleSet ?? args.ruleSets.find((candidate) => idText(candidate.overview_card_rule_set_id) === idText(values.overviewCardRuleSetId)) ?? null, meta: args.meta }), usedRows: args.rows, currentRow: args.row, ownerKey: "overview_card_rule_set_id", ownerValue: values.overviewCardRuleSetId, usedKey: "property_code" }) },
		{ valueKey: "builtinFieldCode", rowKey: "builtin_field_code", label: "Builtin field", type: "select", required: true, visible: (values) => isBuiltinSourceType(values.sourceTypeCode), options: (values) => buildBuiltinFieldOptions({ rows: args.meta.builtinDisplayFields, usedRows: args.rows, currentRow: args.row, ownerKey: "overview_card_rule_set_id", ownerValue: values.overviewCardRuleSetId }) },
		{ valueKey: "labelOverride", rowKey: "label_override", label: "Label override", type: "text" },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaPatchChannelFields(): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: "channelCode", rowKey: "channel_code", label: "Channel code", type: "text", required: true, readOnlyOnEdit: true },
		{ valueKey: "channelName", rowKey: "channel_name", label: "Channel name", type: "text", required: true },
		{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 3, span: 12 },
		{ valueKey: "isPublic", rowKey: "is_public", label: "Public", type: "checkbox", defaultValue: true },
		BOOLEAN_ACTIVE_FIELD,
	];
}

export function buildRiseopediaPatchPublicationFields(args: {
	channels: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
}): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: "patchId", rowKey: "patch_id", label: "Patch", type: "select", required: true, options: buildPatchOptions(args.meta.patchOptions) },
		{ valueKey: "channelCode", rowKey: "channel_code", label: "Channel", type: "select", required: true, options: buildOptionsFromRows(args.channels, "channel_code", "channel_name") },
		{ valueKey: "publicationStatusCode", rowKey: "publication_status_code", label: "Status", type: "select", required: true, defaultValue: "active", options: [
			{ value: "active", label: "Enabled" },
			{ value: "disabled", label: "Disabled" },
		] },
		{ valueKey: "validFrom", rowKey: "valid_from", label: "Valid from", type: "text", helpText: "Use ISO timestamp or leave blank for DB default." },
		{ valueKey: "validTo", rowKey: "valid_to", label: "Valid to", type: "text", helpText: "Use ISO timestamp or leave blank for open-ended." },
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaPatchScopeOverrideFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		...classificationFields(meta),
		{ valueKey: "patchId", rowKey: "patch_id", label: "Patch", type: "select", options: buildPatchOptions(meta.patchOptions), visible: (values) => idText(values.actionCode) === "patch_override" },
		{ valueKey: "actionCode", rowKey: "action_code", label: "Action code", type: "select", required: true, defaultValue: "hide", options: [
			{ value: "hide", label: "Hide" },
			{ value: "show", label: "Show" },
			{ value: "patch_override", label: "Patch override" },
		] },
		{ valueKey: "validFrom", rowKey: "valid_from", label: "Valid from", type: "text" },
		{ valueKey: "validTo", rowKey: "valid_to", label: "Valid to", type: "text" },
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function buildRiseopediaReleaseOverrideFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: "entityTypeCode", rowKey: "entity_type_code", label: "Entity type", type: "select", required: true, options: buildOptionsFromRows(meta.entityTypes ?? [], "entity_type_code", "entity_type_name") },
		{ valueKey: "entityId", rowKey: "entity_id", label: "Entity", type: "select", required: true, options: buildEntityOptions(meta.entityOptions) },
		{ valueKey: "patchId", rowKey: "patch_id", label: "Patch", type: "select", options: buildPatchOptions(meta.patchOptions) },
		{ valueKey: "overrideStateCode", rowKey: "override_state_code", label: "Release state", type: "select", required: true, options: buildOptionsFromRows(meta.releaseStates ?? [], "release_state_code", "release_state_name") },
		{ valueKey: "overrideReasonCode", rowKey: "override_reason_code", label: "Reason code", type: "text" },
		{ valueKey: "overrideNote", rowKey: "override_note", label: "Override note", type: "textarea", textareaRows: 3, span: 12 },
		BOOLEAN_ACTIVE_FIELD,
	];
}

function relationshipOptions(meta: RiseopediaAdminMeta): RiseopediaAdminOption[] {
	return optionRows(meta.relationshipTypes)
		.map((row) => {
			const code = toDisplayText(readRowValue(row, "relationship_code")).trim();
			const name = toDisplayText(readRowValue(row, "relationship_name")).trim();
			const family = toDisplayText(readRowValue(row, "relationship_family_code")).trim();
			const suffix = family ? ` · ${family}` : "";
			return code
				? {
						value: code,
						label: `${name || code} (${code})${suffix}`,
				  }
				: null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildRiseopediaRelationshipDisplayRuleFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{
			valueKey: "relationshipCode",
			rowKey: "relationship_code",
			label: "Relationship",
			type: "select",
			required: true,
			readOnlyOnEdit: true,
			options: relationshipOptions(meta),
		},
		{
			valueKey: "perspectiveCode",
			rowKey: "perspective_code",
			label: "Perspective",
			type: "select",
			required: true,
			readOnlyOnEdit: true,
			options: buildOptionsFromRows(
				optionRows(meta.relationshipDisplayPerspectives),
				"perspective_code",
				"perspective_name",
			),
		},
		{
			valueKey: "dependencyBlockCode",
			rowKey: "dependency_block_code",
			label: "Dependency block",
			type: "select",
			required: true,
			options: buildOptionsFromRows(
				optionRows(meta.relationshipDisplayBlocks),
				"dependency_block_code",
				"dependency_block_label",
			),
		},
		{ valueKey: "dependencyBlockLabel", rowKey: "dependency_block_label", label: "Block label", type: "text", required: true },
		{ valueKey: "dependencyKindLabel", rowKey: "dependency_kind_label", label: "Kind label", type: "text" },
		{ valueKey: "sortOrder", rowKey: "sort_order", label: "Sort order", type: "number", defaultValue: 1000 },
		{ valueKey: "active", rowKey: "active_flag", label: "Enabled", type: "checkbox", defaultValue: true },
		{ valueKey: "description", rowKey: "description", label: "Description", type: "textarea", textareaRows: 3, span: 12 },
	];
}
