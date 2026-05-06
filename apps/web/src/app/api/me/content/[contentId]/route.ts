//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/content/[contentId]/route.ts                                                  ////
//// Language: TS                                                                                                ////
//// Member API route for member-context content edit metadata and updates.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { NextRequest, NextResponse } from "next/server";

import {
	findMemberContentEditMeta,
	updateMemberContent,
	type MemberContentEditStatusCode,
} from "@/lib/data/member-content";
import { slugifyLoose } from "@/lib/helpers/slug";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: Promise<{
		contentId: string;
	}>;
};

type MutationBody = {
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

function normalizeStatusCode(value: unknown): MemberContentEditStatusCode {
	if (value === "published" || value === "archived") {
		return value;
	}
	return "draft";
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

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("Sign in required.", 401);
	}

	const resolvedParams = await context.params;
	const contentId = readString(resolvedParams.contentId);
	if (!contentId) {
		return jsonError("Content id is required.", 400);
	}

	try {
		const meta = await findMemberContentEditMeta({ actorDiscordId, contentId });
		if (!meta) {
			return jsonError("This content is not available for member editing.", 404);
		}
		return NextResponse.json({ meta });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load content edit metadata.";
		return jsonError(message, 500);
	}
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return jsonError("Sign in required.", 401);
	}

	const resolvedParams = await context.params;
	const contentId = readString(resolvedParams.contentId);
	if (!contentId) {
		return jsonError("Content id is required.", 400);
	}

	const rateLimitResponse = checkRateLimit({
		request,
		bucket: "member:content:update",
		identity: actorDiscordId,
		limit: 60,
		windowMs: 600_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const body = await readBody(request);
	if (!body) {
		return jsonError("Invalid JSON body.", 400);
	}

	const title = readString(body.title);
	const slug = slugifyLoose(title);
	const templateId = readString(body.templateId);
	const statusCode = normalizeStatusCode(body.statusCode);
	const fieldValues = isRecord(body.fieldValues) ? body.fieldValues : {};

	if (!title) {
		return jsonError("Title is required.", 400);
	}

	if (!slug) {
		return jsonError("Title must produce a valid slug.", 400);
	}

	try {
		const meta = await findMemberContentEditMeta({ actorDiscordId, contentId });
		if (!meta) {
			return jsonError("This content is not available for member editing.", 404);
		}

		const template = meta.templates.find((row) => row.id === meta.doc.templateId) ?? null;
		if (!template || (templateId && template.id !== templateId)) {
			return jsonError("Template cannot be changed in member editing.", 400);
		}

		const templateFields = meta.fields.filter((field) => field.templateId === template.id);
		const seriesMode = readString(body.seriesMode);
		let seriesId: string | null = null;
		let seriesPartNo: number | null = null;
		let newSeriesTitle: string | null = null;
		let newSeriesDescription: string | null = null;

		if (template.requiresSeries) {
			if (seriesMode === "new") {
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
					return jsonError("Series is required.", 400);
				}
				seriesPartNo = readPositiveNumber(body.seriesPartNo) ?? meta.doc.seriesPartNo ?? series.nextPartNo;
			}
		}

		const updatedContentId = await updateMemberContent({
			actorDiscordId,
			contentId,
			templateId: template.id,
			title,
			slug,
			summary: readNullableString(body.summary),
			seriesId,
			seriesPartNo,
			newSeriesTitle,
			newSeriesDescription,
			statusCode,
			templateFields,
			fieldValues,
		});

		return NextResponse.json({ ok: true, contentId: updatedContentId });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to update content.";
		return jsonError(message, 400);
	}
}
