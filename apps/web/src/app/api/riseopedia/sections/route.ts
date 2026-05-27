//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/sections/route.ts                                                 ////
//// Language: TS                                                                                           ////
//// Public Riseopedia section hub API backed by web_view Riseopedia section contracts.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { listRiseopediaSections } from "@/lib/data/riseopedia-sections";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const rows = await listRiseopediaSections();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load Riseopedia sections.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
