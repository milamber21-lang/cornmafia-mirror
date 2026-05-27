//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/recipes/[slug]/route.ts                                             ////
//// Language: TS                                                                                             ////
//// Public Riseopedia recipe detail API backed by the shared public detail aggregation helper.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { findRiseopediaRecipeDetailBySlug } from "@/lib/data/riseopedia-detail";

export const dynamic = "force-dynamic";

type RiseopediaRecipeDetailRouteContext = {
	params: Promise<{
		slug: string;
	}>;
};

export async function GET(
	_request: Request,
	{ params }: RiseopediaRecipeDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const detail = await findRiseopediaRecipeDetailBySlug(resolvedParams.slug);

		if (!detail) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		return NextResponse.json(detail, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load Riseopedia recipe.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
