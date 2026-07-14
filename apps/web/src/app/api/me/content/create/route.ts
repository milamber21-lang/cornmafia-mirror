//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/content/create/route.ts                                                       ////
//// Language: TS                                                                                               ////
//// Member API route for collection-context content create metadata and creation.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	createMemberContent,
	findMemberContentCreateMetaByPath,
	type MemberContentCreateStatusCode,
} from "@/lib/data/member-content";
import { slugifyLoose } from "@/lib/helpers/slug";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type MutationBody = {
	categorySlug?: unknown;
	subcategorySlug?: unknown;
	templateId?: unknown;
	statusCode?: unknown;
	title?: unknown;
	summary?: unknown;
	fieldValues?: unknown;
	seriesMode?: unknown;
	seriesId?: unknown;
	seriesPartNo?: unknown;
	newSeriesTitle?: unknown;
	newSeriesDescription?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
	const normalized = readString(value);
	return normalized ? normalized : null;
}

function readPositiveNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

function normalizeStatusCode(value: unknown): MemberContentCreateStatusCode {
	return value === "published" ? "published" : "draft";
}

async function readBody(request: NextRequest): Promise<MutationBody | null> {
	try {
		const value = (await request.json()) as unknown;
		return isRecord(value) ? value : null;
	} catch {
		return null;
	}
}

function jsonError(message: string, status: number): NextResponse {
	return NextResponse.json({ message }, { status });
}

export async function GET(request: NextRequest): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("Sign in required.", 401);
	}

	const { searchParams } = new URL(request.url);
	const categorySlug = readString(searchParams.get("categorySlug"));
	const subcategorySlug = readString(searchParams.get("subcategorySlug"));

	if (!categorySlug || !subcategorySlug) {
		return jsonError("Collection path is required.", 400);
	}

	try {
		const meta = await findMemberContentCreateMetaByPath({
			actorDiscordId,
			categorySlug,
			subcategorySlug,
		});

		if (!meta) {
			return jsonError(
				"This collection is not available for member authoring.",
				404,
			);
		}

		return NextResponse.json({ meta });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load create metadata.";
		return jsonError(message, 500);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("Sign in required.", 401);
	}

	const rateLimitResponse = await checkRateLimit({
		request,
		bucket: "member:content:create",
		identity: actorDiscordId,
		limit: 30,
		windowMs: 600_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const body = await readBody(request);
	if (!body) {
		return jsonError("Invalid JSON body.", 400);
	}

	const categorySlug = readString(body.categorySlug);
	const subcategorySlug = readString(body.subcategorySlug);
	const templateId = readString(body.templateId);
	const title = readString(body.title);
	const slug = slugifyLoose(title);
	const statusCode = normalizeStatusCode(body.statusCode);
	const fieldValues = isRecord(body.fieldValues) ? body.fieldValues : {};

	if (!categorySlug || !subcategorySlug) {
		return jsonError("Collection path is required.", 400);
	}

	if (!templateId) {
		return jsonError("Template is required.", 400);
	}

	if (!title) {
		return jsonError("Title is required.", 400);
	}

	if (!slug) {
		return jsonError("Title must produce a valid slug.", 400);
	}

	try {
		const meta = await findMemberContentCreateMetaByPath({
			actorDiscordId,
			categorySlug,
			subcategorySlug,
		});

		if (!meta) {
			return jsonError(
				"This collection is not available for member authoring.",
				404,
			);
		}

		const template = meta.templates.find((row) => row.id === templateId) ?? null;
		if (!template) {
			return jsonError("Template is not valid for this collection.", 400);
		}

		const templateFields = meta.fields.filter(
			(field) => field.templateId === templateId,
		);
		const seriesMode = readString(body.seriesMode);
		let seriesId: string | null = null;
		let seriesPartNo: number | null = null;
		let newSeriesTitle: string | null = null;
		let newSeriesDescription: string | null = null;

		if (template.allowsSeries) {
			if (seriesMode === "none") {
				seriesId = null;
				seriesPartNo = null;
			} else if (seriesMode === "new") {
				newSeriesTitle = readNullableString(body.newSeriesTitle);
				newSeriesDescription = readNullableString(body.newSeriesDescription);
				seriesPartNo = readPositiveNumber(body.seriesPartNo) ?? 1;

				if (!newSeriesTitle) {
					return jsonError("Series title is required.", 400);
				}
			} else {
				seriesId = readString(body.seriesId);
				const series = meta.series.find((row) => row.id === seriesId) ?? null;
				if (!series) {
					return jsonError("Select an existing series or choose No series.", 400);
				}
				seriesPartNo = readPositiveNumber(body.seriesPartNo) ?? series.nextPartNo;
			}
		}

		const contentId = await createMemberContent({
			actorDiscordId,
			templateId,
			title,
			slug,
			summary: readNullableString(body.summary),
			categoryId: meta.collection.categoryId,
			subcategoryId: meta.collection.subcategoryId,
			seriesId,
			seriesPartNo,
			newSeriesTitle,
			newSeriesDescription,
			statusCode,
			templateFields,
			fieldValues,
		});

		return NextResponse.json({ ok: true, contentId });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to create content.";
		return jsonError(message, 400);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
