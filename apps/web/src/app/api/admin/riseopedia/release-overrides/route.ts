//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/release-overrides/route.ts                                      ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia entity release overrides.                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaEntityReleaseOverrideAdmin,
	listRiseopediaReleaseAdmin,
	upsertRiseopediaEntityReleaseOverrideAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNullablePositiveInt,
	getNullableString,
	getOp,
	getOptionalId,
	getPositiveInt,
	getRequiredCode,
	getRequiredId,
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
		const rows = await listRiseopediaReleaseAdmin();
		return NextResponse.json({ rows: rows.overrides }, { status: 200 });
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

			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			const entityId = getPositiveInt(data, "entityId");
			const overrideStateCode = getRequiredCode(data, "overrideStateCode");
			if (!entityTypeCode || !entityId || !overrideStateCode) {
				return jsonError("VALIDATION_REQUIRED", "Entity type, entity, and override state are required.", 400);
			}

			const id = await upsertRiseopediaEntityReleaseOverrideAdmin({
				actorDiscordId: actorOrResponse,
				entityReleaseOverrideId: getOptionalId(payloadOrResponse),
				entityTypeCode,
				entityId,
				patchId: getNullablePositiveInt(data, "patchId"),
				overrideStateCode,
				overrideReasonCode: getNullableString(data, "overrideReasonCode"),
				overrideNote: getNullableString(data, "overrideNote"),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const entityReleaseOverrideId = getRequiredId(payloadOrResponse);
			if (!entityReleaseOverrideId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaEntityReleaseOverrideAdmin({ actorDiscordId: actorOrResponse, entityReleaseOverrideId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
