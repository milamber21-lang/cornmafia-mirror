//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-options/route.ts                                         ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for template field options                                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	findTemplateFieldListAdminById,
	listTemplateFieldOptionsAdminByFieldListId,
} from "@/lib/data/templates";
import {
	createTemplateFieldOptionAdmin,
	deleteTemplateFieldOptionAdmin,
	updateTemplateFieldOptionAdmin,
} from "@/lib/data/admin-web-actions";

import {
	classifyTemplateAdminError,
	jsonError,
	normalizeCode,
	normalizeNonEmptyString,
	parseNonNegativeInt,
	parseRequiredBoolean,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "../template-admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: unknown;
	data?: {
		fieldListId?: unknown;
		optionKey?: unknown;
		label?: unknown;
		displayOrder?: unknown;
		enabled?: unknown;
	};
};

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const fieldListId = parsePositiveInt(
		request.nextUrl.searchParams.get("fieldListId"),
	);
	if (!fieldListId) {
		return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
	}

	try {
		const fieldList = await findTemplateFieldListAdminById(fieldListId);
		if (!fieldList) {
			return jsonError("NOT_FOUND", "Field list not found.", 404);
		}

		if (!fieldList.supportsOptions) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Selected field list does not support options.",
				400,
			);
		}

		const rows = await listTemplateFieldOptionsAdminByFieldListId(fieldListId);
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template field options.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let payload: MutationBody;
	try {
		payload = (await request.json()) as MutationBody;
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const op = payload.op;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "delete") {
			const fieldOptionId = parsePositiveInt(payload.id);
			if (!fieldOptionId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateFieldOptionAdmin(actorDiscordId, fieldOptionId);

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const fieldListId = parsePositiveInt(data.fieldListId);
		const optionKey = normalizeCode(data.optionKey);
		const label = normalizeNonEmptyString(data.label);
		const displayOrder = parseNonNegativeInt(data.displayOrder);
		const enabled = parseRequiredBoolean(data.enabled);

		if (!fieldListId) {
			return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
		}

		if (!optionKey) {
			return jsonError("VALIDATION_REQUIRED", "Option key is required.", 400);
		}

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (displayOrder === null) {
			return jsonError("VALIDATION_REQUIRED", "Display order is required.", 400);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		const fieldList = await findTemplateFieldListAdminById(fieldListId);
		if (!fieldList) {
			return jsonError("NOT_FOUND", "Field list not found.", 404);
		}

		if (!fieldList.supportsOptions) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Selected field list does not support options.",
				400,
			);
		}

		if (op === "create") {
			const createdId = await createTemplateFieldOptionAdmin({
				actorDiscordId,
				fieldListId,
				optionKey,
				label,
				displayOrder,
				enabled,
			});
			const rows = await listTemplateFieldOptionsAdminByFieldListId(fieldListId);
			const doc = createdId
				? (rows.find((item) => item.id === String(createdId)) ?? null)
				: null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const fieldOptionId = parsePositiveInt(payload.id);
			if (!fieldOptionId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateTemplateFieldOptionAdmin({
				actorDiscordId,
				fieldOptionId,
				optionKey,
				label,
				displayOrder,
				enabled,
			});

			const rows = await listTemplateFieldOptionsAdminByFieldListId(fieldListId);
			const doc = rows.find((item) => item.id === String(fieldOptionId)) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field option request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
