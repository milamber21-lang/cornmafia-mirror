//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaEntityRecipeTree.tsx                                  ////
//// Language: TSX                                                                                            ////
//// Renders recipe inputs, DB-configured process rows, and outputs without catalyst-dependent layout changes.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import IconRender from "@/components/ui/IconRender";
import type { JSX } from "react";
import Link from "next/link";

import RiseopediaEmptyState from "@/components/riseopedia/ui/RiseopediaEmptyState";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import type {
	RiseopediaDetailElement,
	RiseopediaEntityMediaRef,
	RiseopediaRecipeOutput,
	RiseopediaRecipeRequirement,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";
import {
	formatRiseopediaNumber,
	formatRiseopediaNumericText,
} from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaEntityRecipeTreeProps = {
	requirements: RiseopediaRecipeRequirement[];
	outputs: RiseopediaRecipeOutput[];
	recipeStageElements?: RiseopediaDetailElement[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	showHeading?: boolean;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type CraftedByRecipeTreeRow = {
	id: string;
	href: string | null;
	name: string;
};

type RecipeTreeRow = {
	id: string;
	name: string;
	quantityValue: number | null;
	quantityText: string | null;
	unitCode: string | null;
	href: string | null;
	iconMediaFileId: string | null;
	badge: string | null;
	craftedByRecipes: CraftedByRecipeTreeRow[];
};

type RiseopediaRecipeTreeGroupKind = "inputs" | "outputs";

type RecipeStageRow = {
	id: string;
	label: string;
	value: string;
	sortOrder: number;
	href: string | null;
	iconMediaFileId: string | null;
};

function formatQuantity(row: RecipeTreeRow): string | null {
	if (row.quantityText) {
		return formatRiseopediaNumericText(row.quantityText);
	}

	if (row.quantityValue === null) {
		return null;
	}

	const quantity = formatRiseopediaNumber(row.quantityValue);
	return row.unitCode ? `${quantity} ${row.unitCode}` : quantity;
}

function requirementName(row: RiseopediaRecipeRequirement): string {
	return (
		row.targetEntityName ??
		row.genericGroupName ??
		row.sourceValueText ??
		"Unresolved requirement"
	);
}

function requirementBadge(row: RiseopediaRecipeRequirement): string | null {
	if (row.requirementKindCode === "component") {
		return null;
	}

	if (row.requirementKindCode === "catalyst") {
		return "Catalyst";
	}

	return row.requirementKindCode
		.replaceAll("_", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapRequirement(
	row: RiseopediaRecipeRequirement,
	wikiCode: OpediaWikiCode | undefined,
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined,
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null,
): RecipeTreeRow {
	return {
		id: `requirement-${row.requirementKindCode}-${row.sourceRowId}`,
		name: requirementName(row),
		quantityValue: row.quantityValue,
		quantityText: row.quantityText,
		unitCode: row.unitCode,
		href: buildRiseopediaEntityHref({
			entityTypeCode: row.targetEntityTypeCode,
			entitySlug: row.targetEntitySlug,
			targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
			wikiCode,
			releaseFilters,
		}),
		iconMediaFileId: row.targetIconMediaFileId,
		badge: requirementBadge(row),
		craftedByRecipes: row.craftedByRecipes.map((craftedByRecipe) => ({
			id: craftedByRecipe.recipeEntityId,
			href: buildRiseopediaEntityHref({
				entityTypeCode: "recipe",
				entitySlug: craftedByRecipe.recipeSlug,
				wikiCode,
				releaseFilters,
			}),
			name: craftedByRecipe.recipeName,
		})),
	};
}

function mapOutput(
	row: RiseopediaRecipeOutput,
	wikiCode: OpediaWikiCode | undefined,
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined,
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null,
): RecipeTreeRow {
	return {
		id: `output-${row.recipeOutputId}`,
		name: row.targetEntityName,
		quantityValue: row.quantityValue,
		quantityText: row.quantityText,
		unitCode: row.unitCode,
		href: buildRiseopediaEntityHref({
			entityTypeCode: row.targetEntityTypeCode,
			entitySlug: row.targetEntitySlug,
			targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
			wikiCode,
			releaseFilters,
		}),
		iconMediaFileId: row.targetIconMediaFileId,
		badge: row.primaryOutput ? "Primary" : null,
		craftedByRecipes: [],
	};
}

function stageRows(args: {
	rows: RiseopediaDetailElement[];
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null;
}): RecipeStageRow[] {
	return args.rows
		.filter((row) => row.displayValue.trim().length > 0)
		.map((row, index) => ({
			id:
				row.displayProfileElementId ??
				`${row.sourceTypeCode}-${row.sourceCode}-${row.sortOrder}-${index}`,
			label: row.displayLabel,
			value: row.displayValue,
			sortOrder: row.sortOrder,
			href: buildRiseopediaEntityHref({
				entityTypeCode: row.linkedEntityTypeCode,
				entitySlug: row.linkedEntitySlug,
				targetEntityVariantKey: args.variantKeyFor(row.linkedEntityVariantId),
				wikiCode: args.wikiCode,
				releaseFilters: args.releaseFilters,
			}),
			iconMediaFileId: row.linkedIconMediaFileId,
		}))
		.sort((left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			const labelCompare = left.label.localeCompare(right.label);
			if (labelCompare !== 0) {
				return labelCompare;
			}

			return left.id.localeCompare(right.id);
		});
}

function RiseopediaRecipeEntityIcon({
	row,
	mediaByFileId,
	wikiCode,
}: {
	row: RecipeTreeRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const media = row.iconMediaFileId
		? (mediaByFileId.get(row.iconMediaFileId) ?? null)
		: null;
	const href =
		media?.url ?? buildRiseopediaMediaHref(row.iconMediaFileId, wikiCode);

	if (!href) {
		return (
			<span className="riseopedia-recipe-tree__icon-placeholder" aria-hidden />
		);
	}

	return (
		<RiseopediaEntityVisual
			className="riseopedia-recipe-tree__visual riseopedia-entity-visual--embedded"
			media={{
				url: href,
				width: media?.width ?? null,
				height: media?.height ?? null,
			}}
			alt=""
			placeholderLabel="Recipe entity"
			size="inline"
			decorative
		/>
	);
}

function RiseopediaRecipeEntityName({
	row,
}: {
	row: RecipeTreeRow;
}): JSX.Element {
	if (!row.href) {
		return <span className="riseopedia-recipe-tree__asset-name">{row.name}</span>;
	}

	return (
		<Link className="riseopedia-recipe-tree__asset-link" href={row.href}>
			{row.name}
		</Link>
	);
}

function RiseopediaRecipeCraftedByList({
	rowId,
	rows,
}: {
	rowId: string;
	rows: CraftedByRecipeTreeRow[];
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	const listId = `riseopedia-recipe-crafted-by-${rowId}`;

	return (
		<details className="riseopedia-recipe-tree__crafted-by">
			<summary
				className="riseopedia-recipe-tree__crafted-by-toggle"
				aria-controls={listId}
			>
				Crafted by ({rows.length})
			</summary>

			<ul className="riseopedia-recipe-tree__crafted-by-list" id={listId}>
				{rows.map((craftedByRecipe) => (
					<li
						className="riseopedia-recipe-tree__crafted-by-item"
						key={craftedByRecipe.id}
					>
						{craftedByRecipe.href ? (
							<Link
								className="riseopedia-recipe-tree__crafted-by-link"
								href={craftedByRecipe.href}
							>
								{craftedByRecipe.name}
							</Link>
						) : (
							<span className="riseopedia-recipe-tree__crafted-by-name">
								{craftedByRecipe.name}
							</span>
						)}
					</li>
				))}
			</ul>
		</details>
	);
}

function RiseopediaRecipeTreeRow({
	row,
	mediaByFileId,
	wikiCode,
}: {
	row: RecipeTreeRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const quantity = formatQuantity(row);

	return (
		<li className="riseopedia-recipe-tree__row">
			<div className="riseopedia-recipe-tree__asset">
				<span className="riseopedia-recipe-tree__icon" aria-hidden>
					<RiseopediaRecipeEntityIcon
						row={row}
						mediaByFileId={mediaByFileId}
						wikiCode={wikiCode}
					/>
				</span>

				<div className="riseopedia-recipe-tree__asset-copy">
					<span className="riseopedia-recipe-tree__asset-title-line">
						<RiseopediaRecipeEntityName row={row} />
					</span>
					<RiseopediaRecipeCraftedByList
						rowId={row.id}
						rows={row.craftedByRecipes}
					/>
				</div>
			</div>

			{row.badge ? (
				<span className="riseopedia-recipe-tree__badge">{row.badge}</span>
			) : null}

			{quantity ? (
				<span className="riseopedia-recipe-tree__quantity">{quantity}</span>
			) : null}
		</li>
	);
}
function RiseopediaRecipeTreeGroup({
	kind,
	rows,
	mediaByFileId,
	wikiCode,
	emptyTitle,
	emptyMessage,
}: {
	kind: RiseopediaRecipeTreeGroupKind;
	rows: RecipeTreeRow[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
	emptyTitle: string;
	emptyMessage: string;
}): JSX.Element {
	return (
		<section
			className={`riseopedia-recipe-tree__group riseopedia-recipe-tree__group--${kind}`}
			aria-label={kind === "inputs" ? "Recipe inputs" : "Recipe outputs"}
		>
			{rows.length > 0 ? (
				<ul className="riseopedia-recipe-tree__list">
					{rows.map((row) => (
						<RiseopediaRecipeTreeRow
							key={row.id}
							row={row}
							mediaByFileId={mediaByFileId}
							wikiCode={wikiCode}
						/>
					))}
				</ul>
			) : (
				<RiseopediaEmptyState title={emptyTitle} message={emptyMessage} />
			)}
		</section>
	);
}

function RiseopediaRecipeProcessIcon({
	row,
	mediaByFileId,
	wikiCode,
}: {
	row: RecipeStageRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const media = row.iconMediaFileId
		? (mediaByFileId.get(row.iconMediaFileId) ?? null)
		: null;
	const href =
		media?.url ?? buildRiseopediaMediaHref(row.iconMediaFileId, wikiCode);

	if (!href) {
		return (
			<IconRender
				className="riseopedia-recipe-tree__process-icon-fallback"
				fallback={{ lucideName: "CircleDot" }}
				iconKey={null}
				size={16}
			/>
		);
	}

	return (
		<IconRender
			className="riseopedia-recipe-tree__process-icon-image"
			iconKey={{
				label: row.label,
				source: "media",
				iconMedia: href,
			}}
			size={32}
			title={row.label}
		/>
	);
}

function RiseopediaRecipeProcessValue({
	row,
}: {
	row: RecipeStageRow;
}): JSX.Element {
	if (!row.href) {
		return (
			<span className="riseopedia-recipe-tree__process-value">{row.value}</span>
		);
	}

	return (
		<Link className="riseopedia-recipe-tree__process-link" href={row.href}>
			{row.value}
		</Link>
	);
}

function RiseopediaRecipeProcess({
	rows,
	mediaByFileId,
	wikiCode,
}: {
	rows: RecipeStageRow[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	return (
		<section
			className="riseopedia-recipe-tree__process"
			aria-label="Recipe process"
		>
			<h3 className="riseopedia-recipe-tree__process-title">Process</h3>
			{rows.length > 0 ? (
				<ul className="riseopedia-recipe-tree__process-list">
					{rows.map((row) => (
						<li className="riseopedia-recipe-tree__process-row" key={row.id}>
							<span className="riseopedia-recipe-tree__process-icon" aria-hidden>
								<RiseopediaRecipeProcessIcon
									row={row}
									mediaByFileId={mediaByFileId}
									wikiCode={wikiCode}
								/>
							</span>
							<span className="riseopedia-recipe-tree__process-copy">
								<span className="riseopedia-recipe-tree__process-label">
									{row.label}
								</span>
								<RiseopediaRecipeProcessValue row={row} />
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="riseopedia-recipe-tree__process-empty">
					No process details are available.
				</p>
			)}
		</section>
	);
}

function RecipeFlowConnector({
	direction,
}: {
	direction: "into" | "out";
}): JSX.Element {
	return (
		<span
			className={`riseopedia-recipe-tree__connector riseopedia-recipe-tree__connector--${direction}`}
			aria-hidden
		>
			<span className="riseopedia-recipe-tree__connector-arrow">→</span>
		</span>
	);
}

export default function RiseopediaEntityRecipeTree({
	requirements,
	outputs,
	recipeStageElements = [],
	mediaByFileId,
	showHeading = true,
	wikiCode,
	releaseFilters,
}: RiseopediaEntityRecipeTreeProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const inputRows = requirements
		.filter((row) => row.requirementKindCode !== "bench")
		.map((row) => mapRequirement(row, wikiCode, releaseFilters, variantKeyFor));
	const outputRows = outputs.map((row) =>
		mapOutput(row, wikiCode, releaseFilters, variantKeyFor),
	);
	const processRows = stageRows({
		rows: recipeStageElements,
		wikiCode,
		releaseFilters,
		variantKeyFor,
	});

	if (inputRows.length === 0 && outputRows.length === 0) {
		return null;
	}

	return (
		<section
			className="riseopedia-recipe-tree"
			aria-labelledby={showHeading ? "riseopedia-recipe-tree-heading" : undefined}
		>
			{showHeading ? (
				<div className="riseopedia-recipe-tree__header">
					<h2
						className="riseopedia-section-title"
						id="riseopedia-recipe-tree-heading"
					>
						Recipe tree
					</h2>
				</div>
			) : null}

			<div className="riseopedia-recipe-tree__grid">
				<RiseopediaRecipeTreeGroup
					kind="inputs"
					rows={inputRows}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					emptyTitle="No inputs listed."
					emptyMessage="This recipe has no resolved input rows in the current Riseopedia contract."
				/>

				<RecipeFlowConnector direction="into" />

				<RiseopediaRecipeProcess
					rows={processRows}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
				/>

				<RecipeFlowConnector direction="out" />

				<RiseopediaRecipeTreeGroup
					kind="outputs"
					rows={outputRows}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					emptyTitle="No outputs listed."
					emptyMessage="This recipe has no resolved output rows in the current Riseopedia contract."
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
