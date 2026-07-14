//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/overview-card-rule-elements/route.ts                        ////
//// Language: TS                                                                                            ////
//// Admin API route for Riseopedia overview-card rule elements.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaOverviewCardRuleElementAdmin,
	listRiseopediaOverviewCardAdmin,
	upsertRiseopediaOverviewCardRuleElementAdmin,
} from "@/lib/data/riseopedia-admin";
import {
	jsonError,
	parsePositiveInt,
	requireAdminResponse,
} from "@/lib/server/admin-route";
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

	const scopedId = parsePositiveInt(
		request.nextUrl.searchParams.get("ruleSetId"),
	);

	try {
		const rows = await listRiseopediaOverviewCardAdmin();
		const filteredRows = scopedId
			? rows.ruleElements.filter(
					(row) => String(row.overview_card_rule_set_id ?? "") === String(scopedId),
				)
			: rows.ruleElements;
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

	const scopedId = parsePositiveInt(
		request.nextUrl.searchParams.get("ruleSetId"),
	);

	try {
		if (op === "upsert") {
			const data = getData(payloadOrResponse);
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const overviewCardRuleSetId =
				scopedId ?? getPositiveInt(data, "overviewCardRuleSetId");
			const postedRuleSetId = getPositiveInt(data, "overviewCardRuleSetId");
			const displaySlotCode = getRequiredCode(data, "displaySlotCode");
			const sourceTypeCode = getRequiredCode(data, "sourceTypeCode");
			const propertyCode = getRequiredCode(data, "propertyCode");
			const builtinFieldCode = getRequiredCode(data, "builtinFieldCode");
			if (!overviewCardRuleSetId || !displaySlotCode || !sourceTypeCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Rule set, display slot, and source type are required.",
					400,
				);
			}
			if (sourceTypeCode !== "property" && sourceTypeCode !== "builtin") {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Display source type must be property or builtin.",
					400,
				);
			}
			if (sourceTypeCode === "property" && !propertyCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Property source requires a property.",
					400,
				);
			}
			if (sourceTypeCode === "builtin" && !builtinFieldCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Builtin source requires a builtin field.",
					400,
				);
			}

			if (scopedId && postedRuleSetId && postedRuleSetId !== scopedId) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Element rule set does not match selected rule set.",
					400,
				);
			}

			const id = await upsertRiseopediaOverviewCardRuleElementAdmin({
				actorDiscordId: actorOrResponse,
				overviewCardRuleElementId: getOptionalId(payloadOrResponse),
				overviewCardRuleSetId,
				displaySlotCode,
				sourceTypeCode,
				propertyCode: sourceTypeCode === "property" ? propertyCode : null,
				builtinFieldCode: sourceTypeCode === "builtin" ? builtinFieldCode : null,
				labelOverride: getNullableString(data, "labelOverride"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const overviewCardRuleElementId = getRequiredId(payloadOrResponse);
			if (!overviewCardRuleElementId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaOverviewCardRuleElementAdmin({
				actorDiscordId: actorOrResponse,
				overviewCardRuleElementId,
			});
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
