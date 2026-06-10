//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/public-series.ts                                                               ////
//// Language: TS                                                                                               ////
//// DB-first public series landing resolver and strict mapper for /series routes.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAppMediaFileUrl } from "@/lib/helpers/media-url";
import type { PublicRendererCode, PublicRoutePrefix } from "@/lib/data/public-content";

type PublicSeriesDbRow = {
	doc: unknown;
};

export type PublicSeriesIconMedia = {
	id: string;
	url: string | null;
	filename: string | null;
	originalFilename: string | null;
	mimeType: string | null;
	storageRelPath: string | null;
};

export type PublicSeriesIconKey = {
	key: string | null;
	label: string | null;
	source: "lucide" | "media" | null;
	lucideName: string | null;
	iconMedia: PublicSeriesIconMedia | null;
};

export type PublicSeriesIconColor = {
	preview: string | null;
};

export type PublicSeriesDoc = {
	id: string;
	title: string;
	slug: string;
	description: string | null;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string | null;
	subcategoryTitle: string | null;
	subcategorySlug: string | null;
	href: string;
	iconKey: PublicSeriesIconKey | null;
	iconColor: PublicSeriesIconColor | null;
};

export type PublicSeriesEpisode = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	partNo: number | null;
	templateId: string;
	templateLabel: string;
	contentKindCode: string;
	contentKindLabel: string;
	rendererCode: PublicRendererCode;
	publicRoutePrefix: PublicRoutePrefix | null;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	href: string;
	publishedAt: string | null;
	updatedAt: string | null;
	iconKey: PublicSeriesIconKey | null;
	iconColor: PublicSeriesIconColor | null;
};

export type PublicSeriesResult = {
	series: PublicSeriesDoc;
	episodes: PublicSeriesEpisode[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" && fieldValue.trim().length > 0
		? fieldValue
		: null;
}

function getNullableString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" ? fieldValue : null;
}

function getNumber(value: Record<string, unknown>, key: string): number | null {
	const fieldValue = value[key];
	if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
		return fieldValue;
	}

	if (typeof fieldValue === "string" && fieldValue.trim().length > 0) {
		const parsed = Number(fieldValue.trim());
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function getArray(value: Record<string, unknown>, key: string): unknown[] {
	const fieldValue = value[key];
	return Array.isArray(fieldValue) ? fieldValue : [];
}

function normalizeRoutePrefix(value: unknown): PublicRoutePrefix | null {
	return value === "map" ||
		value === "tool" ||
		value === "app" ||
		value === "event" ||
		value === "custom" ||
		value === "info" ||
		value === "video"
		? value
		: null;
}

function normalizeRendererCode(value: unknown): PublicRendererCode | null {
	return value === "page" ||
		value === "map" ||
		value === "tool" ||
		value === "app" ||
		value === "event" ||
		value === "custom" ||
		value === "youtube" ||
		value === "stream" ||
		value === "calendar"
		? value
		: null;
}

function normalizeIconSource(value: unknown): "lucide" | "media" | null {
	return value === "lucide" || value === "media" ? value : null;
}

function mapIconMedia(value: unknown): PublicSeriesIconMedia | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	if (!id) {
		return null;
	}

	const storageRelPath = getNullableString(value, "storageRelPath");

	return {
		id,
		url: storageRelPath ? buildAppMediaFileUrl(storageRelPath) : null,
		filename: getNullableString(value, "filename"),
		originalFilename: getNullableString(value, "originalFilename"),
		mimeType: getNullableString(value, "mimeType"),
		storageRelPath,
	};
}

function mapIconKey(value: unknown): PublicSeriesIconKey | null {
	if (!isRecord(value)) {
		return null;
	}

	const key = getString(value, "key");
	const source = normalizeIconSource(value.source);

	if (!key || !source) {
		return null;
	}

	return {
		key,
		label: getNullableString(value, "label"),
		source,
		lucideName: getNullableString(value, "lucideName"),
		iconMedia: mapIconMedia(value.iconMedia),
	};
}

function mapIconColor(value: unknown): PublicSeriesIconColor | null {
	if (!isRecord(value)) {
		return null;
	}

	return {
		preview: getNullableString(value, "preview"),
	};
}

function mapSeriesDoc(value: unknown): PublicSeriesDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");
	const categoryId = getString(value, "categoryId");
	const categoryTitle = getString(value, "categoryTitle");
	const categorySlug = getString(value, "categorySlug");
	const href = getString(value, "href");

	if (!id || !title || !slug || !categoryId || !categoryTitle || !categorySlug || !href) {
		return null;
	}

	return {
		id,
		title,
		slug,
		description: getNullableString(value, "description"),
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId: getNullableString(value, "subcategoryId"),
		subcategoryTitle: getNullableString(value, "subcategoryTitle"),
		subcategorySlug: getNullableString(value, "subcategorySlug"),
		href,
		iconKey: mapIconKey(value.iconKey),
		iconColor: mapIconColor(value.iconColor),
	};
}

function mapEpisode(value: unknown): PublicSeriesEpisode | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");
	const templateId = getString(value, "templateId");
	const templateLabel = getString(value, "templateLabel");
	const contentKindCode = getString(value, "contentKindCode");
	const contentKindLabel = getString(value, "contentKindLabel");
	const rendererCode = normalizeRendererCode(value.rendererCode);
	const categoryId = getString(value, "categoryId");
	const categoryTitle = getString(value, "categoryTitle");
	const categorySlug = getString(value, "categorySlug");
	const subcategoryId = getString(value, "subcategoryId");
	const subcategoryTitle = getString(value, "subcategoryTitle");
	const subcategorySlug = getString(value, "subcategorySlug");
	const href = getString(value, "href");

	if (
		!id ||
		!title ||
		!slug ||
		!templateId ||
		!templateLabel ||
		!contentKindCode ||
		!contentKindLabel ||
		!rendererCode ||
		!categoryId ||
		!categoryTitle ||
		!categorySlug ||
		!subcategoryId ||
		!subcategoryTitle ||
		!subcategorySlug ||
		!href
	) {
		return null;
	}

	return {
		id,
		title,
		slug,
		summary: getNullableString(value, "summary"),
		partNo: getNumber(value, "partNo"),
		templateId,
		templateLabel,
		contentKindCode,
		contentKindLabel,
		rendererCode,
		publicRoutePrefix: normalizeRoutePrefix(value.publicRoutePrefix),
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		href,
		publishedAt: getNullableString(value, "publishedAt"),
		updatedAt: getNullableString(value, "updatedAt"),
		iconKey: mapIconKey(value.iconKey),
		iconColor: mapIconColor(value.iconColor),
	};
}

function mapPublicSeriesResult(value: unknown): PublicSeriesResult | null {
	if (!isRecord(value)) {
		return null;
	}

	const series = mapSeriesDoc(value.series);
	if (!series) {
		return null;
	}

	const episodes = getArray(value, "episodes")
		.map(mapEpisode)
		.filter((episode): episode is PublicSeriesEpisode => episode !== null);

	return {
		series,
		episodes,
	};
}

export async function findPublicSeriesBySlug(args: {
	actorDiscordId: string | null;
	seriesSlug: string;
}): Promise<PublicSeriesResult | null> {
	const result = await query<PublicSeriesDbRow>(
		`
			SELECT web_api.web_series_public_find_by_slug($1, $2) AS doc
		`,
		[args.actorDiscordId, args.seriesSlug],
	);

	return mapPublicSeriesResult(result.rows[0]?.doc ?? null);
}
