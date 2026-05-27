//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/game/assets/[slug]/route.ts                                                 ////
//// Language: TS                                                                                           ////
//// Public game wiki asset detail API backed by web_view game read contracts.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import {
	findGameAssetBySlug,
	listGameAssetProperties,
	listRecipesCraftingGameAsset,
	listRecipesUsingGameAsset,
} from "@/lib/data/game-assets";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type GameAssetDetailRouteContext = {
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
	{ params }: GameAssetDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const slug = normalizeSlug(resolvedParams.slug);
		if (!slug) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const doc = await findGameAssetBySlug(slug);
		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const [properties, usedInRecipes, craftedByRecipes] = await Promise.all([
			listGameAssetProperties(doc.id),
			listRecipesUsingGameAsset(doc.id),
			listRecipesCraftingGameAsset(doc.id),
		]);

		return NextResponse.json(
			{
				doc,
				properties,
				usedInRecipes,
				craftedByRecipes,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load game asset.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
