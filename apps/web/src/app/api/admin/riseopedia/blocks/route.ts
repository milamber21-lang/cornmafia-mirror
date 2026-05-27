//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/blocks/route.ts                                                 ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia relationship, dependency, and changelog display blocks.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaRelationshipBlockAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaRelationshipBlockAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, parsePositiveInt, requireAdminResponse } from "@/lib/server/admin-route";
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
	readObjectBody,
	requireRiseopediaAdminActor,
} from "@/lib/server/riseopedia-admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const scopedId = parsePositiveInt(request.nextUrl.searchParams.get("displayProfileId"));

	try {
		const rows = await listRiseopediaAdminDisplayProfiles();
		const sourceRows = rows.relationshipBlocks;
		const filteredRows = scopedId
			? sourceRows.filter((row) => String(row.display_profile_id ?? "") === String(scopedId))
			: sourceRows;
		return NextResponse.json({ rows: filteredRows }, { status: 200 });
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
			const relationshipBlockTypeCode = getRequiredCode(data, "relationshipBlockTypeCode");
			if (!displayProfileId || !relationshipBlockTypeCode) {
				return jsonError("VALIDATION_REQUIRED", "Display profile and relationship block type are required.", 400);
			}

			const id = await upsertRiseopediaRelationshipBlockAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileRelationshipBlockId: getOptionalId(payloadOrResponse),
				displayProfileId,
				relationshipBlockTypeCode,
				labelOverride: getNullableString(data, "labelOverride"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				visible: getBoolean(data, "visible", true),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileRelationshipBlockId = getRequiredId(payloadOrResponse);
			if (!displayProfileRelationshipBlockId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaRelationshipBlockAdmin({ actorDiscordId: actorOrResponse, displayProfileRelationshipBlockId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
