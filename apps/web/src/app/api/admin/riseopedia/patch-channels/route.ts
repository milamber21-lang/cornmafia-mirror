//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/patch-channels/route.ts                                         ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia patch publication channels.                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaPatchPublicationChannelAdmin,
	listRiseopediaPatchAdmin,
	upsertRiseopediaPatchPublicationChannelAdmin,
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
		const rows = await listRiseopediaPatchAdmin();
		return NextResponse.json({ rows: rows.channels }, { status: 200 });
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

			const channelCode = getRequiredCode(data, "channelCode");
			const channelName = getRequiredString(data, "channelName");
			if (!channelCode || !channelName) {
				return jsonError("VALIDATION_REQUIRED", "Channel code and name are required.", 400);
			}

			const id = await upsertRiseopediaPatchPublicationChannelAdmin({
				actorDiscordId: actorOrResponse,
				patchPublicationChannelId: getOptionalId(payloadOrResponse),
				channelCode,
				channelName,
				description: getNullableString(data, "description"),
				isPublic: getBoolean(data, "isPublic", true),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const patchPublicationChannelId = getRequiredId(payloadOrResponse);
			if (!patchPublicationChannelId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaPatchPublicationChannelAdmin({ actorDiscordId: actorOrResponse, patchPublicationChannelId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
