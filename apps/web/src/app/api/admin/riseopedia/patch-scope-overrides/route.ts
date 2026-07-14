//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/patch-scope-overrides/route.ts                                  ////
//// Language: TS                                                                                                ////
//// Admin API route for classification-level Riseopedia patch publication overrides.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaPatchScopeOverrideAdmin,
	listRiseopediaPatchAdmin,
	upsertRiseopediaPatchScopeOverrideAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNullablePositiveInt,
	getNullableString,
	getNullableTimestampText,
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
		const rows = await listRiseopediaPatchAdmin();
		return NextResponse.json({ rows: rows.scopeOverrides }, { status: 200 });
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

			const actionCode = getRequiredCode(data, "actionCode");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			if (!actionCode || !entityTypeCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Entity type and action are required.",
					400,
				);
			}

			const id = await upsertRiseopediaPatchScopeOverrideAdmin({
				actorDiscordId: actorOrResponse,
				patchPublicationScopeOverrideId: getOptionalId(payloadOrResponse),
				actionCode,
				patchId: getNullablePositiveInt(data, "patchId"),
				entityTypeCode,
				entityClassId: getNullablePositiveInt(data, "entityClassId"),
				entityCategoryId: getNullablePositiveInt(data, "entityCategoryId"),
				entitySubcategoryId: getNullablePositiveInt(data, "entitySubcategoryId"),
				validFrom: getNullableTimestampText(data, "validFrom"),
				validTo: getNullableTimestampText(data, "validTo"),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const patchPublicationScopeOverrideId = getRequiredId(payloadOrResponse);
			if (!patchPublicationScopeOverrideId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaPatchScopeOverrideAdmin({
				actorDiscordId: actorOrResponse,
				patchPublicationScopeOverrideId,
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
