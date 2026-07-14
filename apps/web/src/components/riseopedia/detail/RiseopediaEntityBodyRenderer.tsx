//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaEntityBodyRenderer.tsx                                ////
//// Language: TSX                                                                                            ////
//// Passive configurable detail-block renderer for Riseopedia-family main-body and aside placements.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaConfiguredBodyBlock from "@/components/riseopedia/detail/blocks/RiseopediaConfiguredBodyBlock";
import type {
	RiseopediaBodyBlock,
	RiseopediaDetailElement,
	RiseopediaEffectModifierRow,
	RiseopediaEntityDetailDoc,
	RiseopediaExperienceLevelRow,
	RiseopediaExperienceLevelUnlockRow,
	RiseopediaExperienceProgressionRow,
	RiseopediaEntityMediaRef,
	RiseopediaEntityVariant,
	RiseopediaEntityVariantSelector,
	RiseopediaEntityVariantValue,
	RiseopediaLocationPoiRow,
	RiseopediaLocationTreeRow,
	RiseopediaNeedEffectRow,
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
	RiseopediaPerkTreeRow,
	RiseopediaRecipeOutput,
	RiseopediaRecipeRequirement,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaBodyBlockPlacementCode = "body_main" | "detail_aside";

export type RiseopediaEntityBodyRendererProps = {
	blocks: RiseopediaBodyBlock[];
	placementCode?: RiseopediaBodyBlockPlacementCode;
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

type SupportedBodyRendererCode =
	| "generic_body"
	| "asset_body"
	| "recipe_body"
	| "perk_body"
	| "experience_body"
	| "need_body"
	| "location_body"
	| "poi_body"
	| "quest_body";

const SUPPORTED_BODY_RENDERERS = new Set<string>([
	"generic_body",
	"asset_body",
	"recipe_body",
	"perk_body",
	"experience_body",
	"need_body",
	"effect_body",
	"location_body",
	"poi_body",
	"quest_body",
]);

function isSupportedBodyRendererCode(
	value: string,
): value is SupportedBodyRendererCode {
	return SUPPORTED_BODY_RENDERERS.has(value);
}

function orderedBlocks(args: {
	blocks: RiseopediaBodyBlock[];
	placementCode: RiseopediaBodyBlockPlacementCode;
}): RiseopediaBodyBlock[] {
	return [...args.blocks]
		.filter(
			(block) => block.visible && block.displaySlotCode === args.placementCode,
		)
		.sort((left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			const labelCompare = left.bodyBlockLabel.localeCompare(right.bodyBlockLabel);
			if (labelCompare !== 0) {
				return labelCompare;
			}

			return left.displayProfileBodyBlockId.localeCompare(
				right.displayProfileBodyBlockId,
			);
		});
}

export default function RiseopediaEntityBodyRenderer({
	blocks,
	placementCode = "body_main",
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
}: RiseopediaEntityBodyRendererProps): JSX.Element | null {
	const visibleBlocks = orderedBlocks({ blocks, placementCode });
	if (visibleBlocks.length === 0) {
		return null;
	}

	const bodyRendererCode = visibleBlocks[0]?.bodyRendererCode ?? "generic_body";
	if (!isSupportedBodyRendererCode(bodyRendererCode)) {
		return null;
	}

	return (
		<div
			className="riseopedia-body-content"
			data-body-renderer={bodyRendererCode}
			data-display-slot={placementCode}
		>
			{visibleBlocks.map((block) => (
				<RiseopediaConfiguredBodyBlock
					block={block}
					key={block.displayProfileBodyBlockId}
					selectedEntityVariantId={selectedEntityVariantId}
					currentEntity={currentEntity}
					currentEntityIconMediaFileId={currentEntityIconMediaFileId}
					variants={variants}
					variantValues={variantValues}
					variantSelectors={variantSelectors}
					media={media}
					profileElements={profileElements}
					recipeRequirements={recipeRequirements}
					recipeOutputs={recipeOutputs}
					locationTreeRows={locationTreeRows}
					locationPoiRows={locationPoiRows}
					perkTreeRows={perkTreeRows}
					effectModifierRows={effectModifierRows}
					experienceProgressionRows={experienceProgressionRows}
					experienceLevelRows={experienceLevelRows}
					experienceLevelUnlockRows={experienceLevelUnlockRows}
					needEffectRows={needEffectRows}
					poiLocationTreeRows={poiLocationTreeRows}
					poiResourceYieldRows={poiResourceYieldRows}
					poiTransportStopRows={poiTransportStopRows}
					poiRelatedQuestRows={poiRelatedQuestRows}
					poiPublicBenchLinkRows={poiPublicBenchLinkRows}
					poiContainerLootRows={poiContainerLootRows}
					poiSummaryFactRows={poiSummaryFactRows}
					poiVendorStockRows={poiVendorStockRows}
					questObjectiveRows={questObjectiveRows}
					questRequirementRows={questRequirementRows}
					questRewardRows={questRewardRows}
					questFlowRows={questFlowRows}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					releaseFilters={releaseFilters}
				/>
			))}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
