//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/recipes/[slug]/page.tsx                                                 ////
//// Language: TSX                                                                                            ////
//// Canonical public Riseopedia recipe detail route using the shared fixed detail renderer and recipe tree.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import { notFound } from "next/navigation";

import RiseopediaBodyContent from "@/components/riseopedia/RiseopediaBodyContent";
import RiseopediaBottomBlocks from "@/components/riseopedia/RiseopediaBottomBlocks";
import RiseopediaDetailLayout from "@/components/riseopedia/RiseopediaDetailLayout";
import RiseopediaMediaFrame from "@/components/riseopedia/RiseopediaMediaFrame";
import RiseopediaOverviewTable, {
	type RiseopediaOverviewRow,
} from "@/components/riseopedia/RiseopediaOverviewTable";
import RiseopediaRecipeTree from "@/components/riseopedia/RiseopediaRecipeTree";
import { findRiseopediaRecipeDetailBySlug } from "@/lib/data/riseopedia-detail";
import type { RiseopediaDisplayProperty } from "@/lib/data/riseopedia-display";
import type { RiseopediaMediaRef } from "@/lib/data/riseopedia-assets";
import type { RiseopediaRecipeAssetRef } from "@/lib/data/riseopedia-recipes";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

function formatNumber(value: number | null): string | null {
	if (value === null || !Number.isFinite(value)) {
		return null;
	}

	return new Intl.NumberFormat("en-US").format(value);
}

function formatSeconds(value: number | null): string | null {
	if (value === null || !Number.isFinite(value)) {
		return null;
	}

	if (value < 60) {
		return `${value}s`;
	}

	const minutes = Math.floor(value / 60);
	const seconds = value % 60;
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function displayValue(row: RiseopediaDisplayProperty): string {
	return row.unitCode ? `${row.displayValue} ${row.unitCode}` : row.displayValue;
}

function displayOverviewRows(
	rows: RiseopediaDisplayProperty[],
): RiseopediaOverviewRow[] {
	return rows.map((row) => ({
		key: `display-${row.displayProfilePropertyId}`,
		label: row.displayLabel,
		value: displayValue(row),
	}));
}

function primaryOutput(
	rows: RiseopediaRecipeAssetRef[],
): RiseopediaRecipeAssetRef | null {
	return rows.find((row) => row.primary === true) ?? rows[0] ?? null;
}

function recipeMedia(
	rows: RiseopediaRecipeAssetRef[],
): RiseopediaMediaRef | null {
	return primaryOutput(rows)?.iconMedia ?? null;
}

function outputSummary(rows: RiseopediaRecipeAssetRef[]): string | null {
	if (rows.length === 0) {
		return null;
	}

	if (rows.length === 1) {
		return `Crafts ${rows[0].assetName}.`;
	}

	return `Crafts ${rows.length} outputs.`;
}

export default async function RiseopediaRecipeDetailPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const detail = await findRiseopediaRecipeDetailBySlug(resolvedParams.slug);

	if (!detail) {
		notFound();
	}

	const overviewRows: RiseopediaOverviewRow[] = [
		{ key: "bench", label: "Crafting station", value: detail.doc.benchName },
		{
			key: "tier",
			label: "Crafting tier",
			value:
				detail.doc.craftingTier === null ? null : `Tier ${detail.doc.craftingTier}`,
		},
		{
			key: "duration",
			label: "Crafting time",
			value: formatSeconds(detail.doc.durationSeconds),
		},
		{ key: "xp", label: "XP", value: formatNumber(detail.doc.xpValue) },
		{
			key: "required-perk",
			label: "Required perk",
			value: detail.doc.requiredPerkSourceKey,
		},
		{ key: "patch", label: "Last patch", value: detail.doc.lastSeenPatchCode },
		{ key: "status", label: "Status", value: detail.doc.statusCode },
		...displayOverviewRows(detail.display.overviewRows),
	];

	return (
		<RiseopediaDetailLayout
			eyebrow="Riseopedia / Recipe"
			title={detail.doc.name}
			summary={outputSummary(detail.outputs)}
			sections={detail.sections}
			overview={
				<>
					<RiseopediaMediaFrame
						media={recipeMedia(detail.outputs)}
						alt={primaryOutput(detail.outputs)?.assetName ?? detail.doc.name}
						placeholderLabel="No recipe media"
					/>
					<RiseopediaOverviewTable rows={overviewRows} />
				</>
			}
			body={
				<>
					<RiseopediaRecipeTree
						components={detail.components}
						outputs={detail.outputs}
						componentCraftingRecipes={detail.componentCraftingRecipes}
					/>
					<RiseopediaBodyContent display={detail.display} />
				</>
			}
			bottom={<RiseopediaBottomBlocks display={detail.display} />}
		/>
	);
}
