//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/[templateId]/fields/route.ts                                   ////
//// Language: TS                                                                                                 ////
//// DB-first admin API route for per-template field placements                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listTemplateFieldsAdminByTemplateId } from "@/lib/data/templates";
import {
	createTemplateFieldAdmin,
	deleteTemplateFieldAdmin,
	updateTemplateFieldAdmin,
} from "@/lib/data/admin-web-actions";

import {
	classifyTemplateAdminError,
	jsonError,
	normalizeNullableString,
	parseNonNegativeInt,
	parseRequiredBoolean,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "../../template-admin-route";

export const dynamic = "force-dynamic";

function normalizeLayoutWidthCode(
	value: unknown,
): "full" | "half" | "third" | null {
	if (value === "full" || value === "half" || value === "third") {
		return value;
	}

	return null;
}

function normalizeLayoutAlignCode(
	value: unknown,
): "left" | "center" | "right" | "stretch" | null {
	if (
		value === "left" ||
		value === "center" ||
		value === "right" ||
		value === "stretch"
	) {
		return value;
	}

	return null;
}

type LabelStyleCode = "title" | "label" | "text" | "muted";
type LabelPositionCode = "above" | "inline";
type LabelSeparatorCode = "none" | "colon" | "dash";

function normalizeLabelPositionCode(value: unknown): LabelPositionCode | null {
	if (value === "above" || value === "inline") {
		return value;
	}

	return null;
}

function normalizeLabelStyleCode(args: {
	value: unknown;
	labelPositionCode: LabelPositionCode;
}): LabelStyleCode | null {
	if (args.value === "title") {
		return args.labelPositionCode === "above" ? "title" : null;
	}

	if (
		args.value === "label" ||
		args.value === "text" ||
		args.value === "muted"
	) {
		return args.value;
	}

	return null;
}

function normalizeLabelSeparatorCode(args: {
	value: unknown;
	labelPositionCode: LabelPositionCode;
}): LabelSeparatorCode | null {
	if (args.value === "none" || args.value === "colon") {
		return args.value;
	}

	if (args.value === "dash" && args.labelPositionCode === "inline") {
		return "dash";
	}

	return null;
}

type RouteContext = {
	params: Promise<{
		templateId: string;
	}>;
};

type MutationBody = {
	op?: "create" | "update" | "delete" | "force-delete";
	id?: unknown;
	data?: {
		fieldListId?: unknown;
		labelOverride?: unknown;
		helpTextOverride?: unknown;
		displayOrder?: unknown;
		required?: unknown;
		enabled?: unknown;
		layoutWidthCode?: unknown;
		layoutAlignCode?: unknown;
		showLabel?: unknown;
		labelStyleCode?: unknown;
		labelPositionCode?: unknown;
		labelSeparatorCode?: unknown;
	};
};

export async function GET(
	_request: Request,
	{ params }: RouteContext,
): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const resolvedParams = await params;
	const templateId = parsePositiveInt(resolvedParams.templateId);
	if (!templateId) {
		return jsonError("VALIDATION_REQUIRED", "Invalid template id.", 400);
	}

	try {
		const rows = await listTemplateFieldsAdminByTemplateId(templateId);
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to load template fields.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: RouteContext,
): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const resolvedParams = await params;
	const templateId = parsePositiveInt(resolvedParams.templateId);
	if (!templateId) {
		return jsonError("VALIDATION_REQUIRED", "Invalid template id.", 400);
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
		if (op === "delete" || op === "force-delete") {
			const templateFieldId = parsePositiveInt(payload.id);
			if (!templateFieldId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteTemplateFieldAdmin({
				actorDiscordId,
				templateFieldId,
				force: op === "force-delete",
			});

			return NextResponse.json({ ok: true });
		}

		const data = payload.data ?? {};
		const requestedFieldListId = parsePositiveInt(data.fieldListId);
		const labelOverride = normalizeNullableString(data.labelOverride);
		const helpTextOverride = normalizeNullableString(data.helpTextOverride);
		const displayOrder = parseNonNegativeInt(data.displayOrder);
		const required = parseRequiredBoolean(data.required);
		const enabled = parseRequiredBoolean(data.enabled);
		const layoutWidthCode = normalizeLayoutWidthCode(
			data.layoutWidthCode ?? "full",
		);
		const layoutAlignCode = normalizeLayoutAlignCode(
			data.layoutAlignCode ?? "stretch",
		);
		const showLabel = parseRequiredBoolean(data.showLabel ?? true);
		const labelPositionCode = normalizeLabelPositionCode(
			data.labelPositionCode ?? "above",
		);
		const labelStyleCode = normalizeLabelStyleCode({
			value: data.labelStyleCode ?? "label",
			labelPositionCode: labelPositionCode ?? "above",
		});
		const labelSeparatorCode = normalizeLabelSeparatorCode({
			value: data.labelSeparatorCode ?? "colon",
			labelPositionCode: labelPositionCode ?? "above",
		});

		if (displayOrder === null) {
			return jsonError("VALIDATION_REQUIRED", "Display order is required.", 400);
		}

		if (required === null) {
			return jsonError("VALIDATION_REQUIRED", "Required flag is required.", 400);
		}

		if (enabled === null) {
			return jsonError("VALIDATION_REQUIRED", "Enabled flag is required.", 400);
		}

		if (layoutWidthCode === null) {
			return jsonError("VALIDATION_REQUIRED", "Layout width is invalid.", 400);
		}

		if (layoutAlignCode === null) {
			return jsonError("VALIDATION_REQUIRED", "Layout alignment is invalid.", 400);
		}

		if (showLabel === null) {
			return jsonError("VALIDATION_REQUIRED", "Show label flag is required.", 400);
		}

		if (labelStyleCode === null) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Label style is invalid for the selected label position.",
				400,
			);
		}

		if (labelPositionCode === null) {
			return jsonError("VALIDATION_REQUIRED", "Label position is invalid.", 400);
		}

		if (labelSeparatorCode === null) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Label separator is invalid for the selected label position.",
				400,
			);
		}

		const existingRows = await listTemplateFieldsAdminByTemplateId(templateId);

		if (op === "create") {
			if (!requestedFieldListId) {
				return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
			}

			if (
				existingRows.some((row) => row.fieldListId === String(requestedFieldListId))
			) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Field list is already selected for this template.",
					400,
				);
			}

			const createdId = await createTemplateFieldAdmin({
				actorDiscordId,
				templateId,
				fieldListId: requestedFieldListId,
				labelOverride,
				helpTextOverride,
				displayOrder,
				required,
				enabled,
				layoutWidthCode,
				layoutAlignCode,
				showLabel,
				labelStyleCode,
				labelPositionCode,
				labelSeparatorCode,
			});
			const rows = await listTemplateFieldsAdminByTemplateId(templateId);
			const doc = createdId
				? (rows.find((item) => item.id === String(createdId)) ?? null)
				: null;
			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const templateFieldId = parsePositiveInt(payload.id);
			if (!templateFieldId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existingRow =
				existingRows.find((item) => item.id === String(templateFieldId)) ?? null;
			if (!existingRow) {
				return jsonError("NOT_FOUND", "Template field not found.", 404);
			}

			if (
				requestedFieldListId &&
				requestedFieldListId !== parsePositiveInt(existingRow.fieldListId)
			) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"Field list cannot be changed when editing an existing template field.",
					400,
				);
			}

			const lockedFieldListId = parsePositiveInt(existingRow.fieldListId);
			if (!lockedFieldListId) {
				return jsonError("SERVER_ERROR", "Existing field list is invalid.", 500);
			}

			await updateTemplateFieldAdmin({
				actorDiscordId,
				templateFieldId,
				fieldListId: lockedFieldListId,
				labelOverride,
				helpTextOverride,
				displayOrder,
				required,
				enabled,
				layoutWidthCode,
				layoutAlignCode,
				showLabel,
				labelStyleCode,
				labelPositionCode,
				labelSeparatorCode,
			});

			const rows = await listTemplateFieldsAdminByTemplateId(templateId);
			const doc = rows.find((item) => item.id === String(templateFieldId)) ?? null;
			return NextResponse.json({ ok: true, doc });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyTemplateAdminError(
			error,
			"Failed to process template field request.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
