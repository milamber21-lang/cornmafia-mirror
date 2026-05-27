//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/assets/[slug]/route.ts                                              ////
//// Language: TS                                                                                             ////
//// Public Riseopedia asset detail API backed by override-aware web_view read and display contracts.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import {
	findRiseopediaAssetBySlug,
	listRecipesCraftingRiseopediaAsset,
	listRecipesUsingRiseopediaAsset,
	listRiseopediaAssetProperties,
	listRiseopediaAssetSections,
	listRiseopediaAssetVariants,
} from "@/lib/data/riseopedia-assets";
import { getRiseopediaDisplayLayout } from "@/lib/data/riseopedia-display";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type RiseopediaAssetDetailRouteContext = {
	params: Promise<{
		slug: string;
	}>;
};

function normalizeSlug(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	return SLUG_PATTERN.test(normalized) ? normalized : null;
}

export async function GET(
	_request: Request,
	{ params }: RiseopediaAssetDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const slug = normalizeSlug(resolvedParams.slug);
		if (!slug) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const doc = await findRiseopediaAssetBySlug(slug);
		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const [sections, properties, variants, usedInRecipes, craftedByRecipes, display] = await Promise.all([
			listRiseopediaAssetSections(doc.id),
			listRiseopediaAssetProperties(doc.id),
			listRiseopediaAssetVariants(doc.id),
			listRecipesUsingRiseopediaAsset(doc.id),
			listRecipesCraftingRiseopediaAsset(doc.id),
			getRiseopediaDisplayLayout({
				entityTypeCode: "asset",
				entityKey: doc.canonicalAssetKey,
			}),
		]);

		return NextResponse.json(
			{
				doc,
				sections,
				properties,
				variants,
				usedInRecipes,
				craftedByRecipes,
				display,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load Riseopedia asset.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
