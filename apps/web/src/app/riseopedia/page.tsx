//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/page.tsx                                                              ////
//// Language: TSX                                                                                            ////
//// Public Riseopedia hub route backed by existing web_view list helpers.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";

import RiseopediaHub from "@/components/riseopedia/RiseopediaHub";
import {
	listRiseopediaAssetClasses,
	listRiseopediaAssetClassMediaSamples,
} from "@/lib/data/riseopedia-asset-classes";
import { listRiseopediaAssets } from "@/lib/data/riseopedia-assets";
import { listRiseopediaRecipes } from "@/lib/data/riseopedia-recipes";
import {
	listRiseopediaSections,
	listRiseopediaSectionMediaSamples,
} from "@/lib/data/riseopedia-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia | Corn Mafia",
};

const HUB_PREVIEW_PAGE_SIZE = 8;

export default async function RiseopediaPage(): Promise<JSX.Element> {
	const [
		sections,
		assetClasses,
		sectionMediaSamples,
		assetClassMediaSamples,
		assets,
		recipes,
	] = await Promise.all([
		listRiseopediaSections(),
		listRiseopediaAssetClasses(),
		listRiseopediaSectionMediaSamples(),
		listRiseopediaAssetClassMediaSamples(),
		listRiseopediaAssets({
			search: null,
			section: null,
			assetClassCode: null,
			categorySlug: null,
			subcategorySlug: null,
			brandCode: null,
			page: 1,
			pageSize: HUB_PREVIEW_PAGE_SIZE,
		}),
		listRiseopediaRecipes({
			search: null,
			section: null,
			benchCode: null,
			page: 1,
			pageSize: HUB_PREVIEW_PAGE_SIZE,
		}),
	]);

	return (
		<RiseopediaHub
			assets={assets}
			recipes={recipes}
			sections={sections}
			assetClasses={assetClasses}
			sectionMediaSamples={sectionMediaSamples}
			assetClassMediaSamples={assetClassMediaSamples}
		/>
	);
}
