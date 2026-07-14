//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-body-blocks/route.ts                                   ////
//// Language: TS                                                                                               ////
//// Admin API route for Riseopedia display profile body-block configuration.                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfileBodyBlockAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfileBodyBlockAdmin,
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

	const scopedId = parsePositiveInt(
		request.nextUrl.searchParams.get("displayProfileId"),
	);

	try {
		const rows = await listRiseopediaAdminDisplayProfiles();
		const filteredRows = scopedId
			? rows.bodyBlocks.filter(
					(row) => String(row.display_profile_id ?? "") === String(scopedId),
				)
			: rows.bodyBlocks;
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
			const bodyBlockCode = getRequiredCode(data, "bodyBlockCode");
			const bodyBlockLabel = getRequiredString(data, "bodyBlockLabel");
			const bodyBlockRendererCode = getRequiredCode(data, "bodyBlockRendererCode");
			const bodyBlockDataSourceCode = getRequiredCode(
				data,
				"bodyBlockDataSourceCode",
			);
			const emptyBehaviorCode =
				getRequiredCode(data, "emptyBehaviorCode") ?? "hide_when_empty";
			const displaySlotCode =
				getRequiredCode(data, "displaySlotCode") ?? "body_main";
			if (
				!displayProfileId ||
				!bodyBlockCode ||
				!bodyBlockLabel ||
				!bodyBlockRendererCode ||
				!bodyBlockDataSourceCode
			) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Display profile, code, label, renderer, and datasource are required.",
					400,
				);
			}
			if (displaySlotCode !== "body_main" && displaySlotCode !== "detail_aside") {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Body-block placement must be body_main or detail_aside.",
					400,
				);
			}
			if (scopedId && displayProfileId !== scopedId) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"This body block can only be saved under the selected display profile.",
					400,
				);
			}

			const id = await upsertRiseopediaDisplayProfileBodyBlockAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileBodyBlockId: getOptionalId(payloadOrResponse),
				displayProfileId,
				bodyBlockCode,
				bodyBlockLabel,
				bodyBlockRendererCode,
				bodyBlockDataSourceCode,
				displaySlotCode,
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				visible: getBoolean(data, "visible", true),
				emptyBehaviorCode,
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileBodyBlockId = getRequiredId(payloadOrResponse);
			if (!displayProfileBodyBlockId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			if (scopedId) {
				const rows = await listRiseopediaAdminDisplayProfiles();
				const target = rows.bodyBlocks.find(
					(row) =>
						Number(row.display_profile_body_block_id) === displayProfileBodyBlockId,
				);
				if (!target || Number(target.display_profile_id) !== scopedId) {
					return jsonError(
						"VALIDATION_REQUIRED",
						"This body block does not belong to the selected display profile.",
						400,
					);
				}
			}

			await deleteRiseopediaDisplayProfileBodyBlockAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileBodyBlockId,
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
