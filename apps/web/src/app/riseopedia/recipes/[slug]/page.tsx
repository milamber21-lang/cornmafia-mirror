//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/recipes/[slug]/page.tsx                                                 ////
//// Language: TSX                                                                                            ////
//// Canonical public Riseopedia recipe detail route with profile-driven fields and recipe tree body block.    ////
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

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

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

export default async function RiseopediaRecipeDetailPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const detail = await findRiseopediaRecipeDetailBySlug(resolvedParams.slug);

	if (!detail) {
		notFound();
	}

	const overviewRows = displayOverviewRows(detail.display.overviewRows);

	return (
		<RiseopediaDetailLayout
			breadcrumb={[
				{ label: "Riseopedia", href: "/riseopedia" },
				{ label: "Recipes", href: "/riseopedia/recipes" },
				{ label: detail.doc.name },
			]}
			title={detail.doc.name}
			summary={null}
			sections={detail.sections}
			media={
				<RiseopediaMediaFrame
					media={detail.doc.primaryMedia}
					alt={detail.doc.primaryMediaOutputAssetName ?? detail.doc.name}
					placeholderLabel="No recipe media"
				/>
			}
			overview={<RiseopediaOverviewTable rows={overviewRows} />}
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
