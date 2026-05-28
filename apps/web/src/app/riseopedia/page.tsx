//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/page.tsx                                                              ////
//// Language: TSX                                                                                            ////
//// Public Riseopedia hub route backed by lightweight DB-first hub data surfaces.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";

import RiseopediaHub from "@/components/riseopedia/RiseopediaHub";
import { getRiseopediaHubData } from "@/lib/data/riseopedia-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia | Corn Mafia",
};

export default async function RiseopediaPage(): Promise<JSX.Element> {
	const hubData = await getRiseopediaHubData();

	return (
		<RiseopediaHub
			assets={hubData.assets}
			recipes={hubData.recipes}
			sections={hubData.sections}
			assetClasses={hubData.assetClasses}
			sectionMediaSamples={hubData.sectionMediaSamples}
			assetClassMediaSamples={hubData.assetClassMediaSamples}
		/>
	);
}
