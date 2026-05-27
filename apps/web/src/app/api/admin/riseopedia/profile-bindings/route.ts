//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-bindings/route.ts                                       ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile bindings.                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfileBindingAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfileBindingAdmin,
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
		return NextResponse.json({ rows: rows.bindings }, { status: 200 });
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
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			const profileSelectorKindCode = getRequiredCode(data, "profileSelectorKindCode");
			const selectorValue = getRequiredString(data, "selectorValue");
			if (!displayProfileId || !entityTypeCode || !profileSelectorKindCode || !selectorValue) {
				return jsonError("VALIDATION_REQUIRED", "Display profile, entity type, selector kind, and selector value are required.", 400);
			}

			const id = await upsertRiseopediaDisplayProfileBindingAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileBindingId: getOptionalId(payloadOrResponse),
				displayProfileId,
				entityTypeCode,
				profileSelectorKindCode,
				selectorValue,
				priorityOrder: getNonNegativeInt(data, "priorityOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileBindingId = getRequiredId(payloadOrResponse);
			if (!displayProfileBindingId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaDisplayProfileBindingAdmin({ actorDiscordId: actorOrResponse, displayProfileBindingId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
