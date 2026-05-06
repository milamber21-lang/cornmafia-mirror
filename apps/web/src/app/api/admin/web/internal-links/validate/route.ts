//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/internal-links/validate/route.ts                                      ////
//// Language: TS                                                                                                ////
//// Admin/editor API endpoint for DB-backed internal content-route link validation                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { validateInternalLinkPath } from "@/lib/data/internal-links";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	requireActorDiscordId,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type ValidationBody = {
	rawPath?: unknown;
	path?: unknown;
	url?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBody(value: unknown): ValidationBody | null {
	if (!isRecord(value)) {
		return null;
	}

	return value;
}

export async function POST(request: Request): Promise<NextResponse> {
	const actorDiscordId = await requireActorDiscordId({
		allowAdminOrEditor: true,
	});
	if (typeof actorDiscordId !== "string") {
		return actorDiscordId;
	}

	try {
		const body = readBody((await request.json().catch(() => null)) as unknown);
		if (!body) {
			return jsonError("VALIDATION_REQUIRED", "Request body is required.", 400);
		}

		const rawPath = normalizeNonEmptyString(
			body.rawPath ?? body.path ?? body.url,
		);
		if (!rawPath) {
			return jsonError("VALIDATION_REQUIRED", "Internal path is required.", 400);
		}

		const doc = await validateInternalLinkPath({
			actorDiscordId,
			rawPath,
		});

		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to validate internal link.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
