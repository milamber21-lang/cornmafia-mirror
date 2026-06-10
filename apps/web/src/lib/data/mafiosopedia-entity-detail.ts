//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-entity-detail.ts                                                     ////
//// Language: TS                                                                                               ////
//// Entity-first public Mafiosopedia detail loader backed by stable web_view contracts and DB-owned slugs.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildMafiosopediaMediaFileUrl } from "@/lib/helpers/mafiosopedia-media-files";

const MAFIOSOPEDIA_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type EntityTypeFilter = "asset" | "recipe";

export type MafiosopediaEntityMediaRef = {
	mediaFileId: string;
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
	roleCode: string;
	entityVariantId: string | null;
	primary: boolean;
	sortOrder: number;
	altText: string | null;
	caption: string | null;
	selectedHeaderRank: number;
	selectedIconRank: number;
};

export type MafiosopediaEntityDetailDoc = {
	entityId: string;
	entityTypeCode: string;
	entityTypeName: string | null;
	entityCode: string;
	entitySlug: string;
	publicEntitySlug: string | null;
	entityName: string;
	sectionId: string | null;
	sectionCode: string | null;
	sectionSlug: string | null;
	sectionName: string | null;
	entityClassId: string | null;
	entityClassCode: string | null;
	entityClassName: string | null;
	entityCategoryId: string | null;
	entityCategoryCode: string | null;
	entityCategoryName: string | null;
	entityCategorySlug: string | null;
	entitySubcategoryId: string | null;
	entitySubcategoryCode: string | null;
	entitySubcategoryName: string | null;
	entitySubcategorySlug: string | null;
	categorySubcategoryLabel: string | null;
	classCategoryLabel: string | null;
	classificationPathLabel: string | null;
	publicPatchCode: string | null;
	publicPatchLabel: string | null;
	firstSeenPatchCode: string | null;
	lastSeenPatchCode: string | null;
	releaseStateCode: string | null;
	releaseStateName: string | null;
	assetId: string | null;
	recipeId: string | null;
	primaryMediaFileId: string | null;
	primaryIconMediaFileId: string | null;
};

export type MafiosopediaEntitySection = {
	entityId: string;
	sectionId: string;
	sectionCode: string;
	sectionSlug: string;
	sectionName: string;
	sectionSortOrder: number;
	membershipSortOrder: number;
	primary: boolean;
};

export type MafiosopediaEntityVariant = {
	entityId: string;
	entityVariantId: string;
	variantCode: string;
	variantName: string | null;
	variantDisplayName: string | null;
	primary: boolean;
	common: boolean;
	sourceBacked: boolean;
	variantOriginCode: string | null;
	active: boolean;
	firstSeenPatchCode: string | null;
	lastSeenPatchCode: string | null;
	defaultCandidateRank: number;
	defaultCandidateOrder: number;
};

export type MafiosopediaEntityVariantValue = {
	entityId: string;
	entityVariantId: string;
	entityVariantValueId: string;
	variantGroupCode: string;
	variantGroupName: string | null;
	variantGroupSlug: string | null;
	variantValueCode: string;
	variantValueName: string;
	variantValueSlug: string | null;
	variantValueNumber: number | null;
	badgeLabel: string;
	visualToneCode: string;
	variantGroupSortOrder: number;
	variantValueSortOrder: number;
};

export type MafiosopediaEntityVariantSelector = {
	entityId: string;
	displayProfileId: string;
	displayProfileCode: string;
	displayProfileName: string;
	displayProfileVariantSelectorId: string;
	variantGroupCode: string;
	variantGroupName: string | null;
	variantGroupSlug: string | null;
	selectorLabel: string;
	sortOrder: number;
};

export type MafiosopediaDetailElement = {
	entityId: string;
	entityVariantId: string | null;
	displayProfileId: string | null;
	displayProfileCode: string | null;
	displayProfileName: string | null;
	displayProfileElementId: string | null;
	sourceTypeCode: string;
	sourceCode: string;
	entityPropertyId: string | null;
	builtinFieldCode: string | null;
	displaySlotCode: string;
	displayGroupCode: string | null;
	displayGroupLabel: string | null;
	displayLabel: string;
	displayValue: string;
	valueTypeCode: string;
	sortOrder: number;
	compact: boolean;
	featured: boolean;
	fallback: boolean;
	entityPropertyValueId: string | null;
	entityPropertyValueLinkId: string | null;
	linkedEntityId: string | null;
	linkedEntityVariantId: string | null;
	linkedEntityTypeCode: string | null;
	linkedEntitySlug: string | null;
	linkedEntityName: string | null;
	linkedIconMediaFileId: string | null;
};

export type MafiosopediaRecipeOutput = {
	recipeEntityId: string;
	recipeEntityVariantId: string | null;
	recipeOutputId: string;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string;
	targetEntityClassCode: string | null;
	targetEntityClassName: string | null;
	quantityValue: number | null;
	quantityText: string | null;
	unitCode: string | null;
	primaryOutput: boolean;
	sortOrder: number;
	resolutionStatusCode: string;
	targetIconMediaFileId: string | null;
};

export type MafiosopediaRecipeRequirement = {
	recipeEntityId: string;
	recipeEntityVariantId: string | null;
	sourceRowId: string;
	requirementKindCode: string;
	relationshipTypeCode: string | null;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string | null;
	genericGroupId: string | null;
	genericGroupCode: string | null;
	genericGroupName: string | null;
	quantityValue: number | null;
	quantityText: string | null;
	unitCode: string | null;
	sourceValueText: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
	targetIconMediaFileId: string | null;
	targetCraftedByRecipeEntityId: string | null;
	targetCraftedByRecipeSlug: string | null;
	targetCraftedByRecipeName: string | null;
	targetCraftedByRecipeIconMediaFileId: string | null;
};

export type MafiosopediaAssetRecipeLink = {
	assetEntityId: string;
	assetEntityVariantId: string | null;
	linkKindCode: string;
	recipeEntityId: string;
	recipeEntityVariantId: string | null;
	recipeEntitySlug: string;
	recipeEntityName: string;
	recipeClassCode: string | null;
	recipeClassName: string | null;
	quantityValue: number | null;
	quantityText: string | null;
	sortOrder: number;
	resolutionStatusCode: string;
	recipeIconMediaFileId: string | null;
	primaryOutputEntityId: string | null;
	primaryOutputEntityName: string | null;
};

export type MafiosopediaRelationshipBlockRow = {
	entityId: string;
	entityVariantId: string | null;
	entityRelationshipId: string;
	relationshipCode: string;
	relationshipLabel: string;
	relationshipDirectionCode: string;
	blockCode: string;
	blockLabel: string;
	targetEntityId: string;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string;
	targetEntitySlug: string;
	targetEntityName: string;
	targetClassCode: string | null;
	targetClassName: string | null;
	targetCategoryCode: string | null;
	targetCategoryName: string | null;
	sourceValueText: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
	targetIconMediaFileId: string | null;
};

export type MafiosopediaDependencyRow = {
	entityId: string;
	entityVariantId: string | null;
	dependencyBlockCode: string;
	dependencyBlockLabel: string;
	dependencyKindCode: string;
	dependencyKindLabel: string;
	relationshipSourceCode: string;
	relatedEntityId: string;
	relatedEntityVariantId: string | null;
	relatedEntityVariantLabel: string | null;
	relatedEntityTypeCode: string;
	relatedEntityTypeName: string | null;
	relatedEntitySlug: string;
	relatedEntityName: string;
	relatedSectionCode: string | null;
	relatedSectionName: string | null;
	relatedClassCode: string | null;
	relatedClassName: string | null;
	relatedCategoryCode: string | null;
	relatedCategoryName: string | null;
	relatedSubcategoryCode: string | null;
	relatedSubcategoryName: string | null;
	relatedIconMediaFileId: string | null;
	quantityText: string | null;
	noteText: string | null;
	sortOrder: number;
};

export type MafiosopediaPatchNoteRow = {
	patchNoteRowId: string;
	entityId: string;
	entityVariantId: string | null;
	patchId: string;
	patchCode: string;
	patchLabel: string;
	patchSortOrder: number;
	changeScopeCode: string;
	changeTypeCode: string;
	changeLabel: string;
	whatChangedLabel: string;
	fromValueText: string | null;
	toValueText: string | null;
	sortOrder: number;
};

export type MafiosopediaEntityDetail = {
	doc: MafiosopediaEntityDetailDoc;
	sections: MafiosopediaEntitySection[];
	variants: MafiosopediaEntityVariant[];
	variantValues: MafiosopediaEntityVariantValue[];
	variantSelectors: MafiosopediaEntityVariantSelector[];
	profileElements: MafiosopediaDetailElement[];
	media: MafiosopediaEntityMediaRef[];
	recipeOutputs: MafiosopediaRecipeOutput[];
	recipeRequirements: MafiosopediaRecipeRequirement[];
	assetRecipeLinks: MafiosopediaAssetRecipeLink[];
	relationshipBlocks: MafiosopediaRelationshipBlockRow[];
	dependencyRows: MafiosopediaDependencyRow[];
	patchNoteRows: MafiosopediaPatchNoteRow[];
};

type MafiosopediaEntityDetailRow = {
	entity_id: string | number;
	entity_type_code: string;
	entity_type_name: string | null;
	entity_code: string;
	entity_slug: string;
	public_entity_slug: string | null;
	entity_name: string;
	section_id: string | number | null;
	section_code: string | null;
	section_slug: string | null;
	section_name: string | null;
	entity_class_id: string | number | null;
	entity_class_code: string | null;
	entity_class_name: string | null;
	entity_category_id: string | number | null;
	entity_category_code: string | null;
	entity_category_name: string | null;
	entity_category_slug: string | null;
	entity_subcategory_id: string | number | null;
	entity_subcategory_code: string | null;
	entity_subcategory_name: string | null;
	entity_subcategory_slug: string | null;
	category_subcategory_label: string | null;
	class_category_label: string | null;
	classification_path_label: string | null;
	public_patch_code: string | null;
	public_patch_label: string | null;
	first_seen_patch_code: string | null;
	last_seen_patch_code: string | null;
	release_state_code: string | null;
	release_state_name: string | null;
	asset_id: string | number | null;
	recipe_id: string | number | null;
	primary_media_file_id: string | number | null;
	primary_icon_media_file_id: string | number | null;
};

type MafiosopediaEntitySectionRow = {
	entity_id: string | number;
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	section_sort_order: string | number;
	membership_sort_order: string | number;
	primary_flag: boolean;
};

type MafiosopediaEntityVariantRow = {
	entity_id: string | number;
	entity_variant_id: string | number;
	variant_code: string;
	variant_name: string | null;
	variant_display_name: string | null;
	primary_flag: boolean;
	common_flag: boolean;
	source_backed_flag: boolean;
	variant_origin_code: string | null;
	active_flag: boolean;
	first_seen_patch_code: string | null;
	last_seen_patch_code: string | null;
	default_candidate_rank: string | number;
	default_candidate_order: string | number;
};

type MafiosopediaEntityVariantValueRow = {
	entity_id: string | number;
	entity_variant_id: string | number;
	entity_variant_value_id: string | number;
	variant_group_code: string;
	variant_group_name: string | null;
	variant_group_slug: string | null;
	variant_value_code: string;
	variant_value_name: string;
	variant_value_slug: string | null;
	variant_value_number: string | number | null;
	badge_label: string;
	visual_tone_code: string;
	variant_group_sort_order: string | number;
	variant_value_sort_order: string | number;
};

type MafiosopediaEntityVariantSelectorRow = {
	entity_id: string | number;
	display_profile_id: string | number;
	display_profile_code: string;
	display_profile_name: string;
	display_profile_variant_selector_id: string | number;
	variant_group_code: string;
	variant_group_name: string | null;
	variant_group_slug: string | null;
	selector_label: string;
	sort_order: string | number;
};

type MafiosopediaDetailElementRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	display_profile_id: string | number | null;
	display_profile_code: string | null;
	display_profile_name: string | null;
	display_profile_element_id: string | number | null;
	source_type_code: string;
	source_code: string;
	entity_property_id: string | number | null;
	builtin_field_code: string | null;
	display_slot_code: string;
	display_group_code: string | null;
	display_group_label: string | null;
	display_label: string;
	display_value: string;
	value_type_code: string;
	sort_order: string | number;
	compact_flag: boolean;
	featured_flag: boolean;
	fallback_flag: boolean;
	entity_property_value_id: string | number | null;
	entity_property_value_link_id: string | number | null;
	linked_entity_id: string | number | null;
	linked_entity_variant_id: string | number | null;
	linked_entity_type_code: string | null;
	linked_entity_slug: string | null;
	linked_entity_name: string | null;
	linked_icon_media_file_id: string | number | null;
};

type MafiosopediaEntityMediaRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_media_id: string | number;
	media_id: string | number;
	media_file_id: string | number;
	media_role_code: string;
	primary_flag: boolean;
	sort_order: string | number;
	width_px: number | null;
	height_px: number | null;
	mime_type: string | null;
	alt_text: string | null;
	caption: string | null;
	selected_header_rank: string | number;
	selected_icon_rank: string | number;
};

type MafiosopediaRecipeOutputRow = {
	recipe_entity_id: string | number;
	recipe_entity_variant_id: string | number | null;
	recipe_output_id: string | number;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string;
	target_entity_class_code: string | null;
	target_entity_class_name: string | null;
	quantity_value: string | number | null;
	quantity_text: string | null;
	unit_code: string | null;
	primary_output_flag: boolean;
	sort_order: string | number;
	resolution_status_code: string;
	target_icon_media_file_id: string | number | null;
};

type MafiosopediaRecipeRequirementRow = {
	recipe_entity_id: string | number;
	recipe_entity_variant_id: string | number | null;
	source_row_id: string | number;
	requirement_kind_code: string;
	relationship_type_code: string | null;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string | null;
	generic_group_id: string | number | null;
	generic_group_code: string | null;
	generic_group_name: string | null;
	quantity_value: string | number | null;
	quantity_text: string | null;
	unit_code: string | null;
	source_value_text: string | null;
	resolution_status_code: string;
	sort_order: string | number;
	target_icon_media_file_id: string | number | null;
	target_crafted_by_recipe_entity_id: string | number | null;
	target_crafted_by_recipe_slug: string | null;
	target_crafted_by_recipe_name: string | null;
	target_crafted_by_recipe_icon_media_file_id: string | number | null;
};

type MafiosopediaAssetRecipeLinkRow = {
	asset_entity_id: string | number;
	asset_entity_variant_id: string | number | null;
	link_kind_code: string;
	recipe_entity_id: string | number;
	recipe_entity_variant_id: string | number | null;
	recipe_entity_slug: string;
	recipe_entity_name: string;
	recipe_class_code: string | null;
	recipe_class_name: string | null;
	quantity_value: string | number | null;
	quantity_text: string | null;
	sort_order: string | number;
	resolution_status_code: string;
	recipe_icon_media_file_id: string | number | null;
	primary_output_entity_id: string | number | null;
	primary_output_entity_name: string | null;
};

type MafiosopediaRelationshipBlockDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_relationship_id: string | number;
	relationship_code: string;
	relationship_label: string;
	relationship_direction_code: string;
	block_code: string;
	block_label: string;
	target_entity_id: string | number;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string;
	target_entity_slug: string;
	target_entity_name: string;
	target_class_code: string | null;
	target_class_name: string | null;
	target_category_code: string | null;
	target_category_name: string | null;
	source_value_text: string | null;
	resolution_status_code: string;
	sort_order: string | number;
	target_icon_media_file_id: string | number | null;
};

type MafiosopediaDependencyDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	dependency_block_code: string;
	dependency_block_label: string;
	dependency_kind_code: string;
	dependency_kind_label: string;
	relationship_source_code: string;
	related_entity_id: string | number;
	related_entity_variant_id: string | number | null;
	related_entity_variant_label: string | null;
	related_entity_type_code: string;
	related_entity_type_name: string | null;
	related_entity_slug: string;
	related_entity_name: string;
	related_section_code: string | null;
	related_section_name: string | null;
	related_class_code: string | null;
	related_class_name: string | null;
	related_category_code: string | null;
	related_category_name: string | null;
	related_subcategory_code: string | null;
	related_subcategory_name: string | null;
	related_icon_media_file_id: string | number | null;
	quantity_text: string | null;
	note_text: string | null;
	sort_order: string | number;
};

type MafiosopediaPatchNoteDbRow = {
	patch_note_row_id: string | number;
	entity_id: string | number;
	entity_variant_id: string | number | null;
	patch_id: string | number;
	patch_code: string;
	patch_label: string;
	patch_sort_order: string | number;
	change_scope_code: string;
	change_type_code: string;
	change_label: string;
	what_changed_label: string;
	from_value_text: string | null;
	to_value_text: string | null;
	sort_order: string | number;
};

function toStringId(value: string | number): string {
	return String(value);
}

function toNullableStringId(value: string | number | null): string | null {
	return value === null ? null : String(value);
}

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function toNullableNumber(value: string | number | null): number | null {
	if (value === null) {
		return null;
	}

	const parsed = toNumber(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMafiosopediaSlug(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	return MAFIOSOPEDIA_SLUG_PATTERN.test(normalized) ? normalized : null;
}

function mapDocRow(row: MafiosopediaEntityDetailRow): MafiosopediaEntityDetailDoc {
	return {
		entityId: toStringId(row.entity_id),
		entityTypeCode: row.entity_type_code,
		entityTypeName: row.entity_type_name,
		entityCode: row.entity_code,
		entitySlug: row.entity_slug,
		publicEntitySlug: row.public_entity_slug,
		entityName: row.entity_name,
		sectionId: toNullableStringId(row.section_id),
		sectionCode: row.section_code,
		sectionSlug: row.section_slug,
		sectionName: row.section_name,
		entityClassId: toNullableStringId(row.entity_class_id),
		entityClassCode: row.entity_class_code,
		entityClassName: row.entity_class_name,
		entityCategoryId: toNullableStringId(row.entity_category_id),
		entityCategoryCode: row.entity_category_code,
		entityCategoryName: row.entity_category_name,
		entityCategorySlug: row.entity_category_slug,
		entitySubcategoryId: toNullableStringId(row.entity_subcategory_id),
		entitySubcategoryCode: row.entity_subcategory_code,
		entitySubcategoryName: row.entity_subcategory_name,
		entitySubcategorySlug: row.entity_subcategory_slug,
		categorySubcategoryLabel: row.category_subcategory_label,
		classCategoryLabel: row.class_category_label,
		classificationPathLabel: row.classification_path_label,
		publicPatchCode: row.public_patch_code,
		publicPatchLabel: row.public_patch_label,
		firstSeenPatchCode: row.first_seen_patch_code,
		lastSeenPatchCode: row.last_seen_patch_code,
		releaseStateCode: row.release_state_code,
		releaseStateName: row.release_state_name,
		assetId: toNullableStringId(row.asset_id),
		recipeId: toNullableStringId(row.recipe_id),
		primaryMediaFileId: toNullableStringId(row.primary_media_file_id),
		primaryIconMediaFileId: toNullableStringId(row.primary_icon_media_file_id),
	};
}

function mapSectionRow(row: MafiosopediaEntitySectionRow): MafiosopediaEntitySection {
	return {
		entityId: toStringId(row.entity_id),
		sectionId: toStringId(row.section_id),
		sectionCode: row.section_code,
		sectionSlug: row.section_slug,
		sectionName: row.section_name,
		sectionSortOrder: toNumber(row.section_sort_order),
		membershipSortOrder: toNumber(row.membership_sort_order),
		primary: row.primary_flag,
	};
}

function mapVariantRow(row: MafiosopediaEntityVariantRow): MafiosopediaEntityVariant {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toStringId(row.entity_variant_id),
		variantCode: row.variant_code,
		variantName: row.variant_name,
		variantDisplayName: row.variant_display_name,
		primary: row.primary_flag,
		common: row.common_flag,
		sourceBacked: row.source_backed_flag,
		variantOriginCode: row.variant_origin_code,
		active: row.active_flag,
		firstSeenPatchCode: row.first_seen_patch_code,
		lastSeenPatchCode: row.last_seen_patch_code,
		defaultCandidateRank: toNumber(row.default_candidate_rank),
		defaultCandidateOrder: toNumber(row.default_candidate_order),
	};
}

function mapVariantValueRow(
	row: MafiosopediaEntityVariantValueRow,
): MafiosopediaEntityVariantValue {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toStringId(row.entity_variant_id),
		entityVariantValueId: toStringId(row.entity_variant_value_id),
		variantGroupCode: row.variant_group_code,
		variantGroupName: row.variant_group_name,
		variantGroupSlug: row.variant_group_slug,
		variantValueCode: row.variant_value_code,
		variantValueName: row.variant_value_name,
		variantValueSlug: row.variant_value_slug,
		variantValueNumber: toNullableNumber(row.variant_value_number),
		badgeLabel: row.badge_label,
		visualToneCode: row.visual_tone_code,
		variantGroupSortOrder: toNumber(row.variant_group_sort_order),
		variantValueSortOrder: toNumber(row.variant_value_sort_order),
	};
}

function mapVariantSelectorRow(
	row: MafiosopediaEntityVariantSelectorRow,
): MafiosopediaEntityVariantSelector {
	return {
		entityId: toStringId(row.entity_id),
		displayProfileId: toStringId(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfileVariantSelectorId: toStringId(row.display_profile_variant_selector_id),
		variantGroupCode: row.variant_group_code,
		variantGroupName: row.variant_group_name,
		variantGroupSlug: row.variant_group_slug,
		selectorLabel: row.selector_label,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapDetailElementRow(row: MafiosopediaDetailElementRow): MafiosopediaDetailElement {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		displayProfileId: toNullableStringId(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfileElementId: toNullableStringId(row.display_profile_element_id),
		sourceTypeCode: row.source_type_code,
		sourceCode: row.source_code,
		entityPropertyId: toNullableStringId(row.entity_property_id),
		builtinFieldCode: row.builtin_field_code,
		displaySlotCode: row.display_slot_code,
		displayGroupCode: row.display_group_code,
		displayGroupLabel: row.display_group_label,
		displayLabel: row.display_label,
		displayValue: row.display_value,
		valueTypeCode: row.value_type_code,
		sortOrder: toNumber(row.sort_order),
		compact: row.compact_flag,
		featured: row.featured_flag,
		fallback: row.fallback_flag,
		entityPropertyValueId: toNullableStringId(row.entity_property_value_id),
		entityPropertyValueLinkId: toNullableStringId(row.entity_property_value_link_id),
		linkedEntityId: toNullableStringId(row.linked_entity_id),
		linkedEntityVariantId: toNullableStringId(row.linked_entity_variant_id),
		linkedEntityTypeCode: row.linked_entity_type_code,
		linkedEntitySlug: row.linked_entity_slug,
		linkedEntityName: row.linked_entity_name,
		linkedIconMediaFileId: toNullableStringId(row.linked_icon_media_file_id),
	};
}

function mapMediaRow(row: MafiosopediaEntityMediaRow): MafiosopediaEntityMediaRef {
	const mediaFileId = toStringId(row.media_file_id);

	return {
		mediaFileId,
		mediaId: toStringId(row.media_id),
		url: buildMafiosopediaMediaFileUrl(mediaFileId),
		width: row.width_px,
		height: row.height_px,
		mimeType: row.mime_type,
		roleCode: row.media_role_code,
		entityVariantId: toNullableStringId(row.entity_variant_id),
		primary: row.primary_flag,
		sortOrder: toNumber(row.sort_order),
		altText: row.alt_text,
		caption: row.caption,
		selectedHeaderRank: toNumber(row.selected_header_rank),
		selectedIconRank: toNumber(row.selected_icon_rank),
	};
}

function mapRecipeOutputRow(row: MafiosopediaRecipeOutputRow): MafiosopediaRecipeOutput {
	return {
		recipeEntityId: toStringId(row.recipe_entity_id),
		recipeEntityVariantId: toNullableStringId(row.recipe_entity_variant_id),
		recipeOutputId: toStringId(row.recipe_output_id),
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetEntityClassCode: row.target_entity_class_code,
		targetEntityClassName: row.target_entity_class_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		unitCode: row.unit_code,
		primaryOutput: row.primary_output_flag,
		sortOrder: toNumber(row.sort_order),
		resolutionStatusCode: row.resolution_status_code,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
	};
}

function mapRecipeRequirementRow(
	row: MafiosopediaRecipeRequirementRow,
): MafiosopediaRecipeRequirement {
	return {
		recipeEntityId: toStringId(row.recipe_entity_id),
		recipeEntityVariantId: toNullableStringId(row.recipe_entity_variant_id),
		sourceRowId: toStringId(row.source_row_id),
		requirementKindCode: row.requirement_kind_code,
		relationshipTypeCode: row.relationship_type_code,
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		genericGroupId: toNullableStringId(row.generic_group_id),
		genericGroupCode: row.generic_group_code,
		genericGroupName: row.generic_group_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		unitCode: row.unit_code,
		sourceValueText: row.source_value_text,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		targetCraftedByRecipeEntityId: toNullableStringId(row.target_crafted_by_recipe_entity_id),
		targetCraftedByRecipeSlug: row.target_crafted_by_recipe_slug,
		targetCraftedByRecipeName: row.target_crafted_by_recipe_name,
		targetCraftedByRecipeIconMediaFileId: toNullableStringId(row.target_crafted_by_recipe_icon_media_file_id),
	};
}

function mapAssetRecipeLinkRow(
	row: MafiosopediaAssetRecipeLinkRow,
): MafiosopediaAssetRecipeLink {
	return {
		assetEntityId: toStringId(row.asset_entity_id),
		assetEntityVariantId: toNullableStringId(row.asset_entity_variant_id),
		linkKindCode: row.link_kind_code,
		recipeEntityId: toStringId(row.recipe_entity_id),
		recipeEntityVariantId: toNullableStringId(row.recipe_entity_variant_id),
		recipeEntitySlug: row.recipe_entity_slug,
		recipeEntityName: row.recipe_entity_name,
		recipeClassCode: row.recipe_class_code,
		recipeClassName: row.recipe_class_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		sortOrder: toNumber(row.sort_order),
		resolutionStatusCode: row.resolution_status_code,
		recipeIconMediaFileId: toNullableStringId(row.recipe_icon_media_file_id),
		primaryOutputEntityId: toNullableStringId(row.primary_output_entity_id),
		primaryOutputEntityName: row.primary_output_entity_name,
	};
}

function mapRelationshipBlockRow(
	row: MafiosopediaRelationshipBlockDbRow,
): MafiosopediaRelationshipBlockRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		relationshipCode: row.relationship_code,
		relationshipLabel: row.relationship_label,
		relationshipDirectionCode: row.relationship_direction_code,
		blockCode: row.block_code,
		blockLabel: row.block_label,
		targetEntityId: toStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetClassCode: row.target_class_code,
		targetClassName: row.target_class_name,
		targetCategoryCode: row.target_category_code,
		targetCategoryName: row.target_category_name,
		sourceValueText: row.source_value_text,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
	};
}

function mapDependencyRow(row: MafiosopediaDependencyDbRow): MafiosopediaDependencyRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		dependencyBlockCode: row.dependency_block_code,
		dependencyBlockLabel: row.dependency_block_label,
		dependencyKindCode: row.dependency_kind_code,
		dependencyKindLabel: row.dependency_kind_label,
		relationshipSourceCode: row.relationship_source_code,
		relatedEntityId: toStringId(row.related_entity_id),
		relatedEntityVariantId: toNullableStringId(row.related_entity_variant_id),
		relatedEntityVariantLabel: row.related_entity_variant_label,
		relatedEntityTypeCode: row.related_entity_type_code,
		relatedEntityTypeName: row.related_entity_type_name,
		relatedEntitySlug: row.related_entity_slug,
		relatedEntityName: row.related_entity_name,
		relatedSectionCode: row.related_section_code,
		relatedSectionName: row.related_section_name,
		relatedClassCode: row.related_class_code,
		relatedClassName: row.related_class_name,
		relatedCategoryCode: row.related_category_code,
		relatedCategoryName: row.related_category_name,
		relatedSubcategoryCode: row.related_subcategory_code,
		relatedSubcategoryName: row.related_subcategory_name,
		relatedIconMediaFileId: toNullableStringId(row.related_icon_media_file_id),
		quantityText: row.quantity_text,
		noteText: row.note_text,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapPatchNoteRow(row: MafiosopediaPatchNoteDbRow): MafiosopediaPatchNoteRow {
	return {
		patchNoteRowId: toStringId(row.patch_note_row_id),
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		patchId: toStringId(row.patch_id),
		patchCode: row.patch_code,
		patchLabel: row.patch_label,
		patchSortOrder: toNumber(row.patch_sort_order),
		changeScopeCode: row.change_scope_code,
		changeTypeCode: row.change_type_code,
		changeLabel: row.change_label,
		whatChangedLabel: row.what_changed_label,
		fromValueText: row.from_value_text,
		toValueText: row.to_value_text,
		sortOrder: toNumber(row.sort_order),
	};
}

async function findMafiosopediaEntityDocBySlug(args: {
	slug: string;
	entityTypeCode: EntityTypeFilter | null;
}): Promise<MafiosopediaEntityDetailDoc | null> {
	const params = args.entityTypeCode ? [args.slug, args.entityTypeCode] : [args.slug];
	const entityTypeWhere = args.entityTypeCode ? " AND entity_type_code = $2" : "";
	const result = await query<MafiosopediaEntityDetailRow>(
		`SELECT entity_id,
				entity_type_code,
				entity_type_name,
				entity_code,
				entity_slug,
				entity_slug AS public_entity_slug,
				entity_name,
				section_id,
				section_code,
				section_slug,
				section_name,
				entity_class_id,
				entity_class_code,
				entity_class_name,
				entity_category_id,
				entity_category_code,
				entity_category_name,
				entity_category_slug,
				entity_subcategory_id,
				entity_subcategory_code,
				entity_subcategory_name,
				entity_subcategory_slug,
				category_subcategory_label,
				class_category_label,
				classification_path_label,
				public_patch_code,
				public_patch_label,
				first_seen_patch_code,
				last_seen_patch_code,
				release_state_code,
				release_state_name,
				asset_id,
				recipe_id,
				primary_media_file_id,
				primary_icon_media_file_id
		 FROM web_view.mafiosopedia_entity_detail
		 WHERE entity_slug = $1${entityTypeWhere}
		 LIMIT 1`,
		params,
	);
	const row = result.rows[0] ?? null;

	return row ? mapDocRow(row) : null;
}

async function listMafiosopediaEntitySections(
	entityId: string,
): Promise<MafiosopediaEntitySection[]> {
	const result = await query<MafiosopediaEntitySectionRow>(
		`SELECT entity_id,
				section_id,
				section_code,
				section_slug,
				section_name,
				section_sort_order,
				membership_sort_order,
				primary_flag
		 FROM web_view.mafiosopedia_entity_detail_sections
		 WHERE entity_id = $1::bigint
		 ORDER BY primary_flag DESC,
				  membership_sort_order,
				  section_sort_order,
				  section_name`,
		[entityId],
	);

	return result.rows.map(mapSectionRow);
}

async function listMafiosopediaEntityVariants(
	entityId: string,
): Promise<MafiosopediaEntityVariant[]> {
	const result = await query<MafiosopediaEntityVariantRow>(
		`SELECT entity_id,
				entity_variant_id,
				variant_code,
				variant_name,
				variant_display_name,
				primary_flag,
				common_flag,
				source_backed_flag,
				variant_origin_code,
				active_flag,
				first_seen_patch_code,
				last_seen_patch_code,
				default_candidate_rank,
				default_candidate_order
		 FROM web_view.mafiosopedia_entity_detail_variants
		 WHERE entity_id = $1::bigint
		 ORDER BY default_candidate_order,
				  variant_display_name,
				  entity_variant_id`,
		[entityId],
	);

	return result.rows.map(mapVariantRow);
}

async function listMafiosopediaEntityVariantValues(
	entityId: string,
): Promise<MafiosopediaEntityVariantValue[]> {
	const result = await query<MafiosopediaEntityVariantValueRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_variant_value_id,
				variant_group_code,
				variant_group_name,
				variant_group_slug,
				variant_value_code,
				variant_value_name,
				variant_value_slug,
				variant_value_number,
				badge_label,
				visual_tone_code,
				variant_group_sort_order,
				variant_value_sort_order
		 FROM web_view.mafiosopedia_entity_detail_variant_values
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id,
				  variant_group_sort_order,
				  variant_value_sort_order,
				  variant_value_code`,
		[entityId],
	);

	return result.rows.map(mapVariantValueRow);
}

async function listMafiosopediaEntityVariantSelectors(
	entityId: string,
): Promise<MafiosopediaEntityVariantSelector[]> {
	const result = await query<MafiosopediaEntityVariantSelectorRow>(
		`SELECT entity_id,
				display_profile_id,
				display_profile_code,
				display_profile_name,
				display_profile_variant_selector_id,
				variant_group_code,
				variant_group_name,
				variant_group_slug,
				selector_label,
				sort_order
		 FROM web_view.mafiosopedia_entity_detail_variant_selectors
		 WHERE entity_id = $1::bigint
		 ORDER BY sort_order,
				  variant_group_name,
				  variant_group_code`,
		[entityId],
	);

	return result.rows.map(mapVariantSelectorRow);
}

async function listMafiosopediaEntityProfileElements(
	entityId: string,
): Promise<MafiosopediaDetailElement[]> {
	const result = await query<MafiosopediaDetailElementRow>(
		`SELECT entity_id,
				entity_variant_id,
				display_profile_id,
				display_profile_code,
				display_profile_name,
				display_profile_element_id,
				source_type_code,
				source_code,
				entity_property_id,
				builtin_field_code,
				display_slot_code,
				display_group_code,
				display_group_label,
				display_label,
				display_value,
				value_type_code,
				sort_order,
				compact_flag,
				featured_flag,
				fallback_flag,
				entity_property_value_id,
				entity_property_value_link_id,
				linked_entity_id,
				linked_entity_variant_id,
				linked_entity_type_code,
				linked_entity_slug,
				linked_entity_name,
				linked_icon_media_file_id
		 FROM web_view.mafiosopedia_entity_detail_profile_elements
		 WHERE entity_id = $1::bigint
		   AND public_display_flag = true
		 ORDER BY display_slot_code,
				  sort_order,
				  display_label,
				  entity_variant_id NULLS FIRST`,
		[entityId],
	);

	return result.rows.map(mapDetailElementRow);
}

async function listMafiosopediaEntityMedia(
	entityId: string,
): Promise<MafiosopediaEntityMediaRef[]> {
	const result = await query<MafiosopediaEntityMediaRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_media_id,
				media_id,
				media_file_id,
				media_role_code,
				primary_flag,
				sort_order,
				width_px,
				height_px,
				mime_type,
				alt_text,
				caption,
				selected_header_rank,
				selected_icon_rank
		 FROM web_view.mafiosopedia_entity_detail_media
		 WHERE entity_id = $1::bigint
		   AND public_display_flag = true
		 ORDER BY entity_variant_id NULLS FIRST,
				  selected_header_rank,
				  primary_flag DESC,
				  sort_order,
				  media_file_id`,
		[entityId],
	);

	return result.rows.map(mapMediaRow);
}

async function listMafiosopediaRecipeOutputs(
	entityId: string,
): Promise<MafiosopediaRecipeOutput[]> {
	const result = await query<MafiosopediaRecipeOutputRow>(
		`SELECT recipe_entity_id,
				recipe_entity_variant_id,
				recipe_output_id,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_entity_class_code,
				target_entity_class_name,
				quantity_value,
				quantity_text,
				unit_code,
				primary_output_flag,
				sort_order,
				resolution_status_code,
				target_icon_media_file_id
		 FROM web_view.mafiosopedia_entity_detail_recipe_outputs
		 WHERE recipe_entity_id = $1::bigint
		 ORDER BY primary_output_flag DESC,
				  sort_order,
				  target_entity_name`,
		[entityId],
	);

	return result.rows.map(mapRecipeOutputRow);
}

async function listMafiosopediaRecipeRequirements(
	entityId: string,
): Promise<MafiosopediaRecipeRequirement[]> {
	const result = await query<MafiosopediaRecipeRequirementRow>(
		`SELECT recipe_entity_id,
				recipe_entity_variant_id,
				source_row_id,
				requirement_kind_code,
				relationship_type_code,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				generic_group_id,
				generic_group_code,
				generic_group_name,
				quantity_value,
				quantity_text,
				unit_code,
				source_value_text,
				resolution_status_code,
				sort_order,
				target_icon_media_file_id,
				target_crafted_by_recipe_entity_id,
				target_crafted_by_recipe_slug,
				target_crafted_by_recipe_name,
				target_crafted_by_recipe_icon_media_file_id
		 FROM web_view.mafiosopedia_entity_detail_recipe_requirements
		 WHERE recipe_entity_id = $1::bigint
		 ORDER BY requirement_kind_code,
				  sort_order,
				  target_entity_name NULLS LAST,
				  source_row_id`,
		[entityId],
	);

	return result.rows.map(mapRecipeRequirementRow);
}

async function listMafiosopediaAssetRecipeLinks(
	entityId: string,
): Promise<MafiosopediaAssetRecipeLink[]> {
	const result = await query<MafiosopediaAssetRecipeLinkRow>(
		`SELECT asset_entity_id,
				asset_entity_variant_id,
				link_kind_code,
				recipe_entity_id,
				recipe_entity_variant_id,
				recipe_entity_slug,
				recipe_entity_name,
				recipe_class_code,
				recipe_class_name,
				quantity_value,
				quantity_text,
				sort_order,
				resolution_status_code,
				recipe_icon_media_file_id,
				primary_output_entity_id,
				primary_output_entity_name
		 FROM web_view.mafiosopedia_entity_detail_asset_recipe_links
		 WHERE asset_entity_id = $1::bigint
		 ORDER BY link_kind_code,
				  sort_order,
				  recipe_entity_name`,
		[entityId],
	);

	return result.rows.map(mapAssetRecipeLinkRow);
}

async function listMafiosopediaRelationshipBlocks(
	entityId: string,
): Promise<MafiosopediaRelationshipBlockRow[]> {
	const result = await query<MafiosopediaRelationshipBlockDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_relationship_id,
				relationship_code,
				relationship_label,
				relationship_direction_code,
				block_code,
				block_label,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_class_code,
				target_class_name,
				target_category_code,
				target_category_name,
				source_value_text,
				resolution_status_code,
				sort_order,
				target_icon_media_file_id
		 FROM web_view.mafiosopedia_entity_detail_relationship_blocks
		 WHERE entity_id = $1::bigint
		 ORDER BY block_code,
				  relationship_direction_code,
				  sort_order,
				  target_entity_name`,
		[entityId],
	);

	return result.rows.map(mapRelationshipBlockRow);
}


async function listMafiosopediaDependencyRows(
	entityId: string,
): Promise<MafiosopediaDependencyRow[]> {
	const result = await query<MafiosopediaDependencyDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				dependency_block_code,
				dependency_block_label,
				dependency_kind_code,
				dependency_kind_label,
				relationship_source_code,
				related_entity_id,
				related_entity_variant_id,
				related_entity_variant_label,
				related_entity_type_code,
				related_entity_type_name,
				related_entity_slug,
				related_entity_name,
				related_section_code,
				related_section_name,
				related_class_code,
				related_class_name,
				related_category_code,
				related_category_name,
				related_subcategory_code,
				related_subcategory_name,
				related_icon_media_file_id,
				quantity_text,
				note_text,
				sort_order
		 FROM web_view.mafiosopedia_entity_detail_dependency_rows
		 WHERE entity_id = $1::bigint
		 ORDER BY dependency_block_code,
				  sort_order,
				  related_entity_name,
				  related_entity_id`,
		[entityId],
	);

	return result.rows.map(mapDependencyRow);
}

async function listMafiosopediaPatchNoteRows(
	entityId: string,
): Promise<MafiosopediaPatchNoteRow[]> {
	const result = await query<MafiosopediaPatchNoteDbRow>(
		`SELECT patch_note_row_id,
				entity_id,
				entity_variant_id,
				patch_id,
				patch_code,
				patch_label,
				patch_sort_order,
				change_scope_code,
				change_type_code,
				change_label,
				what_changed_label,
				from_value_text,
				to_value_text,
				sort_order
		 FROM web_view.mafiosopedia_entity_detail_patch_note_rows
		 WHERE entity_id = $1::bigint
		 ORDER BY patch_sort_order DESC,
				  sort_order,
				  what_changed_label,
				  patch_note_row_id`,
		[entityId],
	);

	return result.rows.map(mapPatchNoteRow);
}


async function loadMafiosopediaEntityDetail(
	doc: MafiosopediaEntityDetailDoc,
): Promise<MafiosopediaEntityDetail> {
	const [
		sections,
		variants,
		variantValues,
		variantSelectors,
		profileElements,
		media,
		relationshipBlocks,
		dependencyRows,
		patchNoteRows,
	] = await Promise.all([
		listMafiosopediaEntitySections(doc.entityId),
		listMafiosopediaEntityVariants(doc.entityId),
		listMafiosopediaEntityVariantValues(doc.entityId),
		listMafiosopediaEntityVariantSelectors(doc.entityId),
		listMafiosopediaEntityProfileElements(doc.entityId),
		listMafiosopediaEntityMedia(doc.entityId),
		listMafiosopediaRelationshipBlocks(doc.entityId),
		listMafiosopediaDependencyRows(doc.entityId),
		listMafiosopediaPatchNoteRows(doc.entityId),
	]);

	const [recipeOutputs, recipeRequirements, assetRecipeLinks] = await Promise.all([
		doc.entityTypeCode === "recipe"
			? listMafiosopediaRecipeOutputs(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "recipe"
			? listMafiosopediaRecipeRequirements(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "asset"
			? listMafiosopediaAssetRecipeLinks(doc.entityId)
			: Promise.resolve([]),
	]);

	return {
		doc,
		sections,
		variants,
		variantValues,
		variantSelectors,
		profileElements,
		media,
		recipeOutputs,
		recipeRequirements,
		assetRecipeLinks,
		relationshipBlocks,
		dependencyRows,
		patchNoteRows,
	};
}

export async function findMafiosopediaEntityDetailByEntitySlug(
	entitySlug: string,
): Promise<MafiosopediaEntityDetail | null> {
	const normalizedSlug = normalizeMafiosopediaSlug(entitySlug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findMafiosopediaEntityDocBySlug({
		slug: normalizedSlug,
		entityTypeCode: null,
	});

	return doc ? loadMafiosopediaEntityDetail(doc) : null;
}

export async function findMafiosopediaEntityDetailBySlug(args: {
	slug: string;
	entityTypeCode: EntityTypeFilter;
}): Promise<MafiosopediaEntityDetail | null> {
	const normalizedSlug = normalizeMafiosopediaSlug(args.slug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findMafiosopediaEntityDocBySlug({
		slug: normalizedSlug,
		entityTypeCode: args.entityTypeCode,
	});

	return doc ? loadMafiosopediaEntityDetail(doc) : null;
}
