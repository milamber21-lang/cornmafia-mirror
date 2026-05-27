//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/section-rules/route.ts                                          ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia automatic section rules.                                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaSectionRuleAdmin,
	listRiseopediaAdminSections,
	upsertRiseopediaSectionRuleAdmin,
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

	const scopedId = parsePositiveInt(request.nextUrl.searchParams.get("sectionId"));

	try {
		const rows = await listRiseopediaAdminSections();
		const sourceRows = rows.rules;
		const filteredRows = scopedId
			? sourceRows.filter((row) => String(row.section_id ?? "") === String(scopedId))
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

			const sectionId = getPositiveInt(data, "sectionId");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			const ruleKindCode = getRequiredCode(data, "ruleKindCode");
			const ruleValue = getRequiredString(data, "ruleValue");
			if (!sectionId || !entityTypeCode || !ruleKindCode || !ruleValue) {
				return jsonError("VALIDATION_REQUIRED", "Section, entity type, rule kind, and rule value are required.", 400);
			}

			const id = await upsertRiseopediaSectionRuleAdmin({
				actorDiscordId: actorOrResponse,
				sectionEntityRuleId: getOptionalId(payloadOrResponse),
				sectionId,
				entityTypeCode,
				ruleKindCode,
				ruleValue,
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const sectionEntityRuleId = getRequiredId(payloadOrResponse);
			if (!sectionEntityRuleId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaSectionRuleAdmin({ actorDiscordId: actorOrResponse, sectionEntityRuleId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
