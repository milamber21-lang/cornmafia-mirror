//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/[templateId]/fields/meta/route.ts                              ////
//// Language: TS                                                                                                  ////
//// Admin meta route for per-template field placement options                                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import { listAvailableTemplateFieldListsAdminByTemplateId } from "@/lib/data/templates";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: Promise<{
		templateId: string;
	}>;
};

function parsePositiveInt(value: string | null | undefined): number | null {
	if (!value || !/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
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

	const rawCurrentFieldListId = request.nextUrl.searchParams.get("currentFieldListId");
	const currentFieldListId = rawCurrentFieldListId
		? parsePositiveInt(rawCurrentFieldListId)
		: null;
	if (rawCurrentFieldListId && !currentFieldListId) {
		return jsonError("VALIDATION_REQUIRED", "Invalid current field list id.", 400);
	}

	try {
		const fieldLists = await listAvailableTemplateFieldListsAdminByTemplateId(
			templateId,
			currentFieldListId,
		);
		return NextResponse.json({ fieldLists });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load template field metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}
