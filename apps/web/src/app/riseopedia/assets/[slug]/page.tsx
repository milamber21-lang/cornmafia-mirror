//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/assets/[slug]/page.tsx                                                  ////
//// Language: TSX                                                                                            ////
//// Canonical public Riseopedia asset detail route using the shared fixed detail renderer.                    ////
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
import { findRiseopediaAssetDetailBySlug } from "@/lib/data/riseopedia-detail";
import type { RiseopediaDisplayProperty } from "@/lib/data/riseopedia-display";

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

export default async function RiseopediaAssetDetailPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const detail = await findRiseopediaAssetDetailBySlug(resolvedParams.slug);

	if (!detail) {
		notFound();
	}

	const media = detail.doc.detailMedia ?? detail.doc.iconMedia;
	const overviewRows: RiseopediaOverviewRow[] = [
		{ key: "asset-class", label: "Class", value: detail.doc.assetClassName },
		{ key: "category", label: "Category", value: detail.doc.categoryName },
		{
			key: "subcategory",
			label: "Subcategory",
			value: detail.doc.subcategoryName,
		},
		{ key: "brand", label: "Brand", value: detail.doc.primaryBrandName },
		{ key: "rarity", label: "Rarity", value: detail.doc.rarityCode },
		{
			key: "stack-size",
			label: "Stack size",
			value: formatNumber(detail.doc.stackSize),
		},
		{
			key: "slot-size",
			label: "Slot size",
			value:
				detail.doc.slotWidth && detail.doc.slotHeight
					? `${detail.doc.slotWidth} x ${detail.doc.slotHeight}`
					: null,
		},
		{ key: "value", label: "Value", value: formatNumber(detail.doc.valueAmount) },
		{ key: "patch", label: "Last patch", value: detail.doc.lastSeenPatchCode },
		{ key: "status", label: "Status", value: detail.doc.assetStatusCode },
		...displayOverviewRows(detail.display.overviewRows),
	];

	return (
		<RiseopediaDetailLayout
			eyebrow="Riseopedia / Asset"
			title={detail.doc.name}
			summary={detail.doc.summary}
			sections={detail.sections}
			overview={
				<>
					<RiseopediaMediaFrame
						media={media}
						alt={detail.doc.name}
						placeholderLabel="No asset media"
					/>
					<RiseopediaOverviewTable rows={overviewRows} />
				</>
			}
			body={
				<RiseopediaBodyContent
					display={detail.display}
					fallbackDescription={detail.doc.description}
				/>
			}
			bottom={
				<RiseopediaBottomBlocks
					display={detail.display}
					variants={detail.variants}
					usedInRecipes={detail.usedInRecipes}
					craftedByRecipes={detail.craftedByRecipes}
				/>
			}
		/>
	);
}
