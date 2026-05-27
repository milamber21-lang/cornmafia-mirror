//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/recipes/[slug]/route.ts                                             ////
//// Language: TS                                                                                             ////
//// Public Riseopedia recipe detail API backed by override-aware web_view read and display contracts.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { getRiseopediaDisplayLayout } from "@/lib/data/riseopedia-display";
import {
	findRiseopediaRecipeBySlug,
	listRiseopediaRecipeComponents,
	listRiseopediaRecipeOutputs,
	listRiseopediaRecipeSections,
} from "@/lib/data/riseopedia-recipes";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type RiseopediaRecipeDetailRouteContext = {
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
	{ params }: RiseopediaRecipeDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const slug = normalizeSlug(resolvedParams.slug);
		if (!slug) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const doc = await findRiseopediaRecipeBySlug(slug);
		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const [sections, components, outputs, display] = await Promise.all([
			listRiseopediaRecipeSections(doc.id),
			listRiseopediaRecipeComponents(doc.id),
			listRiseopediaRecipeOutputs(doc.id),
			getRiseopediaDisplayLayout({
				entityTypeCode: "recipe",
				entityKey: doc.recipeKey,
			}),
		]);

		return NextResponse.json(
			{
				doc,
				sections,
				components,
				outputs,
				display,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load Riseopedia recipe.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
