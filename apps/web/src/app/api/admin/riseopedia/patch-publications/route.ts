//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/patch-publications/route.ts                                     ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia patch publication rows and stable promotion.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaPatchPublicationAdmin,
	listRiseopediaPatchAdmin,
	setRiseopediaPatchPublicationStableAdmin,
	upsertRiseopediaPatchPublicationAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getData,
	getNullableString,
	getNullableTimestampText,
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
		const rows = await listRiseopediaPatchAdmin();
		return NextResponse.json({ rows: rows.publications }, { status: 200 });
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

			const patchId = getPositiveInt(data, "patchId");
			const channelCode = getRequiredCode(data, "channelCode");
			const publicationStatusCode = getRequiredCode(data, "publicationStatusCode");
			if (!patchId || !channelCode || !publicationStatusCode) {
				return jsonError("VALIDATION_REQUIRED", "Patch, channel, and status are required.", 400);
			}

			const id = await upsertRiseopediaPatchPublicationAdmin({
				actorDiscordId: actorOrResponse,
				patchPublicationId: getOptionalId(payloadOrResponse),
				channelCode,
				patchId,
				publicationStatusCode,
				validFrom: getNullableTimestampText(data, "validFrom"),
				validTo: getNullableTimestampText(data, "validTo"),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "set-stable") {
			const patchPublicationId = getRequiredId(payloadOrResponse);
			if (!patchPublicationId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await setRiseopediaPatchPublicationStableAdmin({ actorDiscordId: actorOrResponse, patchPublicationId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		if (op === "delete") {
			const patchPublicationId = getRequiredId(payloadOrResponse);
			if (!patchPublicationId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaPatchPublicationAdmin({ actorDiscordId: actorOrResponse, patchPublicationId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
