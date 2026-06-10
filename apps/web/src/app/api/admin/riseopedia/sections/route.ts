//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/sections/route.ts                                                ////
//// Language: TS                                                                                                ////
//// Admin API route for rebuilt Riseopedia section rows.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaSectionAdmin,
	listRiseopediaAdminSections,
	upsertRiseopediaSectionAdmin,
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
		const rows = await listRiseopediaAdminSections();
		return NextResponse.json({ rows: rows.sections }, { status: 200 });
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

			const sectionCode = getRequiredCode(data, "sectionCode");
			const sectionSlug = getRequiredString(data, "sectionSlug");
			const sectionName = getRequiredString(data, "sectionName");
			if (!sectionCode || !sectionSlug || !sectionName) {
				return jsonError("VALIDATION_REQUIRED", "Section code, slug, and name are required.", 400);
			}

			const id = await upsertRiseopediaSectionAdmin({
				actorDiscordId: actorOrResponse,
				sectionId: getOptionalId(payloadOrResponse),
				sectionCode,
				sectionSlug,
				sectionName,
				description: getNullableString(data, "description"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const sectionId = getRequiredId(payloadOrResponse);
			if (!sectionId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaSectionAdmin({ actorDiscordId: actorOrResponse, sectionId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
