//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/content/preview/route.ts                                               ////
//// Language: TS                                                                                                ////
//// Guarded admin endpoint that renders unsaved content form state through the real content renderer.           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import {
	findContentAdminDetailById,
	listContentCategories,
	listContentMediaOptions,
	listContentSeriesOptions,
	listContentSubcategories,
	listContentTemplateFieldOptions,
	listContentTemplateFieldOptionsForContent,
	listContentTemplateFields,
	listContentTemplateFieldsForContent,
	listContentTemplatesForPlacement,
} from "@/lib/data/content";
import {
	createDraftContentRenderModel,
	type ContentPreviewRequest,
} from "@/lib/helpers/content-preview";
import { readOwnProfile } from "@/lib/data/member-profile";
import { slugifyLoose } from "@/lib/helpers/slug";
import {
	jsonError,
	parsePositiveInt,
	requireAdminOrEditorResponse,
} from "@/lib/server/admin-route";
import { renderContentPreviewHtml } from "@/lib/server/content-preview-render";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import { assertSameOriginMutation } from "@/lib/server/mutation-origin";

export const dynamic = "force-dynamic";

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

function readFieldValues(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

async function readBody(
	request: Request,
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
			categoryId: readString(value.categoryId),
			subcategoryId: readNullableString(value.subcategoryId),
			seriesId: readNullableString(value.seriesId),
			seriesPartNo:
				typeof value.seriesPartNo === "number" ||
				typeof value.seriesPartNo === "string"
					? value.seriesPartNo
					: null,
			fieldValues: readFieldValues(value.fieldValues),
		};
	} catch {
		return null;
	}
}

function readSeriesPartNo(
	value: string | number | null | undefined,
): number | null {
	const parsed = parsePositiveInt(value);
	return parsed;
}

export async function POST(request: Request): Promise<NextResponse> {
	const sameOriginResponse = assertSameOriginMutation(request);
	if (sameOriginResponse) {
		return sameOriginResponse;
	}

	const guardResponse = await requireAdminOrEditorResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("AUTH_REQUIRED", "Sign in required.", 401);
	}

	const body = await readBody(request);
	if (!body) {
		return jsonError("VALIDATION_REQUIRED", "Invalid preview data.", 400);
	}

	const templateId = parsePositiveInt(body.templateId);
	const categoryId = parsePositiveInt(body.categoryId);
	const subcategoryId = parsePositiveInt(body.subcategoryId);
	const contentId = parsePositiveInt(body.contentId);
	if (templateId === null || categoryId === null) {
		return jsonError(
			"VALIDATION_REQUIRED",
			"Category and template are required for preview.",
			400,
		);
	}

	try {
		const [
			categories,
			subcategories,
			templates,
			fields,
			fieldOptions,
			media,
			series,
		] = await Promise.all([
			listContentCategories(),
			listContentSubcategories(),
			listContentTemplatesForPlacement({
				categoryId,
				subcategoryId,
				surfaceScopeCode: "admin",
				currentTemplateId: templateId,
			}),
			contentId === null
				? listContentTemplateFields(templateId)
				: listContentTemplateFieldsForContent({ contentId, templateId }),
			contentId === null
				? listContentTemplateFieldOptions(templateId)
				: listContentTemplateFieldOptionsForContent({ contentId, templateId }),
			listContentMediaOptions({ categoryId, subcategoryId }),
			listContentSeriesOptions({ categoryId, subcategoryId }),
		]);

		const category =
			categories.find((row) => row.id === String(categoryId)) ?? null;
		const subcategory =
			subcategoryId === null
				? null
				: (subcategories.find((row) => row.id === String(subcategoryId)) ?? null);
		const template =
			templates.find((row) => row.id === String(templateId)) ?? null;
		if (!category || !template) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Preview placement or template is not available.",
				400,
			);
		}

		const selectedSeries = body.seriesId
			? (series.find((row) => row.id === body.seriesId) ?? null)
			: null;
		const [profile, existingDoc] = await Promise.all([
			readOwnProfile(actorDiscordId),
			contentId === null
				? Promise.resolve(null)
				: findContentAdminDetailById(contentId),
		]);
		const model = createDraftContentRenderModel({
			surfaceScope: "admin",
			mediaRouteScope: "admin",
			doc: {
				id: body.contentId ?? "preview",
				title: body.title,
				slug: body.slug?.trim() || slugifyLoose(body.title) || "preview",
				summary: body.summary?.trim() || null,
				categoryTitle: category.title,
				categorySlug: category.slug,
				subcategoryTitle: subcategory?.title ?? null,
				subcategorySlug: subcategory?.slug ?? null,
				seriesId: selectedSeries?.id ?? null,
				seriesTitle: selectedSeries?.title ?? null,
				seriesSlug: selectedSeries?.slug ?? null,
				seriesPartNo: readSeriesPartNo(body.seriesPartNo),
				authorUsername:
					existingDoc?.authorUsername ??
					profile?.globalName ??
					profile?.username ??
					null,
				publishedAt: existingDoc?.publishedAt ?? null,
				updatedAt: existingDoc?.updatedAt ?? null,
			},
			template,
			fields,
			fieldOptions,
			media,
			fieldValues: body.fieldValues,
		});
		const html = await renderContentPreviewHtml(model);
		return NextResponse.json({ ok: true, html });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to render preview.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
