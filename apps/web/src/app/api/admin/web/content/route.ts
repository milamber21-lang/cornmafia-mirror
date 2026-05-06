//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/content/route.ts                                                        ////
//// Language: TS                                                                                                  ////
//// Admin content list and create route for the server-driven content family                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import {
	createContentAdmin,
	findContentAdminDetailById,
	listContentAdminPage,
	listContentTemplateFields,
	type ContentAdminSortBy,
	type ContentAdminSortDir,
	type ContentIconModeCode,
	type ContentNavModeCode,
	type ContentPolicyCode,
	type ContentStatusCode,
} from "@/lib/data/content";
import { assertContentYoutubeChannelsAllowed } from "@/lib/data/content-youtube-validation";
import {
	buildContentExternalLinkPayload,
	buildContentFieldValuePayload,
} from "@/lib/helpers/content-field-values";
import { extractContentMediaReferences } from "@/lib/helpers/content-media-references";
import { slugifyLoose } from "@/lib/helpers/slug";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	normalizeNullableString,
	parsePageParam,
	parsePageSizeParam,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminOrEditorResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";


const CONTENT_SORT_KEYS: readonly ContentAdminSortBy[] = [
	"title",
	"slug",
	"kind",
	"category",
	"subcategory",
	"template",
] as const;

function normalizeContentSortBy(value: string | null): ContentAdminSortBy {
	return CONTENT_SORT_KEYS.find((sortKey) => sortKey === value) ?? "title";
}

function normalizeContentSortDir(value: string | null): ContentAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

type MutationData = {
	templateId: number;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: number;
	subcategoryId: number | null;
	seriesId: number | null;
	seriesPartNo: number | null;
	statusCode: ContentStatusCode;
	readPolicyCode: ContentPolicyCode;
	readRank: number | null;
	writePolicyCode: ContentPolicyCode;
	writeRank: number | null;
	navHiddenModeCode: ContentNavModeCode;
	navHidden: boolean | null;
	iconModeCode: ContentIconModeCode;
	iconKeyId: number | null;
	iconColorModeCode: ContentIconModeCode;
	iconColorId: number | null;
	fieldValues: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readDataRecord(value: unknown): Record<string, unknown> | null {
	if (!isRecord(value)) {
		return null;
	}

	if (isRecord(value.data)) {
		return value.data;
	}

	return value;
}

function parseNullablePositiveInt(value: unknown): number | null {
	if (value === null || typeof value === "undefined" || value === "") {
		return null;
	}

	return parsePositiveInt(value);
}

function parseStatusCode(value: unknown): ContentStatusCode {
	if (value === "published" || value === "archived") {
		return value;
	}

	return "draft";
}

function parsePolicyCode(value: unknown, fallback: ContentPolicyCode): ContentPolicyCode {
	if (
		value === "inherit" ||
		value === "public" ||
		value === "rank_at_least" ||
		value === "rank_equal"
	) {
		return value;
	}

	return fallback;
}

function parseNavModeCode(value: unknown): ContentNavModeCode {
	if (value === "explicit_visible" || value === "explicit_hidden") {
		return value;
	}

	return "inherit";
}

function parseIconModeCode(value: unknown): ContentIconModeCode {
	return value === "explicit" ? "explicit" : "template_default";
}

function parseNavHidden(value: unknown, navHiddenModeCode: ContentNavModeCode): boolean | null {
	if (navHiddenModeCode === "explicit_visible") {
		return false;
	}

	if (navHiddenModeCode === "explicit_hidden") {
		return true;
	}

	if (typeof value === "boolean") {
		return value;
	}

	return null;
}

function parseMutationData(value: unknown): MutationData | NextResponse {
	const data = readDataRecord(value);
	if (!data) {
		return jsonError("VALIDATION_REQUIRED", "Missing content data.", 400);
	}

	const templateId = parsePositiveInt(data.templateId);
	const categoryId = parsePositiveInt(data.categoryId);
	const subcategoryId = parseNullablePositiveInt(data.subcategoryId);
	const seriesId = parseNullablePositiveInt(data.seriesId);
	const seriesPartNo = parseNullablePositiveInt(data.seriesPartNo);
	const title = normalizeNonEmptyString(data.title);

	if (templateId === null) {
		return jsonError("VALIDATION_REQUIRED", "Template is required.", 400);
	}

	if (categoryId === null) {
		return jsonError("VALIDATION_REQUIRED", "Category is required.", 400);
	}

	if (!title) {
		return jsonError("VALIDATION_REQUIRED", "Title is required.", 400);
	}

	const providedSlug = normalizeNonEmptyString(data.slug);
	const slug = providedSlug ?? slugifyLoose(title);
	if (!slug) {
		return jsonError("VALIDATION_REQUIRED", "Slug is required.", 400);
	}

	const readPolicyCode = parsePolicyCode(data.readPolicyCode, "inherit");
	const writePolicyCode = parsePolicyCode(data.writePolicyCode, "inherit");
	const navHiddenModeCode = parseNavModeCode(data.navHiddenModeCode);

	return {
		templateId,
		title,
		slug,
		summary: normalizeNullableString(data.summary),
		categoryId,
		subcategoryId,
		seriesId,
		seriesPartNo,
		statusCode: parseStatusCode(data.statusCode),
		readPolicyCode,
		readRank: readPolicyCode === "inherit" || readPolicyCode === "public" ? null : parseNullablePositiveInt(data.readRank),
		writePolicyCode,
		writeRank: writePolicyCode === "inherit" ? null : parseNullablePositiveInt(data.writeRank),
		navHiddenModeCode,
		navHidden: parseNavHidden(data.navHidden, navHiddenModeCode),
		iconModeCode: parseIconModeCode(data.iconModeCode),
		iconKeyId:
			parseIconModeCode(data.iconModeCode) === "explicit"
				? parseNullablePositiveInt(data.iconKeyId)
				: null,
		iconColorModeCode: parseIconModeCode(data.iconColorModeCode),
		iconColorId:
			parseIconModeCode(data.iconColorModeCode) === "explicit"
				? parseNullablePositiveInt(data.iconColorId)
				: null,
		fieldValues: isRecord(data.fieldValues) ? data.fieldValues : {},
	};
}

export async function GET(request: Request): Promise<NextResponse> {
	const guardResponse = await requireAdminOrEditorResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(request.url);

	try {
		const id = parsePositiveInt(searchParams.get("id"));
		if (id !== null) {
			const doc = await findContentAdminDetailById(id);
			if (!doc) {
				return jsonError("NOT_FOUND", "Content was not found.", 404);
			}

			return NextResponse.json({ doc });
		}

		const result = await listContentAdminPage({
			page: parsePageParam(searchParams.get("page"), 1),
			pageSize: parsePageSizeParam(searchParams.get("pageSize"), {
				defaultPageSize: 20,
				maxPageSize: 100,
			}),
			search: searchParams.get("search") ?? "",
			categoryId: parsePositiveInt(searchParams.get("categoryId")),
			subcategoryId: parsePositiveInt(searchParams.get("subcategoryId")),
			sortBy: normalizeContentSortBy(searchParams.get("sortBy")),
			sortDir: normalizeContentSortDir(searchParams.get("sortDir")),
		});

		return NextResponse.json(result);
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to load content.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: Request): Promise<NextResponse> {
	const actorDiscordId = await requireActorDiscordId({
		allowAdminOrEditor: true,
	});
	if (typeof actorDiscordId !== "string") {
		return actorDiscordId;
	}

	try {
		const body = (await request.json().catch(() => null)) as unknown;
		const data = parseMutationData(body);
		if (data instanceof NextResponse) {
			return data;
		}

		const templateFields = await listContentTemplateFields(data.templateId);
		const fieldValues = buildContentFieldValuePayload(
			templateFields,
			data.fieldValues,
		);

		await assertContentYoutubeChannelsAllowed({
			actorDiscordId,
			fields: templateFields,
			fieldValues,
		});

		const externalLinks = buildContentExternalLinkPayload(
			templateFields,
			data.fieldValues,
		);

		const mediaReferences = extractContentMediaReferences(
			templateFields,
			fieldValues,
		);

		const contentId = await createContentAdmin({
			actorDiscordId,
			templateId: data.templateId,
			title: data.title,
			slug: data.slug,
			summary: data.summary,
			categoryId: data.categoryId,
			subcategoryId: data.subcategoryId,
			seriesId: data.seriesId,
			seriesPartNo: data.seriesPartNo,
			statusCode: data.statusCode,
			readPolicyCode: data.readPolicyCode,
			readRank: data.readRank,
			writePolicyCode: data.writePolicyCode,
			writeRank: data.writeRank,
			navHiddenModeCode: data.navHiddenModeCode,
			navHidden: data.navHidden,
			iconModeCode: data.iconModeCode,
			iconKeyId: data.iconKeyId,
			iconColorModeCode: data.iconColorModeCode,
			iconColorId: data.iconColorId,
			fieldValues,
			externalLinks,
			mediaReferences,
		});

		const doc = await findContentAdminDetailById(contentId);
		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to create content.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
