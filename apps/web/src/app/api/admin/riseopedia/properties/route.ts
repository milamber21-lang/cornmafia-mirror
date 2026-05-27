//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/riseopedia/properties/route.ts                                             ////
//// Language: TS                                                                                                ////
//// Admin API route for Riseopedia property catalog rows.                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	deleteRiseopediaPropertyCatalogAdmin,
	listRiseopediaAdminProperties,
	upsertRiseopediaPropertyCatalogAdmin,
} from "@/lib/data/riseopedia-admin";
import {
	jsonError,
	normalizeCode,
	normalizeNullableString,
	parsePageSizeParam,
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

	const entityTypeCode = normalizeCode(request.nextUrl.searchParams.get("entityType"));
	const search = normalizeNullableString(request.nextUrl.searchParams.get("search"));
	const limit = parsePageSizeParam(request.nextUrl.searchParams.get("limit"), {
		defaultPageSize: 2000,
		maxPageSize: 3000,
		minPageSize: 1,
	});

	try {
		const result = await listRiseopediaAdminProperties({ entityTypeCode, search, limit });
		return NextResponse.json(
			{ rows: result.catalog, candidates: result.candidates, unmapped: result.unmapped },
			{ status: 200 },
		);
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

	try {
		if (op === "upsert") {
			const data = getData(payloadOrResponse);
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const entityTypeCode = getRequiredCode(data, "entityTypeCode");
			const propertyCode = getRequiredCode(data, "propertyCode");
			const propertyName = getRequiredString(data, "propertyName");
			const propertyOriginCode = getRequiredCode(data, "propertyOriginCode");
			const dataTypeCode = getRequiredCode(data, "dataTypeCode");
			const defaultDisplaySlotCode = getRequiredCode(data, "defaultDisplaySlotCode");
			const defaultGroupCode = getRequiredCode(data, "defaultGroupCode");
			if (
				!entityTypeCode ||
				!propertyCode ||
				!propertyName ||
				!propertyOriginCode ||
				!dataTypeCode ||
				!defaultDisplaySlotCode ||
				!defaultGroupCode
			) {
				return jsonError("VALIDATION_REQUIRED", "Required property catalog fields are missing.", 400);
			}

			const id = await upsertRiseopediaPropertyCatalogAdmin({
				actorDiscordId: actorOrResponse,
				propertyCatalogId: getOptionalId(payloadOrResponse),
				entityTypeCode,
				propertyCode,
				propertyName,
				description: getNullableString(data, "description"),
				propertyOriginCode,
				sourceColumnName: getNullableString(data, "sourceColumnName"),
				sourcePropertyCode: getNullableString(data, "sourcePropertyCode"),
				dataTypeCode,
				unitCode: getNullableString(data, "unitCode"),
				defaultDisplaySlotCode,
				defaultGroupCode,
				defaultVisible: getBoolean(data, "defaultVisible", false),
				sortOrder: getNonNegativeInt(data, "sortOrder", 1000),
				active: getBoolean(data, "active", true),
			});

			return NextResponse.json({ ok: true, id }, { status: 200 });
		}

		if (op === "delete") {
			const propertyCatalogId = getRequiredId(payloadOrResponse);
			if (!propertyCatalogId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteRiseopediaPropertyCatalogAdmin({ actorDiscordId: actorOrResponse, propertyCatalogId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyRiseopediaAdminError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
