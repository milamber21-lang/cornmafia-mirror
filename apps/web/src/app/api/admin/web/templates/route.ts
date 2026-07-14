//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/route.ts                                                       ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for templates with content metadata wiring                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	findTemplateAdminById,
	listTemplatesAdmin,
} from "@/lib/data/templates";
import {
	createTemplateAdmin,
	deleteTemplateAdmin,
	updateTemplateAdmin,
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
} from "./template-admin-route";

export const dynamic = "force-dynamic";

type TemplateSurfaceScopeCode = "admin" | "public";

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: unknown;
	data?: {
		templateCode?: unknown;
		label?: unknown;
		description?: unknown;
		contentKindCode?: unknown;
		surfaceScopeCode?: unknown;
		allowsSeries?: unknown;
		defaultIconKeyId?: unknown;
		defaultIconColorId?: unknown;
		enabled?: unknown;
	};
};

function parseSurfaceScopeCode(
	value: unknown,
): TemplateSurfaceScopeCode | null {
	const surfaceScopeCode = normalizeCode(value);

	if (surfaceScopeCode === "admin" || surfaceScopeCode === "public") {
		return surfaceScopeCode;
	}

	return null;
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listTemplatesAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load templates.",
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
			const templateId = parsePositiveInt(payload.id);
			if (!templateId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateAdmin(actorDiscordId, templateId);

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const templateCode = normalizeCode(data.templateCode);
		const label = normalizeNonEmptyString(data.label);
		const description = normalizeNullableString(data.description);
		const contentKindCode = normalizeCode(data.contentKindCode);
		const surfaceScopeCode = parseSurfaceScopeCode(data.surfaceScopeCode);
		const allowsSeries = parseRequiredBoolean(data.allowsSeries);
		const defaultIconKeyId = parsePositiveInt(data.defaultIconKeyId);
		const defaultIconColorId = parsePositiveInt(data.defaultIconColorId);
		const enabled = parseRequiredBoolean(data.enabled);

		if (!templateCode) {
			return jsonError("VALIDATION_REQUIRED", "Template code is required.", 400);
		}

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (!contentKindCode) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Content kind code is required.",
				400,
			);
		}

		if (!surfaceScopeCode) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Surface scope must be admin or public.",
				400,
			);
		}

		if (!defaultIconKeyId) {
			return jsonError("VALIDATION_REQUIRED", "Default icon is required.", 400);
		}

		if (!defaultIconColorId) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Default icon color is required.",
				400,
			);
		}

		if (allowsSeries === null) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Allow series flag is required.",
				400,
			);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		if (op === "create") {
			const createdId = await createTemplateAdmin({
				actorDiscordId,
				templateCode,
				label,
				description,
				contentKindCode,
				surfaceScopeCode,
				allowsSeries,
				defaultIconKeyId,
				defaultIconColorId,
				enabled,
			});
			const doc = createdId ? await findTemplateAdminById(createdId) : null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const templateId = parsePositiveInt(payload.id);
			if (!templateId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateTemplateAdmin({
				actorDiscordId,
				templateId,
				templateCode,
				label,
				description,
				contentKindCode,
				surfaceScopeCode,
				allowsSeries,
				defaultIconKeyId,
				defaultIconColorId,
				enabled,
			});

			const doc = await findTemplateAdminById(templateId);
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
