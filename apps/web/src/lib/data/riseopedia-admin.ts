//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-admin.ts                                                         ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia admin infrastructure read and mutation helpers.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

type DbRow = {
	[column: string]: unknown;
};

type IdRow = {
	[column: string]: string | number | null;
};

export type RiseopediaAdminRows = DbRow[];

export type RiseopediaAdminMeta = {
	entityTypes: RiseopediaAdminRows;
	visibilityStates: RiseopediaAdminRows;
	sectionModes: RiseopediaAdminRows;
	ruleKinds: RiseopediaAdminRows;
	assetClasses: RiseopediaAdminRows;
	recipeBenches: RiseopediaAdminRows;
	propertyOrigins: RiseopediaAdminRows;
	propertyOriginOptions: RiseopediaAdminRows;
	propertySourceOptions: RiseopediaAdminRows;
	propertyDataTypes: RiseopediaAdminRows;
	displaySlots: RiseopediaAdminRows;
	profileSelectorKinds: RiseopediaAdminRows;
	relationshipBlockTypes: RiseopediaAdminRows;
	profilePropertyOptions: RiseopediaAdminRows;
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
		visibilityStates,
		sectionModes,
		ruleKinds,
		assetClasses,
		recipeBenches,
		propertyOrigins,
		propertyOriginOptions,
		propertySourceOptions,
		propertyDataTypes,
		displaySlots,
		profileSelectorKinds,
		relationshipBlockTypes,
		profilePropertyOptions,
	] = await Promise.all([
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_entity_types ORDER BY sort_order, entity_type_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_visibility_states ORDER BY sort_order, visibility_state_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_section_modes ORDER BY sort_order, section_mode_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_rule_kinds ORDER BY sort_order, rule_kind_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_asset_classes ORDER BY sort_order, asset_class_name`,
		),
		query<DbRow>(
			`SELECT DISTINCT bench_code,
						bench_name
			 FROM web_view.riseopedia_recipes
			 WHERE bench_code IS NOT NULL
			 ORDER BY bench_name,
					  bench_code`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_property_origins ORDER BY sort_order, property_origin_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_property_origin_options ORDER BY entity_type_code, sort_order, property_origin_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_property_source_options ORDER BY entity_type_code, property_origin_code, source_selector_kind_code, cataloged_flag, source_label`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_property_data_types ORDER BY sort_order, data_type_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_display_slots ORDER BY sort_order, display_slot_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_profile_selector_kinds ORDER BY sort_order, profile_selector_kind_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_relationship_block_types ORDER BY block_group_code, sort_order, relationship_block_type_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_profile_property_options ORDER BY display_profile_name, sort_order, property_name`,
		),
	]);

	return {
		entityTypes: entityTypes.rows,
		visibilityStates: visibilityStates.rows,
		sectionModes: sectionModes.rows,
		ruleKinds: ruleKinds.rows,
		assetClasses: assetClasses.rows,
		recipeBenches: recipeBenches.rows,
		propertyOrigins: propertyOrigins.rows,
		propertyOriginOptions: propertyOriginOptions.rows,
		propertySourceOptions: propertySourceOptions.rows,
		propertyDataTypes: propertyDataTypes.rows,
		displaySlots: displaySlots.rows,
		profileSelectorKinds: profileSelectorKinds.rows,
		relationshipBlockTypes: relationshipBlockTypes.rows,
		profilePropertyOptions: profilePropertyOptions.rows,
	};
}

export async function listRiseopediaAdminSections(): Promise<{
	sections: RiseopediaAdminRows;
	rules: RiseopediaAdminRows;
	items: RiseopediaAdminRows;
}> {
	const [sections, rules, items] = await Promise.all([
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_sections ORDER BY sort_order, section_name, section_id`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_section_rules ORDER BY section_name, sort_order, rule_value, section_entity_rule_id`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_section_items ORDER BY section_name, sort_order, entity_type_code, resolved_entity_name, section_item_id`,
		),
	]);

	return { sections: sections.rows, rules: rules.rows, items: items.rows };
}


export async function listRiseopediaAdminEntities(args: {
	search: string | null;
	entityTypeCode: string | null;
	limit: number;
}): Promise<RiseopediaAdminRows> {
	const search = args.search ? `%${args.search}%` : null;
	const result = await query<DbRow>(
		`SELECT *
		 FROM web_view.riseopedia_admin_entities
		 WHERE ($1::text IS NULL OR entity_name ILIKE $1 OR entity_key ILIKE $1)
		   AND ($2::text IS NULL OR entity_type_code = $2)
		 ORDER BY entity_type_code,
				  entity_name,
				  entity_key
		 LIMIT $3`,
		[search, args.entityTypeCode, args.limit],
	);

	return result.rows;
}

export async function listRiseopediaAdminVisibility(args: {
	search: string | null;
	entityTypeCode: string | null;
	limit: number;
}): Promise<{
	entities: RiseopediaAdminRows;
	overrides: RiseopediaAdminRows;
}> {
	const search = args.search ? `%${args.search}%` : null;
	const [entities, overrides] = await Promise.all([
		query<DbRow>(
			`SELECT *
			 FROM web_view.riseopedia_admin_entities
			 WHERE ($1::text IS NULL OR entity_name ILIKE $1 OR entity_key ILIKE $1)
			   AND ($2::text IS NULL OR entity_type_code = $2)
			 ORDER BY entity_type_code,
					  entity_name,
					  entity_key
			 LIMIT $3`,
			[search, args.entityTypeCode, args.limit],
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_visibility_overrides ORDER BY entity_type_code, resolved_entity_name, entity_key`,
		),
	]);

	return { entities: entities.rows, overrides: overrides.rows };
}

export async function listRiseopediaAdminProperties(args: {
	entityTypeCode: string | null;
	search: string | null;
	limit: number;
}): Promise<{
	catalog: RiseopediaAdminRows;
	candidates: RiseopediaAdminRows;
	unmapped: RiseopediaAdminRows;
}> {
	const search = args.search ? `%${args.search}%` : null;
	const [catalog, candidates, unmapped] = await Promise.all([
		query<DbRow>(
			`SELECT catalog.*,
					COALESCE(catalog.source_property_code, catalog.source_column_name) AS source_display_value
			 FROM web_view.riseopedia_admin_property_catalog catalog
			 WHERE ($1::text IS NULL OR catalog.entity_type_code = $1)
			   AND ($2::text IS NULL
					OR catalog.property_name ILIKE $2
					OR catalog.property_code ILIKE $2
					OR catalog.source_property_code ILIKE $2
					OR catalog.source_column_name ILIKE $2)
			 ORDER BY catalog.entity_type_code,
					  catalog.sort_order,
					  catalog.property_name,
					  catalog.property_catalog_id
			 LIMIT $3`,
			[args.entityTypeCode, search, args.limit],
		),
		query<DbRow>(
			`SELECT *
			 FROM web_view.riseopedia_admin_property_candidates
			 WHERE ($1::text IS NULL OR entity_type_code = $1)
			   AND ($2::text IS NULL OR property_name ILIKE $2 OR property_code ILIKE $2)
			 ORDER BY rendered_flag,
					  cataloged_flag,
					  entity_group_code,
					  property_name
			 LIMIT $3`,
			[args.entityTypeCode, search, args.limit],
		),
		query<DbRow>(
			`SELECT *
			 FROM web_view.riseopedia_admin_unmapped_properties
			 WHERE ($1::text IS NULL OR entity_type_code = $1)
			   AND ($2::text IS NULL OR property_name ILIKE $2 OR property_code ILIKE $2)
			 ORDER BY cataloged_flag,
					  rendered_flag,
					  entity_group_code,
					  property_name
			 LIMIT $3`,
			[args.entityTypeCode, search, args.limit],
		),
	]);

	return { catalog: catalog.rows, candidates: candidates.rows, unmapped: unmapped.rows };
}

export async function listRiseopediaAdminDisplayProfiles(): Promise<{
	profiles: RiseopediaAdminRows;
	bindings: RiseopediaAdminRows;
	properties: RiseopediaAdminRows;
	relationshipBlocks: RiseopediaAdminRows;
}> {
	const [profiles, bindings, properties, relationshipBlocks] = await Promise.all([
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_display_profiles ORDER BY entity_type_code, sort_order, display_profile_name`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_display_profile_bindings ORDER BY display_profile_name, priority_order, profile_selector_kind_code, selector_value`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_display_profile_properties ORDER BY display_profile_name, display_slot_code, group_code, sort_order, effective_label`,
		),
		query<DbRow>(
			`SELECT * FROM web_view.riseopedia_admin_relationship_blocks ORDER BY display_profile_name, block_group_code, sort_order, effective_label`,
		),
	]);

	return {
		profiles: profiles.rows,
		bindings: bindings.rows,
		properties: properties.rows,
		relationshipBlocks: relationshipBlocks.rows,
	};
}

export async function upsertRiseopediaSectionAdmin(args: {
	actorDiscordId: string;
	sectionId: number | null;
	sectionCode: string;
	sectionSlug: string;
	sectionName: string;
	description: string | null;
	sectionModeCode: string;
	publicVisible: boolean;
	showWhenEmpty: boolean;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT section_id
		 FROM web_api.riseopedia_section_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			args.actorDiscordId,
			args.sectionId,
			args.sectionCode,
			args.sectionSlug,
			args.sectionName,
			args.description,
			args.sectionModeCode,
			args.publicVisible,
			args.showWhenEmpty,
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

export async function upsertRiseopediaSectionRuleAdmin(args: {
	actorDiscordId: string;
	sectionEntityRuleId: number | null;
	sectionId: number;
	entityTypeCode: string;
	ruleKindCode: string;
	ruleValue: string;
	sortOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT section_entity_rule_id
		 FROM web_api.riseopedia_section_rule_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.sectionEntityRuleId,
			args.sectionId,
			args.entityTypeCode,
			args.ruleKindCode,
			args.ruleValue,
			args.sortOrder,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "section_entity_rule_id");
}

export async function deleteRiseopediaSectionRuleAdmin(args: {
	actorDiscordId: string;
	sectionEntityRuleId: number;
}): Promise<void> {
	await query(
		`SELECT section_entity_rule_id FROM web_api.riseopedia_section_rule_delete($1, $2)`,
		[args.actorDiscordId, args.sectionEntityRuleId],
	);
}

export async function upsertRiseopediaSectionItemAdmin(args: {
	actorDiscordId: string;
	sectionItemId: number | null;
	sectionId: number;
	entityTypeCode: string;
	entityKey: string;
	sortOrder: number;
	pinned: boolean;
	featured: boolean;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT section_item_id
		 FROM web_api.riseopedia_section_item_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			args.actorDiscordId,
			args.sectionItemId,
			args.sectionId,
			args.entityTypeCode,
			args.entityKey,
			args.sortOrder,
			args.pinned,
			args.featured,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "section_item_id");
}

export async function deleteRiseopediaSectionItemAdmin(args: {
	actorDiscordId: string;
	sectionItemId: number;
}): Promise<void> {
	await query(`SELECT section_item_id FROM web_api.riseopedia_section_item_delete($1, $2)`, [
		args.actorDiscordId,
		args.sectionItemId,
	]);
}

export async function upsertRiseopediaVisibilityOverrideAdmin(args: {
	actorDiscordId: string;
	visibilityOverrideId: number | null;
	entityTypeCode: string;
	entityKey: string;
	visibilityStateCode: string;
	reason: string | null;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT visibility_override_id
		 FROM web_api.riseopedia_visibility_override_upsert($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.visibilityOverrideId,
			args.entityTypeCode,
			args.entityKey,
			args.visibilityStateCode,
			args.reason,
			args.active,
		],
	);

	return firstId(result.rows, "visibility_override_id");
}

export async function deleteRiseopediaVisibilityOverrideAdmin(args: {
	actorDiscordId: string;
	visibilityOverrideId: number;
}): Promise<void> {
	await query(
		`SELECT visibility_override_id FROM web_api.riseopedia_visibility_override_delete($1, $2)`,
		[args.actorDiscordId, args.visibilityOverrideId],
	);
}

export async function upsertRiseopediaPropertyCatalogAdmin(args: {
	actorDiscordId: string;
	propertyCatalogId: number | null;
	entityTypeCode: string;
	propertyCode: string;
	propertyName: string;
	description: string | null;
	propertyOriginCode: string;
	sourceColumnName: string | null;
	sourcePropertyCode: string | null;
	dataTypeCode: string;
	unitCode: string | null;
	defaultDisplaySlotCode: string;
	defaultGroupCode: string;
	defaultVisible: boolean;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT property_catalog_id
		 FROM web_api.riseopedia_property_catalog_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
		[
			args.actorDiscordId,
			args.propertyCatalogId,
			args.entityTypeCode,
			args.propertyCode,
			args.propertyName,
			args.description,
			args.propertyOriginCode,
			args.sourceColumnName,
			args.sourcePropertyCode,
			args.dataTypeCode,
			args.unitCode,
			args.defaultDisplaySlotCode,
			args.defaultGroupCode,
			args.defaultVisible,
			args.sortOrder,
			args.active,
		],
	);

	return firstId(result.rows, "property_catalog_id");
}

export async function deleteRiseopediaPropertyCatalogAdmin(args: {
	actorDiscordId: string;
	propertyCatalogId: number;
}): Promise<void> {
	await query(`SELECT property_catalog_id FROM web_api.riseopedia_property_catalog_delete($1, $2)`, [
		args.actorDiscordId,
		args.propertyCatalogId,
	]);
}

export async function upsertRiseopediaDisplayProfileAdmin(args: {
	actorDiscordId: string;
	displayProfileId: number | null;
	displayProfileCode: string;
	displayProfileName: string;
	entityTypeCode: string;
	description: string | null;
	sortOrder: number;
	active: boolean;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_id
		 FROM web_api.riseopedia_display_profile_upsert($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.displayProfileId,
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
	profileSelectorKindCode: string;
	selectorValue: string;
	priorityOrder: number;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_binding_id
		 FROM web_api.riseopedia_display_profile_binding_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.displayProfileBindingId,
			args.displayProfileId,
			args.entityTypeCode,
			args.profileSelectorKindCode,
			args.selectorValue,
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
	displayProfilePropertyId: number | null;
	displayProfileId: number;
	propertyCatalogId: number;
	displaySlotCode: string;
	groupCode: string;
	labelOverride: string | null;
	sortOrder: number;
	visible: boolean;
	compact: boolean;
	featured: boolean;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_property_id
		 FROM web_api.riseopedia_display_profile_property_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		[
			args.actorDiscordId,
			args.displayProfilePropertyId,
			args.displayProfileId,
			args.propertyCatalogId,
			args.displaySlotCode,
			args.groupCode,
			args.labelOverride,
			args.sortOrder,
			args.visible,
			args.compact,
			args.featured,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "display_profile_property_id");
}

export async function deleteRiseopediaDisplayProfilePropertyAdmin(args: {
	actorDiscordId: string;
	displayProfilePropertyId: number;
}): Promise<void> {
	await query(
		`SELECT display_profile_property_id FROM web_api.riseopedia_display_profile_property_delete($1, $2)`,
		[args.actorDiscordId, args.displayProfilePropertyId],
	);
}

export async function upsertRiseopediaRelationshipBlockAdmin(args: {
	actorDiscordId: string;
	displayProfileRelationshipBlockId: number | null;
	displayProfileId: number;
	relationshipBlockTypeCode: string;
	labelOverride: string | null;
	sortOrder: number;
	visible: boolean;
	active: boolean;
	adminNote: string | null;
}): Promise<number | null> {
	const result = await query<IdRow>(
		`SELECT display_profile_relationship_block_id
		 FROM web_api.riseopedia_display_profile_relationship_block_upsert($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		[
			args.actorDiscordId,
			args.displayProfileRelationshipBlockId,
			args.displayProfileId,
			args.relationshipBlockTypeCode,
			args.labelOverride,
			args.sortOrder,
			args.visible,
			args.active,
			args.adminNote,
		],
	);

	return firstId(result.rows, "display_profile_relationship_block_id");
}

export async function deleteRiseopediaRelationshipBlockAdmin(args: {
	actorDiscordId: string;
	displayProfileRelationshipBlockId: number;
}): Promise<void> {
	await query(
		`SELECT display_profile_relationship_block_id FROM web_api.riseopedia_display_profile_relationship_block_delete($1, $2)`,
		[args.actorDiscordId, args.displayProfileRelationshipBlockId],
	);
}
