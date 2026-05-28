//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-detail.ts                                                          ////
//// Language: TS                                                                                             ////
//// Shared server-side detail aggregators for canonical public Riseopedia pages and matching public APIs.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import {
	findRiseopediaAssetBySlug,
	listRecipesCraftingRiseopediaAsset,
	listRecipesCraftingRiseopediaAssets,
	listRecipesUsingRiseopediaAsset,
	listRiseopediaAssetProperties,
	listRiseopediaAssetRarities,
	listRiseopediaAssetSections,
	listRiseopediaAssetStateProperties,
	listRiseopediaAssetVariants,
	type RiseopediaAssetDoc,
	type RiseopediaAssetProperty,
	type RiseopediaAssetRarity,
	type RiseopediaAssetRecipeRef,
	type RiseopediaAssetStateProperty,
	type RiseopediaAssetVariant,
} from "@/lib/data/riseopedia-assets";
import {
	getRiseopediaDisplayLayout,
	type RiseopediaDisplayLayout,
} from "@/lib/data/riseopedia-display";
import {
	findRiseopediaRecipeBySlug,
	listRiseopediaRecipeComponents,
	listRiseopediaRecipeOutputs,
	listRiseopediaRecipeSections,
	type RiseopediaRecipeAssetRef,
	type RiseopediaRecipeDoc,
} from "@/lib/data/riseopedia-recipes";
import type { RiseopediaEntitySectionRef } from "@/lib/data/riseopedia-sections";

const RISEOPEDIA_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

export type RiseopediaAssetDetail = {
	doc: RiseopediaAssetDoc;
	sections: RiseopediaEntitySectionRef[];
	properties: RiseopediaAssetProperty[];
	rarities: RiseopediaAssetRarity[];
	stateProperties: RiseopediaAssetStateProperty[];
	variants: RiseopediaAssetVariant[];
	usedInRecipes: RiseopediaAssetRecipeRef[];
	craftedByRecipes: RiseopediaAssetRecipeRef[];
	display: RiseopediaDisplayLayout;
};

export type RiseopediaRecipeComponentCraftingRecipes = {
	assetId: string;
	canonicalAssetKey: string;
	assetName: string;
	assetSlug: string;
	recipes: RiseopediaAssetRecipeRef[];
};

export type RiseopediaRecipeDetail = {
	doc: RiseopediaRecipeDoc;
	sections: RiseopediaEntitySectionRef[];
	components: RiseopediaRecipeAssetRef[];
	outputs: RiseopediaRecipeAssetRef[];
	componentCraftingRecipes: RiseopediaRecipeComponentCraftingRecipes[];
	display: RiseopediaDisplayLayout;
};

export function normalizeRiseopediaSlug(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	return RISEOPEDIA_SLUG_PATTERN.test(normalized) ? normalized : null;
}

function uniqueResolvedComponents(
	components: RiseopediaRecipeAssetRef[],
): RiseopediaRecipeAssetRef[] {
	const seenAssetIds = new Set<string>();
	const rows: RiseopediaRecipeAssetRef[] = [];

	for (const component of components) {
		if (component.isPlaceholder || seenAssetIds.has(component.assetId)) {
			continue;
		}

		seenAssetIds.add(component.assetId);
		rows.push(component);
	}

	return rows;
}

async function listRecipeComponentCraftingRecipes(args: {
	currentRecipeId: string;
	components: RiseopediaRecipeAssetRef[];
}): Promise<RiseopediaRecipeComponentCraftingRecipes[]> {
	const resolvedComponents = uniqueResolvedComponents(args.components);
	const recipesByAssetId = await listRecipesCraftingRiseopediaAssets(
		resolvedComponents.map((component) => component.assetId),
	);
	const rows = resolvedComponents.map((component) => ({
		assetId: component.assetId,
		canonicalAssetKey: component.canonicalAssetKey,
		assetName: component.assetName,
		assetSlug: component.assetSlug,
		recipes: (recipesByAssetId.get(component.assetId) ?? []).filter(
			(recipe) => recipe.recipeId !== args.currentRecipeId,
		),
	}));

	return rows.filter((row) => row.recipes.length > 0);
}

export async function findRiseopediaAssetDetailBySlug(
	slug: string,
): Promise<RiseopediaAssetDetail | null> {
	const normalizedSlug = normalizeRiseopediaSlug(slug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findRiseopediaAssetBySlug(normalizedSlug);
	if (!doc) {
		return null;
	}

	const [
		sections,
		properties,
		rarities,
		stateProperties,
		variants,
		usedInRecipes,
		craftedByRecipes,
		display,
	] = await Promise.all([
		listRiseopediaAssetSections(doc.id),
		listRiseopediaAssetProperties(doc.id),
		listRiseopediaAssetRarities(doc.id),
		listRiseopediaAssetStateProperties(doc.id),
		listRiseopediaAssetVariants(doc.id),
		listRecipesUsingRiseopediaAsset(doc.id),
		listRecipesCraftingRiseopediaAsset(doc.id),
		getRiseopediaDisplayLayout({
			entityTypeCode: "asset",
			entityKey: doc.canonicalAssetKey,
		}),
	]);

	return {
		doc,
		sections,
		properties,
		rarities,
		stateProperties,
		variants,
		usedInRecipes,
		craftedByRecipes,
		display,
	};
}

export async function findRiseopediaRecipeDetailBySlug(
	slug: string,
): Promise<RiseopediaRecipeDetail | null> {
	const normalizedSlug = normalizeRiseopediaSlug(slug);
	if (!normalizedSlug) {
		return null;
	}

	const doc = await findRiseopediaRecipeBySlug(normalizedSlug);
	if (!doc) {
		return null;
	}

	const [sections, components, outputs, display] = await Promise.all([
		listRiseopediaRecipeSections(doc.id),
		listRiseopediaRecipeComponents(doc.id),
		listRiseopediaRecipeOutputs(doc.id),
		getRiseopediaDisplayLayout({
			entityTypeCode: "recipe",
			entityKey: doc.recipeKey,
		}),
	]);
	const componentCraftingRecipes = await listRecipeComponentCraftingRecipes({
		currentRecipeId: doc.id,
		components,
	});

	return {
		doc,
		sections,
		components,
		outputs,
		componentCraftingRecipes,
		display,
	};
}
