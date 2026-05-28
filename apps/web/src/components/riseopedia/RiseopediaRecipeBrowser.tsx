//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaRecipeBrowser.tsx                                      ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia broad recipe overview page using existing public card and UI primitive styling.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, ChefHat } from "lucide-react";

import RiseopediaFilterBar, {
	type RiseopediaFilterOption,
} from "@/components/riseopedia/RiseopediaFilterBar";
import RiseopediaPager from "@/components/riseopedia/RiseopediaPager";
import { ButtonLink, StatusPill } from "@/components/ui";
import type {
	RiseopediaRecipeDoc,
	RiseopediaRecipeListResult,
} from "@/lib/data/riseopedia-recipes";
import type { RiseopediaSectionDoc } from "@/lib/data/riseopedia-sections";

export type RiseopediaRecipeBrowserFilters = {
	search: string | null;
	section: string | null;
};

export type RiseopediaRecipeBrowserProps = {
	result: RiseopediaRecipeListResult;
	filters: RiseopediaRecipeBrowserFilters;
	sections: RiseopediaSectionDoc[];
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(seconds: number | null): string | null {
	if (seconds === null || seconds <= 0) {
		return null;
	}

	if (seconds < 60) {
		return `${seconds}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function sectionOptions(sections: RiseopediaSectionDoc[]): RiseopediaFilterOption[] {
	return sections
		.filter((section) => section.publicVisible || section.showWhenEmpty)
		.map((section) => ({
			value: section.slug,
			label: section.name,
			count: section.itemCount,
		}));
}

function recipeMetaParts(recipe: RiseopediaRecipeDoc): string[] {
	const duration = formatDuration(recipe.durationSeconds);
	const tier = recipe.craftingTier === null ? null : `Tier ${recipe.craftingTier}`;
	const xp = recipe.xpValue === null ? null : `${formatNumber(recipe.xpValue)} XP`;

	return [recipe.benchName, tier, duration, xp].filter(
		(value): value is string => typeof value === "string" && value.trim().length > 0,
	);
}

function RiseopediaRecipeCard({ recipe }: { recipe: RiseopediaRecipeDoc }): JSX.Element {
	const metaParts = recipeMetaParts(recipe);
	const media = recipe.outputIconMedia;
	const summary = recipe.outputAssetName
		? `Crafts ${recipe.outputAssetName}`
		: recipe.requiredPerkSourceKey
			? `Requires ${recipe.requiredPerkSourceKey}`
			: "Open the recipe detail page for components, outputs, and profile-driven metadata.";

	return (
		<Link
			className="public-collection-card riseopedia-result-card"
			href={`/riseopedia/recipes/${recipe.slug}`}
		>
			<span className="public-collection-card__icon riseopedia-result-card__icon" aria-hidden>
				{media ? (
					<img
						className="riseopedia-result-card__image"
						src={media.url}
						alt=""
						width={media.width ?? undefined}
						height={media.height ?? undefined}
						loading="lazy"
					/>
				) : (
					<ChefHat className="riseopedia-result-card__fallback-icon" />
				)}
			</span>

			<span className="public-collection-card__body">
				<span className="public-collection-card__meta">
					<span className="public-collection-card__meta-item">
						{metaParts.length > 0 ? metaParts.join(" / ") : "Recipe"}
					</span>
				</span>
				<span className="public-collection-card__title">{recipe.name}</span>
				<span className="public-collection-card__summary">{summary}</span>
			</span>

			<ArrowRight className="public-collection-card__arrow" aria-hidden />
		</Link>
	);
}

export default function RiseopediaRecipeBrowser({
	result,
	filters,
	sections,
}: RiseopediaRecipeBrowserProps): JSX.Element {
	const hasActiveFilters = Boolean(filters.search || filters.section);

	return (
		<section className="public-collection-shell">
			<div className="card public-collection-page riseopedia-page">
				<section className="public-collection-hero riseopedia-browser-hero">
					<div className="public-collection-hero__main">
						<div className="public-collection-hero__icon">
							<ChefHat className="public-collection-hero__icon-glyph" aria-hidden />
						</div>
						<div>
							<nav className="riseopedia-breadcrumb" aria-label="Riseopedia breadcrumb">
								<Link href="/riseopedia">Riseopedia</Link>
								<span>Recipes</span>
							</nav>
							<div className="public-collection-hero__eyebrow">Crafting index</div>
							<h1 className="public-collection-hero__title">Recipes</h1>
						</div>
					</div>

					<div className="public-collection-hero__actions">
						<StatusPill tone="default" size="md">
							{formatNumber(result.totalDocs)} matching recipes
						</StatusPill>
						<ButtonLink href="/riseopedia/assets" variant="neutral">
							Browse assets
						</ButtonLink>
					</div>
				</section>

				<section className="public-collection-panel">
					<RiseopediaFilterBar
						action="/riseopedia/recipes"
						search={filters.search}
						section={filters.section}
						sectionOptions={sectionOptions(sections)}
						pageSize={result.pageSize}
					/>

					{result.rows.length > 0 ? (
						<>
							<div className="public-collection-grid riseopedia-result-grid">
								{result.rows.map((recipe) => (
									<RiseopediaRecipeCard recipe={recipe} key={recipe.id} />
								))}
							</div>

							<RiseopediaPager
								basePath="/riseopedia/recipes"
								params={[
									{ name: "q", value: filters.search },
									{ name: "section", value: filters.section },
								]}
								page={result.page}
								pageSize={result.pageSize}
								totalDocs={result.totalDocs}
								totalPages={result.totalPages}
							/>
						</>
					) : (
						<div className="public-empty-state">
							<h2 className="public-empty-state__title">
								{hasActiveFilters ? "No matching recipes found." : "No public recipes found."}
							</h2>
							<p className="public-empty-state__message">
								{hasActiveFilters
									? "Try a broader search or clear the filters."
									: "Recipes will appear here when the Riseopedia public recipe view has visible rows."}
							</p>
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
