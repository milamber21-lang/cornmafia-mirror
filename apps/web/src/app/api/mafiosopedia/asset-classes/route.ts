//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/asset-classes/route.ts                                           ////
//// Language: TS                                                                                           ////
//// Public Mafiosopedia asset class list API backed by web_view Mafiosopedia read contracts.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { listMafiosopediaAssetClasses } from "@/lib/data/mafiosopedia-asset-classes";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const rows = await listMafiosopediaAssetClasses();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load Mafiosopedia asset classes.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}
