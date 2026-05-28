//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaBottomBlocks.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Bottom relationship/dependency/changelog block renderer for public Riseopedia detail pages.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type {
	RiseopediaAssetRecipeRef,
	RiseopediaAssetVariant,
} from "@/lib/data/riseopedia-assets";
import type {
	RiseopediaDisplayBlock,
	RiseopediaDisplayLayout,
} from "@/lib/data/riseopedia-display";

export type RiseopediaBottomBlocksProps = {
	display: RiseopediaDisplayLayout;
	variants?: RiseopediaAssetVariant[];
	usedInRecipes?: RiseopediaAssetRecipeRef[];
	craftedByRecipes?: RiseopediaAssetRecipeRef[];
};

type RiseopediaBottomBlock = {
	key: string;
	group: RiseopediaDisplayBlock["blockGroupCode"];
	title: string;
	body: ReactNode;
};

const VARIANT_BLOCK_CODES = new Set([
	"variants",
	"asset_variants",
	"related_variants",
]);
const USED_IN_RECIPE_BLOCK_CODES = new Set([
	"used_in_recipes",
	"asset_used_in_recipes",
	"recipe_inputs",
]);
const CRAFTED_BY_RECIPE_BLOCK_CODES = new Set([
	"crafted_by_recipes",
	"asset_crafted_by_recipes",
	"recipe_outputs",
]);

function selectedBlock(
	blocks: RiseopediaDisplayBlock[],
	codes: Set<string>,
): RiseopediaDisplayBlock | null {
	return (
		blocks.find((block) => codes.has(block.relationshipBlockTypeCode)) ?? null
	);
}

function recipeDurationLabel(recipe: RiseopediaAssetRecipeRef): string | null {
	if (recipe.durationSeconds === null) {
		return null;
	}

	if (recipe.durationSeconds < 60) {
		return `${recipe.durationSeconds}s`;
	}

	const minutes = Math.floor(recipe.durationSeconds / 60);
	const seconds = recipe.durationSeconds % 60;
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function recipeMeta(recipe: RiseopediaAssetRecipeRef): string {
	return [
		recipe.benchName,
		recipe.craftingTier === null ? null : `Tier ${recipe.craftingTier}`,
		recipeDurationLabel(recipe),
	]
		.filter((part): part is string => typeof part === "string" && part.length > 0)
		.join(" / ");
}

function VariantList({
	variants,
}: {
	variants: RiseopediaAssetVariant[];
}): JSX.Element {
	return (
		<ul className="riseopedia-bottom-list">
			{variants.map((variant) => (
				<li className="riseopedia-bottom-list__item" key={variant.assetVariantId}>
					<Link
						className="riseopedia-bottom-list__title"
						href={`/riseopedia/assets/${variant.variantSlug}`}
					>
						{variant.variantName}
					</Link>
					<p className="riseopedia-bottom-list__meta">
						{variant.variantLabel ?? variant.variantRoleCode}
						{variant.variantRarityCode ? ` / ${variant.variantRarityCode}` : null}
						{variant.isCurrentAsset ? " / current" : null}
					</p>
				</li>
			))}
		</ul>
	);
}

function RecipeRefList({
	recipes,
}: {
	recipes: RiseopediaAssetRecipeRef[];
}): JSX.Element {
	return (
		<ul className="riseopedia-bottom-list riseopedia-bottom-list--recipes">
			{recipes.map((recipe) => (
				<li className="riseopedia-bottom-list__item" key={recipe.recipeId}>
					<Link
						className="public-collection-card riseopedia-bottom-recipe-card"
						href={`/riseopedia/recipes/${recipe.recipeSlug}`}
					>
						<span className="public-collection-card__body">
							<span className="public-collection-card__title">
								{recipe.recipeName}
							</span>
							{recipeMeta(recipe) ? (
								<span className="public-collection-card__meta">
									{recipeMeta(recipe)}
								</span>
							) : null}
						</span>
						<ArrowRight className="public-collection-card__arrow" aria-hidden />
					</Link>
				</li>
			))}
		</ul>
	);
}

function groupLabel(group: RiseopediaDisplayBlock["blockGroupCode"]): string {
	if (group === "dependencies") {
		return "Dependencies";
	}

	if (group === "changelog") {
		return "Changelog";
	}

	return "Relationships";
}

function blockGroupSortValue(
	group: RiseopediaDisplayBlock["blockGroupCode"],
): number {
	if (group === "relationships") {
		return 1;
	}

	if (group === "dependencies") {
		return 2;
	}

	return 3;
}

function buildBlocks({
	display,
	variants,
	usedInRecipes,
	craftedByRecipes,
}: RiseopediaBottomBlocksProps): RiseopediaBottomBlock[] {
	const selectedBlocks = [
		...display.relationshipBlocks,
		...display.dependencyBlocks,
		...display.changeLogBlocks,
	].filter((block) => block.visible);
	const blocks: RiseopediaBottomBlock[] = [];
	const variantBlock = selectedBlock(selectedBlocks, VARIANT_BLOCK_CODES);
	const usedInRecipeBlock = selectedBlock(
		selectedBlocks,
		USED_IN_RECIPE_BLOCK_CODES,
	);
	const craftedByRecipeBlock = selectedBlock(
		selectedBlocks,
		CRAFTED_BY_RECIPE_BLOCK_CODES,
	);

	if (variantBlock && variants && variants.length > 0) {
		blocks.push({
			key: "variants",
			group: variantBlock.blockGroupCode,
			title: variantBlock.blockLabel,
			body: <VariantList variants={variants} />,
		});
	}

	if (usedInRecipeBlock && usedInRecipes && usedInRecipes.length > 0) {
		blocks.push({
			key: "used-in-recipes",
			group: usedInRecipeBlock.blockGroupCode,
			title: usedInRecipeBlock.blockLabel,
			body: <RecipeRefList recipes={usedInRecipes} />,
		});
	}

	if (craftedByRecipeBlock && craftedByRecipes && craftedByRecipes.length > 0) {
		blocks.push({
			key: "crafted-by-recipes",
			group: craftedByRecipeBlock.blockGroupCode,
			title: craftedByRecipeBlock.blockLabel,
			body: <RecipeRefList recipes={craftedByRecipes} />,
		});
	}

	return blocks.sort((left, right) => {
		const groupCompare =
			blockGroupSortValue(left.group) - blockGroupSortValue(right.group);
		return groupCompare !== 0
			? groupCompare
			: left.title.localeCompare(right.title);
	});
}

export default function RiseopediaBottomBlocks(
	props: RiseopediaBottomBlocksProps,
): JSX.Element | null {
	const blocks = buildBlocks(props);

	if (blocks.length === 0) {
		return null;
	}

	return (
		<section
			className="riseopedia-bottom-blocks"
			aria-label="Riseopedia relationship blocks"
		>
			{blocks.map((block) => (
				<article className="riseopedia-bottom-block" key={block.key}>
					<div className="riseopedia-bottom-block__header">
						<p className="riseopedia-bottom-block__eyebrow">
							{groupLabel(block.group)}
						</p>
						<h2 className="riseopedia-section-title">{block.title}</h2>
					</div>
					{block.body}
				</article>
			))}
		</section>
	);
}
