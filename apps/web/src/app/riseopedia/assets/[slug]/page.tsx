//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/assets/[slug]/page.tsx                                                  ////
//// Language: TSX                                                                                            ////
//// Canonical public Riseopedia asset detail route with rarity and variant state selectors.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import { notFound } from "next/navigation";

import RiseopediaAssetDetailClient from "@/components/riseopedia/RiseopediaAssetDetailClient";
import { findRiseopediaAssetDetailBySlug } from "@/lib/data/riseopedia-detail";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function RiseopediaAssetDetailPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const detail = await findRiseopediaAssetDetailBySlug(resolvedParams.slug);

	if (!detail) {
		notFound();
	}

	return (
		<RiseopediaAssetDetailClient
			doc={detail.doc}
			sections={detail.sections}
			rarities={detail.rarities}
			stateProperties={detail.stateProperties}
			variants={detail.variants}
			usedInRecipes={detail.usedInRecipes}
			craftedByRecipes={detail.craftedByRecipes}
			display={detail.display}
		/>
	);
}
