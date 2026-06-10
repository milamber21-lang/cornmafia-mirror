//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/section-rules/route.ts                                          ////
//// Language: TS                                                                                                ////
//// Admin API route for rebuilt Riseopedia section classification rules.                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaSectionClassificationRuleAdmin,
	listRiseopediaAdminSections,
	upsertRiseopediaSectionClassificationRuleAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, parsePositiveInt, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNonNegativeInt,
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

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const scopedId = parsePositiveInt(request.nextUrl.searchParams.get("sectionId"));

	try {
		const rows = await listRiseopediaAdminSections();
		const filteredRows = scopedId
			? rows.classificationRules.filter((row) => String(row.section_id ?? "") === String(scopedId))
			: rows.classificationRules;
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

			const sectionId = getPositiveInt(data, "sectionId");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			if (!sectionId || !entityTypeCode) {
				return jsonError("VALIDATION_REQUIRED", "Section and entity type are required.", 400);
			}

			const id = await upsertRiseopediaSectionClassificationRuleAdmin({
				actorDiscordId: actorOrResponse,
				sectionClassificationRuleId: getOptionalId(payloadOrResponse),
				sectionId,
				entityTypeCode,
				entityClassId: getNullablePositiveInt(data, "entityClassId"),
				entityCategoryId: getNullablePositiveInt(data, "entityCategoryId"),
				entitySubcategoryId: getNullablePositiveInt(data, "entitySubcategoryId"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const sectionClassificationRuleId = getRequiredId(payloadOrResponse);
			if (!sectionClassificationRuleId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaSectionClassificationRuleAdmin({ actorDiscordId: actorOrResponse, sectionClassificationRuleId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
