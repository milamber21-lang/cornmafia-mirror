//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityRecipeTree.tsx                                  ////
//// Language: TSX                                                                                            ////
//// Entity-first recipe requirements and outputs renderer for public Riseopedia recipe detail pages.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";

import RiseopediaEmptyState from "@/components/riseopedia/RiseopediaEmptyState";
import type {
	RiseopediaEntityMediaRef,
	RiseopediaRecipeOutput,
	RiseopediaRecipeRequirement,
} from "@/lib/data/riseopedia-entity-detail";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityRecipeTreeProps = {
	requirements: RiseopediaRecipeRequirement[];
	outputs: RiseopediaRecipeOutput[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
};

type RecipeTreeRow = {
	id: string;
	name: string;
	className: string | null;
	quantityValue: number | null;
	quantityText: string | null;
	unitCode: string | null;
	resolutionStatusCode: string;
	placeholder: boolean;
	href: string | null;
	iconMediaFileId: string | null;
	badge: string | null;
	craftedByRecipeHref: string | null;
	craftedByRecipeName: string | null;
};

type RiseopediaRecipeTreeGroupKind = "inputs" | "outputs";

function formatQuantity(row: RecipeTreeRow): string | null {
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

	return row.requirementKindCode
		.replaceAll("_", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapRequirement(
	row: RiseopediaRecipeRequirement,
	wikiCode: OpediaWikiCode | undefined,
): RecipeTreeRow {
	return {
		id: `requirement-${row.requirementKindCode}-${row.sourceRowId}`,
		name: requirementName(row),
		className: row.genericGroupName ?? null,
		quantityValue: row.quantityValue,
		quantityText: row.quantityText,
		unitCode: row.unitCode,
		resolutionStatusCode: row.resolutionStatusCode,
		placeholder: row.targetEntityId === null,
		href: buildRiseopediaEntityHref({
			entityTypeCode: row.targetEntityTypeCode,
			entitySlug: row.targetEntitySlug,
			wikiCode,
		}),
		iconMediaFileId: row.targetIconMediaFileId,
		badge: requirementBadge(row),
		craftedByRecipeHref: buildRiseopediaEntityHref({
			entityTypeCode: row.targetCraftedByRecipeEntityId ? "recipe" : null,
			entitySlug: row.targetCraftedByRecipeSlug,
			wikiCode,
		}),
		craftedByRecipeName: row.targetCraftedByRecipeName,
	};
}

function mapOutput(
	row: RiseopediaRecipeOutput,
	wikiCode: OpediaWikiCode | undefined,
): RecipeTreeRow {
	return {
		id: `output-${row.recipeOutputId}`,
		name: row.targetEntityName,
		className: row.targetEntityClassName,
		quantityValue: row.quantityValue,
		quantityText: row.quantityText,
		unitCode: row.unitCode,
		resolutionStatusCode: row.resolutionStatusCode,
		placeholder: row.targetEntityId === null,
		href: buildRiseopediaEntityHref({
			entityTypeCode: row.targetEntityTypeCode,
			entitySlug: row.targetEntitySlug,
			wikiCode,
		}),
		iconMediaFileId: row.targetIconMediaFileId,
		badge: row.primaryOutput ? "Primary" : null,
		craftedByRecipeHref: null,
		craftedByRecipeName: null,
	};
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
		? mediaByFileId.get(row.iconMediaFileId) ?? null
		: null;

	const href = media?.url ?? buildRiseopediaMediaHref(row.iconMediaFileId, wikiCode);

	if (!href) {
		return (
			<span className="riseopedia-recipe-tree__icon-placeholder" aria-hidden />
		);
	}

	return (
		<img
			className="riseopedia-recipe-tree__icon-image"
			src={href}
			alt=""
			width={media?.width ?? undefined}
			height={media?.height ?? undefined}
			loading="lazy"
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

				<span className="riseopedia-recipe-tree__asset-copy">
					<span className="riseopedia-recipe-tree__asset-title-line">
						<RiseopediaRecipeEntityName row={row} />
					</span>
					{row.craftedByRecipeHref && row.craftedByRecipeName ? (
						<span className="riseopedia-recipe-tree__asset-meta">
							<Link
								className="riseopedia-recipe-tree__crafted-by-link"
								href={row.craftedByRecipeHref}
							>
								Crafted by {row.craftedByRecipeName}
							</Link>
						</span>
					) : null}
				</span>
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
	title,
	kind,
	rows,
	mediaByFileId,
	wikiCode,
	emptyTitle,
	emptyMessage,
}: {
	title: string;
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
		>
			<h3 className="riseopedia-recipe-tree__group-title">{title}</h3>
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

export default function RiseopediaEntityRecipeTree({
	requirements,
	outputs,
	mediaByFileId,
	wikiCode,
}: RiseopediaEntityRecipeTreeProps): JSX.Element | null {
	const visibleRequirements = requirements.filter(
		(row) => row.requirementKindCode !== "bench",
	);

	if (visibleRequirements.length === 0 && outputs.length === 0) {
		return null;
	}

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
					rows={visibleRequirements.map((row) => mapRequirement(row, wikiCode))}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					emptyTitle="No inputs listed."
					emptyMessage="This recipe has no resolved input rows in the current Riseopedia contract."
				/>

				<RiseopediaRecipeTreeGroup
					title="Outputs"
					kind="outputs"
					rows={outputs.map((row) => mapOutput(row, wikiCode))}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					emptyTitle="No outputs listed."
					emptyMessage="This recipe has no resolved output rows in the current Riseopedia contract."
				/>
			</div>
		</section>
	);
}
