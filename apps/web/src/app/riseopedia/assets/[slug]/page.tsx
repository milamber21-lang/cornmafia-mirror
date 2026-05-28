//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/assets/[slug]/page.tsx                                                  ////
//// Language: TSX                                                                                            ////
//// Canonical public Riseopedia asset detail route using profile-driven fields and header media.              ////
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
	const overviewRows = displayOverviewRows(detail.display.overviewRows);

	return (
		<RiseopediaDetailLayout
			breadcrumb={[
				{ label: "Riseopedia", href: "/riseopedia" },
				{ label: "Assets", href: "/riseopedia/assets" },
				{ label: detail.doc.name },
			]}
			title={detail.doc.name}
			summary={null}
			brandName={detail.doc.primaryBrandName}
			sections={detail.sections}
			media={
				<RiseopediaMediaFrame
					media={media}
					alt={detail.doc.name}
					placeholderLabel="No asset media"
				/>
			}
			overview={<RiseopediaOverviewTable rows={overviewRows} />}
			body={<RiseopediaBodyContent display={detail.display} />}
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
