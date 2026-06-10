//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/profile-variant-selectors/route.ts                              ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia display profile variant selector rows.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaDisplayProfileVariantSelectorAdmin,
	listRiseopediaAdminDisplayProfiles,
	upsertRiseopediaDisplayProfileVariantSelectorAdmin,
} from "@/lib/data/riseopedia-admin";
import { jsonError, parsePositiveInt, requireAdminResponse } from "@/lib/server/admin-route";
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
	readObjectBody,
	requireRiseopediaAdminActor,
} from "@/lib/server/riseopedia-admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const scopedId = parsePositiveInt(request.nextUrl.searchParams.get("displayProfileId"));

	try {
		const rows = await listRiseopediaAdminDisplayProfiles();
		const filteredRows = scopedId
			? rows.variantSelectors.filter((row) => String(row.display_profile_id ?? "") === String(scopedId))
			: rows.variantSelectors;
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

	const scopedId = parsePositiveInt(request.nextUrl.searchParams.get("displayProfileId"));

	try {
		if (op === "upsert") {
			const data = getData(payloadOrResponse);
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const displayProfileId = getPositiveInt(data, "displayProfileId");
			const variantGroupCode = getRequiredCode(data, "variantGroupCode");
			if (!displayProfileId || !variantGroupCode) {
				return jsonError("VALIDATION_REQUIRED", "Display profile and variant group are required.", 400);
			}
			if (scopedId && displayProfileId !== scopedId) {
				return jsonError("VALIDATION_REQUIRED", "This variant selector can only be saved under the selected display profile.", 400);
			}

			const id = await upsertRiseopediaDisplayProfileVariantSelectorAdmin({
				actorDiscordId: actorOrResponse,
				displayProfileVariantSelectorId: getOptionalId(payloadOrResponse),
				displayProfileId,
				variantGroupCode,
				selectorLabelOverride: getNullableString(data, "selectorLabelOverride"),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
				adminNote: getNullableString(data, "adminNote"),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const displayProfileVariantSelectorId = getRequiredId(payloadOrResponse);
			if (!displayProfileVariantSelectorId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			if (scopedId) {
				const rows = await listRiseopediaAdminDisplayProfiles();
				const target = rows.variantSelectors.find((row) => Number(row.display_profile_variant_selector_id) === displayProfileVariantSelectorId);
				if (!target || Number(target.display_profile_id) !== scopedId) {
					return jsonError("VALIDATION_REQUIRED", "This variant selector does not belong to the selected display profile.", 400);
				}
			}

			await deleteRiseopediaDisplayProfileVariantSelectorAdmin({ actorDiscordId: actorOrResponse, displayProfileVariantSelectorId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
