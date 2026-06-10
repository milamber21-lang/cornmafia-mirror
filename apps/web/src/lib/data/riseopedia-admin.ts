//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-admin.ts                                                         ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia admin read and mutation helpers for rebuilt admin contracts.                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type DbRow = {
	[column: string]: unknown;
};

type IdRow = {
	[column: string]: string | number | null;
};

export type RiseopediaAdminRows = DbRow[];

export type RiseopediaAdminMeta = {
	entityTypes: RiseopediaAdminRows;
	entityClasses: RiseopediaAdminRows;
	entityCategories: RiseopediaAdminRows;
	entitySubcategories: RiseopediaAdminRows;
	entityOptions: RiseopediaAdminRows;
	propertyOptions: RiseopediaAdminRows;
	renderingChannels: RiseopediaAdminRows;
	variantGroups: RiseopediaAdminRows;
	variantGroupScopes: RiseopediaAdminRows;
	patchOptions: RiseopediaAdminRows;
	releaseStates: RiseopediaAdminRows;
	displaySlots: RiseopediaAdminRows;
	displayElementSourceTypes: RiseopediaAdminRows;
	builtinDisplayFields: RiseopediaAdminRows;
	displayElementSourceOptions: RiseopediaAdminRows;
	overviewCardPlacements: RiseopediaAdminRows;
	overviewCardModes: RiseopediaAdminRows;
	overviewCardDisplaySlots: RiseopediaAdminRows;
	sections: RiseopediaAdminRows;
	sectionClassificationRules: RiseopediaAdminRows;
	relationshipTypes: RiseopediaAdminRows;
	relationshipDisplayBlocks: RiseopediaAdminRows;
	relationshipDisplayPerspectives: RiseopediaAdminRows;
};

export type RiseopediaDisplayProfileAdminRows = {
	profiles: RiseopediaAdminRows;
	bindings: RiseopediaAdminRows;
	properties: RiseopediaAdminRows;
	variantSelectors: RiseopediaAdminRows;
};

export type RiseopediaSectionAdminRows = {
	sections: RiseopediaAdminRows;
	classificationRules: RiseopediaAdminRows;
};

export type RiseopediaOverviewCardAdminRows = {
	placements: RiseopediaAdminRows;
	displaySlots: RiseopediaAdminRows;
	ruleSets: RiseopediaAdminRows;
	ruleElements: RiseopediaAdminRows;
};

export type RiseopediaPatchAdminRows = {
	channels: RiseopediaAdminRows;
	publications: RiseopediaAdminRows;
	scopeOverrides: RiseopediaAdminRows;
};

export type RiseopediaReleaseAdminRows = {
	decisions: RiseopediaAdminRows;
	evidence: RiseopediaAdminRows;
	overrides: RiseopediaAdminRows;
};

export type RiseopediaRelationshipDisplayRuleAdminRows = {
	rules: RiseopediaAdminRows;
};

function toPositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

function firstId(resultRows: IdRow[], column: string): number | null {
	return toPositiveInt(resultRows[0]?.[column]);
}

export async function listRiseopediaAdminMeta(): Promise<RiseopediaAdminMeta> {
	const [
		entityTypes,
		entityClasses,
		entityCategories,
		entitySubcategories,
		entityOptions,
		propertyOptions,
		renderingChannels,
		variantGroups,
		variantGroupScopes,
		patchOptions,
		releaseStates,
		displaySlots,
		displayElementSourceTypes,
		builtinDisplayFields,
		displayElementSourceOptions,
		overviewCardPlacements,
		overviewCardModes,
		overviewCardDisplaySlots,
		sections,
		sectionClassificationRules,
		relationshipTypes,
		relationshipDisplayBlocks,
		relationshipDisplayPerspectives,
	] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_type_options ORDER BY sort_order, entity_type_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_class_options ORDER BY entity_type_code, sort_order, entity_class_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_category_options ORDER BY entity_type_code, entity_class_name, sort_order, entity_category_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_subcategory_options ORDER BY entity_type_code, entity_class_name, entity_category_name, sort_order, entity_subcategory_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_options ORDER BY entity_type_code, entity_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_property_options ORDER BY entity_type_code, entity_class_name NULLS FIRST, display_order, property_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_rendering_channels ORDER BY sort_order, channel_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_variant_group_options ORDER BY sort_order, variant_group_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_variant_group_scope_options ORDER BY entity_type_code, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST, variant_group_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_patch_options ORDER BY created_dt DESC, patch_code DESC`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_release_state_options ORDER BY sort_order, release_state_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_slots ORDER BY sort_order, display_slot_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_element_source_types ORDER BY sort_order, source_type_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_builtin_display_fields ORDER BY sort_order, builtin_field_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_element_source_options ORDER BY source_type_code, sort_order, source_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_placements ORDER BY sort_order, placement_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_modes ORDER BY sort_order, card_mode_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_display_slots ORDER BY sort_order, display_slot_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_sections ORDER BY sort_order, section_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_section_classification_rules ORDER BY section_name, sort_order, entity_type_code, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_relationship_type_options ORDER BY sort_order, relationship_name, relationship_code`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_relationship_display_block_options ORDER BY sort_order, dependency_block_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_relationship_display_perspective_options ORDER BY sort_order, perspective_name`),
	]);

	return {
		entityTypes: entityTypes.rows,
		entityClasses: entityClasses.rows,
		entityCategories: entityCategories.rows,
		entitySubcategories: entitySubcategories.rows,
		entityOptions: entityOptions.rows,
		propertyOptions: propertyOptions.rows,
		renderingChannels: renderingChannels.rows,
		variantGroups: variantGroups.rows,
		variantGroupScopes: variantGroupScopes.rows,
		patchOptions: patchOptions.rows,
		releaseStates: releaseStates.rows,
		displaySlots: displaySlots.rows,
		displayElementSourceTypes: displayElementSourceTypes.rows,
		builtinDisplayFields: builtinDisplayFields.rows,
		displayElementSourceOptions: displayElementSourceOptions.rows,
		overviewCardPlacements: overviewCardPlacements.rows,
		overviewCardModes: overviewCardModes.rows,
		overviewCardDisplaySlots: overviewCardDisplaySlots.rows,
		sections: sections.rows,
		sectionClassificationRules: sectionClassificationRules.rows,
		relationshipTypes: relationshipTypes.rows,
		relationshipDisplayBlocks: relationshipDisplayBlocks.rows,
		relationshipDisplayPerspectives: relationshipDisplayPerspectives.rows,
	};
}

export async function listRiseopediaAdminDisplayProfiles(): Promise<RiseopediaDisplayProfileAdminRows> {
	const [profiles, bindings, properties, variantSelectors] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_profiles ORDER BY channel_name, entity_type_code, sort_order, display_profile_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_profile_bindings ORDER BY channel_code, display_profile_name, priority_order, entity_type_code, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_profile_elements ORDER BY channel_code, display_profile_name, display_slot_code, sort_order, source_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_display_profile_variant_selectors ORDER BY channel_code, display_profile_name, sort_order, selector_label`),
	]);

	return {
		profiles: profiles.rows,
		bindings: bindings.rows,
		properties: properties.rows,
		variantSelectors: variantSelectors.rows,
	};
}

export async function listRiseopediaAdminSections(): Promise<RiseopediaSectionAdminRows> {
	const [sections, classificationRules] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_sections ORDER BY sort_order, section_name, section_id`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_section_classification_rules ORDER BY section_name, sort_order, entity_type_code, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST`),
	]);

	return { sections: sections.rows, classificationRules: classificationRules.rows };
}

export async function listRiseopediaOverviewCardAdmin(): Promise<RiseopediaOverviewCardAdminRows> {
	const [placements, displaySlots, ruleSets, ruleElements] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_placements ORDER BY sort_order, placement_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_display_slots ORDER BY sort_order, display_slot_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_rule_sets ORDER BY channel_name, placement_code, entity_type_name NULLS FIRST, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST, rule_set_label`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_overview_card_rule_elements ORDER BY channel_code, placement_code, entity_type_name NULLS FIRST, rule_set_label, sort_order, element_label, source_code`),
	]);

	return {
		placements: placements.rows,
		displaySlots: displaySlots.rows,
		ruleSets: ruleSets.rows,
		ruleElements: ruleElements.rows,
	};
}

export async function listRiseopediaPatchAdmin(): Promise<RiseopediaPatchAdminRows> {
	const [channels, publications, scopeOverrides] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_patch_publication_channels ORDER BY sort_order, channel_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_patch_publications ORDER BY CASE channel_code WHEN 'new' THEN 1 WHEN 'stable' THEN 2 WHEN 'stale' THEN 3 ELSE 99 END, valid_from DESC, patch_code DESC`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_patch_scope_overrides ORDER BY entity_type_code, entity_class_name NULLS FIRST, entity_category_name NULLS FIRST, entity_subcategory_name NULLS FIRST, valid_from DESC`),
	]);

	return { channels: channels.rows, publications: publications.rows, scopeOverrides: scopeOverrides.rows };
}

export async function listRiseopediaReleaseAdmin(): Promise<RiseopediaReleaseAdminRows> {
	const [decisions, evidence, overrides] = await Promise.all([
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_release_decision_rows ORDER BY patch_code DESC, effective_release_state_code, entity_name`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_release_evidence_rows ORDER BY patch_code DESC, entity_id, severity_code, evidence_code`),
		query<DbRow>(`SELECT * FROM web_view.riseopedia_admin_entity_release_overrides ORDER BY active_flag DESC, updated_dt DESC`),
	]);

	return { decisions: decisions.rows, evidence: evidence.rows, overrides: overrides.rows };
}


export async function listRiseopediaRelationshipDisplayRuleAdmin(): Promise<RiseopediaRelationshipDisplayRuleAdminRows> {
	const rules = await query<DbRow>(
		`SELECT *
		 FROM web_view.riseopedia_admin_relationship_display_rules
		 ORDER BY relationship_family_code,
			  relationship_sort_order,
			  relationship_name,
			  perspective_sort_order`,
	);

	return { rules: rules.rows };
}

export async function listRiseopediaAdminProperties(_args?: {
	entityTypeCode?: string | null;
	search?: string | null;
	limit?: number;
}): Promise<{
	catalog: RiseopediaAdminRows;
	candidates: RiseopediaAdminRows;
	unmapped: RiseopediaAdminRows;
}> {
	const properties = await query<DbRow>(
		`SELECT * FROM web_view.riseopedia_admin_property_options ORDER BY entity_type_code, entity_class_name NULLS FIRST, display_order, property_label`,
	);

	return { catalog: properties.rows, candidates: [], unmapped: [] };
}

export async function listRiseopediaAdminEntities(args?: {
	search?: string | null;
	entityTypeCode?: string | null;
	limit?: number;
}): Promise<RiseopediaAdminRows> {
	const search = args?.search ? `%${args.search}%` : null;
	const result = await query<DbRow>(
		`SELECT *
		 FROM web_view.riseopedia_admin_entity_options
		 WHERE ($1::text IS NULL OR entity_name ILIKE $1 OR canonical_entity_key ILIKE $1 OR entity_slug ILIKE $1)
		   AND ($2::text IS NULL OR entity_type_code = $2)
		 ORDER BY entity_type_code,
				  entity_name
		 LIMIT $3`,
		[search, args?.entityTypeCode ?? null, args?.limit ?? 3000],
	);

	return result.rows;
}

export async function upsertRiseopediaDisplayProfileAdmin(args: {
	actorDiscordId: string;
	displayProfileId: number | null;
	channelCode: string;
	displayProfileCode: string;
	displayProfileName: string;
	entityTypeCode: string;
	description: string | null;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_id
		 FROM web_api.riseopedia_display_profile_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.displayProfileId,
			args.channelCode,
			args.displayProfileCode,
			args.displayProfileName,
			args.entityTypeCode,
			args.description,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "display_profile_id");
}

export async function deleteRiseopediaDisplayProfileAdmin(args: {
	actorDiscordId: string;
	displayProfileId: number;
}): Promise<void> {
	await query(`SELECT display_profile_id FROM web_api.riseopedia_display_profile_delete($1, $2)`, [
		args.actorDiscordId,
		args.displayProfileId,
	]);
}

export async function upsertRiseopediaDisplayProfileBindingAdmin(args: {
	actorDiscordId: string;
	displayProfileBindingId: number | null;
	displayProfileId: number;
	entityTypeCode: string;
	entityClassId: number | null;
	entityCategoryId: number | null;
	entitySubcategoryId: number | null;
	priorityOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_binding_id
		 FROM web_api.riseopedia_display_profile_binding_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			args.actorDiscordId,
			args.displayProfileBindingId,
			args.displayProfileId,
			args.entityTypeCode,
			args.entityClassId,
			args.entityCategoryId,
			args.entitySubcategoryId,
			args.priorityOrder,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "display_profile_binding_id");
}

export async function deleteRiseopediaDisplayProfileBindingAdmin(args: {
	actorDiscordId: string;
	displayProfileBindingId: number;
}): Promise<void> {
	await query(
		`SELECT display_profile_binding_id FROM web_api.riseopedia_display_profile_binding_delete($1, $2)`,
		[args.actorDiscordId, args.displayProfileBindingId],
	);
}

export async function upsertRiseopediaDisplayProfilePropertyAdmin(args: {
	actorDiscordId: string;
	displayProfileElementId: number | null;
	displayProfileId: number;
	displaySlotCode: string;
	sourceTypeCode: string;
	propertyCode: string | null;
	builtinFieldCode: string | null;
	labelOverride: string | null;
	sortOrder: number;
	visible: boolean;
	compact: boolean;
	featured: boolean;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_element_id
		 FROM web_api.riseopedia_display_profile_element_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		[
			args.actorDiscordId,
			args.displayProfileElementId,
			args.displayProfileId,
			args.displaySlotCode,
			args.sourceTypeCode,
			args.propertyCode,
			args.builtinFieldCode,
			args.labelOverride,
			args.sortOrder,
			args.visible,
			args.compact,
			args.featured,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "display_profile_element_id");
}

export async function deleteRiseopediaDisplayProfilePropertyAdmin(args: {
	actorDiscordId: string;
	displayProfileElementId: number;
}): Promise<void> {
	await query(
		`SELECT display_profile_element_id FROM web_api.riseopedia_display_profile_element_delete($1, $2)`,
		[args.actorDiscordId, args.displayProfileElementId],
	);
}

export async function upsertRiseopediaDisplayProfileVariantSelectorAdmin(args: {
	actorDiscordId: string;
	displayProfileVariantSelectorId: number | null;
	displayProfileId: number;
	variantGroupCode: string;
	selectorLabelOverride: string | null;
	sortOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_variant_selector_id
		 FROM web_api.riseopedia_display_profile_variant_selector_upsert($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.displayProfileVariantSelectorId,
			args.displayProfileId,
			args.variantGroupCode,
			args.selectorLabelOverride,
			args.sortOrder,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "display_profile_variant_selector_id");
}

export async function deleteRiseopediaDisplayProfileVariantSelectorAdmin(args: {
	actorDiscordId: string;
	displayProfileVariantSelectorId: number;
}): Promise<void> {
	await query(
		`SELECT display_profile_variant_selector_id FROM web_api.riseopedia_display_profile_variant_selector_delete($1, $2)`,
		[args.actorDiscordId, args.displayProfileVariantSelectorId],
	);
}

export async function upsertRiseopediaSectionAdmin(args: {
	actorDiscordId: string;
	sectionId: number | null;
	sectionCode: string;
	sectionSlug: string;
	sectionName: string;
	description: string | null;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT section_id
		 FROM web_api.riseopedia_section_upsert($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.sectionId,
			args.sectionCode,
			args.sectionSlug,
			args.sectionName,
			args.description,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "section_id");
}

export async function deleteRiseopediaSectionAdmin(args: {
	actorDiscordId: string;
	sectionId: number;
}): Promise<void> {
	await query(`SELECT section_id FROM web_api.riseopedia_section_delete($1, $2)`, [
		args.actorDiscordId,
		args.sectionId,
	]);
}

export async function upsertRiseopediaSectionClassificationRuleAdmin(args: {
	actorDiscordId: string;
	sectionClassificationRuleId: number | null;
	sectionId: number;
	entityTypeCode: string;
	entityClassId: number | null;
	entityCategoryId: number | null;
	entitySubcategoryId: number | null;
	sortOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT section_classification_rule_id
		 FROM web_api.riseopedia_section_classification_rule_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			args.actorDiscordId,
			args.sectionClassificationRuleId,
			args.sectionId,
			args.entityTypeCode,
			args.entityClassId,
			args.entityCategoryId,
			args.entitySubcategoryId,
			args.sortOrder,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "section_classification_rule_id");
}

export async function deleteRiseopediaSectionClassificationRuleAdmin(args: {
	actorDiscordId: string;
	sectionClassificationRuleId: number;
}): Promise<void> {
	await query(
		`SELECT section_classification_rule_id FROM web_api.riseopedia_section_classification_rule_delete($1, $2)`,
		[args.actorDiscordId, args.sectionClassificationRuleId],
	);
}

export async function upsertRiseopediaOverviewCardPlacementAdmin(args: {
	actorDiscordId: string;
	overviewCardPlacementId: number | null;
	placementCode: string;
	placementName: string;
	description: string | null;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT overview_card_placement_id
		 FROM web_api.riseopedia_overview_card_placement_upsert($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.overviewCardPlacementId,
			args.placementCode,
			args.placementName,
			args.description,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "overview_card_placement_id");
}

export async function deleteRiseopediaOverviewCardPlacementAdmin(args: {
	actorDiscordId: string;
	overviewCardPlacementId: number;
}): Promise<void> {
	await query(
		`SELECT overview_card_placement_id FROM web_api.riseopedia_overview_card_placement_delete($1, $2)`,
		[args.actorDiscordId, args.overviewCardPlacementId],
	);
}

export async function upsertRiseopediaOverviewCardDisplaySlotAdmin(args: {
	actorDiscordId: string;
	overviewCardDisplaySlotId: number | null;
	displaySlotCode: string;
	displaySlotName: string;
	description: string | null;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT overview_card_display_slot_id
		 FROM web_api.riseopedia_overview_card_display_slot_upsert($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.overviewCardDisplaySlotId,
			args.displaySlotCode,
			args.displaySlotName,
			args.description,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "overview_card_display_slot_id");
}

export async function deleteRiseopediaOverviewCardDisplaySlotAdmin(args: {
	actorDiscordId: string;
	overviewCardDisplaySlotId: number;
}): Promise<void> {
	await query(
		`SELECT overview_card_display_slot_id FROM web_api.riseopedia_overview_card_display_slot_delete($1, $2)`,
		[args.actorDiscordId, args.overviewCardDisplaySlotId],
	);
}

export async function upsertRiseopediaOverviewCardRuleSetAdmin(args: {
	actorDiscordId: string;
	overviewCardRuleSetId: number | null;
	channelCode: string;
	placementCode: string;
	entityTypeCode: string | null;
	cardModeCode: string;
	entityClassId: number | null;
	entityCategoryId: number | null;
	entitySubcategoryId: number | null;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT overview_card_rule_set_id
		 FROM web_api.riseopedia_overview_card_rule_set_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			args.actorDiscordId,
			args.overviewCardRuleSetId,
			args.channelCode,
			args.placementCode,
			args.cardModeCode,
			args.entityTypeCode,
			args.entityClassId,
			args.entityCategoryId,
			args.entitySubcategoryId,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "overview_card_rule_set_id");
}

export async function deleteRiseopediaOverviewCardRuleSetAdmin(args: {
	actorDiscordId: string;
	overviewCardRuleSetId: number;
}): Promise<void> {
	await query(
		`SELECT overview_card_rule_set_id FROM web_api.riseopedia_overview_card_rule_set_delete($1, $2)`,
		[args.actorDiscordId, args.overviewCardRuleSetId],
	);
}

export async function upsertRiseopediaOverviewCardRuleElementAdmin(args: {
	actorDiscordId: string;
	overviewCardRuleElementId: number | null;
	overviewCardRuleSetId: number;
	displaySlotCode: string;
	sourceTypeCode: string;
	propertyCode: string | null;
	builtinFieldCode: string | null;
	labelOverride: string | null;
	sortOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT overview_card_rule_element_id
		 FROM web_api.riseopedia_overview_card_rule_element_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			args.actorDiscordId,
			args.overviewCardRuleElementId,
			args.overviewCardRuleSetId,
			args.displaySlotCode,
			args.sourceTypeCode,
			args.propertyCode,
			args.builtinFieldCode,
			args.labelOverride,
			args.sortOrder,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "overview_card_rule_element_id");
}

export async function deleteRiseopediaOverviewCardRuleElementAdmin(args: {
	actorDiscordId: string;
	overviewCardRuleElementId: number;
}): Promise<void> {
	await query(
		`SELECT overview_card_rule_element_id FROM web_api.riseopedia_overview_card_rule_element_delete($1, $2)`,
		[args.actorDiscordId, args.overviewCardRuleElementId],
	);
}

export async function upsertRiseopediaPatchPublicationChannelAdmin(args: {
	actorDiscordId: string;
	patchPublicationChannelId: number | null;
	channelCode: string;
	channelName: string;
	description: string | null;
	isPublic: boolean;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT patch_publication_channel_id
		 FROM web_api.riseopedia_patch_publication_channel_upsert($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.patchPublicationChannelId,
			args.channelCode,
			args.channelName,
			args.description,
			args.isPublic,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "patch_publication_channel_id");
}

export async function deleteRiseopediaPatchPublicationChannelAdmin(args: {
	actorDiscordId: string;
	patchPublicationChannelId: number;
}): Promise<void> {
	await query(
		`SELECT patch_publication_channel_id FROM web_api.riseopedia_patch_publication_channel_delete($1, $2)`,
		[args.actorDiscordId, args.patchPublicationChannelId],
	);
}

export async function upsertRiseopediaPatchPublicationAdmin(args: {
	actorDiscordId: string;
	patchPublicationId: number | null;
	channelCode: string;
	patchId: number;
	publicationStatusCode: string;
	validFrom: string | null;
	validTo: string | null;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT patch_publication_id
		 FROM web_api.riseopedia_patch_publication_upsert($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, $8)`,
		[
			args.actorDiscordId,
			args.patchPublicationId,
			args.channelCode,
			args.patchId,
			args.publicationStatusCode,
			args.validFrom,
			args.validTo,
			args.adminNote,
		],
	);

	return firstId(result.rows, "patch_publication_id");
}

export async function deleteRiseopediaPatchPublicationAdmin(args: {
	actorDiscordId: string;
	patchPublicationId: number;
}): Promise<void> {
	await query(`SELECT patch_publication_id FROM web_api.riseopedia_patch_publication_delete($1, $2)`, [
		args.actorDiscordId,
		args.patchPublicationId,
	]);
}

export async function setRiseopediaPatchPublicationStableAdmin(args: {
	actorDiscordId: string;
	patchPublicationId: number;
}): Promise<void> {
	await query(`SELECT patch_publication_id FROM web_api.riseopedia_patch_publication_set_stable($1, $2)`, [
		args.actorDiscordId,
		args.patchPublicationId,
	]);
}

export async function upsertRiseopediaPatchScopeOverrideAdmin(args: {
	actorDiscordId: string;
	patchPublicationScopeOverrideId: number | null;
	actionCode: string;
	patchId: number | null;
	entityTypeCode: string;
	entityClassId: number | null;
	entityCategoryId: number | null;
	entitySubcategoryId: number | null;
	validFrom: string | null;
	validTo: string | null;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT patch_publication_scope_override_id
		 FROM web_api.riseopedia_patch_scope_override_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11, $12)`,
		[
			args.actorDiscordId,
			args.patchPublicationScopeOverrideId,
			args.actionCode,
			args.patchId,
			args.entityTypeCode,
			args.entityClassId,
			args.entityCategoryId,
			args.entitySubcategoryId,
			args.validFrom,
			args.validTo,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "patch_publication_scope_override_id");
}

export async function deleteRiseopediaPatchScopeOverrideAdmin(args: {
	actorDiscordId: string;
	patchPublicationScopeOverrideId: number;
}): Promise<void> {
	await query(
		`SELECT patch_publication_scope_override_id FROM web_api.riseopedia_patch_scope_override_delete($1, $2)`,
		[args.actorDiscordId, args.patchPublicationScopeOverrideId],
	);
}

export async function upsertRiseopediaEntityReleaseOverrideAdmin(args: {
	actorDiscordId: string;
	entityReleaseOverrideId: number | null;
	entityTypeCode: string;
	entityId: number;
	patchId: number | null;
	overrideStateCode: string;
	overrideReasonCode: string | null;
	overrideNote: string | null;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT entity_release_override_id
		 FROM web_api.riseopedia_entity_release_override_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.entityReleaseOverrideId,
			args.entityTypeCode,
			args.entityId,
			args.patchId,
			args.overrideStateCode,
			args.overrideReasonCode,
			args.overrideNote,
			args.active,
		],
	);

	return firstId(result.rows, "entity_release_override_id");
}

export async function deleteRiseopediaEntityReleaseOverrideAdmin(args: {
	actorDiscordId: string;
	entityReleaseOverrideId: number;
}): Promise<void> {
	await query(
		`SELECT entity_release_override_id FROM web_api.riseopedia_entity_release_override_delete($1, $2)`,
		[args.actorDiscordId, args.entityReleaseOverrideId],
	);
}

export async function upsertRiseopediaRelationshipDisplayRuleAdmin(args: {
	actorDiscordId: string;
	relationshipCode: string;
	perspectiveCode: string;
	dependencyBlockCode: string;
	dependencyBlockLabel: string;
	dependencyKindLabel: string | null;
	sortOrder: number;
	active: boolean;
	description: string | null;
}): Promise<string | null> {
	const result = await query<DbRow>(
		`SELECT rule_key
		 FROM web_api.riseopedia_relationship_display_rule_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.relationshipCode,
			args.perspectiveCode,
			args.dependencyBlockCode,
			args.dependencyBlockLabel,
			args.dependencyKindLabel,
			args.sortOrder,
			args.active,
			args.description,
		],
	);

	const value = result.rows[0]?.rule_key;
	return typeof value === "string" ? value : null;
}

export async function deleteRiseopediaRelationshipDisplayRuleAdmin(args: {
	actorDiscordId: string;
	ruleKey: string;
}): Promise<void> {
	await query(`SELECT rule_key FROM web_api.riseopedia_relationship_display_rule_delete($1, $2)`, [
		args.actorDiscordId,
		args.ruleKey,
	]);
}
