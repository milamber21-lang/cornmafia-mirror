//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/game/recipes/[slug]/route.ts                                                ////
//// Language: TS                                                                                           ////
//// Public game wiki recipe detail API backed by web_view game read contracts.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import {
	findGameRecipeBySlug,
	listGameRecipeComponents,
	listGameRecipeOutputs,
} from "@/lib/data/game-recipes";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

type GameRecipeDetailRouteContext = {
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
	{ params }: GameRecipeDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const slug = normalizeSlug(resolvedParams.slug);
		if (!slug) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const doc = await findGameRecipeBySlug(slug);
		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const [components, outputs] = await Promise.all([
			listGameRecipeComponents(doc.id),
			listGameRecipeOutputs(doc.id),
		]);

		return NextResponse.json(
			{
				doc,
				components,
				outputs,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load game recipe.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
