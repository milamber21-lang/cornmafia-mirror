//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/display-profiles/route.ts                                       ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile rows.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfileAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfileAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNonNegativeInt,
	getNullableString,
	getOp,
	getOptionalId,
	getRequiredCode,
	getRequiredId,
	getRequiredString,
	readObjectBody,
	requireRiseopediaAdminActor,
} from "@/lib/server/riseopedia-admin-api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listRiseopediaAdminDisplayProfiles();
		return NextResponse.json({ rows: rows.profiles }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorOrResponse = await requireRiseopediaAdminActor();
	if (actorOrResponse instanceof NextResponse) {
		return actorOrResponse;
	}

	const payloadOrResponse = await readObjectBody(request);
	if (payloadOrResponse instanceof NextResponse) {
		return payloadOrResponse;
	}

	const op = getOp(payloadOrResponse);
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "upsert") {
			const data = getData(payloadOrResponse);
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const displayProfileCode = getRequiredCode(data, "displayProfileCode");
			const displayProfileName = getRequiredString(data, "displayProfileName");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			if (!displayProfileCode || !displayProfileName || !entityTypeCode) {
				return jsonError("VALIDATION_REQUIRED", "Display profile code, name, and entity type are required.", 400);
			}

			const id = await upsertRiseopediaDisplayProfileAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileId: getOptionalId(payloadOrResponse),
				displayProfileCode,
				displayProfileName,
				entityTypeCode,
				description: getNullableString(data, "description"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileId = getRequiredId(payloadOrResponse);
			if (!displayProfileId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaDisplayProfileAdmin({ actorDiscordId: actorOrResponse, displayProfileId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
