//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/section-items/route.ts                                          ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia manual section items.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaSectionItemAdmin,
	listRiseopediaAdminSections,
	upsertRiseopediaSectionItemAdmin,
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
		const rows = await listRiseopediaAdminSections();
		return NextResponse.json({ rows: rows.items }, { status: 200 });
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

			const sectionId = getPositiveInt(data, "sectionId");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			const entityKey = getRequiredString(data, "entityKey");
			if (!sectionId || !entityTypeCode || !entityKey) {
				return jsonError("VALIDATION_REQUIRED", "Section, entity type, and entity key are required.", 400);
			}

			const id = await upsertRiseopediaSectionItemAdmin({
				actorDiscordId: actorOrResponse,
				sectionItemId: getOptionalId(payloadOrResponse),
				sectionId,
				entityTypeCode,
				entityKey,
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				pinned: getBoolean(data, "pinned", false),
				featured: getBoolean(data, "featured", false),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const sectionItemId = getRequiredId(payloadOrResponse);
			if (!sectionItemId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaSectionItemAdmin({ actorDiscordId: actorOrResponse, sectionItemId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
