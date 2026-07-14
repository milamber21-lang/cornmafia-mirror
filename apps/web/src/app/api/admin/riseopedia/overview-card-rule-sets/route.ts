//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/overview-card-rule-sets/route.ts                            ////
//// Language: TS                                                                                            ////
//// Admin API route for Riseopedia overview-card rule sets.                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaOverviewCardRuleSetAdmin,
	listRiseopediaOverviewCardAdmin,
	upsertRiseopediaOverviewCardRuleSetAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNullablePositiveInt,
	getNullableString,
	getOp,
	getOptionalId,
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
		const rows = await listRiseopediaOverviewCardAdmin();
		return NextResponse.json({ rows: rows.ruleSets }, { status: 200 });
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

			const channelCode = getRequiredCode(data, "channelCode") ?? "riseopedia";
			const placementCode = getRequiredCode(data, "placementCode");
			if (!channelCode || !placementCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Channel and placement are required.",
					400,
				);
			}

			const cardModeCode = getRequiredCode(data, "cardModeCode") ?? "compact";
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");

			const id = await upsertRiseopediaOverviewCardRuleSetAdmin({
				actorDiscordId: actorOrResponse,
				overviewCardRuleSetId: getOptionalId(payloadOrResponse),
				channelCode,
				placementCode,
				cardModeCode,
				entityTypeCode,
				entityClassId: getNullablePositiveInt(data, "entityClassId"),
				entityCategoryId: getNullablePositiveInt(data, "entityCategoryId"),
				entitySubcategoryId: getNullablePositiveInt(data, "entitySubcategoryId"),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const overviewCardRuleSetId = getRequiredId(payloadOrResponse);
			if (!overviewCardRuleSetId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaOverviewCardRuleSetAdmin({
				actorDiscordId: actorOrResponse,
				overviewCardRuleSetId,
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
