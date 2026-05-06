//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/discord/users/[id]/route.ts                                                  ////
//// Language: TS                                                                                                  ////
//// Admin Discord user detail route with shared guard helpers and boring doc response                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { findDiscordUserAdminDetail } from "@/lib/data/admin-discord";
import {
	classifyAdminMutationError,
	jsonError,
	parsePositiveInt,
	requireAdminResponse,
} from "@/lib/server/admin-route";

type ContextShape = {
	params?: Promise<{
		id?: string;
	}>;
};

async function parseIdParam(context: unknown): Promise<number | null> {
	if (
		typeof context !== "object" ||
		context === null ||
		!("params" in context)
	) {
		return null;
	}

	const params = await (context as ContextShape).params;
	return parsePositiveInt(params?.id);
}

export async function GET(_req: Request, context: unknown): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const discordUserId = await parseIdParam(context);
	if (discordUserId === null) {
		return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
	}

	try {
		const doc = await findDiscordUserAdminDetail(discordUserId);
		if (!doc) {
			return jsonError("NOT_FOUND", "User not found.", 404);
		}

		return NextResponse.json({ doc }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to fetch user detail.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
