//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/content/route.ts                                                             ////
//// Language: TS                                                                                               ////
//// Member API route for loading actor-owned manageable content and authorable collections.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { NextResponse } from "next/server";

import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import { listMemberContent } from "@/lib/data/member-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	try {
		const [rows, collections] = await Promise.all([
			listMemberContent(actorDiscordId),
			listMemberAuthorableCollections(actorDiscordId),
		]);
		return NextResponse.json({ rows, collections });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load member content.";
		return NextResponse.json({ message }, { status: 500 });
	}
}
