//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-entity-detail.ts                                                     ////
//// Language: TS                                                                                               ////
//// Entity-first public Riseopedia detail loader backed by stable web_view contracts and DB-owned slugs.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

const RISEOPEDIA_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type EntityTypeFilter = "asset" | "recipe";

export type RiseopediaEntityMediaRef = {
	mediaFileId: string;
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
	heroMediaFileId: string | null;
	heroUrl: string | null;
	heroWidth: number | null;
	heroHeight: number | null;
	heroMimeType: string | null;
	roleCode: string;
	entityVariantId: string | null;
	primary: boolean;
	sortOrder: number;
	altText: string | null;
	caption: string | null;
	selectedHeaderRank: number;
	selectedIconRank: number;
};

export type RiseopediaEntityDetailDoc = {
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

export type RiseopediaEntitySection = {
	entityId: string;
	sectionId: string;
	sectionCode: string;
	sectionSlug: string;
	sectionName: string;
	sectionSortOrder: number;
	membershipSortOrder: number;
	primary: boolean;
};

export type RiseopediaEntityVariant = {
	entityId: string;
	entityVariantId: string;
	variantKey: string;
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

export type RiseopediaEntityVariantLinkKey = {
	entityVariantId: string;
	variantKey: string;
};

export type RiseopediaEntityVariantValue = {
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

export type RiseopediaEntityVariantSelector = {
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

export type RiseopediaDetailElement = {
	entityId: string;
	entityVariantId: string | null;
	displayProfileId: string | null;
	displayProfileCode: string | null;
	displayProfileName: string | null;
	displayProfileElementId: string | null;
	displayProfileBodyBlockId: string | null;
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

export type RiseopediaRecipeOutput = {
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

export type RiseopediaCraftedByRecipe = {
	recipeEntityId: string;
	recipeEntityVariantId: string | null;
	recipeSlug: string;
	recipeName: string;
	recipeIconMediaFileId: string | null;
	sortOrder: number;
};

export type RiseopediaRecipeRequirement = {
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
	craftedByRecipes: RiseopediaCraftedByRecipe[];
};

export type RiseopediaAssetRecipeLink = {
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

export type RiseopediaRelationshipBlockRow = {
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

export type RiseopediaDependencyRow = {
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

export type RiseopediaPatchNoteRow = {
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

export type RiseopediaLocationTreeRow = {
	entityId: string;
	parentLocationEntityId: string | null;
	locationEntityId: string;
	locationEntitySlug: string;
	locationEntityName: string;
	locationEntityClassCode: string | null;
	locationEntityClassName: string | null;
	locationEntityCategoryCode: string | null;
	locationEntityCategoryName: string | null;
	locationIconMediaFileId: string | null;
	locationDepth: number;
	locationTreeRoleCode: "ancestor" | "current" | "descendant";
};

export type RiseopediaLocationPoiRow = {
	entityId: string;
	locationEntityId: string;
	locationEntitySlug: string;
	locationEntityName: string;
	locationDepth: number;
	poiEntityId: string;
	poiEntitySlug: string;
	poiEntityName: string;
	poiEntityClassCode: string | null;
	poiEntityClassName: string | null;
	poiEntityCategoryCode: string | null;
	poiEntityCategoryName: string | null;
	poiIconMediaFileId: string | null;
};

export type RiseopediaPoiLocationTreeRow = RiseopediaLocationTreeRow & {
	entityVariantId: string | null;
};

export type RiseopediaPoiVendorStockRow = {
	entityId: string;
	entityVariantId: string | null;
	entityLootTableId: string;
	lootTableId: string;
	lootTableKey: string;
	lootTableDisplayName: string;
	lootTableEntryId: string;
	itemEntityId: string | null;
	itemEntityVariantId: string | null;
	itemEntityVariantLabel: string | null;
	itemEntityTypeCode: string | null;
	itemEntitySlug: string | null;
	itemEntityName: string | null;
	itemEntityClassCode: string | null;
	itemEntityClassName: string | null;
	itemIconMediaFileId: string | null;
	itemPriceValue: number | null;
	itemPriceDisplayValue: string | null;
	itemSourceValueText: string | null;
	minQuantity: number | null;
	maxQuantity: number | null;
	chanceValue: number | null;
	weightValue: number | null;
	availabilityCode: string;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaPoiResourceYieldRow = {
	entityId: string;
	entityVariantId: string | null;
	entityLootTableId: string;
	lootTableId: string;
	lootTableKey: string;
	lootTableDisplayName: string;
	lootTableEntryId: string;
	itemEntityId: string | null;
	itemEntityVariantId: string | null;
	itemEntityVariantLabel: string | null;
	itemEntityTypeCode: string | null;
	itemEntitySlug: string | null;
	itemEntityName: string | null;
	itemEntityClassCode: string | null;
	itemEntityClassName: string | null;
	itemIconMediaFileId: string | null;
	itemSourceValueText: string | null;
	minQuantity: number | null;
	maxQuantity: number | null;
	chanceValue: number | null;
	weightValue: number | null;
	availabilityCode: string;
	resolutionStatusCode: string;
	sortOrder: number;
	spawnerCount: number | null;
	initialStartupTriesMin: number | null;
	initialStartupTriesMax: number | null;
};

export type RiseopediaPoiTransportStopRow = {
	entityId: string;
	routePointId: string;
	routeCode: string;
	pointOrder: number;
	pointRoleCode: string;
	stopName: string;
	locationEntityId: string | null;
	locationEntitySlug: string | null;
	locationEntityName: string | null;
	locationIconMediaFileId: string | null;
	confidenceCode: string;
	metadataJson: unknown;
};

export type RiseopediaPoiRelatedQuestRow = {
	entityId: string;
	entityRelationshipId: string;
	entityVariantId: string | null;
	relationshipCode: string;
	questRoleCode: string;
	questRoleLabel: string;
	questEntityId: string;
	questEntitySlug: string;
	questEntityName: string;
	questEntityClassCode: string | null;
	questEntityClassName: string | null;
	questEntityCategoryCode: string | null;
	questEntityCategoryName: string | null;
	questEntitySubcategoryCode: string | null;
	questEntitySubcategoryName: string | null;
	questClassificationLabel: string | null;
	questIconMediaFileId: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaPoiPublicBenchLinkRow = {
	entityId: string;
	entityRelationshipId: string;
	entityVariantId: string | null;
	linkKindCode: "bench_asset" | "recipe" | "unknown";
	relationshipCode: string;
	targetEntityId: string;
	targetEntityVariantId: string | null;
	targetEntityVariantLabel: string | null;
	targetEntityTypeCode: string;
	targetEntitySlug: string;
	targetEntityName: string;
	targetEntityClassCode: string | null;
	targetEntityClassName: string | null;
	targetEntityCategoryCode: string | null;
	targetEntityCategoryName: string | null;
	targetEntitySubcategoryCode: string | null;
	targetEntitySubcategoryName: string | null;
	targetClassificationLabel: string | null;
	targetIconMediaFileId: string | null;
	benchFamilyCode: string | null;
	requiredTier: number | null;
	providedTier: number | null;
	exactTierFlag: boolean;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaPoiContainerLootRow = {
	entityId: string;
	entityVariantId: string | null;
	entityLootTableId: string;
	lootTableId: string;
	lootTableKey: string;
	lootTableDisplayName: string;
	lootTableEntryId: string;
	itemEntityId: string | null;
	itemEntityVariantId: string | null;
	itemEntityVariantLabel: string | null;
	itemEntityTypeCode: string | null;
	itemEntitySlug: string | null;
	itemEntityName: string | null;
	itemEntityClassCode: string | null;
	itemEntityClassName: string | null;
	itemIconMediaFileId: string | null;
	itemSourceValueText: string | null;
	minQuantity: number | null;
	maxQuantity: number | null;
	chanceValue: number | null;
	weightValue: number | null;
	chancePercent: number | null;
	availabilityCode: string;
	itemModeCode: string;
	sourceOccurrenceCount: number | null;
	placementCount: number | null;
	maxSlots: number | null;
	minSpawnedItems: number | null;
	maxSpawnedItems: number | null;
	respawnTimeSeconds: number | null;
	repeatableFlag: boolean;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaPoiSummaryFactRow = {
	entityId: string;
	summaryKindCode: "holocache" | "aero_trail" | "unknown";
	xpAwarded: number | null;
	rarityCode: string | null;
	rarityName: string | null;
	routePointCount: number | null;
	checkpointCount: number | null;
	startCount: number | null;
	finishCount: number | null;
	orderConfidenceCode: string | null;
};

export type RiseopediaPerkTreeRow = {
	entityId: string;
	entityVariantId: string | null;
	entityRelationshipId: string;
	relationshipRoleCode: string;
	targetEntityId: string;
	targetEntityVariantId: string | null;
	targetEntityVariantLabel: string | null;
	targetEntitySlug: string;
	targetEntityName: string;
	targetClassCode: string | null;
	targetClassName: string | null;
	targetIconMediaFileId: string | null;
	sourceValueText: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
	requirementsSectionLabel: string;
	requirementsSectionEmptyLabel: string | null;
	unlocksSectionLabel: string;
	unlocksSectionEmptyLabel: string | null;
	currentSectionLabel: string;
	currentMetaDisplayLabel: string;
	fallbackIconKey: string | null;
	fallbackIconSourceCode: string | null;
	fallbackIconLucideName: string | null;
	currentFallbackIconKey: string | null;
	currentFallbackIconSourceCode: string | null;
	currentFallbackIconLucideName: string | null;
};

export type RiseopediaEffectModifierRow = {
	entityId: string;
	entityVariantId: string | null;
	mechanicEffectModifierId: string;
	modifierIndex: number;
	targetNeedEntityId: string;
	targetNeedEntitySlug: string;
	targetNeedEntityName: string;
	targetNeedEntityClassCode: string | null;
	targetNeedEntityClassName: string | null;
	targetNeedIconMediaFileId: string | null;
	effectTypeCode: string;
	sourceEffectTypeCode: string;
	operationCode: string;
	sourceOperationCode: string;
	operationDisplayLabel: string;
	effectTypeDisplayLabel: string;
	effectValue: number;
	unitCode: string | null;
	effectValueDisplayText: string | null;
	initialDelaySeconds: number | null;
	durationSeconds: number | null;
	intervalSeconds: number | null;
	burstCount: number | null;
	delayLabel: string | null;
	durationLabel: string | null;
	intervalLabel: string | null;
	burstLabel: string | null;
	delayDisplayText: string | null;
	durationDisplayText: string | null;
	intervalDisplayText: string | null;
	burstDisplayText: string | null;
	resolutionStatusCode: string;
};

export type RiseopediaNeedEffectRow = {
	entityId: string;
	mechanicEffectModifierId: string;
	modifierIndex: number;
	effectEntityId: string;
	effectEntityVariantId: string | null;
	effectEntitySlug: string;
	effectEntityName: string;
	effectEntityClassCode: string | null;
	effectEntityClassName: string | null;
	effectIconMediaFileId: string | null;
	effectTypeCode: string;
	sourceEffectTypeCode: string;
	operationCode: string;
	sourceOperationCode: string;
	operationDisplayLabel: string;
	effectTypeDisplayLabel: string;
	effectValue: number;
	unitCode: string | null;
	effectValueDisplayText: string | null;
	initialDelaySeconds: number | null;
	durationSeconds: number | null;
	intervalSeconds: number | null;
	burstCount: number | null;
	delayLabel: string | null;
	durationLabel: string | null;
	intervalLabel: string | null;
	burstLabel: string | null;
	delayDisplayText: string | null;
	durationDisplayText: string | null;
	intervalDisplayText: string | null;
	burstDisplayText: string | null;
	resolutionStatusCode: string;
};

export type RiseopediaExperienceProgressionRow = {
	entityId: string;
	entityRelationshipId: string;
	relationshipRoleCode: "parent" | "child";
	relatedEntityId: string;
	relatedEntitySlug: string;
	relatedEntityName: string;
	relatedEntityClassCode: string | null;
	relatedEntityClassName: string | null;
	relatedIconMediaFileId: string | null;
	maxExperience: number | null;
	maxExperienceDisplayText: string | null;
	progressionDisplayModeCode: "level_table" | "points_summary";
	progressionUnitCode: string | null;
	progressionUnitDisplayLabel: string | null;
	maxLevel: number | null;
	maxPerkPoints: number | null;
	progressionSummaryLabel: string | null;
	progressionSummaryValueText: string | null;
	progressionSecondaryDisplayText: string | null;
	colorHex: string | null;
	sourceValueText: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaExperienceLevelRow = {
	entityId: string;
	entityVariantId: string | null;
	experienceLevelThresholdId: string;
	levelValue: number;
	levelStartValue: number;
	maxLevelValue: number;
	experiencePointsTotalToReachLevel: number;
	experiencePointsToNextLevel: number | null;
	experienceUnitCode: string;
	experienceUnitDisplayLabel: string;
	experiencePointsTotalToReachLevelDisplayText: string;
	experiencePointsToNextLevelDisplayText: string;
};

export type RiseopediaExperienceLevelUnlockRow = {
	entityId: string;
	entityVariantId: string | null;
	entityRelationshipId: string;
	requiredLevelValue: number;
	questEntityId: string;
	questEntityTypeCode: string;
	questEntitySlug: string | null;
	questEntityName: string;
	questIconMediaFileId: string | null;
	resolutionStatusCode: string;
};

export type RiseopediaQuestObjectiveRow = {
	entityId: string;
	entityVariantId: string | null;
	questObjectiveId: string;
	objectiveIndex: number;
	displayOrdinal: number;
	objectiveTypeCode: string;
	sourceObjectiveTypeCode: string;
	objectiveActionCode: string | null;
	objectiveActionLabel: string | null;
	objectiveActionGroupCode: string | null;
	objectiveActionGroupIndex: number;
	objectiveTitleText: string | null;
	objectiveTitleKey: string | null;
	requireLastToComplete: boolean | null;
	requireLastToShowInUi: boolean | null;
	showCountsAsPercentage: boolean | null;
	objectiveResolutionStatusCode: string;
	questObjectiveTargetId: string | null;
	targetSequenceIndex: number | null;
	completionGroupIndex: number | null;
	optionIndex: number | null;
	groupMatchOperatorCode: string | null;
	targetKindCode: string | null;
	targetDisplayText: string;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string | null;
	targetIconMediaFileId: string | null;
	fallbackIconKey: string | null;
	fallbackIconSourceCode: string | null;
	fallbackIconLucideName: string | null;
	requiredCountValue: number | null;
	requiredCountUnitCode: string | null;
	quantityDisplayText: string | null;
	targetResolutionStatusCode: string | null;
	targetResolutionDisplayLabel: string | null;
};

export type RiseopediaQuestRequirementRow = {
	entityId: string;
	entityVariantId: string | null;
	questRequirementId: string;
	requirementIndex: number;
	displayOrdinal: number;
	requirementTypeCode: string;
	requirementTypeLabel: string;
	sourceRequirementTypeCode: string;
	rawValueText: string | null;
	requiredLevelValue: number | null;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string | null;
	targetIconMediaFileId: string | null;
	fallbackIconKey: string | null;
	fallbackIconSourceCode: string | null;
	fallbackIconLucideName: string | null;
	targetDisplayText: string;
	resolutionStatusCode: string;
};

export type RiseopediaQuestRewardRow = {
	entityId: string;
	entityVariantId: string | null;
	questRewardId: string;
	rewardIndex: number;
	displayOrdinal: number;
	rewardTypeCode: string;
	sourceRewardTypeCode: string;
	rewardRowName: string | null;
	quantityValue: number | null;
	quantityText: string | null;
	quantityUnitCode: string | null;
	quantityDisplayText: string | null;
	chooseGroupCode: string | null;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string | null;
	targetIconMediaFileId: string | null;
	fallbackIconKey: string | null;
	fallbackIconSourceCode: string | null;
	fallbackIconLucideName: string | null;
	targetDisplayText: string;
	resolutionStatusCode: string;
};

export type RiseopediaQuestFlowRow = {
	entityId: string;
	entityVariantId: string | null;
	entityRelationshipId: string | null;
	flowSectionCode: string;
	flowSectionLabel: string;
	flowSectionEmptyLabel: string | null;
	initialVisibleRows: number | null;
	sectionSortOrder: number;
	targetEntityId: string | null;
	targetEntityVariantId: string | null;
	targetEntityTypeCode: string | null;
	targetEntitySlug: string | null;
	targetEntityName: string | null;
	targetIconMediaFileId: string | null;
	fallbackIconKey: string | null;
	fallbackIconSourceCode: string | null;
	fallbackIconLucideName: string | null;
	sourceValueText: string | null;
	resolutionStatusCode: string;
	sortOrder: number;
};

export type RiseopediaBodyBlock = {
	entityId: string;
	entitySlug: string;
	entityTypeCode: string;
	displayProfileId: string;
	displayProfileCode: string;
	displayProfileName: string;
	bodyRendererCode: string;
	displayProfileBodyBlockId: string;
	bodyBlockCode: string;
	bodyBlockLabel: string;
	bodyBlockRendererCode: string;
	bodyBlockDataSourceCode: string;
	displaySlotCode: "body_main" | "detail_aside";
	sortOrder: number;
	visible: boolean;
	emptyBehaviorCode: string;
	metadataJson: unknown;
};

export type RiseopediaEntityDetail = {
	doc: RiseopediaEntityDetailDoc;
	sections: RiseopediaEntitySection[];
	variants: RiseopediaEntityVariant[];
	variantLinkKeys: RiseopediaEntityVariantLinkKey[];
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
	bodyBlocks: RiseopediaBodyBlock[];
	profileElements: RiseopediaDetailElement[];
	media: RiseopediaEntityMediaRef[];
	recipeOutputs: RiseopediaRecipeOutput[];
	recipeRequirements: RiseopediaRecipeRequirement[];
	assetRecipeLinks: RiseopediaAssetRecipeLink[];
	relationshipBlocks: RiseopediaRelationshipBlockRow[];
	dependencyRows: RiseopediaDependencyRow[];
	patchNoteRows: RiseopediaPatchNoteRow[];
	locationTreeRows: RiseopediaLocationTreeRow[];
	locationPoiRows: RiseopediaLocationPoiRow[];
	poiLocationTreeRows: RiseopediaPoiLocationTreeRow[];
	poiVendorStockRows: RiseopediaPoiVendorStockRow[];
	poiResourceYieldRows: RiseopediaPoiResourceYieldRow[];
	poiTransportStopRows: RiseopediaPoiTransportStopRow[];
	poiRelatedQuestRows: RiseopediaPoiRelatedQuestRow[];
	poiPublicBenchLinkRows: RiseopediaPoiPublicBenchLinkRow[];
	poiContainerLootRows: RiseopediaPoiContainerLootRow[];
	poiSummaryFactRows: RiseopediaPoiSummaryFactRow[];
	perkTreeRows: RiseopediaPerkTreeRow[];
	effectModifierRows: RiseopediaEffectModifierRow[];
	needEffectRows: RiseopediaNeedEffectRow[];
	experienceProgressionRows: RiseopediaExperienceProgressionRow[];
	experienceLevelRows: RiseopediaExperienceLevelRow[];
	experienceLevelUnlockRows: RiseopediaExperienceLevelUnlockRow[];

	questObjectiveRows: RiseopediaQuestObjectiveRow[];
	questRequirementRows: RiseopediaQuestRequirementRow[];
	questRewardRows: RiseopediaQuestRewardRow[];
	questFlowRows: RiseopediaQuestFlowRow[];
};

type RiseopediaEntityDetailRow = {
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

type RiseopediaEntitySectionRow = {
	entity_id: string | number;
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	section_sort_order: string | number;
	membership_sort_order: string | number;
	primary_flag: boolean;
};

type RiseopediaEntityVariantRow = {
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

type RiseopediaEntityVariantLinkKeyRow = {
	entity_variant_id: string | number;
	variant_code: string;
};

type RiseopediaEntityVariantValueRow = {
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

type RiseopediaEntityVariantSelectorRow = {
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

type RiseopediaDetailElementRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	display_profile_id: string | number | null;
	display_profile_code: string | null;
	display_profile_name: string | null;
	display_profile_element_id: string | number | null;
	display_profile_body_block_id: string | number | null;
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

type RiseopediaEntityMediaRow = {
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
	hero_media_file_id: string | number | null;
	hero_width_px: number | null;
	hero_height_px: number | null;
	hero_mime_type: string | null;
	alt_text: string | null;
	caption: string | null;
	selected_header_rank: string | number;
	selected_icon_rank: string | number;
};

type RiseopediaRecipeOutputRow = {
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

type RiseopediaRecipeRequirementRow = {
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
	target_crafted_by_recipes_json: unknown;
};

type RiseopediaAssetRecipeLinkRow = {
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

type RiseopediaRelationshipBlockDbRow = {
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

type RiseopediaDependencyDbRow = {
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

type RiseopediaPatchNoteDbRow = {
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

type RiseopediaLocationTreeDbRow = {
	entity_id: string | number;
	parent_location_entity_id: string | number | null;
	location_entity_id: string | number;
	location_entity_slug: string;
	location_entity_name: string;
	location_entity_class_code: string | null;
	location_entity_class_name: string | null;
	location_entity_category_code: string | null;
	location_entity_category_name: string | null;
	location_icon_media_file_id: string | number | null;
	location_depth: string | number;
	location_tree_role_code: "ancestor" | "current" | "descendant";
};

type RiseopediaLocationPoiDbRow = {
	entity_id: string | number;
	location_entity_id: string | number;
	location_entity_slug: string;
	location_entity_name: string;
	location_depth: string | number;
	poi_entity_id: string | number;
	poi_entity_slug: string;
	poi_entity_name: string;
	poi_entity_class_code: string | null;
	poi_entity_class_name: string | null;
	poi_entity_category_code: string | null;
	poi_entity_category_name: string | null;
	poi_icon_media_file_id: string | number | null;
};

type RiseopediaPoiLocationTreeDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	location_entity_id: string | number;
	location_entity_slug: string;
	location_entity_name: string;
	location_entity_class_code: string | null;
	location_entity_class_name: string | null;
	location_entity_category_code: string | null;
	location_entity_category_name: string | null;
	location_icon_media_file_id: string | number | null;
	location_depth: string | number;
	parent_location_entity_id: string | number | null;
	location_tree_role_code: "ancestor" | "current" | "descendant";
};

type RiseopediaPoiVendorStockDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_loot_table_id: string | number;
	loot_table_id: string | number;
	loot_table_key: string;
	loot_table_display_name: string;
	loot_table_entry_id: string | number;
	item_entity_id: string | number | null;
	item_entity_variant_id: string | number | null;
	item_entity_variant_label: string | null;
	item_entity_type_code: string | null;
	item_entity_slug: string | null;
	item_entity_name: string | null;
	item_entity_class_code: string | null;
	item_entity_class_name: string | null;
	item_icon_media_file_id: string | number | null;
	item_price_value: string | number | null;
	item_price_display_value: string | null;
	item_source_value_text: string | null;
	min_quantity: string | number | null;
	max_quantity: string | number | null;
	chance_value: string | number | null;
	weight_value: string | number | null;
	availability_code: string;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaPoiResourceYieldDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_loot_table_id: string | number;
	loot_table_id: string | number;
	loot_table_key: string;
	loot_table_display_name: string;
	loot_table_entry_id: string | number;
	item_entity_id: string | number | null;
	item_entity_variant_id: string | number | null;
	item_entity_variant_label: string | null;
	item_entity_type_code: string | null;
	item_entity_slug: string | null;
	item_entity_name: string | null;
	item_entity_class_code: string | null;
	item_entity_class_name: string | null;
	item_icon_media_file_id: string | number | null;
	item_source_value_text: string | null;
	min_quantity: string | number | null;
	max_quantity: string | number | null;
	chance_value: string | number | null;
	weight_value: string | number | null;
	availability_code: string;
	resolution_status_code: string;
	sort_order: string | number;
	spawner_count: string | number | null;
	initial_startup_tries_min: string | number | null;
	initial_startup_tries_max: string | number | null;
};

type RiseopediaPoiTransportStopDbRow = {
	entity_id: string | number;
	route_point_id: string | number;
	route_code: string;
	point_order: string | number;
	point_role_code: string;
	stop_name: string;
	location_entity_id: string | number | null;
	location_entity_slug: string | null;
	location_entity_name: string | null;
	location_icon_media_file_id: string | number | null;
	confidence_code: string;
	metadata_json: unknown;
};

type RiseopediaPoiRelatedQuestDbRow = {
	entity_id: string | number;
	entity_relationship_id: string | number;
	entity_variant_id: string | number | null;
	relationship_code: string;
	quest_role_code: string;
	quest_role_label: string;
	quest_entity_id: string | number;
	quest_entity_slug: string;
	quest_entity_name: string;
	quest_entity_class_code: string | null;
	quest_entity_class_name: string | null;
	quest_entity_category_code: string | null;
	quest_entity_category_name: string | null;
	quest_entity_subcategory_code: string | null;
	quest_entity_subcategory_name: string | null;
	quest_classification_label: string | null;
	quest_icon_media_file_id: string | number | null;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaPoiPublicBenchLinkDbRow = {
	entity_id: string | number;
	entity_relationship_id: string | number;
	entity_variant_id: string | number | null;
	link_kind_code: "bench_asset" | "recipe" | "unknown";
	relationship_code: string;
	target_entity_id: string | number;
	target_entity_variant_id: string | number | null;
	target_entity_variant_label: string | null;
	target_entity_type_code: string;
	target_entity_slug: string;
	target_entity_name: string;
	target_entity_class_code: string | null;
	target_entity_class_name: string | null;
	target_entity_category_code: string | null;
	target_entity_category_name: string | null;
	target_entity_subcategory_code: string | null;
	target_entity_subcategory_name: string | null;
	target_classification_label: string | null;
	target_icon_media_file_id: string | number | null;
	bench_family_code: string | null;
	required_tier: string | number | null;
	provided_tier: string | number | null;
	exact_tier_flag: boolean;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaPoiContainerLootDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_loot_table_id: string | number;
	loot_table_id: string | number;
	loot_table_key: string;
	loot_table_display_name: string;
	loot_table_entry_id: string | number;
	item_entity_id: string | number | null;
	item_entity_variant_id: string | number | null;
	item_entity_variant_label: string | null;
	item_entity_type_code: string | null;
	item_entity_slug: string | null;
	item_entity_name: string | null;
	item_entity_class_code: string | null;
	item_entity_class_name: string | null;
	item_icon_media_file_id: string | number | null;
	item_source_value_text: string | null;
	min_quantity: string | number | null;
	max_quantity: string | number | null;
	chance_value: string | number | null;
	weight_value: string | number | null;
	chance_percent: string | number | null;
	availability_code: string;
	item_mode_code: string;
	source_occurrence_count: string | number | null;
	placement_count: string | number | null;
	max_slots: string | number | null;
	min_spawned_items: string | number | null;
	max_spawned_items: string | number | null;
	respawn_time_seconds: string | number | null;
	repeatable_flag: boolean;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaPoiSummaryFactDbRow = {
	entity_id: string | number;
	summary_kind_code: "holocache" | "aero_trail" | "unknown";
	xp_awarded: string | number | null;
	rarity_code: string | null;
	rarity_name: string | null;
	route_point_count: string | number | null;
	checkpoint_count: string | number | null;
	start_count: string | number | null;
	finish_count: string | number | null;
	order_confidence_code: string | null;
};

type RiseopediaPerkTreeDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_relationship_id: string | number;
	relationship_role_code: string;
	target_entity_id: string | number;
	target_entity_variant_id: string | number | null;
	target_entity_variant_label: string | null;
	target_entity_slug: string;
	target_entity_name: string;
	target_entity_class_code: string | null;
	target_entity_class_name: string | null;
	target_icon_media_file_id: string | number | null;
	source_value_text: string | null;
	resolution_status_code: string;
	sort_order: string | number;
	requirements_section_label: string;
	requirements_section_empty_label: string | null;
	unlocks_section_label: string;
	unlocks_section_empty_label: string | null;
	current_section_label: string;
	current_meta_display_label: string;
	fallback_icon_key: string | null;
	fallback_icon_source_code: string | null;
	fallback_icon_lucide_name: string | null;
	current_fallback_icon_key: string | null;
	current_fallback_icon_source_code: string | null;
	current_fallback_icon_lucide_name: string | null;
};

type RiseopediaEffectModifierDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	mechanic_effect_modifier_id: string | number;
	modifier_index: string | number;
	target_need_entity_id: string | number;
	target_need_entity_slug: string;
	target_need_entity_name: string;
	target_need_entity_class_code: string | null;
	target_need_entity_class_name: string | null;
	target_need_icon_media_file_id: string | number | null;
	effect_type_code: string;
	source_effect_type_code: string;
	operation_code: string;
	source_operation_code: string;
	operation_display_label: string;
	effect_type_display_label: string;
	effect_value: string | number;
	unit_code: string | null;
	effect_value_display_text: string | null;
	initial_delay_seconds: string | number | null;
	duration_seconds: string | number | null;
	interval_seconds: string | number | null;
	burst_count: string | number | null;
	delay_label: string | null;
	duration_label: string | null;
	interval_label: string | null;
	burst_label: string | null;
	delay_display_text: string | null;
	duration_display_text: string | null;
	interval_display_text: string | null;
	burst_display_text: string | null;
	resolution_status_code: string;
};

type RiseopediaNeedEffectDbRow = {
	entity_id: string | number;
	mechanic_effect_modifier_id: string | number;
	modifier_index: string | number;
	effect_entity_id: string | number;
	effect_entity_variant_id: string | number | null;
	effect_entity_slug: string;
	effect_entity_name: string;
	effect_entity_class_code: string | null;
	effect_entity_class_name: string | null;
	effect_icon_media_file_id: string | number | null;
	effect_type_code: string;
	source_effect_type_code: string;
	operation_code: string;
	source_operation_code: string;
	operation_display_label: string;
	effect_type_display_label: string;
	effect_value: string | number;
	unit_code: string | null;
	effect_value_display_text: string | null;
	initial_delay_seconds: string | number | null;
	duration_seconds: string | number | null;
	interval_seconds: string | number | null;
	burst_count: string | number | null;
	delay_label: string | null;
	duration_label: string | null;
	interval_label: string | null;
	burst_label: string | null;
	delay_display_text: string | null;
	duration_display_text: string | null;
	interval_display_text: string | null;
	burst_display_text: string | null;
	resolution_status_code: string;
};

type RiseopediaExperienceProgressionDbRow = {
	entity_id: string | number;
	entity_relationship_id: string | number;
	relationship_role_code: "parent" | "child";
	related_entity_id: string | number;
	related_entity_slug: string;
	related_entity_name: string;
	related_entity_class_code: string | null;
	related_entity_class_name: string | null;
	related_icon_media_file_id: string | number | null;
	max_experience: string | number | null;
	max_experience_display_text: string | null;
	progression_display_mode_code: "level_table" | "points_summary";
	progression_unit_code: string | null;
	progression_unit_display_label: string | null;
	max_level: string | number | null;
	max_perk_points: string | number | null;
	progression_summary_label: string | null;
	progression_summary_value_text: string | null;
	progression_secondary_display_text: string | null;
	color_hex: string | null;
	source_value_text: string | null;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaExperienceLevelDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	experience_level_threshold_id: string | number;
	level_value: string | number;
	level_start_value: string | number;
	max_level_value: string | number;
	experience_points_total_to_reach_level: string | number;
	experience_points_to_next_level: string | number | null;
	experience_unit_code: string;
	experience_unit_display_label: string;
	experience_points_total_to_reach_level_display_text: string;
	experience_points_to_next_level_display_text: string;
};

type RiseopediaExperienceLevelUnlockDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_relationship_id: string | number;
	required_level_value: string | number;
	quest_entity_id: string | number;
	quest_entity_type_code: string;
	quest_entity_slug: string | null;
	quest_entity_name: string;
	quest_icon_media_file_id: string | number | null;
	resolution_status_code: string;
};

type RiseopediaQuestObjectiveDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	quest_objective_id: string | number;
	objective_index: string | number;
	display_ordinal: string | number;
	objective_type_code: string;
	source_objective_type_code: string;
	objective_action_code: string | null;
	objective_action_label: string | null;
	objective_action_group_code: string | null;
	objective_action_group_index: string | number;
	objective_title_text: string | null;
	objective_title_key: string | null;
	require_last_to_complete_flag: boolean | null;
	require_last_to_show_in_ui_flag: boolean | null;
	show_counts_as_percentage_flag: boolean | null;
	objective_resolution_status_code: string;
	quest_objective_target_id: string | number | null;
	target_sequence_index: string | number | null;
	completion_group_index: string | number | null;
	option_index: string | number | null;
	group_match_operator_code: string | null;
	target_kind_code: string | null;
	target_display_text: string;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string | null;
	target_icon_media_file_id: string | number | null;
	fallback_icon_key: string | null;
	fallback_icon_source_code: string | null;
	fallback_icon_lucide_name: string | null;
	required_count_value: string | number | null;
	required_count_unit_code: string | null;
	quantity_display_text: string | null;
	target_resolution_status_code: string | null;
	target_resolution_display_label: string | null;
};

type RiseopediaQuestRequirementDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	quest_requirement_id: string | number;
	requirement_index: string | number;
	display_ordinal: string | number;
	requirement_type_code: string;
	requirement_type_label: string;
	source_requirement_type_code: string;
	raw_value_text: string | null;
	required_level_value: string | number | null;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string | null;
	target_icon_media_file_id: string | number | null;
	fallback_icon_key: string | null;
	fallback_icon_source_code: string | null;
	fallback_icon_lucide_name: string | null;
	target_display_text: string;
	resolution_status_code: string;
};

type RiseopediaQuestRewardDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	quest_reward_id: string | number;
	reward_index: string | number;
	display_ordinal: string | number;
	reward_type_code: string;
	source_reward_type_code: string;
	reward_row_name: string | null;
	quantity_value: string | number | null;
	quantity_text: string | null;
	quantity_unit_code: string | null;
	quantity_display_text: string | null;
	choose_group_code: string | null;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string | null;
	target_icon_media_file_id: string | number | null;
	fallback_icon_key: string | null;
	fallback_icon_source_code: string | null;
	fallback_icon_lucide_name: string | null;
	target_display_text: string;
	resolution_status_code: string;
};

type RiseopediaQuestFlowDbRow = {
	entity_id: string | number;
	entity_variant_id: string | number | null;
	entity_relationship_id: string | number | null;
	flow_section_code: string;
	flow_section_label: string;
	flow_section_empty_label: string | null;
	initial_visible_rows: string | number | null;
	section_sort_order: string | number;
	target_entity_id: string | number | null;
	target_entity_variant_id: string | number | null;
	target_entity_type_code: string | null;
	target_entity_slug: string | null;
	target_entity_name: string | null;
	target_icon_media_file_id: string | number | null;
	fallback_icon_key: string | null;
	fallback_icon_source_code: string | null;
	fallback_icon_lucide_name: string | null;
	source_value_text: string | null;
	resolution_status_code: string;
	sort_order: string | number;
};

type RiseopediaBodyBlockDbRow = {
	entity_id: string | number;
	entity_slug: string;
	entity_type_code: string;
	display_profile_id: string | number;
	display_profile_code: string;
	display_profile_name: string;
	body_renderer_code: string;
	display_profile_body_block_id: string | number;
	body_block_code: string;
	body_block_label: string;
	body_block_renderer_code: string;
	body_block_data_source_code: string;
	display_slot_code: "body_main" | "detail_aside";
	sort_order: string | number;
	visible_flag: boolean;
	empty_behavior_code: string;
	metadata_json: unknown;
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

function normalizeRiseopediaSlug(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	return RISEOPEDIA_SLUG_PATTERN.test(normalized) ? normalized : null;
}

function isUnknownObject(value: unknown): value is { [key: string]: unknown } {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

function unknownStringId(value: unknown): string | null {
	if (typeof value === "string" || typeof value === "number") {
		return String(value);
	}

	return null;
}

function unknownNumber(value: unknown): number | null {
	if (typeof value !== "string" && typeof value !== "number") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseCraftedByRecipes(
	value: unknown,
	fallback: {
		recipeEntityId: string | null;
		recipeSlug: string | null;
		recipeName: string | null;
		recipeIconMediaFileId: string | null;
	},
): RiseopediaCraftedByRecipe[] {
	const recipes: RiseopediaCraftedByRecipe[] = [];
	const seenRecipeEntityIds = new Set<string>();

	if (Array.isArray(value)) {
		for (const candidate of value) {
			if (!isUnknownObject(candidate)) {
				continue;
			}

			const recipeEntityId = unknownStringId(candidate.recipe_entity_id);
			const recipeSlug = unknownString(candidate.recipe_slug);
			const recipeName = unknownString(candidate.recipe_name);

			if (
				!recipeEntityId ||
				!recipeSlug ||
				!recipeName ||
				seenRecipeEntityIds.has(recipeEntityId)
			) {
				continue;
			}

			seenRecipeEntityIds.add(recipeEntityId);
			recipes.push({
				recipeEntityId,
				recipeEntityVariantId: unknownStringId(candidate.recipe_entity_variant_id),
				recipeSlug,
				recipeName,
				recipeIconMediaFileId: unknownStringId(candidate.recipe_icon_media_file_id),
				sortOrder: unknownNumber(candidate.sort_order) ?? 0,
			});
		}
	}

	if (recipes.length > 0) {
		return recipes;
	}

	if (!fallback.recipeEntityId || !fallback.recipeSlug || !fallback.recipeName) {
		return [];
	}

	return [
		{
			recipeEntityId: fallback.recipeEntityId,
			recipeEntityVariantId: null,
			recipeSlug: fallback.recipeSlug,
			recipeName: fallback.recipeName,
			recipeIconMediaFileId: fallback.recipeIconMediaFileId,
			sortOrder: 0,
		},
	];
}

function mapQuestObjectiveRow(
	row: RiseopediaQuestObjectiveDbRow,
): RiseopediaQuestObjectiveRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		questObjectiveId: toStringId(row.quest_objective_id),
		objectiveIndex: toNumber(row.objective_index),
		displayOrdinal: toNumber(row.display_ordinal),
		objectiveTypeCode: row.objective_type_code,
		sourceObjectiveTypeCode: row.source_objective_type_code,
		objectiveActionCode: row.objective_action_code,
		objectiveActionLabel: row.objective_action_label,
		objectiveActionGroupCode: row.objective_action_group_code,
		objectiveActionGroupIndex: toNumber(row.objective_action_group_index),
		objectiveTitleText: row.objective_title_text,
		objectiveTitleKey: row.objective_title_key,
		requireLastToComplete: row.require_last_to_complete_flag,
		requireLastToShowInUi: row.require_last_to_show_in_ui_flag,
		showCountsAsPercentage: row.show_counts_as_percentage_flag,
		objectiveResolutionStatusCode: row.objective_resolution_status_code,
		questObjectiveTargetId: toNullableStringId(row.quest_objective_target_id),
		targetSequenceIndex: toNullableNumber(row.target_sequence_index),
		completionGroupIndex: toNullableNumber(row.completion_group_index),
		optionIndex: toNullableNumber(row.option_index),
		groupMatchOperatorCode: row.group_match_operator_code,
		targetKindCode: row.target_kind_code,
		targetDisplayText: row.target_display_text,
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		fallbackIconKey: row.fallback_icon_key,
		fallbackIconSourceCode: row.fallback_icon_source_code,
		fallbackIconLucideName: row.fallback_icon_lucide_name,
		requiredCountValue: toNullableNumber(row.required_count_value),
		requiredCountUnitCode: row.required_count_unit_code,
		quantityDisplayText: row.quantity_display_text,
		targetResolutionStatusCode: row.target_resolution_status_code,
		targetResolutionDisplayLabel: row.target_resolution_display_label,
	};
}

function mapQuestRequirementRow(
	row: RiseopediaQuestRequirementDbRow,
): RiseopediaQuestRequirementRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		questRequirementId: toStringId(row.quest_requirement_id),
		requirementIndex: toNumber(row.requirement_index),
		displayOrdinal: toNumber(row.display_ordinal),
		requirementTypeCode: row.requirement_type_code,
		requirementTypeLabel: row.requirement_type_label,
		sourceRequirementTypeCode: row.source_requirement_type_code,
		rawValueText: row.raw_value_text,
		requiredLevelValue: toNullableNumber(row.required_level_value),
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		fallbackIconKey: row.fallback_icon_key,
		fallbackIconSourceCode: row.fallback_icon_source_code,
		fallbackIconLucideName: row.fallback_icon_lucide_name,
		targetDisplayText: row.target_display_text,
		resolutionStatusCode: row.resolution_status_code,
	};
}

function mapQuestRewardRow(
	row: RiseopediaQuestRewardDbRow,
): RiseopediaQuestRewardRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		questRewardId: toStringId(row.quest_reward_id),
		rewardIndex: toNumber(row.reward_index),
		displayOrdinal: toNumber(row.display_ordinal),
		rewardTypeCode: row.reward_type_code,
		sourceRewardTypeCode: row.source_reward_type_code,
		rewardRowName: row.reward_row_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		quantityUnitCode: row.quantity_unit_code,
		quantityDisplayText: row.quantity_display_text,
		chooseGroupCode: row.choose_group_code,
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		fallbackIconKey: row.fallback_icon_key,
		fallbackIconSourceCode: row.fallback_icon_source_code,
		fallbackIconLucideName: row.fallback_icon_lucide_name,
		targetDisplayText: row.target_display_text,
		resolutionStatusCode: row.resolution_status_code,
	};
}

function mapQuestFlowRow(
	row: RiseopediaQuestFlowDbRow,
): RiseopediaQuestFlowRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityRelationshipId: toNullableStringId(row.entity_relationship_id),
		flowSectionCode: row.flow_section_code,
		flowSectionLabel: row.flow_section_label,
		flowSectionEmptyLabel: row.flow_section_empty_label,
		initialVisibleRows: toNullableNumber(row.initial_visible_rows),
		sectionSortOrder: toNumber(row.section_sort_order),
		targetEntityId: toNullableStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		fallbackIconKey: row.fallback_icon_key,
		fallbackIconSourceCode: row.fallback_icon_source_code,
		fallbackIconLucideName: row.fallback_icon_lucide_name,
		sourceValueText: row.source_value_text,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapExperienceProgressionRow(
	row: RiseopediaExperienceProgressionDbRow,
): RiseopediaExperienceProgressionRow {
	return {
		entityId: toStringId(row.entity_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		relationshipRoleCode: row.relationship_role_code,
		relatedEntityId: toStringId(row.related_entity_id),
		relatedEntitySlug: row.related_entity_slug,
		relatedEntityName: row.related_entity_name,
		relatedEntityClassCode: row.related_entity_class_code,
		relatedEntityClassName: row.related_entity_class_name,
		relatedIconMediaFileId: toNullableStringId(row.related_icon_media_file_id),
		maxExperience: toNullableNumber(row.max_experience),
		maxExperienceDisplayText: row.max_experience_display_text,
		progressionDisplayModeCode: row.progression_display_mode_code,
		progressionUnitCode: row.progression_unit_code,
		progressionUnitDisplayLabel: row.progression_unit_display_label,
		maxLevel: toNullableNumber(row.max_level),
		maxPerkPoints: toNullableNumber(row.max_perk_points),
		progressionSummaryLabel: row.progression_summary_label,
		progressionSummaryValueText: row.progression_summary_value_text,
		progressionSecondaryDisplayText: row.progression_secondary_display_text,
		colorHex: row.color_hex,
		sourceValueText: row.source_value_text,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapExperienceLevelRow(
	row: RiseopediaExperienceLevelDbRow,
): RiseopediaExperienceLevelRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		experienceLevelThresholdId: toStringId(row.experience_level_threshold_id),
		levelValue: toNumber(row.level_value),
		levelStartValue: toNumber(row.level_start_value),
		maxLevelValue: toNumber(row.max_level_value),
		experiencePointsTotalToReachLevel: toNumber(
			row.experience_points_total_to_reach_level,
		),
		experiencePointsToNextLevel: toNullableNumber(
			row.experience_points_to_next_level,
		),
		experienceUnitCode: row.experience_unit_code,
		experienceUnitDisplayLabel: row.experience_unit_display_label,
		experiencePointsTotalToReachLevelDisplayText:
			row.experience_points_total_to_reach_level_display_text,
		experiencePointsToNextLevelDisplayText:
			row.experience_points_to_next_level_display_text,
	};
}

function mapExperienceLevelUnlockRow(
	row: RiseopediaExperienceLevelUnlockDbRow,
): RiseopediaExperienceLevelUnlockRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		requiredLevelValue: toNumber(row.required_level_value),
		questEntityId: toStringId(row.quest_entity_id),
		questEntityTypeCode: row.quest_entity_type_code,
		questEntitySlug: row.quest_entity_slug,
		questEntityName: row.quest_entity_name,
		questIconMediaFileId: toNullableStringId(row.quest_icon_media_file_id),
		resolutionStatusCode: row.resolution_status_code,
	};
}

function mapBodyBlockRow(row: RiseopediaBodyBlockDbRow): RiseopediaBodyBlock {
	return {
		entityId: toStringId(row.entity_id),
		entitySlug: row.entity_slug,
		entityTypeCode: row.entity_type_code,
		displayProfileId: toStringId(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		bodyRendererCode: row.body_renderer_code,
		displayProfileBodyBlockId: toStringId(row.display_profile_body_block_id),
		bodyBlockCode: row.body_block_code,
		bodyBlockLabel: row.body_block_label,
		bodyBlockRendererCode: row.body_block_renderer_code,
		bodyBlockDataSourceCode: row.body_block_data_source_code,
		displaySlotCode: row.display_slot_code,
		sortOrder: toNumber(row.sort_order),
		visible: row.visible_flag,
		emptyBehaviorCode: row.empty_behavior_code,
		metadataJson: row.metadata_json,
	};
}

function mapDocRow(row: RiseopediaEntityDetailRow): RiseopediaEntityDetailDoc {
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

function mapSectionRow(
	row: RiseopediaEntitySectionRow,
): RiseopediaEntitySection {
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

function mapVariantRow(
	row: RiseopediaEntityVariantRow,
): RiseopediaEntityVariant {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toStringId(row.entity_variant_id),
		variantKey: row.variant_code,
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

function mapVariantLinkKeyRow(
	row: RiseopediaEntityVariantLinkKeyRow,
): RiseopediaEntityVariantLinkKey {
	return {
		entityVariantId: toStringId(row.entity_variant_id),
		variantKey: row.variant_code,
	};
}

function mapVariantValueRow(
	row: RiseopediaEntityVariantValueRow,
): RiseopediaEntityVariantValue {
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
	row: RiseopediaEntityVariantSelectorRow,
): RiseopediaEntityVariantSelector {
	return {
		entityId: toStringId(row.entity_id),
		displayProfileId: toStringId(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfileVariantSelectorId: toStringId(
			row.display_profile_variant_selector_id,
		),
		variantGroupCode: row.variant_group_code,
		variantGroupName: row.variant_group_name,
		variantGroupSlug: row.variant_group_slug,
		selectorLabel: row.selector_label,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapDetailElementRow(
	row: RiseopediaDetailElementRow,
): RiseopediaDetailElement {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		displayProfileId: toNullableStringId(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfileElementId: toNullableStringId(row.display_profile_element_id),
		displayProfileBodyBlockId: toNullableStringId(
			row.display_profile_body_block_id,
		),
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
		entityPropertyValueLinkId: toNullableStringId(
			row.entity_property_value_link_id,
		),
		linkedEntityId: toNullableStringId(row.linked_entity_id),
		linkedEntityVariantId: toNullableStringId(row.linked_entity_variant_id),
		linkedEntityTypeCode: row.linked_entity_type_code,
		linkedEntitySlug: row.linked_entity_slug,
		linkedEntityName: row.linked_entity_name,
		linkedIconMediaFileId: toNullableStringId(row.linked_icon_media_file_id),
	};
}

function mapMediaRow(row: RiseopediaEntityMediaRow): RiseopediaEntityMediaRef {
	const mediaFileId = toStringId(row.media_file_id);
	const heroMediaFileId = toNullableStringId(row.hero_media_file_id);

	return {
		mediaFileId,
		mediaId: toStringId(row.media_id),
		url: buildRiseopediaMediaFileUrl(mediaFileId),
		width: row.width_px,
		height: row.height_px,
		mimeType: row.mime_type,
		heroMediaFileId,
		heroUrl: heroMediaFileId
			? buildRiseopediaMediaFileUrl(heroMediaFileId)
			: null,
		heroWidth: row.hero_width_px,
		heroHeight: row.hero_height_px,
		heroMimeType: row.hero_mime_type,
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

function mapRecipeOutputRow(
	row: RiseopediaRecipeOutputRow,
): RiseopediaRecipeOutput {
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
	row: RiseopediaRecipeRequirementRow,
): RiseopediaRecipeRequirement {
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
		targetCraftedByRecipeEntityId: toNullableStringId(
			row.target_crafted_by_recipe_entity_id,
		),
		targetCraftedByRecipeSlug: row.target_crafted_by_recipe_slug,
		targetCraftedByRecipeName: row.target_crafted_by_recipe_name,
		targetCraftedByRecipeIconMediaFileId: toNullableStringId(
			row.target_crafted_by_recipe_icon_media_file_id,
		),
		craftedByRecipes: parseCraftedByRecipes(row.target_crafted_by_recipes_json, {
			recipeEntityId: toNullableStringId(row.target_crafted_by_recipe_entity_id),
			recipeSlug: row.target_crafted_by_recipe_slug,
			recipeName: row.target_crafted_by_recipe_name,
			recipeIconMediaFileId: toNullableStringId(
				row.target_crafted_by_recipe_icon_media_file_id,
			),
		}),
	};
}

function mapAssetRecipeLinkRow(
	row: RiseopediaAssetRecipeLinkRow,
): RiseopediaAssetRecipeLink {
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
	row: RiseopediaRelationshipBlockDbRow,
): RiseopediaRelationshipBlockRow {
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

function mapDependencyRow(
	row: RiseopediaDependencyDbRow,
): RiseopediaDependencyRow {
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

function mapPatchNoteRow(
	row: RiseopediaPatchNoteDbRow,
): RiseopediaPatchNoteRow {
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

function mapLocationTreeRow(
	row: RiseopediaLocationTreeDbRow,
): RiseopediaLocationTreeRow {
	return {
		entityId: toStringId(row.entity_id),
		parentLocationEntityId: toNullableStringId(row.parent_location_entity_id),
		locationEntityId: toStringId(row.location_entity_id),
		locationEntitySlug: row.location_entity_slug,
		locationEntityName: row.location_entity_name,
		locationEntityClassCode: row.location_entity_class_code,
		locationEntityClassName: row.location_entity_class_name,
		locationEntityCategoryCode: row.location_entity_category_code,
		locationEntityCategoryName: row.location_entity_category_name,
		locationIconMediaFileId: toNullableStringId(row.location_icon_media_file_id),
		locationDepth: toNumber(row.location_depth),
		locationTreeRoleCode: row.location_tree_role_code,
	};
}

function mapLocationPoiRow(
	row: RiseopediaLocationPoiDbRow,
): RiseopediaLocationPoiRow {
	return {
		entityId: toStringId(row.entity_id),
		locationEntityId: toStringId(row.location_entity_id),
		locationEntitySlug: row.location_entity_slug,
		locationEntityName: row.location_entity_name,
		locationDepth: toNumber(row.location_depth),
		poiEntityId: toStringId(row.poi_entity_id),
		poiEntitySlug: row.poi_entity_slug,
		poiEntityName: row.poi_entity_name,
		poiEntityClassCode: row.poi_entity_class_code,
		poiEntityClassName: row.poi_entity_class_name,
		poiEntityCategoryCode: row.poi_entity_category_code,
		poiEntityCategoryName: row.poi_entity_category_name,
		poiIconMediaFileId: toNullableStringId(row.poi_icon_media_file_id),
	};
}

function mapPoiLocationTreeRow(
	row: RiseopediaPoiLocationTreeDbRow,
): RiseopediaPoiLocationTreeRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		parentLocationEntityId: toNullableStringId(row.parent_location_entity_id),
		locationEntityId: toStringId(row.location_entity_id),
		locationEntitySlug: row.location_entity_slug,
		locationEntityName: row.location_entity_name,
		locationEntityClassCode: row.location_entity_class_code,
		locationEntityClassName: row.location_entity_class_name,
		locationEntityCategoryCode: row.location_entity_category_code,
		locationEntityCategoryName: row.location_entity_category_name,
		locationIconMediaFileId: toNullableStringId(row.location_icon_media_file_id),
		locationDepth: toNumber(row.location_depth),
		locationTreeRoleCode: row.location_tree_role_code,
	};
}

function mapPoiVendorStockRow(
	row: RiseopediaPoiVendorStockDbRow,
): RiseopediaPoiVendorStockRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityLootTableId: toStringId(row.entity_loot_table_id),
		lootTableId: toStringId(row.loot_table_id),
		lootTableKey: row.loot_table_key,
		lootTableDisplayName: row.loot_table_display_name,
		lootTableEntryId: toStringId(row.loot_table_entry_id),
		itemEntityId: toNullableStringId(row.item_entity_id),
		itemEntityVariantId: toNullableStringId(row.item_entity_variant_id),
		itemEntityVariantLabel: row.item_entity_variant_label,
		itemEntityTypeCode: row.item_entity_type_code,
		itemEntitySlug: row.item_entity_slug,
		itemEntityName: row.item_entity_name,
		itemEntityClassCode: row.item_entity_class_code,
		itemEntityClassName: row.item_entity_class_name,
		itemIconMediaFileId: toNullableStringId(row.item_icon_media_file_id),
		itemPriceValue: toNullableNumber(row.item_price_value),
		itemPriceDisplayValue: row.item_price_display_value,
		itemSourceValueText: row.item_source_value_text,
		minQuantity: toNullableNumber(row.min_quantity),
		maxQuantity: toNullableNumber(row.max_quantity),
		chanceValue: toNullableNumber(row.chance_value),
		weightValue: toNullableNumber(row.weight_value),
		availabilityCode: row.availability_code,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapPoiResourceYieldRow(
	row: RiseopediaPoiResourceYieldDbRow,
): RiseopediaPoiResourceYieldRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityLootTableId: toStringId(row.entity_loot_table_id),
		lootTableId: toStringId(row.loot_table_id),
		lootTableKey: row.loot_table_key,
		lootTableDisplayName: row.loot_table_display_name,
		lootTableEntryId: toStringId(row.loot_table_entry_id),
		itemEntityId: toNullableStringId(row.item_entity_id),
		itemEntityVariantId: toNullableStringId(row.item_entity_variant_id),
		itemEntityVariantLabel: row.item_entity_variant_label,
		itemEntityTypeCode: row.item_entity_type_code,
		itemEntitySlug: row.item_entity_slug,
		itemEntityName: row.item_entity_name,
		itemEntityClassCode: row.item_entity_class_code,
		itemEntityClassName: row.item_entity_class_name,
		itemIconMediaFileId: toNullableStringId(row.item_icon_media_file_id),
		itemSourceValueText: row.item_source_value_text,
		minQuantity: toNullableNumber(row.min_quantity),
		maxQuantity: toNullableNumber(row.max_quantity),
		chanceValue: toNullableNumber(row.chance_value),
		weightValue: toNullableNumber(row.weight_value),
		availabilityCode: row.availability_code,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
		spawnerCount: toNullableNumber(row.spawner_count),
		initialStartupTriesMin: toNullableNumber(row.initial_startup_tries_min),
		initialStartupTriesMax: toNullableNumber(row.initial_startup_tries_max),
	};
}

function mapPoiTransportStopRow(
	row: RiseopediaPoiTransportStopDbRow,
): RiseopediaPoiTransportStopRow {
	return {
		entityId: toStringId(row.entity_id),
		routePointId: toStringId(row.route_point_id),
		routeCode: row.route_code,
		pointOrder: toNumber(row.point_order),
		pointRoleCode: row.point_role_code,
		stopName: row.stop_name,
		locationEntityId: toNullableStringId(row.location_entity_id),
		locationEntitySlug: row.location_entity_slug,
		locationEntityName: row.location_entity_name,
		locationIconMediaFileId: toNullableStringId(row.location_icon_media_file_id),
		confidenceCode: row.confidence_code,
		metadataJson: row.metadata_json,
	};
}

function mapPoiRelatedQuestRow(
	row: RiseopediaPoiRelatedQuestDbRow,
): RiseopediaPoiRelatedQuestRow {
	return {
		entityId: toStringId(row.entity_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		relationshipCode: row.relationship_code,
		questRoleCode: row.quest_role_code,
		questRoleLabel: row.quest_role_label,
		questEntityId: toStringId(row.quest_entity_id),
		questEntitySlug: row.quest_entity_slug,
		questEntityName: row.quest_entity_name,
		questEntityClassCode: row.quest_entity_class_code,
		questEntityClassName: row.quest_entity_class_name,
		questEntityCategoryCode: row.quest_entity_category_code,
		questEntityCategoryName: row.quest_entity_category_name,
		questEntitySubcategoryCode: row.quest_entity_subcategory_code,
		questEntitySubcategoryName: row.quest_entity_subcategory_name,
		questClassificationLabel: row.quest_classification_label,
		questIconMediaFileId: toNullableStringId(row.quest_icon_media_file_id),
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapPoiPublicBenchLinkRow(
	row: RiseopediaPoiPublicBenchLinkDbRow,
): RiseopediaPoiPublicBenchLinkRow {
	return {
		entityId: toStringId(row.entity_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		linkKindCode: row.link_kind_code,
		relationshipCode: row.relationship_code,
		targetEntityId: toStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityVariantLabel: row.target_entity_variant_label,
		targetEntityTypeCode: row.target_entity_type_code,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetEntityClassCode: row.target_entity_class_code,
		targetEntityClassName: row.target_entity_class_name,
		targetEntityCategoryCode: row.target_entity_category_code,
		targetEntityCategoryName: row.target_entity_category_name,
		targetEntitySubcategoryCode: row.target_entity_subcategory_code,
		targetEntitySubcategoryName: row.target_entity_subcategory_name,
		targetClassificationLabel: row.target_classification_label,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		benchFamilyCode: row.bench_family_code,
		requiredTier: toNullableNumber(row.required_tier),
		providedTier: toNullableNumber(row.provided_tier),
		exactTierFlag: row.exact_tier_flag,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapPoiContainerLootRow(
	row: RiseopediaPoiContainerLootDbRow,
): RiseopediaPoiContainerLootRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityLootTableId: toStringId(row.entity_loot_table_id),
		lootTableId: toStringId(row.loot_table_id),
		lootTableKey: row.loot_table_key,
		lootTableDisplayName: row.loot_table_display_name,
		lootTableEntryId: toStringId(row.loot_table_entry_id),
		itemEntityId: toNullableStringId(row.item_entity_id),
		itemEntityVariantId: toNullableStringId(row.item_entity_variant_id),
		itemEntityVariantLabel: row.item_entity_variant_label,
		itemEntityTypeCode: row.item_entity_type_code,
		itemEntitySlug: row.item_entity_slug,
		itemEntityName: row.item_entity_name,
		itemEntityClassCode: row.item_entity_class_code,
		itemEntityClassName: row.item_entity_class_name,
		itemIconMediaFileId: toNullableStringId(row.item_icon_media_file_id),
		itemSourceValueText: row.item_source_value_text,
		minQuantity: toNullableNumber(row.min_quantity),
		maxQuantity: toNullableNumber(row.max_quantity),
		chanceValue: toNullableNumber(row.chance_value),
		weightValue: toNullableNumber(row.weight_value),
		chancePercent: toNullableNumber(row.chance_percent),
		availabilityCode: row.availability_code,
		itemModeCode: row.item_mode_code,
		sourceOccurrenceCount: toNullableNumber(row.source_occurrence_count),
		placementCount: toNullableNumber(row.placement_count),
		maxSlots: toNullableNumber(row.max_slots),
		minSpawnedItems: toNullableNumber(row.min_spawned_items),
		maxSpawnedItems: toNullableNumber(row.max_spawned_items),
		respawnTimeSeconds: toNullableNumber(row.respawn_time_seconds),
		repeatableFlag: row.repeatable_flag,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
	};
}

function mapPoiSummaryFactRow(
	row: RiseopediaPoiSummaryFactDbRow,
): RiseopediaPoiSummaryFactRow {
	return {
		entityId: toStringId(row.entity_id),
		summaryKindCode: row.summary_kind_code,
		xpAwarded: toNullableNumber(row.xp_awarded),
		rarityCode: row.rarity_code,
		rarityName: row.rarity_name,
		routePointCount: toNullableNumber(row.route_point_count),
		checkpointCount: toNullableNumber(row.checkpoint_count),
		startCount: toNullableNumber(row.start_count),
		finishCount: toNullableNumber(row.finish_count),
		orderConfidenceCode: row.order_confidence_code,
	};
}

function mapPerkTreeRow(row: RiseopediaPerkTreeDbRow): RiseopediaPerkTreeRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		entityRelationshipId: toStringId(row.entity_relationship_id),
		relationshipRoleCode: row.relationship_role_code,
		targetEntityId: toStringId(row.target_entity_id),
		targetEntityVariantId: toNullableStringId(row.target_entity_variant_id),
		targetEntityVariantLabel: row.target_entity_variant_label,
		targetEntitySlug: row.target_entity_slug,
		targetEntityName: row.target_entity_name,
		targetClassCode: row.target_entity_class_code,
		targetClassName: row.target_entity_class_name,
		targetIconMediaFileId: toNullableStringId(row.target_icon_media_file_id),
		sourceValueText: row.source_value_text,
		resolutionStatusCode: row.resolution_status_code,
		sortOrder: toNumber(row.sort_order),
		requirementsSectionLabel: row.requirements_section_label,
		requirementsSectionEmptyLabel: row.requirements_section_empty_label,
		unlocksSectionLabel: row.unlocks_section_label,
		unlocksSectionEmptyLabel: row.unlocks_section_empty_label,
		currentSectionLabel: row.current_section_label,
		currentMetaDisplayLabel: row.current_meta_display_label,
		fallbackIconKey: row.fallback_icon_key,
		fallbackIconSourceCode: row.fallback_icon_source_code,
		fallbackIconLucideName: row.fallback_icon_lucide_name,
		currentFallbackIconKey: row.current_fallback_icon_key,
		currentFallbackIconSourceCode: row.current_fallback_icon_source_code,
		currentFallbackIconLucideName: row.current_fallback_icon_lucide_name,
	};
}

function mapEffectModifierRow(
	row: RiseopediaEffectModifierDbRow,
): RiseopediaEffectModifierRow {
	return {
		entityId: toStringId(row.entity_id),
		entityVariantId: toNullableStringId(row.entity_variant_id),
		mechanicEffectModifierId: toStringId(row.mechanic_effect_modifier_id),
		modifierIndex: toNumber(row.modifier_index),
		targetNeedEntityId: toStringId(row.target_need_entity_id),
		targetNeedEntitySlug: row.target_need_entity_slug,
		targetNeedEntityName: row.target_need_entity_name,
		targetNeedEntityClassCode: row.target_need_entity_class_code,
		targetNeedEntityClassName: row.target_need_entity_class_name,
		targetNeedIconMediaFileId: toNullableStringId(
			row.target_need_icon_media_file_id,
		),
		effectTypeCode: row.effect_type_code,
		sourceEffectTypeCode: row.source_effect_type_code,
		operationCode: row.operation_code,
		sourceOperationCode: row.source_operation_code,
		operationDisplayLabel: row.operation_display_label,
		effectTypeDisplayLabel: row.effect_type_display_label,
		effectValue: toNumber(row.effect_value),
		unitCode: row.unit_code,
		effectValueDisplayText: row.effect_value_display_text,
		initialDelaySeconds: toNullableNumber(row.initial_delay_seconds),
		durationSeconds: toNullableNumber(row.duration_seconds),
		intervalSeconds: toNullableNumber(row.interval_seconds),
		burstCount: toNullableNumber(row.burst_count),
		delayLabel: row.delay_label,
		durationLabel: row.duration_label,
		intervalLabel: row.interval_label,
		burstLabel: row.burst_label,
		delayDisplayText: row.delay_display_text,
		durationDisplayText: row.duration_display_text,
		intervalDisplayText: row.interval_display_text,
		burstDisplayText: row.burst_display_text,
		resolutionStatusCode: row.resolution_status_code,
	};
}

function mapNeedEffectRow(
	row: RiseopediaNeedEffectDbRow,
): RiseopediaNeedEffectRow {
	return {
		entityId: toStringId(row.entity_id),
		mechanicEffectModifierId: toStringId(row.mechanic_effect_modifier_id),
		modifierIndex: toNumber(row.modifier_index),
		effectEntityId: toStringId(row.effect_entity_id),
		effectEntityVariantId: toNullableStringId(row.effect_entity_variant_id),
		effectEntitySlug: row.effect_entity_slug,
		effectEntityName: row.effect_entity_name,
		effectEntityClassCode: row.effect_entity_class_code,
		effectEntityClassName: row.effect_entity_class_name,
		effectIconMediaFileId: toNullableStringId(row.effect_icon_media_file_id),
		effectTypeCode: row.effect_type_code,
		sourceEffectTypeCode: row.source_effect_type_code,
		operationCode: row.operation_code,
		sourceOperationCode: row.source_operation_code,
		operationDisplayLabel: row.operation_display_label,
		effectTypeDisplayLabel: row.effect_type_display_label,
		effectValue: toNumber(row.effect_value),
		unitCode: row.unit_code,
		effectValueDisplayText: row.effect_value_display_text,
		initialDelaySeconds: toNullableNumber(row.initial_delay_seconds),
		durationSeconds: toNullableNumber(row.duration_seconds),
		intervalSeconds: toNullableNumber(row.interval_seconds),
		burstCount: toNullableNumber(row.burst_count),
		delayLabel: row.delay_label,
		durationLabel: row.duration_label,
		intervalLabel: row.interval_label,
		burstLabel: row.burst_label,
		delayDisplayText: row.delay_display_text,
		durationDisplayText: row.duration_display_text,
		intervalDisplayText: row.interval_display_text,
		burstDisplayText: row.burst_display_text,
		resolutionStatusCode: row.resolution_status_code,
	};
}

async function findRiseopediaEntityDocBySlug(args: {
	slug: string;
	entityTypeCode: EntityTypeFilter | null;
}): Promise<RiseopediaEntityDetailDoc | null> {
	const params = args.entityTypeCode
		? [args.slug, args.entityTypeCode]
		: [args.slug];
	const entityTypeWhere = args.entityTypeCode
		? " AND entity_type_code = $2"
		: "";
	const result = await query<RiseopediaEntityDetailRow>(
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
		 FROM web_view.riseopedia_entity_detail
		 WHERE entity_slug = $1${entityTypeWhere}
		 LIMIT 1`,
		params,
	);
	const row = result.rows[0] ?? null;

	return row ? mapDocRow(row) : null;
}

async function listRiseopediaEntitySections(
	entityId: string,
): Promise<RiseopediaEntitySection[]> {
	const result = await query<RiseopediaEntitySectionRow>(
		`SELECT entity_id,
				section_id,
				section_code,
				section_slug,
				section_name,
				section_sort_order,
				membership_sort_order,
				primary_flag
		 FROM web_view.riseopedia_entity_detail_sections
		 WHERE entity_id = $1::bigint
		 ORDER BY primary_flag DESC,
				  membership_sort_order,
				  section_sort_order,
				  section_name`,
		[entityId],
	);

	return result.rows.map(mapSectionRow);
}

async function listRiseopediaEntityVariants(
	entityId: string,
): Promise<RiseopediaEntityVariant[]> {
	const result = await query<RiseopediaEntityVariantRow>(
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
		 FROM web_view.riseopedia_entity_detail_variants
		 WHERE entity_id = $1::bigint
		 ORDER BY default_candidate_order,
				  variant_display_name,
				  entity_variant_id`,
		[entityId],
	);

	return result.rows.map(mapVariantRow);
}

async function listRiseopediaEntityVariantLinkKeys(
	entityVariantIds: readonly string[],
): Promise<RiseopediaEntityVariantLinkKey[]> {
	if (entityVariantIds.length === 0) {
		return [];
	}

	const result = await query<RiseopediaEntityVariantLinkKeyRow>(
		`SELECT entity_variant_id,
				variant_code
		 FROM web_view.riseopedia_entity_detail_variants
		 WHERE entity_variant_id = ANY($1::bigint[])
		 ORDER BY entity_variant_id`,
		[entityVariantIds],
	);

	return result.rows.map(mapVariantLinkKeyRow);
}

async function listRiseopediaEntityVariantValues(
	entityId: string,
): Promise<RiseopediaEntityVariantValue[]> {
	const result = await query<RiseopediaEntityVariantValueRow>(
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
		 FROM web_view.riseopedia_entity_detail_variant_values
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id,
				  variant_group_sort_order,
				  variant_value_sort_order,
				  variant_value_code`,
		[entityId],
	);

	return result.rows.map(mapVariantValueRow);
}

async function listRiseopediaEntityVariantSelectors(
	entityId: string,
): Promise<RiseopediaEntityVariantSelector[]> {
	const result = await query<RiseopediaEntityVariantSelectorRow>(
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
		 FROM web_view.riseopedia_entity_detail_variant_selectors
		 WHERE entity_id = $1::bigint
		 ORDER BY sort_order,
				  variant_group_name,
				  variant_group_code`,
		[entityId],
	);

	return result.rows.map(mapVariantSelectorRow);
}

async function listRiseopediaEntityBodyBlocks(
	entityId: string,
): Promise<RiseopediaBodyBlock[]> {
	const result = await query<RiseopediaBodyBlockDbRow>(
		`SELECT entity_id,
				entity_slug,
				entity_type_code,
				display_profile_id,
				display_profile_code,
				display_profile_name,
				body_renderer_code,
				display_profile_body_block_id,
				body_block_code,
				body_block_label,
				body_block_renderer_code,
				body_block_data_source_code,
				display_slot_code,
				sort_order,
				visible_flag,
				empty_behavior_code,
				metadata_json
		 FROM web_view.riseopedia_entity_detail_body_blocks
		 WHERE entity_id = $1::bigint
		   AND public_display_flag = true
		 ORDER BY sort_order,
				body_block_label,
				display_profile_body_block_id`,
		[entityId],
	);

	return result.rows.map(mapBodyBlockRow);
}

async function listRiseopediaEntityProfileElements(
	entityId: string,
): Promise<RiseopediaDetailElement[]> {
	const result = await query<RiseopediaDetailElementRow>(
		`SELECT entity_id,
				entity_variant_id,
				display_profile_id,
				display_profile_code,
				display_profile_name,
				display_profile_element_id,
				display_profile_body_block_id,
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
		 FROM web_view.riseopedia_entity_detail_profile_elements
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

async function listRiseopediaEntityMedia(
	entityId: string,
): Promise<RiseopediaEntityMediaRef[]> {
	const result = await query<RiseopediaEntityMediaRow>(
		`SELECT media_row.entity_id,
				media_row.entity_variant_id,
				media_row.entity_media_id,
				media_row.media_id,
				media_row.media_file_id,
				media_row.media_role_code,
				media_row.primary_flag,
				media_row.sort_order,
				media_row.width_px,
				media_row.height_px,
				media_row.mime_type,
				hero_media.media_file_id AS hero_media_file_id,
				hero_media.width_px AS hero_width_px,
				hero_media.height_px AS hero_height_px,
				hero_media.mime_type AS hero_mime_type,
				media_row.alt_text,
				media_row.caption,
				media_row.selected_header_rank,
				media_row.selected_icon_rank
		 FROM web_view.riseopedia_entity_detail_media media_row
		 LEFT JOIN LATERAL (SELECT file_row.media_file_id,
							   file_row.width_px,
							   file_row.height_px,
							   file_row.mime_type
						FROM web_view.riseopedia_media_files_source_v file_row
						WHERE file_row.media_id = media_row.media_id
						ORDER BY CASE
							WHEN lower(file_row.media_rel_path) LIKE '%/detail_1024/%' THEN 0
							WHEN lower(file_row.media_rel_path) LIKE 'images/detail_1024/%' THEN 0
							WHEN lower(file_row.media_rel_path) LIKE '%/icon_256/%' THEN 10
							WHEN lower(file_row.media_rel_path) LIKE 'images/icon_256/%' THEN 10
							WHEN lower(file_row.media_rel_path) LIKE '%/icon_128/%' THEN 20
							WHEN lower(file_row.media_rel_path) LIKE 'images/icon_128/%' THEN 20
							WHEN file_row.media_file_id = media_row.media_file_id THEN 30
							WHEN lower(file_row.media_rel_path) LIKE '%/icon_64/%' THEN 40
							WHEN lower(file_row.media_rel_path) LIKE 'images/icon_64/%' THEN 40
							ELSE 100
						END,
						file_row.media_file_id
						LIMIT 1) hero_media ON true
		 WHERE media_row.entity_id = $1::bigint
		   AND media_row.public_display_flag = true
		 ORDER BY media_row.entity_variant_id NULLS FIRST,
				  media_row.selected_header_rank,
				  media_row.primary_flag DESC,
				  media_row.sort_order,
				  media_row.media_file_id`,
		[entityId],
	);

	return result.rows.map(mapMediaRow);
}

async function listRiseopediaRecipeOutputs(
	entityId: string,
): Promise<RiseopediaRecipeOutput[]> {
	const result = await query<RiseopediaRecipeOutputRow>(
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
		 FROM web_view.riseopedia_entity_detail_recipe_outputs
		 WHERE recipe_entity_id = $1::bigint
		 ORDER BY primary_output_flag DESC,
				  sort_order,
				  target_entity_name`,
		[entityId],
	);

	return result.rows.map(mapRecipeOutputRow);
}

async function listRiseopediaRecipeRequirements(
	entityId: string,
): Promise<RiseopediaRecipeRequirement[]> {
	const result = await query<RiseopediaRecipeRequirementRow>(
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
				target_crafted_by_recipe_icon_media_file_id,
				target_crafted_by_recipes_json
		 FROM web_view.riseopedia_entity_detail_recipe_requirements
		 WHERE recipe_entity_id = $1::bigint
		 ORDER BY requirement_kind_code,
				  sort_order,
				  target_entity_name NULLS LAST,
				  source_row_id`,
		[entityId],
	);

	return result.rows.map(mapRecipeRequirementRow);
}

async function listRiseopediaAssetRecipeLinks(
	entityId: string,
): Promise<RiseopediaAssetRecipeLink[]> {
	const result = await query<RiseopediaAssetRecipeLinkRow>(
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
		 FROM web_view.riseopedia_entity_detail_asset_recipe_links
		 WHERE asset_entity_id = $1::bigint
		 ORDER BY link_kind_code,
				  sort_order,
				  recipe_entity_name`,
		[entityId],
	);

	return result.rows.map(mapAssetRecipeLinkRow);
}

async function listRiseopediaRelationshipBlocks(
	entityId: string,
): Promise<RiseopediaRelationshipBlockRow[]> {
	const result = await query<RiseopediaRelationshipBlockDbRow>(
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
		 FROM web_view.riseopedia_entity_detail_relationship_blocks
		 WHERE entity_id = $1::bigint
		 ORDER BY block_code,
				  relationship_direction_code,
				  sort_order,
				  target_entity_name`,
		[entityId],
	);

	return result.rows.map(mapRelationshipBlockRow);
}

async function listRiseopediaLocationTreeRows(
	entityId: string,
): Promise<RiseopediaLocationTreeRow[]> {
	const result = await query<RiseopediaLocationTreeDbRow>(
		`SELECT entity_id,
				parent_location_entity_id,
				location_entity_id,
				location_entity_slug,
				location_entity_name,
				location_entity_class_code,
				location_entity_class_name,
				location_entity_category_code,
				location_entity_category_name,
				location_icon_media_file_id,
				location_depth,
				location_tree_role_code
		 FROM web_view.riseopedia_entity_detail_location_tree
		 WHERE entity_id = $1::bigint
		 ORDER BY CASE location_tree_role_code
					WHEN 'ancestor' THEN 10
					WHEN 'current' THEN 20
					ELSE 30
				  END,
				  location_depth,
				  location_entity_name,
				  location_entity_id`,
		[entityId],
	);

	return result.rows.map(mapLocationTreeRow);
}

async function listRiseopediaLocationPoiRows(
	entityId: string,
): Promise<RiseopediaLocationPoiRow[]> {
	const result = await query<RiseopediaLocationPoiDbRow>(
		`SELECT entity_id,
				location_entity_id,
				location_entity_slug,
				location_entity_name,
				location_depth,
				poi_entity_id,
				poi_entity_slug,
				poi_entity_name,
				poi_entity_class_code,
				poi_entity_class_name,
				poi_entity_category_code,
				poi_entity_category_name,
				poi_icon_media_file_id
		 FROM web_view.riseopedia_entity_detail_location_pois
		 WHERE entity_id = $1::bigint
		 ORDER BY location_depth,
				  location_entity_name,
				  poi_entity_name,
				  poi_entity_id`,
		[entityId],
	);

	return result.rows.map(mapLocationPoiRow);
}

async function listRiseopediaPoiLocationTreeRows(
	entityId: string,
): Promise<RiseopediaPoiLocationTreeRow[]> {
	const result = await query<RiseopediaPoiLocationTreeDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				location_entity_id,
				location_entity_slug,
				location_entity_name,
				location_entity_class_code,
				location_entity_class_name,
				location_entity_category_code,
				location_entity_category_name,
				location_icon_media_file_id,
				location_depth,
				parent_location_entity_id,
				location_tree_role_code
		 FROM web_view.riseopedia_entity_detail_poi_location_context
		 WHERE entity_id = $1::bigint
		   AND location_tree_role_code IN ('ancestor', 'current')
		 ORDER BY entity_variant_id NULLS FIRST,
				  location_depth DESC,
				  location_entity_name,
				  location_entity_id`,
		[entityId],
	);

	return result.rows.map(mapPoiLocationTreeRow);
}

async function listRiseopediaPoiVendorStockRows(
	entityId: string,
): Promise<RiseopediaPoiVendorStockRow[]> {
	const result = await query<RiseopediaPoiVendorStockDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_loot_table_id,
				loot_table_id,
				loot_table_key,
				loot_table_display_name,
				loot_table_entry_id,
				item_entity_id,
				item_entity_variant_id,
				item_entity_variant_label,
				item_entity_type_code,
				item_entity_slug,
				item_entity_name,
				item_entity_class_code,
				item_entity_class_name,
				item_icon_media_file_id,
				item_price_value,
				item_price_display_value,
				item_source_value_text,
				min_quantity,
				max_quantity,
				chance_value,
				weight_value,
				availability_code,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_poi_vendor_stock
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				  sort_order,
				  item_entity_name NULLS LAST,
				  item_source_value_text NULLS LAST,
				  loot_table_entry_id`,
		[entityId],
	);

	return result.rows.map(mapPoiVendorStockRow);
}

async function listRiseopediaPoiResourceYieldRows(
	entityId: string,
): Promise<RiseopediaPoiResourceYieldRow[]> {
	const result = await query<RiseopediaPoiResourceYieldDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_loot_table_id,
				loot_table_id,
				loot_table_key,
				loot_table_display_name,
				loot_table_entry_id,
				item_entity_id,
				item_entity_variant_id,
				item_entity_variant_label,
				item_entity_type_code,
				item_entity_slug,
				item_entity_name,
				item_entity_class_code,
				item_entity_class_name,
				item_icon_media_file_id,
				item_source_value_text,
				min_quantity,
				max_quantity,
				chance_value,
				weight_value,
				availability_code,
				resolution_status_code,
				sort_order,
				spawner_count,
				initial_startup_tries_min,
				initial_startup_tries_max
		 FROM web_view.riseopedia_entity_detail_poi_resource_yields
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				  sort_order,
				  item_entity_name NULLS LAST,
				  item_source_value_text NULLS LAST,
				  loot_table_entry_id`,
		[entityId],
	);

	return result.rows.map(mapPoiResourceYieldRow);
}

async function listRiseopediaPoiTransportStopRows(
	entityId: string,
): Promise<RiseopediaPoiTransportStopRow[]> {
	const result = await query<RiseopediaPoiTransportStopDbRow>(
		`SELECT entity_id,
				route_point_id,
				route_code,
				point_order,
				point_role_code,
				stop_name,
				location_entity_id,
				location_entity_slug,
				location_entity_name,
				location_icon_media_file_id,
				confidence_code,
				metadata_json
		 FROM web_view.riseopedia_entity_detail_poi_transport_stops
		 WHERE entity_id = $1::bigint
		 ORDER BY point_order,
				route_point_id`,
		[entityId],
	);

	return result.rows.map(mapPoiTransportStopRow);
}

async function listRiseopediaPoiRelatedQuestRows(
	entityId: string,
): Promise<RiseopediaPoiRelatedQuestRow[]> {
	const result = await query<RiseopediaPoiRelatedQuestDbRow>(
		`SELECT entity_id,
				entity_relationship_id,
				entity_variant_id,
				relationship_code,
				quest_role_code,
				quest_role_label,
				quest_entity_id,
				quest_entity_slug,
				quest_entity_name,
				quest_entity_class_code,
				quest_entity_class_name,
				quest_entity_category_code,
				quest_entity_category_name,
				quest_entity_subcategory_code,
				quest_entity_subcategory_name,
				quest_classification_label,
				quest_icon_media_file_id,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_poi_related_quests
		 WHERE entity_id = $1::bigint
		 ORDER BY sort_order,
				quest_entity_name,
				entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapPoiRelatedQuestRow);
}

async function listRiseopediaPoiPublicBenchLinkRows(
	entityId: string,
): Promise<RiseopediaPoiPublicBenchLinkRow[]> {
	const result = await query<RiseopediaPoiPublicBenchLinkDbRow>(
		`SELECT entity_id,
				entity_relationship_id,
				entity_variant_id,
				link_kind_code,
				relationship_code,
				target_entity_id,
				target_entity_variant_id,
				target_entity_variant_label,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_entity_class_code,
				target_entity_class_name,
				target_entity_category_code,
				target_entity_category_name,
				target_entity_subcategory_code,
				target_entity_subcategory_name,
				target_classification_label,
				target_icon_media_file_id,
				bench_family_code,
				required_tier,
				provided_tier,
				exact_tier_flag,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_poi_public_bench_links
		 WHERE entity_id = $1::bigint
		 ORDER BY sort_order,
				target_entity_name,
				entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapPoiPublicBenchLinkRow);
}

async function listRiseopediaPoiContainerLootRows(
	entityId: string,
): Promise<RiseopediaPoiContainerLootRow[]> {
	const result = await query<RiseopediaPoiContainerLootDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_loot_table_id,
				loot_table_id,
				loot_table_key,
				loot_table_display_name,
				loot_table_entry_id,
				item_entity_id,
				item_entity_variant_id,
				item_entity_variant_label,
				item_entity_type_code,
				item_entity_slug,
				item_entity_name,
				item_entity_class_code,
				item_entity_class_name,
				item_icon_media_file_id,
				item_source_value_text,
				min_quantity,
				max_quantity,
				chance_value,
				weight_value,
				chance_percent,
				availability_code,
				item_mode_code,
				source_occurrence_count,
				placement_count,
				max_slots,
				min_spawned_items,
				max_spawned_items,
				respawn_time_seconds,
				repeatable_flag,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_poi_container_loot
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				sort_order,
				item_entity_name NULLS LAST,
				item_source_value_text NULLS LAST,
				loot_table_entry_id`,
		[entityId],
	);

	return result.rows.map(mapPoiContainerLootRow);
}

async function listRiseopediaPoiSummaryFactRows(
	entityId: string,
): Promise<RiseopediaPoiSummaryFactRow[]> {
	const result = await query<RiseopediaPoiSummaryFactDbRow>(
		`SELECT entity_id,
				summary_kind_code,
				xp_awarded,
				rarity_code,
				rarity_name,
				route_point_count,
				checkpoint_count,
				start_count,
				finish_count,
				order_confidence_code
		 FROM web_view.riseopedia_entity_detail_poi_summary_facts
		 WHERE entity_id = $1::bigint`,
		[entityId],
	);

	return result.rows.map(mapPoiSummaryFactRow);
}

async function listRiseopediaPerkTreeRows(
	entityId: string,
): Promise<RiseopediaPerkTreeRow[]> {
	const result = await query<RiseopediaPerkTreeDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_relationship_id,
				relationship_role_code,
				target_entity_id,
				target_entity_variant_id,
				target_entity_variant_label,
				target_entity_slug,
				target_entity_name,
				target_entity_class_code,
				target_entity_class_name,
				target_icon_media_file_id,
				source_value_text,
				resolution_status_code,
				sort_order,
				requirements_section_label,
				requirements_section_empty_label,
				unlocks_section_label,
				unlocks_section_empty_label,
				current_section_label,
				current_meta_display_label,
				fallback_icon_key,
				fallback_icon_source_code,
				fallback_icon_lucide_name,
				current_fallback_icon_key,
				current_fallback_icon_source_code,
				current_fallback_icon_lucide_name
		 FROM web_view.riseopedia_entity_detail_perk_tree
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				  relationship_role_code,
				  sort_order,
				  entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapPerkTreeRow);
}

async function listRiseopediaEffectModifierRows(
	entityId: string,
): Promise<RiseopediaEffectModifierRow[]> {
	const result = await query<RiseopediaEffectModifierDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				mechanic_effect_modifier_id,
				modifier_index,
				target_need_entity_id,
				target_need_entity_slug,
				target_need_entity_name,
				target_need_entity_class_code,
				target_need_entity_class_name,
				target_need_icon_media_file_id,
				effect_type_code,
				source_effect_type_code,
				operation_code,
				source_operation_code,
				operation_display_label,
				effect_type_display_label,
				effect_value,
				unit_code,
				effect_value_display_text,
				initial_delay_seconds,
				duration_seconds,
				interval_seconds,
				burst_count,
				delay_label,
				duration_label,
				interval_label,
				burst_label,
				delay_display_text,
				duration_display_text,
				interval_display_text,
				burst_display_text,
				resolution_status_code
		 FROM web_view.riseopedia_entity_detail_effect_modifiers
		 WHERE entity_id = $1::bigint
		 ORDER BY target_need_entity_name,
				  modifier_index,
				  mechanic_effect_modifier_id`,
		[entityId],
	);

	return result.rows.map(mapEffectModifierRow);
}

async function listRiseopediaNeedEffectRows(
	entityId: string,
): Promise<RiseopediaNeedEffectRow[]> {
	const result = await query<RiseopediaNeedEffectDbRow>(
		`SELECT entity_id,
				mechanic_effect_modifier_id,
				modifier_index,
				effect_entity_id,
				effect_entity_variant_id,
				effect_entity_slug,
				effect_entity_name,
				effect_entity_class_code,
				effect_entity_class_name,
				effect_icon_media_file_id,
				effect_type_code,
				source_effect_type_code,
				operation_code,
				source_operation_code,
				operation_display_label,
				effect_type_display_label,
				effect_value,
				unit_code,
				effect_value_display_text,
				initial_delay_seconds,
				duration_seconds,
				interval_seconds,
				burst_count,
				delay_label,
				duration_label,
				interval_label,
				burst_label,
				delay_display_text,
				duration_display_text,
				interval_display_text,
				burst_display_text,
				resolution_status_code
		 FROM web_view.riseopedia_entity_detail_need_effects
		 WHERE entity_id = $1::bigint
		 ORDER BY effect_entity_name,
				  modifier_index,
				  mechanic_effect_modifier_id`,
		[entityId],
	);

	return result.rows.map(mapNeedEffectRow);
}

async function listRiseopediaExperienceProgressionRows(
	entityId: string,
): Promise<RiseopediaExperienceProgressionRow[]> {
	const result = await query<RiseopediaExperienceProgressionDbRow>(
		`SELECT entity_id,
				entity_relationship_id,
				relationship_role_code,
				related_entity_id,
				related_entity_slug,
				related_entity_name,
				related_entity_class_code,
				related_entity_class_name,
				related_icon_media_file_id,
				max_experience,
				max_experience_display_text,
				progression_display_mode_code,
				progression_unit_code,
				progression_unit_display_label,
				max_level,
				max_perk_points,
				progression_summary_label,
				progression_summary_value_text,
				progression_secondary_display_text,
				color_hex,
				source_value_text,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_experience_progression
		 WHERE entity_id = $1::bigint
		 ORDER BY sort_order,
				  related_entity_name,
				  entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapExperienceProgressionRow);
}

async function listRiseopediaExperienceLevelRows(
	entityId: string,
): Promise<RiseopediaExperienceLevelRow[]> {
	const result = await query<RiseopediaExperienceLevelDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				experience_level_threshold_id,
				level_value,
				level_start_value,
				max_level_value,
				experience_points_total_to_reach_level,
				experience_points_to_next_level,
				experience_unit_code,
				experience_unit_display_label,
				experience_points_total_to_reach_level_display_text,
				experience_points_to_next_level_display_text
		 FROM web_view.riseopedia_entity_detail_experience_levels
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				  level_value,
				  experience_level_threshold_id`,
		[entityId],
	);

	return result.rows.map(mapExperienceLevelRow);
}

async function listRiseopediaExperienceLevelUnlockRows(
	entityId: string,
): Promise<RiseopediaExperienceLevelUnlockRow[]> {
	const result = await query<RiseopediaExperienceLevelUnlockDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_relationship_id,
				required_level_value,
				quest_entity_id,
				quest_entity_type_code,
				quest_entity_slug,
				quest_entity_name,
				quest_icon_media_file_id,
				resolution_status_code
		 FROM web_view.riseopedia_entity_detail_experience_level_unlocks
		 WHERE entity_id = $1::bigint
		 ORDER BY entity_variant_id NULLS FIRST,
				  required_level_value,
				  quest_entity_name,
				  entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapExperienceLevelUnlockRow);
}

async function listRiseopediaQuestObjectiveRows(
	entityId: string,
): Promise<RiseopediaQuestObjectiveRow[]> {
	const result = await query<RiseopediaQuestObjectiveDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				quest_objective_id,
				objective_index,
				display_ordinal,
				objective_type_code,
				source_objective_type_code,
				objective_action_code,
				objective_action_label,
				objective_action_group_code,
				objective_action_group_index,
				objective_title_text,
				objective_title_key,
				require_last_to_complete_flag,
				require_last_to_show_in_ui_flag,
				show_counts_as_percentage_flag,
				objective_resolution_status_code,
				quest_objective_target_id,
				target_sequence_index,
				completion_group_index,
				option_index,
				group_match_operator_code,
				target_kind_code,
				target_display_text,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_icon_media_file_id,
				fallback_icon_key,
				fallback_icon_source_code,
				fallback_icon_lucide_name,
				required_count_value,
				required_count_unit_code,
				quantity_display_text,
				target_resolution_status_code,
				target_resolution_display_label
		 FROM web_view.riseopedia_entity_detail_quest_objectives
		 WHERE entity_id = $1::bigint
		 ORDER BY objective_index,
				  completion_group_index NULLS LAST,
				  option_index NULLS LAST,
				  target_sequence_index NULLS LAST,
				  quest_objective_target_id NULLS LAST`,
		[entityId],
	);

	return result.rows.map(mapQuestObjectiveRow);
}

async function listRiseopediaQuestRequirementRows(
	entityId: string,
): Promise<RiseopediaQuestRequirementRow[]> {
	const result = await query<RiseopediaQuestRequirementDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				quest_requirement_id,
				requirement_index,
				display_ordinal,
				requirement_type_code,
				requirement_type_label,
				source_requirement_type_code,
				raw_value_text,
				required_level_value,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_icon_media_file_id,
				fallback_icon_key,
				fallback_icon_source_code,
				fallback_icon_lucide_name,
				target_display_text,
				resolution_status_code
		 FROM web_view.riseopedia_entity_detail_quest_requirements
		 WHERE entity_id = $1::bigint
		 ORDER BY requirement_index,
				  quest_requirement_id`,
		[entityId],
	);

	return result.rows.map(mapQuestRequirementRow);
}

async function listRiseopediaQuestRewardRows(
	entityId: string,
): Promise<RiseopediaQuestRewardRow[]> {
	const result = await query<RiseopediaQuestRewardDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				quest_reward_id,
				reward_index,
				display_ordinal,
				reward_type_code,
				source_reward_type_code,
				reward_row_name,
				quantity_value,
				quantity_text,
				quantity_unit_code,
				quantity_display_text,
				choose_group_code,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_icon_media_file_id,
				fallback_icon_key,
				fallback_icon_source_code,
				fallback_icon_lucide_name,
				target_display_text,
				resolution_status_code
		 FROM web_view.riseopedia_entity_detail_quest_rewards
		 WHERE entity_id = $1::bigint
		 ORDER BY reward_index,
				  quest_reward_id`,
		[entityId],
	);

	return result.rows.map(mapQuestRewardRow);
}

async function listRiseopediaQuestFlowRows(
	entityId: string,
): Promise<RiseopediaQuestFlowRow[]> {
	const result = await query<RiseopediaQuestFlowDbRow>(
		`SELECT entity_id,
				entity_variant_id,
				entity_relationship_id,
				flow_section_code,
				flow_section_label,
				flow_section_empty_label,
				initial_visible_rows,
				section_sort_order,
				target_entity_id,
				target_entity_variant_id,
				target_entity_type_code,
				target_entity_slug,
				target_entity_name,
				target_icon_media_file_id,
				fallback_icon_key,
				fallback_icon_source_code,
				fallback_icon_lucide_name,
				source_value_text,
				resolution_status_code,
				sort_order
		 FROM web_view.riseopedia_entity_detail_quest_flow
		 WHERE entity_id = $1::bigint
		 ORDER BY section_sort_order,
				  sort_order,
				  target_entity_name,
				  entity_relationship_id`,
		[entityId],
	);

	return result.rows.map(mapQuestFlowRow);
}

async function listRiseopediaDependencyRows(
	entityId: string,
): Promise<RiseopediaDependencyRow[]> {
	const result = await query<RiseopediaDependencyDbRow>(
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
		 FROM web_view.riseopedia_entity_detail_dependency_rows
		 WHERE entity_id = $1::bigint
		 ORDER BY dependency_block_code,
				  sort_order,
				  related_entity_name,
				  related_entity_id`,
		[entityId],
	);

	return result.rows.map(mapDependencyRow);
}

async function listRiseopediaPatchNoteRows(
	entityId: string,
): Promise<RiseopediaPatchNoteRow[]> {
	const result = await query<RiseopediaPatchNoteDbRow>(
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
		 FROM web_view.riseopedia_entity_detail_patch_note_rows
		 WHERE entity_id = $1::bigint
		 ORDER BY patch_sort_order DESC,
				  sort_order,
				  what_changed_label,
				  patch_note_row_id`,
		[entityId],
	);

	return result.rows.map(mapPatchNoteRow);
}

async function loadRiseopediaEntityDetail(
	doc: RiseopediaEntityDetailDoc,
): Promise<RiseopediaEntityDetail> {
	const [
		sections,
		variants,
		variantValues,
		variantSelectors,
		bodyBlocks,
		profileElements,
		media,
		relationshipBlocks,
		dependencyRows,
		patchNoteRows,
		locationTreeRows,
		locationPoiRows,
		poiLocationTreeRows,
		poiVendorStockRows,
		poiResourceYieldRows,
		poiTransportStopRows,
		poiRelatedQuestRows,
		poiPublicBenchLinkRows,
		poiContainerLootRows,
		poiSummaryFactRows,
		perkTreeRows,
		effectModifierRows,
		needEffectRows,
		experienceProgressionRows,
		experienceLevelRows,
		experienceLevelUnlockRows,
		questObjectiveRows,
		questRequirementRows,
		questRewardRows,
		questFlowRows,
	] = await Promise.all([
		listRiseopediaEntitySections(doc.entityId),
		listRiseopediaEntityVariants(doc.entityId),
		listRiseopediaEntityVariantValues(doc.entityId),
		listRiseopediaEntityVariantSelectors(doc.entityId),
		listRiseopediaEntityBodyBlocks(doc.entityId),
		listRiseopediaEntityProfileElements(doc.entityId),
		listRiseopediaEntityMedia(doc.entityId),
		listRiseopediaRelationshipBlocks(doc.entityId),
		listRiseopediaDependencyRows(doc.entityId),
		listRiseopediaPatchNoteRows(doc.entityId),
		doc.entityTypeCode === "location"
			? listRiseopediaLocationTreeRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "location"
			? listRiseopediaLocationPoiRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiLocationTreeRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiVendorStockRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiResourceYieldRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiTransportStopRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiRelatedQuestRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiPublicBenchLinkRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiContainerLootRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "poi"
			? listRiseopediaPoiSummaryFactRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "perk"
			? listRiseopediaPerkTreeRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "mechanic" && doc.entityClassCode === "effect"
			? listRiseopediaEffectModifierRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "mechanic" && doc.entityClassCode === "need"
			? listRiseopediaNeedEffectRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "mechanic" && doc.entityClassCode === "experience"
			? listRiseopediaExperienceProgressionRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "mechanic" && doc.entityClassCode === "experience"
			? listRiseopediaExperienceLevelRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "mechanic" && doc.entityClassCode === "experience"
			? listRiseopediaExperienceLevelUnlockRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "quest"
			? listRiseopediaQuestObjectiveRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "quest"
			? listRiseopediaQuestRequirementRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "quest"
			? listRiseopediaQuestRewardRows(doc.entityId)
			: Promise.resolve([]),
		doc.entityTypeCode === "quest"
			? listRiseopediaQuestFlowRows(doc.entityId)
			: Promise.resolve([]),
	]);

	const [recipeOutputs, recipeRequirements, assetRecipeLinks] =
		await Promise.all([
			doc.entityTypeCode === "recipe"
				? listRiseopediaRecipeOutputs(doc.entityId)
				: Promise.resolve([]),
			doc.entityTypeCode === "recipe"
				? listRiseopediaRecipeRequirements(doc.entityId)
				: Promise.resolve([]),
			doc.entityTypeCode === "asset"
				? listRiseopediaAssetRecipeLinks(doc.entityId)
				: Promise.resolve([]),
		]);

	const variantLinkIds = new Set<string>();
	const addVariantLinkId = (
		entityVariantId: string | null | undefined,
	): void => {
		if (entityVariantId) {
			variantLinkIds.add(entityVariantId);
		}
	};

	for (const variant of variants) {
		addVariantLinkId(variant.entityVariantId);
	}

	for (const row of profileElements) {
		addVariantLinkId(row.linkedEntityVariantId);
	}
	for (const row of recipeOutputs) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of recipeRequirements) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of assetRecipeLinks) {
		addVariantLinkId(row.recipeEntityVariantId);
	}
	for (const row of relationshipBlocks) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of dependencyRows) {
		addVariantLinkId(row.relatedEntityVariantId);
	}
	for (const row of poiVendorStockRows) {
		addVariantLinkId(row.itemEntityVariantId);
	}
	for (const row of poiResourceYieldRows) {
		addVariantLinkId(row.itemEntityVariantId);
	}
	for (const row of poiRelatedQuestRows) {
		addVariantLinkId(row.entityVariantId);
	}
	for (const row of poiPublicBenchLinkRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of poiContainerLootRows) {
		addVariantLinkId(row.itemEntityVariantId);
	}
	for (const row of perkTreeRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of needEffectRows) {
		addVariantLinkId(row.effectEntityVariantId);
	}
	for (const row of questObjectiveRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of questRequirementRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of questRewardRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}
	for (const row of questFlowRows) {
		addVariantLinkId(row.targetEntityVariantId);
	}

	const variantLinkKeys = await listRiseopediaEntityVariantLinkKeys([
		...variantLinkIds,
	]);

	return {
		doc,
		sections,
		variants,
		variantLinkKeys,
		variantValues,
		variantSelectors,
		bodyBlocks,
		profileElements,
		media,
		recipeOutputs,
		recipeRequirements,
		assetRecipeLinks,
		relationshipBlocks,
		dependencyRows,
		patchNoteRows,
		locationTreeRows,
		locationPoiRows,
		poiLocationTreeRows,
		poiVendorStockRows,
		poiResourceYieldRows,
		poiTransportStopRows,
		poiRelatedQuestRows,
		poiPublicBenchLinkRows,
		poiContainerLootRows,
		poiSummaryFactRows,
		perkTreeRows,
		effectModifierRows,
		needEffectRows,
		experienceProgressionRows,
		experienceLevelRows,
		experienceLevelUnlockRows,
		questObjectiveRows,
		questRequirementRows,
		questRewardRows,
		questFlowRows,
	};
}

export async function findRiseopediaEntityDetailByEntitySlug(
	entitySlug: string,
): Promise<RiseopediaEntityDetail | null> {
	const normalizedSlug = normalizeRiseopediaSlug(entitySlug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findRiseopediaEntityDocBySlug({
		slug: normalizedSlug,
		entityTypeCode: null,
	});

	return doc ? loadRiseopediaEntityDetail(doc) : null;
}

export async function findRiseopediaEntityDetailBySlug(args: {
	slug: string;
	entityTypeCode: EntityTypeFilter;
}): Promise<RiseopediaEntityDetail | null> {
	const normalizedSlug = normalizeRiseopediaSlug(args.slug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findRiseopediaEntityDocBySlug({
		slug: normalizedSlug,
		entityTypeCode: args.entityTypeCode,
	});

	return doc ? loadRiseopediaEntityDetail(doc) : null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
