//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/content/preview/route.ts                                                      ////
//// Language: TS                                                                                                ////
//// Guarded member endpoint that renders unsaved member content through the real content renderer.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	findMemberContentCreateMetaByPath,
	findMemberContentEditMeta,
} from "@/lib/data/member-content";
import { readOwnProfile } from "@/lib/data/member-profile";
import {
	createDraftContentRenderModel,
	type ContentPreviewRequest,
} from "@/lib/helpers/content-preview";
import { slugifyLoose } from "@/lib/helpers/slug";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import { renderContentPreviewHtml } from "@/lib/server/content-preview-render";
import { assertSameOriginMutation } from "@/lib/server/mutation-origin";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number): NextResponse {
	return NextResponse.json({ ok: false, message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
	const normalized = readString(value);
	return normalized.length > 0 ? normalized : null;
}

function readPositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}
	return null;
}

async function readBody(
	request: NextRequest,
): Promise<ContentPreviewRequest | null> {
	try {
		const value: unknown = await request.json();
		if (!isRecord(value)) {
			return null;
		}
		return {
			contentId: readNullableString(value.contentId),
			templateId: readString(value.templateId),
			title: readString(value.title),
			slug: readString(value.slug),
			summary: readString(value.summary),
			categorySlug: readString(value.categorySlug),
			subcategorySlug: readString(value.subcategorySlug),
			seriesId: readNullableString(value.seriesId),
			seriesPartNo:
				typeof value.seriesPartNo === "number" ||
				typeof value.seriesPartNo === "string"
					? value.seriesPartNo
					: null,
			fieldValues: isRecord(value.fieldValues) ? value.fieldValues : {},
		};
	} catch {
		return null;
	}
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const sameOriginResponse = assertSameOriginMutation(request);
	if (sameOriginResponse) {
		return sameOriginResponse;
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("Sign in required.", 401);
	}

	const rateLimitResponse = await checkRateLimit({
		request,
		bucket: "member:content:preview",
		identity: actorDiscordId,
		limit: 120,
		windowMs: 600_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const body = await readBody(request);
	if (!body || !body.categorySlug || !body.subcategorySlug || !body.templateId) {
		return jsonError("Collection and template are required for preview.", 400);
	}

	try {
		const meta = await findMemberContentCreateMetaByPath({
			actorDiscordId,
			categorySlug: body.categorySlug,
			subcategorySlug: body.subcategorySlug,
		});
		if (!meta) {
			return jsonError(
				"This collection is not available for member authoring.",
				404,
			);
		}

		const template =
			meta.templates.find((row) => row.id === body.templateId) ?? null;
		if (!template) {
			return jsonError("Template is not valid for this collection.", 400);
		}

		const selectedSeries = body.seriesId
			? (meta.series.find((row) => row.id === body.seriesId) ?? null)
			: null;
		const [profile, editMeta] = await Promise.all([
			readOwnProfile(actorDiscordId),
			body.contentId
				? findMemberContentEditMeta({ actorDiscordId, contentId: body.contentId })
				: Promise.resolve(null),
		]);
		const model = createDraftContentRenderModel({
			surfaceScope: "member",
			mediaRouteScope: "app",
			doc: {
				id: body.contentId ?? "preview",
				title: body.title,
				slug: body.slug?.trim() || slugifyLoose(body.title) || "preview",
				summary: body.summary?.trim() || null,
				categoryTitle: meta.collection.categoryTitle,
				categorySlug: meta.collection.categorySlug,
				subcategoryTitle: meta.collection.subcategoryTitle,
				subcategorySlug: meta.collection.subcategorySlug,
				seriesId: selectedSeries?.id ?? null,
				seriesTitle: selectedSeries?.title ?? null,
				seriesSlug: selectedSeries?.slug ?? null,
				seriesPartNo: readPositiveInt(body.seriesPartNo),
				authorUsername: profile?.globalName ?? profile?.username ?? null,
				publishedAt: editMeta?.doc.publishedAt ?? null,
				updatedAt: editMeta?.doc.updatedAt ?? null,
			},
			template,
			fields: meta.fields.filter((field) => field.templateId === template.id),
			fieldOptions: meta.fieldOptions,
			media: meta.media,
			fieldValues: body.fieldValues,
		});
		const html = await renderContentPreviewHtml(model);
		return NextResponse.json({ ok: true, html });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to render preview.";
		return jsonError(message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
