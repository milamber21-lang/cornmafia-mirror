//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/navigation-panels/[panelKey]/tree/route.ts                            ////
//// Language: TS                                                                                                ////
//// DB-first admin API route for one navigation panel tree                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	findNavigationPanelAdminByKey,
	findNavigationPanelTreeAdmin,
	listNavigationCategoriesLookupAdmin,
	listNavigationContentLookupAdmin,
	listNavigationSubcategoriesLookupAdmin,
	replaceNavigationPanelTreeAdmin,
} from "@/lib/data/navigation";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeCode,
	requireActorDiscordId,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: Promise<{
		panelKey?: string;
	}>;
};

type MutationBody = {
	items?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parsePanelKey(context: RouteContext): Promise<string | null> {
	const params = await context.params;
	return normalizeCode(params.panelKey);
}

function readItemsFromBody(value: unknown): unknown[] | null {
	if (!isRecord(value)) {
		return null;
	}

	const body = value as MutationBody;
	return Array.isArray(body.items) ? body.items : null;
}

async function loadPayload(panelKey: string): Promise<NextResponse> {
	const [panel, doc, categories, subcategories, content] = await Promise.all([
		findNavigationPanelAdminByKey(panelKey),
		findNavigationPanelTreeAdmin(panelKey),
		listNavigationCategoriesLookupAdmin(),
		listNavigationSubcategoriesLookupAdmin(),
		listNavigationContentLookupAdmin(),
	]);

	if (!panel || !doc) {
		return jsonError("NOT_FOUND", "Navigation panel was not found.", 404);
	}

	return NextResponse.json({
		doc,
		categories,
		subcategories,
		content,
	});
}

export async function GET(
	_request: Request,
	context: RouteContext,
): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const panelKey = await parsePanelKey(context);
	if (!panelKey) {
		return jsonError("VALIDATION_REQUIRED", "Invalid navigation panel key.", 400);
	}

	try {
		return await loadPayload(panelKey);
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to load navigation panel tree.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function PATCH(
	request: NextRequest,
	context: RouteContext,
): Promise<Response> {
	const actorDiscordId = await requireActorDiscordId();
	if (actorDiscordId instanceof NextResponse) {
		return actorDiscordId;
	}

	const panelKey = await parsePanelKey(context);
	if (!panelKey) {
		return jsonError("VALIDATION_REQUIRED", "Invalid navigation panel key.", 400);
	}

	try {
		const body = (await request.json().catch(() => null)) as unknown;
		const items = readItemsFromBody(body);
		if (!items) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Navigation panel items are required.",
				400,
			);
		}

		await replaceNavigationPanelTreeAdmin({
			actorDiscordId,
			panelKey,
			items,
		});

		const doc = await findNavigationPanelTreeAdmin(panelKey);
		if (!doc) {
			return jsonError("NOT_FOUND", "Navigation panel was not found.", 404);
		}

		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to save navigation panel tree.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
