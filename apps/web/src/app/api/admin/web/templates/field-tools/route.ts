//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-tools/route.ts                                          ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for template field editor tool catalog rows                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	findTemplateFieldToolAdminByCode,
	listTemplateFieldToolsAdmin,
} from "@/lib/data/templates";
import {
	createTemplateFieldToolAdmin,
	deleteTemplateFieldToolAdmin,
	updateTemplateFieldToolAdmin,
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

type MutationBody = {
	op?: "create" | "update" | "delete";
	id?: unknown;
	data?: {
		fieldToolCode?: unknown;
		fieldTypeCode?: unknown;
		label?: unknown;
		toolGroupCode?: unknown;
		displayOrder?: unknown;
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
		const rows = await listTemplateFieldToolsAdmin();
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template field tools.",
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
			const fieldToolCode = normalizeCode(payload.id);
			if (!fieldToolCode) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateFieldToolAdmin(actorDiscordId, fieldToolCode);

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const fieldToolCode = normalizeCode(data.fieldToolCode ?? payload.id);
		const fieldTypeCode = normalizeCode(data.fieldTypeCode);
		const label = normalizeNonEmptyString(data.label);
		const toolGroupCode = normalizeCode(data.toolGroupCode);
		const displayOrder = parsePositiveInt(data.displayOrder);
		const description = normalizeNullableString(data.description);
		const enabled = parseRequiredBoolean(data.enabled);

		if (!fieldToolCode) {
			return jsonError("VALIDATION_REQUIRED", "Field tool code is required.", 400);
		}

		if (!fieldTypeCode) {
			return jsonError("VALIDATION_REQUIRED", "Field type is required.", 400);
		}

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (!toolGroupCode) {
			return jsonError("VALIDATION_REQUIRED", "Tool group code is required.", 400);
		}

		if (displayOrder === null) {
			return jsonError("VALIDATION_REQUIRED", "Display order is required.", 400);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		if (op === "create") {
			await createTemplateFieldToolAdmin({
				actorDiscordId,
				fieldToolCode,
				fieldTypeCode,
				label,
				toolGroupCode,
				displayOrder,
				description,
				enabled,
			});

			const doc = await findTemplateFieldToolAdminByCode(fieldToolCode);
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			await updateTemplateFieldToolAdmin({
				actorDiscordId,
				fieldToolCode,
				fieldTypeCode,
				label,
				toolGroupCode,
				displayOrder,
				description,
				enabled,
			});

			const doc = await findTemplateFieldToolAdminByCode(fieldToolCode);
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field tool request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
