//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-list-tools/route.ts                                    ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for selected template field-list editor tools                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import { replaceTemplateFieldListToolsAdmin } from "@/lib/data/admin-web-actions";
import {
	findTemplateFieldListAdminById,
	listTemplateFieldListToolsAdminByFieldListId,
	listTemplateFieldToolsAdminByFieldTypeCode,
} from "@/lib/data/templates";

import {
	classifyTemplateAdminError,
	jsonError,
	normalizeCode,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "../template-admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: "create" | "delete" | "replace";
	id?: unknown;
	data?: {
		fieldListId?: unknown;
		fieldToolCode?: unknown;
		fieldToolCodes?: unknown;
	};
};

function normalizeCodeArray(value: unknown): string[] | null {
	if (!Array.isArray(value)) {
		return null;
	}

	const codes = new Set<string>();
	for (const item of value) {
		const code = normalizeCode(item);
		if (!code) {
			return null;
		}

		codes.add(code);
	}

	return [...codes];
}

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const fieldListId = parsePositiveInt(request.nextUrl.searchParams.get("fieldListId"));
	if (!fieldListId) {
		return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
	}

	try {
		const fieldList = await findTemplateFieldListAdminById(fieldListId);
		if (!fieldList) {
			return jsonError("NOT_FOUND", "Field list not found.", 404);
		}

		if (!fieldList.supportsTools) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Selected field list does not support toolbar tools.",
				400,
			);
		}

		const [rows, availableTools] = await Promise.all([
			listTemplateFieldListToolsAdminByFieldListId(fieldListId),
			listTemplateFieldToolsAdminByFieldTypeCode(fieldList.fieldTypeCode),
		]);

		return NextResponse.json({ rows, availableTools });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template field-list tools.",
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

	const data = payload.data ?? {};
	const fieldListId = parsePositiveInt(data.fieldListId);
	if (!fieldListId) {
		return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
	}

	try {
		const fieldList = await findTemplateFieldListAdminById(fieldListId);
		if (!fieldList) {
			return jsonError("NOT_FOUND", "Field list not found.", 404);
		}

		if (!fieldList.supportsTools) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Selected field list does not support toolbar tools.",
				400,
			);
		}

		const selectedRows = await listTemplateFieldListToolsAdminByFieldListId(fieldListId);
		const selectedCodes = new Set(
			selectedRows.map((selectedRow) => selectedRow.fieldToolCode),
		);

		if (op === "create") {
			const fieldToolCode = normalizeCode(data.fieldToolCode);
			if (!fieldToolCode) {
				return jsonError("VALIDATION_REQUIRED", "Field tool is required.", 400);
			}

			const availableTools = await listTemplateFieldToolsAdminByFieldTypeCode(
				fieldList.fieldTypeCode,
			);
			if (!availableTools.some((tool) => tool.fieldToolCode === fieldToolCode)) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Selected field tool is not available for this field type.",
					400,
				);
			}

			selectedCodes.add(fieldToolCode);
			await replaceTemplateFieldListToolsAdmin({
				actorDiscordId,
				fieldListId,
				fieldToolCodes: [...selectedCodes],
			});

			const rows = await listTemplateFieldListToolsAdminByFieldListId(fieldListId);
			const doc = rows.find((row) => row.fieldToolCode === fieldToolCode) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "delete") {
			const fieldToolCode = normalizeCode(payload.id);
			if (!fieldToolCode) {
				return jsonError("VALIDATION_REQUIRED", "Field tool is required.", 400);
			}

			selectedCodes.delete(fieldToolCode);
			await replaceTemplateFieldListToolsAdmin({
				actorDiscordId,
				fieldListId,
				fieldToolCodes: [...selectedCodes],
			});

			return NextResponse.json({ ok: true });
		}

		if (op === "replace") {
			const fieldToolCodes = normalizeCodeArray(data.fieldToolCodes);
			if (!fieldToolCodes) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Field tool codes must be a valid code list.",
					400,
				);
			}

			await replaceTemplateFieldListToolsAdmin({
				actorDiscordId,
				fieldListId,
				fieldToolCodes,
			});

			const rows = await listTemplateFieldListToolsAdminByFieldListId(fieldListId);
			return NextResponse.json({ ok: true, rows });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field-list tool request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
