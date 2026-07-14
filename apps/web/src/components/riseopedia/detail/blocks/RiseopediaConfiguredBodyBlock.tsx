//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/RiseopediaConfiguredBodyBlock.tsx                               ////
//// Language: TSX                                                                                             ////
//// Dispatches one configured Riseopedia body block through the shared family shell and renderer registry.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAssetVariantsBlock from "@/components/riseopedia/detail/blocks/asset/RiseopediaAssetVariantsBlock";
import RiseopediaBodyBlockShell from "@/components/riseopedia/detail/blocks/shared/RiseopediaBodyBlockShell";
import RiseopediaEffectModifiersBlock from "@/components/riseopedia/detail/blocks/mechanic/RiseopediaEffectModifiersBlock";
import RiseopediaEmptyState from "@/components/riseopedia/ui/RiseopediaEmptyState";
import RiseopediaExperienceLevelTableBlock from "@/components/riseopedia/detail/blocks/progression/RiseopediaExperienceLevelTableBlock";
import RiseopediaExperienceLevelUnlocksBlock from "@/components/riseopedia/detail/blocks/progression/RiseopediaExperienceLevelUnlocksBlock";
import RiseopediaExperienceProgressionBlock from "@/components/riseopedia/detail/blocks/progression/RiseopediaExperienceProgressionBlock";
import RiseopediaLocationPoiListBlock from "@/components/riseopedia/detail/blocks/location/RiseopediaLocationPoiListBlock";
import RiseopediaLocationTreeBlock from "@/components/riseopedia/detail/blocks/location/RiseopediaLocationTreeBlock";
import RiseopediaNeedEffectsBlock from "@/components/riseopedia/detail/blocks/mechanic/RiseopediaNeedEffectsBlock";
import RiseopediaPerkTreeBlock from "@/components/riseopedia/detail/blocks/perk/RiseopediaPerkTreeBlock";
import RiseopediaPoiContainerContentsBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiContainerContentsBlock";
import RiseopediaPoiContainerSummaryBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiContainerSummaryBlock";
import RiseopediaPoiFactSummaryBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiFactSummaryBlock";
import RiseopediaPoiPlaceholderBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiPlaceholderBlock";
import RiseopediaPoiPublicBenchAssetBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiPublicBenchAssetBlock";
import RiseopediaPoiPublicBenchRecipesBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiPublicBenchRecipesBlock";
import RiseopediaPoiRelatedQuestsBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiRelatedQuestsBlock";
import RiseopediaPoiResourceSiteBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiResourceSiteBlock";
import RiseopediaPoiResourceSummaryBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiResourceSummaryBlock";
import RiseopediaPoiTransportStopsBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiTransportStopsBlock";
import RiseopediaPoiVendorStockBlock from "@/components/riseopedia/detail/blocks/poi/RiseopediaPoiVendorStockBlock";
import RiseopediaProfilePropertyStackBlock from "@/components/riseopedia/detail/blocks/profile/RiseopediaProfilePropertyStackBlock";
import RiseopediaProfileProseBlock, {
	hasRenderableRiseopediaProfileProseRows,
} from "@/components/riseopedia/detail/blocks/profile/RiseopediaProfileProseBlock";
import RiseopediaQuestFlowBlock from "@/components/riseopedia/detail/blocks/quest/RiseopediaQuestFlowBlock";
import RiseopediaQuestObjectivesBlock from "@/components/riseopedia/detail/blocks/quest/RiseopediaQuestObjectivesBlock";
import RiseopediaQuestRequirementsBlock from "@/components/riseopedia/detail/blocks/quest/RiseopediaQuestRequirementsBlock";
import RiseopediaQuestRewardsBlock from "@/components/riseopedia/detail/blocks/quest/RiseopediaQuestRewardsBlock";
import RiseopediaRecipeTreeBlock from "@/components/riseopedia/detail/blocks/recipe/RiseopediaRecipeTreeBlock";
import {
	findRiseopediaBodyBlockPresentation,
	isRiseopediaSupportedBodyBlockRendererCode,
} from "@/components/riseopedia/detail/blocks/riseopedia-body-block-registry";
import type {
	RiseopediaBodyBlock,
	RiseopediaDetailElement,
	RiseopediaEffectModifierRow,
	RiseopediaEntityDetailDoc,
	RiseopediaEntityMediaRef,
	RiseopediaEntityVariant,
	RiseopediaEntityVariantSelector,
	RiseopediaEntityVariantValue,
	RiseopediaExperienceLevelRow,
	RiseopediaExperienceLevelUnlockRow,
	RiseopediaExperienceProgressionRow,
	RiseopediaLocationPoiRow,
	RiseopediaLocationTreeRow,
	RiseopediaNeedEffectRow,
	RiseopediaPerkTreeRow,
	RiseopediaPoiContainerLootRow,
	RiseopediaPoiLocationTreeRow,
	RiseopediaPoiPublicBenchLinkRow,
	RiseopediaPoiRelatedQuestRow,
	RiseopediaPoiResourceYieldRow,
	RiseopediaPoiSummaryFactRow,
	RiseopediaPoiTransportStopRow,
	RiseopediaPoiVendorStockRow,
	RiseopediaQuestFlowRow,
	RiseopediaQuestObjectiveRow,
	RiseopediaQuestRequirementRow,
	RiseopediaQuestRewardRow,
	RiseopediaRecipeOutput,
	RiseopediaRecipeRequirement,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaConfiguredBodyBlockProps = {
	block: RiseopediaBodyBlock;
	selectedEntityVariantId: string | null;
	currentEntity: RiseopediaEntityDetailDoc;
	currentEntityIconMediaFileId: string | null;
	variants: RiseopediaEntityVariant[];
	variantValues: RiseopediaEntityVariantValue[];
	variantSelectors: RiseopediaEntityVariantSelector[];
	media: RiseopediaEntityMediaRef[];
	profileElements: RiseopediaDetailElement[];
	recipeRequirements: RiseopediaRecipeRequirement[];
	recipeOutputs: RiseopediaRecipeOutput[];
	locationTreeRows: RiseopediaLocationTreeRow[];
	locationPoiRows: RiseopediaLocationPoiRow[];
	perkTreeRows: RiseopediaPerkTreeRow[];
	effectModifierRows: RiseopediaEffectModifierRow[];
	experienceProgressionRows: RiseopediaExperienceProgressionRow[];
	experienceLevelRows: RiseopediaExperienceLevelRow[];
	experienceLevelUnlockRows: RiseopediaExperienceLevelUnlockRow[];
	needEffectRows: RiseopediaNeedEffectRow[];
	poiLocationTreeRows: RiseopediaPoiLocationTreeRow[];
	poiResourceYieldRows: RiseopediaPoiResourceYieldRow[];
	poiTransportStopRows: RiseopediaPoiTransportStopRow[];
	poiRelatedQuestRows: RiseopediaPoiRelatedQuestRow[];
	poiPublicBenchLinkRows: RiseopediaPoiPublicBenchLinkRow[];
	poiContainerLootRows: RiseopediaPoiContainerLootRow[];
	poiSummaryFactRows: RiseopediaPoiSummaryFactRow[];
	poiVendorStockRows: RiseopediaPoiVendorStockRow[];
	questObjectiveRows: RiseopediaQuestObjectiveRow[];
	questRequirementRows: RiseopediaQuestRequirementRow[];
	questRewardRows: RiseopediaQuestRewardRow[];
	questFlowRows: RiseopediaQuestFlowRow[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function blockProfileElements(args: {
	block: RiseopediaBodyBlock;
	profileElements: RiseopediaDetailElement[];
}): RiseopediaDetailElement[] {
	const allowsAssignedProfileElements =
		args.block.bodyBlockDataSourceCode === "profile_elements" ||
		args.block.bodyBlockRendererCode === "recipe_tree";

	if (!allowsAssignedProfileElements) {
		return [];
	}

	return args.profileElements.filter(
		(row) =>
			row.displayProfileBodyBlockId === args.block.displayProfileBodyBlockId,
	);
}

function recipeBlockHasRows(args: {
	requirements: RiseopediaRecipeRequirement[];
	outputs: RiseopediaRecipeOutput[];
}): boolean {
	return (
		args.outputs.length > 0 ||
		args.requirements.some((row) => row.requirementKindCode !== "bench")
	);
}

function shouldShowEmptyState(block: RiseopediaBodyBlock): boolean {
	return block.emptyBehaviorCode === "show_empty_state";
}

function emptyStateMessage(block: RiseopediaBodyBlock): string {
	switch (block.bodyBlockRendererCode) {
		case "location_tree":
			return "No location available.";
		case "location_poi_list":
			return "No points of interest available.";
		case "experience_progression":
			return "No progression tracks available.";
		case "experience_level_table":
			return "No level progression available.";
		case "experience_level_unlocks":
			return "No unlocks available.";
		case "quest_flow":
			return "No quest flow available.";
		case "quest_objective_timeline":
			return "No objectives available.";
		case "quest_requirements":
			return "No requirements available.";
		case "quest_rewards":
			return "No rewards available.";
		case "poi_vendor_stock":
			return "No available rows.";
		case "poi_resource_site":
			return "No resource yield rows available.";
		case "poi_transport_stops":
			return "No route stops available.";
		case "poi_related_quests":
			return "No related Quests available.";
		case "poi_public_bench_recipes":
			return "No craftable Recipes available.";
		case "poi_public_bench_asset":
			return "No canonical bench asset available.";
		case "poi_container_contents":
			return "No container contents available.";
		case "poi_container_summary":
			return "No container details available.";
		case "poi_resource_summary":
			return "No gathering details available.";
		case "poi_fact_summary":
			return "No POI facts available.";
		case "effect_modifiers":
		case "need_effects":
			return "No effects available.";
		case "asset_variants":
			return "No variants available.";
		case "profile_prose": {
			const bodyBlockLabel = block.bodyBlockLabel.trim().toLocaleLowerCase();
			return bodyBlockLabel
				? `No ${bodyBlockLabel} available.`
				: "No text available.";
		}
		default:
			return "No rows available.";
	}
}

function emptyStateContent(block: RiseopediaBodyBlock): JSX.Element {
	return <RiseopediaEmptyState message={emptyStateMessage(block)} />;
}

export default function RiseopediaConfiguredBodyBlock({
	block,
	selectedEntityVariantId,
	currentEntity,
	currentEntityIconMediaFileId,
	variants,
	variantValues,
	variantSelectors,
	media,
	profileElements,
	recipeRequirements,
	recipeOutputs,
	locationTreeRows,
	locationPoiRows,
	perkTreeRows,
	effectModifierRows,
	experienceProgressionRows,
	experienceLevelRows,
	experienceLevelUnlockRows,
	needEffectRows,
	poiLocationTreeRows,
	poiResourceYieldRows,
	poiTransportStopRows,
	poiRelatedQuestRows,
	poiPublicBenchLinkRows,
	poiContainerLootRows,
	poiSummaryFactRows,
	poiVendorStockRows,
	questObjectiveRows,
	questRequirementRows,
	questRewardRows,
	questFlowRows,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: RiseopediaConfiguredBodyBlockProps): JSX.Element | null {
	if (
		!block.visible ||
		!isRiseopediaSupportedBodyBlockRendererCode(block.bodyBlockRendererCode)
	) {
		return null;
	}

	const presentation = findRiseopediaBodyBlockPresentation(
		block.bodyBlockRendererCode,
	);
	if (!presentation) {
		return null;
	}

	let content: JSX.Element | null = null;

	switch (block.bodyBlockRendererCode) {
		case "asset_variants":
			content =
				currentEntity.entityTypeCode === "asset" && variants.length > 1 ? (
					<RiseopediaAssetVariantsBlock
						block={block}
						currentEntity={currentEntity}
						media={media}
						releaseFilters={releaseFilters}
						selectedEntityVariantId={selectedEntityVariantId}
						variantSelectors={variantSelectors}
						variantValues={variantValues}
						variants={variants}
						wikiCode={wikiCode}
					/>
				) : null;
			break;
		case "profile_prose": {
			const rows = blockProfileElements({ block, profileElements });
			content = hasRenderableRiseopediaProfileProseRows(rows) ? (
				<RiseopediaProfileProseBlock
					rows={rows}
					wikiCode={wikiCode}
					releaseFilters={releaseFilters}
				/>
			) : null;
			break;
		}
		case "profile_property_stack": {
			const rows = blockProfileElements({ block, profileElements });
			content =
				rows.length > 0 ? (
					<RiseopediaProfilePropertyStackBlock
						rows={rows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		}
		case "quest_objective_timeline":
			content =
				questObjectiveRows.length > 0 ? (
					<RiseopediaQuestObjectivesBlock
						block={block}
						rows={questObjectiveRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "quest_requirements":
			content =
				questRequirementRows.length > 0 ? (
					<RiseopediaQuestRequirementsBlock
						block={block}
						rows={questRequirementRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "quest_rewards":
			content =
				questRewardRows.length > 0 ? (
					<RiseopediaQuestRewardsBlock
						block={block}
						rows={questRewardRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "quest_flow":
			content =
				questFlowRows.length > 0 ? (
					<RiseopediaQuestFlowBlock
						block={block}
						rows={questFlowRows}
						selectedEntityVariantId={selectedEntityVariantId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "effect_modifiers":
			content =
				effectModifierRows.length > 0 ? (
					<RiseopediaEffectModifiersBlock
						rows={effectModifierRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "experience_progression":
			content =
				experienceProgressionRows.length > 0 ||
				block.emptyBehaviorCode === "show_empty_state" ? (
					<RiseopediaExperienceProgressionBlock
						block={block}
						rows={experienceProgressionRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "experience_level_table":
			content =
				experienceLevelRows.length > 0 ? (
					<RiseopediaExperienceLevelTableBlock
						block={block}
						rows={experienceLevelRows}
						selectedEntityVariantId={selectedEntityVariantId}
					/>
				) : null;
			break;
		case "experience_level_unlocks":
			content =
				experienceLevelUnlockRows.length > 0 ? (
					<RiseopediaExperienceLevelUnlocksBlock
						block={block}
						rows={experienceLevelUnlockRows}
						selectedEntityVariantId={selectedEntityVariantId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "need_effects":
			content =
				needEffectRows.length > 0 ? (
					<RiseopediaNeedEffectsBlock
						block={block}
						rows={needEffectRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_vendor_stock":
			content =
				poiVendorStockRows.length > 0 ? (
					<RiseopediaPoiVendorStockBlock
						rows={poiVendorStockRows}
						selectedEntityVariantId={selectedEntityVariantId}
						mediaByFileId={mediaByFileId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_placeholder":
			content = <RiseopediaPoiPlaceholderBlock block={block} />;
			break;
		case "poi_resource_site":
			content =
				poiResourceYieldRows.length > 0 ? (
					<RiseopediaPoiResourceSiteBlock
						rows={poiResourceYieldRows}
						selectedEntityVariantId={selectedEntityVariantId}
						mediaByFileId={mediaByFileId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_transport_stops":
			content =
				poiTransportStopRows.length > 0 ? (
					<RiseopediaPoiTransportStopsBlock
						rows={poiTransportStopRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_related_quests":
			content =
				poiRelatedQuestRows.length > 0 ? (
					<RiseopediaPoiRelatedQuestsBlock
						rows={poiRelatedQuestRows}
						selectedEntityVariantId={selectedEntityVariantId}
						groupByClassification={block.bodyBlockCode === "related_quests"}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_public_bench_recipes":
			content =
				poiPublicBenchLinkRows.length > 0 ? (
					<RiseopediaPoiPublicBenchRecipesBlock
						rows={poiPublicBenchLinkRows}
						selectedEntityVariantId={selectedEntityVariantId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_public_bench_asset":
			content =
				poiPublicBenchLinkRows.length > 0 ? (
					<RiseopediaPoiPublicBenchAssetBlock
						block={block}
						rows={poiPublicBenchLinkRows}
						selectedEntityVariantId={selectedEntityVariantId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_container_contents":
			content =
				poiContainerLootRows.length > 0 ? (
					<RiseopediaPoiContainerContentsBlock
						rows={poiContainerLootRows}
						selectedEntityVariantId={selectedEntityVariantId}
						mediaByFileId={mediaByFileId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "poi_container_summary":
			content =
				poiContainerLootRows.length > 0 ? (
					<RiseopediaPoiContainerSummaryBlock
						block={block}
						rows={poiContainerLootRows}
						selectedEntityVariantId={selectedEntityVariantId}
					/>
				) : null;
			break;
		case "poi_resource_summary":
			content =
				poiResourceYieldRows.length > 0 ? (
					<RiseopediaPoiResourceSummaryBlock
						block={block}
						rows={poiResourceYieldRows}
						selectedEntityVariantId={selectedEntityVariantId}
					/>
				) : null;
			break;
		case "poi_fact_summary":
			content =
				poiSummaryFactRows.length > 0 ? (
					<RiseopediaPoiFactSummaryBlock block={block} rows={poiSummaryFactRows} />
				) : null;
			break;
		case "location_tree": {
			const rows =
				currentEntity.entityTypeCode === "poi"
					? poiLocationTreeRows
					: locationTreeRows;
			content =
				rows.length > 0 ? (
					<RiseopediaLocationTreeBlock
						block={block}
						rows={rows}
						selectedEntityVariantId={selectedEntityVariantId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		}
		case "location_poi_list":
			content =
				locationPoiRows.length > 0 ? (
					<RiseopediaLocationPoiListBlock
						block={block}
						rows={locationPoiRows}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "perk_tree":
			content =
				perkTreeRows.length > 0 ? (
					<RiseopediaPerkTreeBlock
						rows={perkTreeRows}
						selectedEntityVariantId={selectedEntityVariantId}
						currentEntity={currentEntity}
						currentEntityIconMediaFileId={currentEntityIconMediaFileId}
						mediaByFileId={mediaByFileId}
						wikiCode={wikiCode}
						releaseFilters={releaseFilters}
					/>
				) : null;
			break;
		case "recipe_tree": {
			const assignedStageElements = blockProfileElements({
				block,
				profileElements,
			});

			content = recipeBlockHasRows({
				requirements: recipeRequirements,
				outputs: recipeOutputs,
			}) ? (
				<RiseopediaRecipeTreeBlock
					requirements={recipeRequirements}
					outputs={recipeOutputs}
					recipeStageElements={assignedStageElements}
					mediaByFileId={mediaByFileId}
					showHeading={false}
					wikiCode={wikiCode}
					releaseFilters={releaseFilters}
				/>
			) : null;
			break;
		}
		default:
			content = null;
	}

	if (!content && shouldShowEmptyState(block)) {
		content = emptyStateContent(block);
	}

	if (!content) {
		return null;
	}

	return (
		<RiseopediaBodyBlockShell
			block={block}
			family={presentation.family}
			variant={presentation.variant}
			showHeading={
				block.bodyBlockRendererCode !== "recipe_tree" &&
				block.bodyBlockRendererCode !== "perk_tree" &&
				block.bodyBlockRendererCode !== "poi_public_bench_asset" &&
				block.bodyBlockRendererCode !== "poi_container_summary" &&
				block.bodyBlockRendererCode !== "poi_resource_summary" &&
				block.bodyBlockRendererCode !== "poi_fact_summary"
			}
		>
			{content}
		</RiseopediaBodyBlockShell>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
