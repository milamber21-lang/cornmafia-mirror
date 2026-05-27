//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-properties/route.ts                                     ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile property placements.                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfilePropertyAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfilePropertyAdmin,
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
	getPositiveInt,
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
		return NextResponse.json({ rows: rows.properties }, { status: 200 });
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

			const displayProfileId = getPositiveInt(data, "displayProfileId");
			const propertyCatalogId = getPositiveInt(data, "propertyCatalogId");
			const displaySlotCode = getRequiredCode(data, "displaySlotCode");
			const groupCode = getRequiredCode(data, "groupCode");
			if (!displayProfileId || !propertyCatalogId || !displaySlotCode || !groupCode) {
				return jsonError("VALIDATION_REQUIRED", "Display profile, property, slot, and group are required.", 400);
			}

			const id = await upsertRiseopediaDisplayProfilePropertyAdmin({
				actorDiscordId: actorOrResponse,
				displayProfilePropertyId: getOptionalId(payloadOrResponse),
				displayProfileId,
				propertyCatalogId,
				displaySlotCode,
				groupCode,
				labelOverride: getNullableString(data, "labelOverride"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				visible: getBoolean(data, "visible", true),
				compact: getBoolean(data, "compact", false),
				featured: getBoolean(data, "featured", false),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfilePropertyId = getRequiredId(payloadOrResponse);
			if (!displayProfilePropertyId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaDisplayProfilePropertyAdmin({ actorDiscordId: actorOrResponse, displayProfilePropertyId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
