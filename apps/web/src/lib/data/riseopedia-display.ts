//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-display.ts                                                        ////
//// Language: TS                                                                                             ////
//// DB-first fixed-layout Riseopedia display contract helpers for public detail APIs.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type RiseopediaDisplayProperty = {
	entityTypeCode: string;
	entityKey: string;
	displayProfileId: string;
	displayProfileCode: string;
	displayProfileName: string;
	displayProfilePropertyId: string;
	propertyCatalogId: string;
	propertyCode: string;
	displayLabel: string;
	propertyName: string;
	description: string | null;
	propertyOriginCode: string;
	dataTypeCode: string;
	unitCode: string | null;
	displaySlotCode: string;
	displaySlotName: string;
	groupCode: string;
	sortOrder: number;
	compact: boolean;
	featured: boolean;
	valueText: string | null;
	displayValue: string;
};

export type RiseopediaDisplayBlock = {
	entityTypeCode: string;
	entityKey: string;
	displayProfileId: string;
	displayProfileCode: string;
	displayProfileName: string;
	displayProfileRelationshipBlockId: string;
	relationshipBlockTypeCode: string;
	blockLabel: string;
	relationshipBlockTypeName: string;
	blockGroupCode: "relationships" | "dependencies" | "changelog";
	sortOrder: number;
	visible: boolean;
};

export type RiseopediaDisplayLayout = {
	profile: {
		displayProfileId: string | null;
		displayProfileCode: string | null;
		displayProfileName: string | null;
	};
	overviewRows: RiseopediaDisplayProperty[];
	bodyLead: RiseopediaDisplayProperty[];
	bodyMain: RiseopediaDisplayProperty[];
	bodyNotes: RiseopediaDisplayProperty[];
	specRows: RiseopediaDisplayProperty[];
	requirementRows: RiseopediaDisplayProperty[];
	relationshipBlocks: RiseopediaDisplayBlock[];
	dependencyBlocks: RiseopediaDisplayBlock[];
	changeLogBlocks: RiseopediaDisplayBlock[];
};

type RiseopediaDisplayPropertyRow = {
	entity_type_code: string;
	entity_key: string;
	display_profile_id: string | number;
	display_profile_code: string;
	display_profile_name: string;
	display_profile_property_id: string | number;
	property_catalog_id: string | number;
	property_code: string;
	display_label: string;
	property_name: string;
	description: string | null;
	property_origin_code: string;
	data_type_code: string;
	unit_code: string | null;
	display_slot_code: string;
	display_slot_name: string;
	group_code: string;
	sort_order: string | number;
	compact_flag: boolean;
	featured_flag: boolean;
	value_text: string | null;
	display_value: string;
};

type RiseopediaDisplayBlockRow = {
	entity_type_code: string;
	entity_key: string;
	display_profile_id: string | number;
	display_profile_code: string;
	display_profile_name: string;
	display_profile_relationship_block_id: string | number;
	relationship_block_type_code: string;
	block_label: string;
	relationship_block_type_name: string;
	block_group_code: string;
	sort_order: string | number;
	visible_flag: boolean;
};

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function normalizeBlockGroup(value: string): "relationships" | "dependencies" | "changelog" {
	if (value === "relationships" || value === "dependencies" || value === "changelog") {
		return value;
	}

	return "relationships";
}

function mapDisplayPropertyRow(
	row: RiseopediaDisplayPropertyRow,
): RiseopediaDisplayProperty {
	return {
		entityTypeCode: row.entity_type_code,
		entityKey: row.entity_key,
		displayProfileId: String(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfilePropertyId: String(row.display_profile_property_id),
		propertyCatalogId: String(row.property_catalog_id),
		propertyCode: row.property_code,
		displayLabel: row.display_label,
		propertyName: row.property_name,
		description: row.description,
		propertyOriginCode: row.property_origin_code,
		dataTypeCode: row.data_type_code,
		unitCode: row.unit_code,
		displaySlotCode: row.display_slot_code,
		displaySlotName: row.display_slot_name,
		groupCode: row.group_code,
		sortOrder: toNumber(row.sort_order),
		compact: row.compact_flag,
		featured: row.featured_flag,
		valueText: row.value_text,
		displayValue: row.display_value,
	};
}

function mapDisplayBlockRow(row: RiseopediaDisplayBlockRow): RiseopediaDisplayBlock {
	return {
		entityTypeCode: row.entity_type_code,
		entityKey: row.entity_key,
		displayProfileId: String(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfileRelationshipBlockId: String(row.display_profile_relationship_block_id),
		relationshipBlockTypeCode: row.relationship_block_type_code,
		blockLabel: row.block_label,
		relationshipBlockTypeName: row.relationship_block_type_name,
		blockGroupCode: normalizeBlockGroup(row.block_group_code),
		sortOrder: toNumber(row.sort_order),
		visible: row.visible_flag,
	};
}

function buildDisplayLayout(args: {
	properties: RiseopediaDisplayProperty[];
	blocks: RiseopediaDisplayBlock[];
}): RiseopediaDisplayLayout {
	const firstProperty = args.properties[0] ?? null;
	const firstBlock = args.blocks[0] ?? null;
	const displayProfileId = firstProperty?.displayProfileId ?? firstBlock?.displayProfileId ?? null;
	const displayProfileCode = firstProperty?.displayProfileCode ?? firstBlock?.displayProfileCode ?? null;
	const displayProfileName = firstProperty?.displayProfileName ?? firstBlock?.displayProfileName ?? null;

	return {
		profile: {
			displayProfileId,
			displayProfileCode,
			displayProfileName,
		},
		overviewRows: args.properties.filter((row) => row.displaySlotCode === "overview_table"),
		bodyLead: args.properties.filter((row) => row.displaySlotCode === "body_lead"),
		bodyMain: args.properties.filter((row) => row.displaySlotCode === "body_main"),
		bodyNotes: args.properties.filter((row) => row.displaySlotCode === "body_notes"),
		specRows: args.properties.filter((row) => row.displaySlotCode === "spec_table"),
		requirementRows: args.properties.filter((row) => row.displaySlotCode === "requirements"),
		relationshipBlocks: args.blocks.filter((row) => row.blockGroupCode === "relationships"),
		dependencyBlocks: args.blocks.filter((row) => row.blockGroupCode === "dependencies"),
		changeLogBlocks: args.blocks.filter((row) => row.blockGroupCode === "changelog"),
	};
}

export async function getRiseopediaDisplayLayout(args: {
	entityTypeCode: "asset" | "recipe";
	entityKey: string;
}): Promise<RiseopediaDisplayLayout> {
	const [propertyResult, blockResult] = await Promise.all([
		query<RiseopediaDisplayPropertyRow>(
			`SELECT entity_type_code,
					entity_key,
					display_profile_id,
					display_profile_code,
					display_profile_name,
					display_profile_property_id,
					property_catalog_id,
					property_code,
					display_label,
					property_name,
					description,
					property_origin_code,
					data_type_code,
					unit_code,
					display_slot_code,
					display_slot_name,
					group_code,
					sort_order,
					compact_flag,
					featured_flag,
					value_text,
					display_value
			 FROM web_view.riseopedia_detail_display_properties
			 WHERE entity_type_code = $1
			   AND entity_key = $2
			 ORDER BY display_slot_code,
					  group_code,
					  sort_order,
					  display_label,
					  property_code`,
			[args.entityTypeCode, args.entityKey],
		),
		query<RiseopediaDisplayBlockRow>(
			`SELECT entity_type_code,
					entity_key,
					display_profile_id,
					display_profile_code,
					display_profile_name,
					display_profile_relationship_block_id,
					relationship_block_type_code,
					block_label,
					relationship_block_type_name,
					block_group_code,
					sort_order,
					visible_flag
			 FROM web_view.riseopedia_detail_display_blocks
			 WHERE entity_type_code = $1
			   AND entity_key = $2
			 ORDER BY block_group_code,
					  sort_order,
					  block_label,
					  relationship_block_type_code`,
			[args.entityTypeCode, args.entityKey],
		),
	]);

	return buildDisplayLayout({
		properties: propertyResult.rows.map(mapDisplayPropertyRow),
		blocks: blockResult.rows.map(mapDisplayBlockRow),
	});
}
