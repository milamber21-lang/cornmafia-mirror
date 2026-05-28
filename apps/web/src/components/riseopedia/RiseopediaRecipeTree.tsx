//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaRecipeTree.tsx                                        ////
//// Language: TSX                                                                                            ////
//// Compact recipe tree renderer for public Riseopedia inputs, outputs, quantities, and recipe links.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import RiseopediaEmptyState from "@/components/riseopedia/RiseopediaEmptyState";
import type { RiseopediaRecipeComponentCraftingRecipes } from "@/lib/data/riseopedia-detail";
import type { RiseopediaAssetRecipeRef } from "@/lib/data/riseopedia-assets";
import type { RiseopediaRecipeAssetRef } from "@/lib/data/riseopedia-recipes";

export type RiseopediaRecipeTreeProps = {
	components: RiseopediaRecipeAssetRef[];
	outputs: RiseopediaRecipeAssetRef[];
	componentCraftingRecipes: RiseopediaRecipeComponentCraftingRecipes[];
};

type RiseopediaRecipeTreeGroupKind = "inputs" | "outputs";

function formatQuantity(row: RiseopediaRecipeAssetRef): string | null {
	if (row.quantityText) {
		return row.quantityText;
	}

	if (row.quantityValue === null) {
		return null;
	}

	return row.unitCode
		? `${row.quantityValue} ${row.unitCode}`
		: String(row.quantityValue);
}

function buildCraftingRecipeMap(
	rows: RiseopediaRecipeComponentCraftingRecipes[],
): Map<string, RiseopediaAssetRecipeRef[]> {
	const byAssetId = new Map<string, RiseopediaAssetRecipeRef[]>();

	for (const row of rows) {
		byAssetId.set(row.assetId, row.recipes);
	}

	return byAssetId;
}

function RiseopediaRecipeAssetIcon({
	row,
}: {
	row: RiseopediaRecipeAssetRef;
}): JSX.Element {
	if (row.iconMedia) {
		return (
			<img
				className="riseopedia-recipe-tree__icon-image"
				src={row.iconMedia.url}
				alt=""
				width={row.iconMedia.width ?? undefined}
				height={row.iconMedia.height ?? undefined}
				loading="lazy"
			/>
		);
	}

	return (
		<span className="riseopedia-recipe-tree__icon-placeholder" aria-hidden />
	);
}

function RiseopediaRecipeAssetName({
	row,
}: {
	row: RiseopediaRecipeAssetRef;
}): JSX.Element {
	if (row.isPlaceholder) {
		return (
			<span className="riseopedia-recipe-tree__asset-name">
				{row.assetName || row.sourceRefValue}
			</span>
		);
	}

	return (
		<Link
			className="riseopedia-recipe-tree__asset-link"
			href={`/riseopedia/assets/${row.assetSlug}`}
		>
			{row.assetName}
		</Link>
	);
}

function RiseopediaCraftingRecipeActions({
	recipes,
}: {
	recipes: RiseopediaAssetRecipeRef[];
}): JSX.Element | null {
	if (recipes.length === 0) {
		return null;
	}

	return (
		<div className="riseopedia-recipe-tree__recipe-actions">
			{recipes.map((recipe) => (
				<Link
					className="ui-btn ui-button ui-button--xs ui-button--ghost riseopedia-recipe-tree__recipe-action"
					href={`/riseopedia/recipes/${recipe.recipeSlug}`}
					key={recipe.recipeId}
				>
					<span>{recipe.recipeName}</span>
					<span className="ui-button__icon ui-button__icon--right">
						<ArrowRight aria-hidden />
					</span>
				</Link>
			))}
		</div>
	);
}

function RiseopediaRecipeTreeRow({
	row,
	craftingRecipes,
}: {
	row: RiseopediaRecipeAssetRef;
	craftingRecipes: RiseopediaAssetRecipeRef[];
}): JSX.Element {
	const quantity = formatQuantity(row);

	return (
		<li className="riseopedia-recipe-tree__row">
			<div className="riseopedia-recipe-tree__asset">
				<span className="riseopedia-recipe-tree__icon" aria-hidden>
					<RiseopediaRecipeAssetIcon row={row} />
				</span>

				<span className="riseopedia-recipe-tree__asset-copy">
					<span className="riseopedia-recipe-tree__asset-title-line">
						<RiseopediaRecipeAssetName row={row} />
					</span>
					<span className="riseopedia-recipe-tree__asset-meta">
						{row.assetClassName}
						{row.isPlaceholder ? " / unresolved placeholder" : null}
					</span>
				</span>
			</div>

			<RiseopediaCraftingRecipeActions recipes={craftingRecipes} />

			{row.isPlaceholder ? (
				<span className="riseopedia-recipe-tree__badge">Placeholder</span>
			) : null}

			{quantity ? (
				<span className="riseopedia-recipe-tree__quantity">{quantity}</span>
			) : null}
		</li>
	);
}

function RiseopediaRecipeTreeGroup({
	title,
	kind,
	rows,
	craftingByAssetId,
	emptyTitle,
	emptyMessage,
}: {
	title: string;
	kind: RiseopediaRecipeTreeGroupKind;
	rows: RiseopediaRecipeAssetRef[];
	craftingByAssetId: Map<string, RiseopediaAssetRecipeRef[]>;
	emptyTitle: string;
	emptyMessage: string;
}): JSX.Element {
	return (
		<section
			className={`riseopedia-recipe-tree__group riseopedia-recipe-tree__group--${kind}`}
		>
			<h3 className="riseopedia-recipe-tree__group-title">{title}</h3>
			{rows.length > 0 ? (
				<ul className="riseopedia-recipe-tree__list">
					{rows.map((row) => (
						<RiseopediaRecipeTreeRow
							key={`${row.assetId}-${row.sourceRefValue}-${row.primary ? "primary" : "secondary"}`}
							row={row}
							craftingRecipes={craftingByAssetId.get(row.assetId) ?? []}
						/>
					))}
				</ul>
			) : (
				<RiseopediaEmptyState title={emptyTitle} message={emptyMessage} />
			)}
		</section>
	);
}

export default function RiseopediaRecipeTree({
	components,
	outputs,
	componentCraftingRecipes,
}: RiseopediaRecipeTreeProps): JSX.Element {
	const craftingByAssetId = buildCraftingRecipeMap(componentCraftingRecipes);

	return (
		<section
			className="riseopedia-recipe-tree"
			aria-labelledby="riseopedia-recipe-tree-heading"
		>
			<div className="riseopedia-recipe-tree__header">
				<h2
					className="riseopedia-section-title"
					id="riseopedia-recipe-tree-heading"
				>
					Recipe Tree
				</h2>
			</div>

			<div className="riseopedia-recipe-tree__grid">
				<RiseopediaRecipeTreeGroup
					title="Inputs"
					kind="inputs"
					rows={components}
					craftingByAssetId={craftingByAssetId}
					emptyTitle="No inputs listed."
					emptyMessage="This recipe has no resolved input rows in the current Riseopedia contract."
				/>

				<RiseopediaRecipeTreeGroup
					title="Outputs"
					kind="outputs"
					rows={outputs}
					craftingByAssetId={new Map<string, RiseopediaAssetRecipeRef[]>()}
					emptyTitle="No outputs listed."
					emptyMessage="This recipe has no resolved output rows in the current Riseopedia contract."
				/>
			</div>
		</section>
	);
}
