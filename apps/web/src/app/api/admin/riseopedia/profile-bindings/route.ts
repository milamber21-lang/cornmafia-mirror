//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-bindings/route.ts                                       ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile classification bindings.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfileBindingAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfileBindingAdmin,
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

	const scopedId = parsePositiveInt(
		request.nextUrl.searchParams.get("displayProfileId"),
	);

	try {
		const rows = await listRiseopediaAdminDisplayProfiles();
		const filteredRows = scopedId
			? rows.bindings.filter(
					(row) => String(row.display_profile_id ?? "") === String(scopedId),
				)
			: rows.bindings;
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
		request.nextUrl.searchParams.get("displayProfileId"),
	);

	try {
		if (op === "upsert") {
			const data = getData(payloadOrResponse);
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const displayProfileId = getPositiveInt(data, "displayProfileId");
			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			if (!displayProfileId || !entityTypeCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Display profile and entity type are required.",
					400,
				);
			}
			if (scopedId && displayProfileId !== scopedId) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"This binding can only be saved under the selected display profile.",
					400,
				);
			}

			const id = await upsertRiseopediaDisplayProfileBindingAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileBindingId: getOptionalId(payloadOrResponse),
				displayProfileId,
				entityTypeCode,
				entityClassId: getNullablePositiveInt(data, "entityClassId"),
				entityCategoryId: getNullablePositiveInt(data, "entityCategoryId"),
				entitySubcategoryId: getNullablePositiveInt(data, "entitySubcategoryId"),
				priorityOrder: getNonNegativeInt(data, "priorityOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileBindingId = getRequiredId(payloadOrResponse);
			if (!displayProfileBindingId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			if (scopedId) {
				const rows = await listRiseopediaAdminDisplayProfiles();
				const target = rows.bindings.find(
					(row) =>
						Number(row.display_profile_binding_id) === displayProfileBindingId,
				);
				if (!target || Number(target.display_profile_id) !== scopedId) {
					return jsonError(
						"VALIDATION_REQUIRED",
						"This binding does not belong to the selected display profile.",
						400,
					);
				}
			}

			await deleteRiseopediaDisplayProfileBindingAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileBindingId,
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
