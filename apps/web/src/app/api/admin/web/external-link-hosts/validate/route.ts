//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/external-link-hosts/validate/route.ts                                  ////
//// Language: TS                                                                                                ////
//// Admin/editor API endpoint for DB-backed external link whitelist validation                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import {
	validateExternalLinkUrl,
	type ExternalLinkValidationSurfaceScopeCode,
} from "@/lib/data/external-link-hosts";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	requireActorDiscordId,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type ValidationBody = {
	rawUrl?: unknown;
	url?: unknown;
	surfaceScopeCode?: unknown;
};

const SURFACE_SCOPE_CODES: readonly ExternalLinkValidationSurfaceScopeCode[] = [
	"admin",
	"public",
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSurfaceScopeCode(
	value: string,
): value is ExternalLinkValidationSurfaceScopeCode {
	return SURFACE_SCOPE_CODES.includes(
		value as ExternalLinkValidationSurfaceScopeCode,
	);
}

function parseSurfaceScopeCode(
	value: unknown,
): ExternalLinkValidationSurfaceScopeCode | null {
	if (value === null || value === undefined || value === "") {
		return "admin";
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return isSurfaceScopeCode(normalized) ? normalized : null;
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

		const rawUrl = normalizeNonEmptyString(body.rawUrl ?? body.url);
		if (!rawUrl) {
			return jsonError("VALIDATION_REQUIRED", "External URL is required.", 400);
		}

		const surfaceScopeCode = parseSurfaceScopeCode(body.surfaceScopeCode);
		if (!surfaceScopeCode) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"surfaceScopeCode must be admin or public.",
				400,
			);
		}

		const doc = await validateExternalLinkUrl({
			rawUrl,
			surfaceScopeCode,
		});

		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to validate external link.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
