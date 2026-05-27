//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/visibility/route.ts                                             ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia entity visibility overrides.                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaVisibilityOverrideAdmin,
	listRiseopediaAdminVisibility,
	upsertRiseopediaVisibilityOverrideAdmin,
} from "@/lib/data/riseopedia-admin";
import {
	jsonError,
	normalizeCode,
	normalizeNullableString,
	parsePageSizeParam,
	requireAdminResponse,
} from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
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

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const search = normalizeNullableString(request.nextUrl.searchParams.get("search"));
	const entityTypeCode = normalizeCode(request.nextUrl.searchParams.get("entityType"));
	const limit = parsePageSizeParam(request.nextUrl.searchParams.get("limit"), {
		defaultPageSize: 1000,
		maxPageSize: 2000,
		minPageSize: 1,
	});

	try {
		const result = await listRiseopediaAdminVisibility({ search, entityTypeCode, limit });
		return NextResponse.json({ rows: result.overrides, entities: result.entities }, { status: 200 });
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
			const entityKey = getRequiredString(data, "entityKey");
			const visibilityStateCode = getRequiredCode(data, "visibilityStateCode");
			if (!entityTypeCode || !entityKey || !visibilityStateCode) {
				return jsonError("VALIDATION_REQUIRED", "Entity type, entity key, and visibility state are required.", 400);
			}

			const id = await upsertRiseopediaVisibilityOverrideAdmin({
				actorDiscordId: actorOrResponse,
				visibilityOverrideId: getOptionalId(payloadOrResponse),
				entityTypeCode,
				entityKey,
				visibilityStateCode,
				reason: getNullableString(data, "reason"),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const visibilityOverrideId = getRequiredId(payloadOrResponse);
			if (!visibilityOverrideId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaVisibilityOverrideAdmin({ actorDiscordId: actorOrResponse, visibilityOverrideId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
