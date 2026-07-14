//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-list/route.ts                                            ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for reusable template field definitions                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listTemplateFieldListAdmin } from "@/lib/data/templates";
import {
	createTemplateFieldListAdmin,
	deleteTemplateFieldListAdmin,
	updateTemplateFieldListAdmin,
} from "@/lib/data/admin-web-actions";

import {
	classifyTemplateAdminError,
	jsonError,
	normalizeCode,
	normalizeNullableString,
	normalizeNonEmptyString,
	parsePositiveInt,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
} from "../template-admin-route";

export const dynamic = "force-dynamic";

const RENDER_DESTINATION_CODES = [
	"seo",
	"hero",
	"top",
	"left",
	"main",
	"right",
	"bottom",
	"hidden",
] as const;

type RenderDestinationCode = (typeof RENDER_DESTINATION_CODES)[number];

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: unknown;
	data?: {
		fieldListCode?: unknown;
		label?: unknown;
		helpText?: unknown;
		fieldTypeCode?: unknown;
		renderDestinationCode?: unknown;
		enabled?: unknown;
	};
};

function normalizeRenderDestinationCode(
	value: unknown,
): RenderDestinationCode | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	const match = RENDER_DESTINATION_CODES.find((code) => code === normalized);
	return match ?? null;
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listTemplateFieldListAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template field list.",
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
			const fieldListId = parsePositiveInt(payload.id);
			if (!fieldListId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateFieldListAdmin(actorDiscordId, fieldListId);

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const fieldListCode = normalizeCode(data.fieldListCode);
		const label = normalizeNonEmptyString(data.label);
		const helpText = normalizeNullableString(data.helpText);
		const fieldTypeCode = normalizeCode(data.fieldTypeCode);
		const renderDestinationCode = normalizeRenderDestinationCode(
			data.renderDestinationCode ?? "main",
		);
		const enabled = parseRequiredBoolean(data.enabled);

		if (!fieldListCode) {
			return jsonError("VALIDATION_REQUIRED", "Field list code is required.", 400);
		}

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (!fieldTypeCode) {
			return jsonError("VALIDATION_REQUIRED", "Field type is required.", 400);
		}

		if (!renderDestinationCode) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Render destination is required.",
				400,
			);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		if (op === "create") {
			const createdId = await createTemplateFieldListAdmin({
				actorDiscordId,
				fieldListCode,
				label,
				helpText,
				fieldTypeCode,
				renderDestinationCode,
				enabled,
			});
			const rows = await listTemplateFieldListAdmin();
			const doc = createdId
				? (rows.find((item) => item.id === String(createdId)) ?? null)
				: null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const fieldListId = parsePositiveInt(payload.id);
			if (!fieldListId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateTemplateFieldListAdmin({
				actorDiscordId,
				fieldListId,
				fieldListCode,
				label,
				helpText,
				fieldTypeCode,
				renderDestinationCode,
				enabled,
			});

			const rows = await listTemplateFieldListAdmin();
			const doc = rows.find((item) => item.id === String(fieldListId)) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field list request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
