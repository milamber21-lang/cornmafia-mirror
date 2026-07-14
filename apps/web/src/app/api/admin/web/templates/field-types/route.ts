//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-types/route.ts                                           ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for template field types                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listTemplateFieldTypesAdmin } from "@/lib/data/templates";
import {
	createTemplateFieldTypeAdmin,
	deleteTemplateFieldTypeAdmin,
	updateTemplateFieldTypeAdmin,
} from "@/lib/data/admin-web-actions";

import {
	classifyTemplateAdminError,
	jsonError,
	normalizeCode,
	normalizeNullableString,
	normalizeNonEmptyString,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
} from "../template-admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: unknown;
	data?: {
		fieldTypeCode?: unknown;
		label?: unknown;
		valueColumnName?: unknown;
		description?: unknown;
		enabled?: unknown;
	};
};

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listTemplateFieldTypesAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template field types.",
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
			const fieldTypeCode = normalizeCode(payload.id);
			if (!fieldTypeCode) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateFieldTypeAdmin(actorDiscordId, fieldTypeCode);

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const fieldTypeCode = normalizeCode(data.fieldTypeCode ?? payload.id);
		const label = normalizeNonEmptyString(data.label);
		const valueColumnName = normalizeCode(data.valueColumnName);
		const description = normalizeNullableString(data.description);
		const enabled = parseRequiredBoolean(data.enabled);

		if (!fieldTypeCode) {
			return jsonError("VALIDATION_REQUIRED", "Field type code is required.", 400);
		}

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (!valueColumnName) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Value column name is required.",
				400,
			);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		if (op === "create") {
			await createTemplateFieldTypeAdmin({
				actorDiscordId,
				fieldTypeCode,
				label,
				valueColumnName,
				description,
				enabled,
			});

			const rows = await listTemplateFieldTypesAdmin();
			const doc =
				rows.find((item) => item.fieldTypeCode === fieldTypeCode) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			await updateTemplateFieldTypeAdmin({
				actorDiscordId,
				fieldTypeCode,
				label,
				valueColumnName,
				description,
				enabled,
			});

			const rows = await listTemplateFieldTypesAdmin();
			const doc =
				rows.find((item) => item.fieldTypeCode === fieldTypeCode) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field type request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
