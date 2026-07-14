//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/riseopedia-body-block-registry.ts                               ////
//// Language: TS                                                                                              ////
//// Defines the visual-family ownership contract for configured Riseopedia body renderers.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RiseopediaBodyBlockFamily =
	| "prose"
	| "definition"
	| "hierarchy_tree"
	| "data_table"
	| "numbered_entity_rows"
	| "grouped_mechanics_rows"
	| "special_visualization"
	| "state";

export type RiseopediaBodyBlockVariant =
	| "default"
	| "active_navigation"
	| "neutral_hierarchy"
	| "directory"
	| "standard_table"
	| "numbered_rows"
	| "metrics"
	| "transformation"
	| "gating"
	| "unavailable";

export type RiseopediaBodyBlockPresentation = {
	family: RiseopediaBodyBlockFamily;
	variant: RiseopediaBodyBlockVariant;
};

export type RiseopediaSupportedBodyBlockRendererCode =
	| "profile_prose"
	| "profile_property_stack"
	| "recipe_tree"
	| "asset_variants"
	| "location_tree"
	| "location_poi_list"
	| "perk_tree"
	| "effect_modifiers"
	| "experience_progression"
	| "experience_level_table"
	| "experience_level_unlocks"
	| "need_effects"
	| "poi_vendor_stock"
	| "poi_placeholder"
	| "poi_resource_site"
	| "poi_transport_stops"
	| "poi_related_quests"
	| "poi_public_bench_recipes"
	| "poi_public_bench_asset"
	| "poi_container_contents"
	| "poi_container_summary"
	| "poi_resource_summary"
	| "poi_fact_summary"
	| "quest_objective_timeline"
	| "quest_requirements"
	| "quest_rewards"
	| "quest_flow";

const BODY_BLOCK_PRESENTATIONS: {
	[rendererCode in RiseopediaSupportedBodyBlockRendererCode]: RiseopediaBodyBlockPresentation;
} = {
	profile_prose: {
		family: "prose",
		variant: "default",
	},
	profile_property_stack: {
		family: "definition",
		variant: "default",
	},
	recipe_tree: {
		family: "special_visualization",
		variant: "transformation",
	},
	asset_variants: {
		family: "hierarchy_tree",
		variant: "active_navigation",
	},
	location_tree: {
		family: "hierarchy_tree",
		variant: "active_navigation",
	},
	location_poi_list: {
		family: "hierarchy_tree",
		variant: "directory",
	},
	perk_tree: {
		family: "special_visualization",
		variant: "gating",
	},
	effect_modifiers: {
		family: "grouped_mechanics_rows",
		variant: "metrics",
	},
	experience_progression: {
		family: "hierarchy_tree",
		variant: "neutral_hierarchy",
	},
	experience_level_table: {
		family: "data_table",
		variant: "standard_table",
	},
	experience_level_unlocks: {
		family: "hierarchy_tree",
		variant: "neutral_hierarchy",
	},
	need_effects: {
		family: "grouped_mechanics_rows",
		variant: "metrics",
	},
	poi_vendor_stock: {
		family: "data_table",
		variant: "standard_table",
	},
	poi_placeholder: {
		family: "state",
		variant: "unavailable",
	},
	poi_resource_site: {
		family: "data_table",
		variant: "standard_table",
	},
	poi_transport_stops: {
		family: "numbered_entity_rows",
		variant: "numbered_rows",
	},
	poi_related_quests: {
		family: "numbered_entity_rows",
		variant: "numbered_rows",
	},
	poi_public_bench_recipes: {
		family: "numbered_entity_rows",
		variant: "numbered_rows",
	},
	poi_public_bench_asset: {
		family: "definition",
		variant: "default",
	},
	poi_container_contents: {
		family: "data_table",
		variant: "standard_table",
	},
	poi_container_summary: {
		family: "definition",
		variant: "default",
	},
	poi_resource_summary: {
		family: "definition",
		variant: "default",
	},
	poi_fact_summary: {
		family: "definition",
		variant: "default",
	},
	quest_objective_timeline: {
		family: "numbered_entity_rows",
		variant: "numbered_rows",
	},
	quest_requirements: {
		family: "numbered_entity_rows",
		variant: "numbered_rows",
	},
	quest_rewards: {
		family: "data_table",
		variant: "standard_table",
	},
	quest_flow: {
		family: "hierarchy_tree",
		variant: "neutral_hierarchy",
	},
};

export function findRiseopediaBodyBlockPresentation(
	rendererCode: string,
): RiseopediaBodyBlockPresentation | null {
	if (!isRiseopediaSupportedBodyBlockRendererCode(rendererCode)) {
		return null;
	}

	return BODY_BLOCK_PRESENTATIONS[rendererCode];
}

export function isRiseopediaSupportedBodyBlockRendererCode(
	value: string,
): value is RiseopediaSupportedBodyBlockRendererCode {
	return Object.hasOwn(BODY_BLOCK_PRESENTATIONS, value);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
