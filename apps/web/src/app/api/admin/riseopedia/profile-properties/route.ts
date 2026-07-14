//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-properties/route.ts                                     ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile property placements.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfilePropertyAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfilePropertyAdmin,
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
			? rows.properties.filter(
					(row) => String(row.display_profile_id ?? "") === String(scopedId),
				)
			: rows.properties;
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
			const displayProfileBodyBlockId = getNullablePositiveInt(
				data,
				"displayProfileBodyBlockId",
			);
			const displaySlotCode = getRequiredCode(data, "displaySlotCode");
			const sourceTypeCode = getRequiredCode(data, "sourceTypeCode");
			const sourcePropertyCode = getRequiredCode(data, "sourceValue");
			const sourceBuiltinFieldCode = getRequiredCode(data, "sourceValue");
			const propertyCode =
				getRequiredCode(data, "propertyCode") ?? sourcePropertyCode;
			const builtinFieldCode =
				getRequiredCode(data, "builtinFieldCode") ?? sourceBuiltinFieldCode;
			if (!displayProfileId || !displaySlotCode || !sourceTypeCode) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Display profile, display slot, and source type are required.",
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
			if (scopedId && displayProfileId !== scopedId) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"This display element can only be saved under the selected display profile.",
					400,
				);
			}

			const id = await upsertRiseopediaDisplayProfilePropertyAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileElementId: getOptionalId(payloadOrResponse),
				displayProfileId,
				displaySlotCode,
				sourceTypeCode,
				displayProfileBodyBlockId,
				propertyCode: sourceTypeCode === "property" ? propertyCode : null,
				builtinFieldCode: sourceTypeCode === "builtin" ? builtinFieldCode : null,
				labelOverride: getNullableString(data, "labelOverride"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				visible: getBoolean(data, "visible", true),
				compact: getBoolean(data, "compact", false),
				featured: getBoolean(data, "featured", false),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileElementId = getRequiredId(payloadOrResponse);
			if (!displayProfileElementId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			if (scopedId) {
				const rows = await listRiseopediaAdminDisplayProfiles();
				const target = rows.properties.find(
					(row) =>
						Number(row.display_profile_element_id) === displayProfileElementId,
				);
				if (!target || Number(target.display_profile_id) !== scopedId) {
					return jsonError(
						"VALIDATION_REQUIRED",
						"This display element does not belong to the selected display profile.",
						400,
					);
				}
			}

			await deleteRiseopediaDisplayProfilePropertyAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileElementId,
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
