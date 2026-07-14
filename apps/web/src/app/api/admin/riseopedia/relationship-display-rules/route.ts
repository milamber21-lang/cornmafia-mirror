//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/relationship-display-rules/route.ts                            ////
//// Language: TS                                                                                                ////
//// Admin API route for table-driven Riseopedia relationship display rules.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaRelationshipDisplayRuleAdmin,
	listRiseopediaRelationshipDisplayRuleAdmin,
	upsertRiseopediaRelationshipDisplayRuleAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import {
	classifyRiseopediaAdminError,
	getBoolean,
	getData,
	getNonNegativeInt,
	getNullableString,
	getOp,
	getRequiredCode,
	readObjectBody,
	requireRiseopediaAdminActor,
} from "@/lib/server/riseopedia-admin-api";

export const dynamic = "force-dynamic";

function getStringId(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listRiseopediaRelationshipDisplayRuleAdmin();
		return NextResponse.json({ rows: rows.rules }, { status: 200 });
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

			const relationshipCode = getRequiredCode(data, "relationshipCode");
			const perspectiveCode = getRequiredCode(data, "perspectiveCode");
			const dependencyBlockCode = getRequiredCode(data, "dependencyBlockCode");
			const dependencyBlockLabel = getStringId(data.dependencyBlockLabel);
			if (
				!relationshipCode ||
				!perspectiveCode ||
				!dependencyBlockCode ||
				!dependencyBlockLabel
			) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Relationship, perspective, block code, and block label are required.",
					400,
				);
			}

			const id = await upsertRiseopediaRelationshipDisplayRuleAdmin({
				actorDiscordId: actorOrResponse,
				relationshipCode,
				perspectiveCode,
				dependencyBlockCode,
				dependencyBlockLabel,
				dependencyKindLabel: getNullableString(data, "dependencyKindLabel"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
				description: getNullableString(data, "description"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const ruleKey = getStringId(payloadOrResponse.id);
			if (!ruleKey) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaRelationshipDisplayRuleAdmin({
				actorDiscordId: actorOrResponse,
				ruleKey,
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
