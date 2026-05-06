//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/member-content.ts                                                              ////
//// Language: TS                                                                                               ////
//// DB-first member content list, create/edit metadata, and mutation helpers for the member workspace.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { pg, query } from "@/lib/data/pg";
import type {
	ContentMediaOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
	ContentTemplateOption,
} from "@/lib/data/content";
import type { MemberAuthorableCollection } from "@/lib/data/member-authoring";
import { extractContentMediaReferences } from "@/lib/helpers/content-media-references";
import {
	buildContentExternalLinkPayload,
	buildContentFieldValuePayload,
	type ContentExternalLinkDbInput,
	type ContentFieldLabelPositionCode,
	type ContentFieldLabelSeparatorCode,
	type ContentFieldLabelStyleCode,
	type ContentFieldLayoutAlignCode,
	type ContentFieldLayoutWidthCode,
	type ContentFieldRenderDestinationCode,
	type ContentFieldValueDbInput,
} from "@/lib/helpers/content-field-values";
import { buildAppMediaFileUrl } from "@/lib/helpers/media-url";

export type MemberContentStatusCode = "draft" | "published" | "archived";
export type MemberContentCreateStatusCode = "draft" | "published";
export type MemberContentEditStatusCode = "draft" | "published" | "archived";

export type MemberContentItem = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	statusCode: MemberContentStatusCode;
	templateId: string;
	templateCode: string;
	templateLabel: string;
	contentKindCode: string;
	contentKindLabel: string;
	rendererCode: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	seriesId: string | null;
	seriesTitle: string | null;
	seriesPartNo: number | null;
	publicHref: string | null;
	canViewPublic: boolean;
	publishedAt: string | null;
	archivedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export type MemberContentCollectionResult = {
	collection: MemberAuthorableCollection;
	rows: MemberContentItem[];
};

export type MemberContentDetail = MemberContentItem & {
	fieldValues: Record<string, unknown>;
};

export type MemberContentCreateSeriesOption = {
	id: string;
	title: string;
	slug: string;
	description: string;
	categoryId: string;
	subcategoryId: string;
	nextPartNo: number;
};

export type MemberContentCreateMeta = {
	collection: MemberAuthorableCollection;
	templates: ContentTemplateOption[];
	fields: ContentTemplateField[];
	fieldOptions: ContentTemplateFieldOption[];
	media: ContentMediaOption[];
	series: MemberContentCreateSeriesOption[];
};

export type MemberContentEditMeta = MemberContentCreateMeta & {
	doc: MemberContentDetail;
};

export type MemberContentCreateInput = {
	actorDiscordId: string;
	templateId: string;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: string;
	subcategoryId: string;
	seriesId: string | null;
	seriesPartNo: number | null;
	newSeriesTitle: string | null;
	newSeriesDescription: string | null;
	statusCode: MemberContentCreateStatusCode;
	templateFields: ContentTemplateField[];
	fieldValues: Record<string, unknown>;
};

export type MemberContentUpdateInput = {
	actorDiscordId: string;
	contentId: string;
	templateId: string;
	title: string;
	slug: string;
	summary: string | null;
	seriesId: string | null;
	seriesPartNo: number | null;
	newSeriesTitle: string | null;
	newSeriesDescription: string | null;
	statusCode: MemberContentEditStatusCode;
	templateFields: ContentTemplateField[];
	fieldValues: Record<string, unknown>;
};

type JsonPayloadRow = {
	payload: unknown;
};

type IdRow = {
	content_id: string | number;
};

type SeriesIdRow = {
	series_id: string | number;
};

type ContentMediaReferenceDbInput = {
	media_id?: number | null;
	storage_rel_path?: string | null;
	usage_code: string;
	display_order: number;
	caption?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function readNullableString(record: Record<string, unknown>, key: string): string | null {
	const value = record[key];
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
	const value = record[key];
	return typeof value === "boolean" ? value : false;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
	const value = record[key];
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function readDateString(record: Record<string, unknown>, key: string): string | null {
	const value = record[key];
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}
	return null;
}

function normalizeStatusCode(value: string): MemberContentStatusCode | null {
	if (value === "draft" || value === "published" || value === "archived") {
		return value;
	}
	return null;
}

function normalizeRenderDestination(value: string): ContentFieldRenderDestinationCode {
	if (
		value === "seo" ||
		value === "hero" ||
		value === "top" ||
		value === "left" ||
		value === "right" ||
		value === "bottom" ||
		value === "hidden"
	) {
		return value;
	}
	return "main";
}

function normalizeLayoutWidth(value: string): ContentFieldLayoutWidthCode {
	return value === "half" || value === "third" || value === "full" ? value : "full";
}

function normalizeLayoutAlign(value: string): ContentFieldLayoutAlignCode {
	return value === "left" || value === "center" || value === "right" || value === "stretch"
		? value
		: "stretch";
}

function normalizeLabelStyle(value: string): ContentFieldLabelStyleCode {
	return value === "title" || value === "text" || value === "muted" || value === "label"
		? value
		: "label";
}

function normalizeLabelPosition(value: string): ContentFieldLabelPositionCode {
	return value === "inline" ? "inline" : "above";
}

function normalizeLabelSeparator(value: string): ContentFieldLabelSeparatorCode {
	return value === "none" || value === "dash" || value === "colon" ? value : "colon";
}

function mapCollection(value: unknown): MemberAuthorableCollection | null {
	if (!isRecord(value)) {
		return null;
	}

	const categoryId = readString(value, "categoryId");
	const categoryTitle = readString(value, "categoryTitle");
	const categorySlug = readString(value, "categorySlug");
	const subcategoryId = readString(value, "subcategoryId");
	const subcategoryTitle = readString(value, "subcategoryTitle");
	const subcategorySlug = readString(value, "subcategorySlug");
	const label = readString(value, "label");

	if (!categoryId || !subcategoryId || !categorySlug || !subcategorySlug) {
		return null;
	}

	return {
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		label: label || [categoryTitle, subcategoryTitle].filter(Boolean).join(" / "),
	};
}

function mapContent(value: unknown): MemberContentItem | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const slug = readString(value, "slug");
	const statusCode = normalizeStatusCode(readString(value, "statusCode"));
	const templateId = readString(value, "templateId");
	const templateCode = readString(value, "templateCode");
	const templateLabel = readString(value, "templateLabel");
	const contentKindCode = readString(value, "contentKindCode");
	const contentKindLabel = readString(value, "contentKindLabel");
	const rendererCode = readString(value, "rendererCode");
	const categoryId = readString(value, "categoryId");
	const categoryTitle = readString(value, "categoryTitle");
	const categorySlug = readString(value, "categorySlug");
	const subcategoryId = readString(value, "subcategoryId");
	const subcategoryTitle = readString(value, "subcategoryTitle");
	const subcategorySlug = readString(value, "subcategorySlug");
	const createdAt = readDateString(value, "createdAt");
	const updatedAt = readDateString(value, "updatedAt");

	if (
		!id ||
		!title ||
		!slug ||
		!statusCode ||
		!templateId ||
		!templateCode ||
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
		!createdAt ||
		!updatedAt
	) {
		return null;
	}

	return {
		id,
		title,
		slug,
		summary: readString(value, "summary"),
		statusCode,
		templateId,
		templateCode,
		templateLabel,
		contentKindCode,
		contentKindLabel,
		rendererCode,
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		seriesId: readNullableString(value, "seriesId"),
		seriesTitle: readNullableString(value, "seriesTitle"),
		seriesPartNo: readNumber(value, "seriesPartNo"),
		publicHref: readNullableString(value, "publicHref"),
		canViewPublic: readBoolean(value, "canViewPublic"),
		publishedAt: readDateString(value, "publishedAt"),
		archivedAt: readDateString(value, "archivedAt"),
		createdAt,
		updatedAt,
	};
}

function mapContentDetail(value: unknown): MemberContentDetail | null {
	const row = mapContent(value);
	if (!row || !isRecord(value)) {
		return null;
	}

	return {
		...row,
		fieldValues: isRecord(value.fieldValues) ? value.fieldValues : {},
	};
}

function mapRows(value: unknown): MemberContentItem[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((row) => {
		const mapped = mapContent(row);
		return mapped ? [mapped] : [];
	});
}

function mapCollectionResult(value: unknown): MemberContentCollectionResult | null {
	if (!isRecord(value)) {
		return null;
	}

	const collection = mapCollection(value.collection);
	if (!collection) {
		return null;
	}

	return {
		collection,
		rows: mapRows(value.rows),
	};
}

function mapTemplate(value: unknown): ContentTemplateOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const code = readString(value, "code");
	const key = readString(value, "key") || code;
	const label = readString(value, "label");
	const contentKindCode = readString(value, "contentKindCode");
	const contentKindLabel = readString(value, "contentKindLabel");
	const surfaceScopeCode = readString(value, "surfaceScopeCode");

	if (!id || !code || !label || !contentKindCode || !surfaceScopeCode) {
		return null;
	}

	return {
		id,
		code,
		key,
		label,
		contentKindCode,
		contentKindLabel,
		surfaceScopeCode,
		requiresSeries: readBoolean(value, "requiresSeries"),
	};
}

function mapFieldToolCodes(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => (typeof item === "string" && item ? [item] : []));
}

function mapField(value: unknown): ContentTemplateField | null {
	if (!isRecord(value)) {
		return null;
	}

	const templateFieldId = readNumber(value, "templateFieldId");
	const id = readString(value, "id");
	const templateId = readString(value, "templateId");
	const templateCode = readString(value, "templateCode");
	const templateLabel = readString(value, "templateLabel");
	const contentKindCode = readString(value, "contentKindCode");
	const surfaceScopeCode = readString(value, "surfaceScopeCode");
	const fieldListId = readString(value, "fieldListId");
	const fieldListCode = readString(value, "fieldListCode");
	const label = readString(value, "label");
	const fieldTypeCode = readString(value, "fieldTypeCode");
	const fieldTypeLabel = readString(value, "fieldTypeLabel");
	const valueColumnName = readString(value, "valueColumnName");

	if (
		templateFieldId === null ||
		!id ||
		!templateId ||
		!templateCode ||
		!templateLabel ||
		!contentKindCode ||
		!surfaceScopeCode ||
		!fieldListId ||
		!fieldListCode ||
		!label ||
		!fieldTypeCode ||
		!fieldTypeLabel ||
		!valueColumnName
	) {
		return null;
	}

	const labelStyleCode = normalizeLabelStyle(readString(value, "labelStyleCode"));

	return {
		id,
		templateFieldId,
		templateId,
		templateCode,
		templateLabel,
		contentKindCode,
		surfaceScopeCode,
		requiresSeries: readBoolean(value, "requiresSeries"),
		fieldListId,
		fieldListCode,
		label,
		helpText: readNullableString(value, "helpText"),
		fieldTypeCode,
		fieldTypeLabel,
		renderDestinationCode: normalizeRenderDestination(readString(value, "renderDestinationCode")),
		layoutWidthCode: normalizeLayoutWidth(readString(value, "layoutWidthCode")),
		layoutAlignCode: normalizeLayoutAlign(readString(value, "layoutAlignCode")),
		showLabel: readBoolean(value, "showLabel"),
		labelStyleCode,
		labelPositionCode: normalizeLabelPosition(readString(value, "labelPositionCode")),
		labelSeparatorCode: normalizeLabelSeparator(readString(value, "labelSeparatorCode")),
		valueColumnName,
		displayOrder: readNumber(value, "displayOrder") ?? 0,
		isRequired: readBoolean(value, "isRequired"),
		isEnabled: readBoolean(value, "isEnabled"),
		optionCount: readNumber(value, "optionCount") ?? 0,
		fieldToolCodes: mapFieldToolCodes(value.fieldToolCodes),
	};
}

function mapFieldOption(value: unknown): ContentTemplateFieldOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const fieldListId = readString(value, "fieldListId");
	const fieldListCode = readString(value, "fieldListCode");
	const optionKey = readString(value, "optionKey");
	const label = readString(value, "label");

	if (!id || !fieldListId || !fieldListCode || !optionKey || !label) {
		return null;
	}

	return {
		id,
		fieldListId,
		fieldListCode,
		optionKey,
		label,
		displayOrder: readNumber(value, "displayOrder") ?? 0,
	};
}

function mapMedia(value: unknown): ContentMediaOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const originalFilename = readString(value, "originalFilename");
	const storageRelPath = readString(value, "storageRelPath");

	if (!id || !originalFilename || !storageRelPath) {
		return null;
	}

	const altText = readNullableString(value, "altText");

	return {
		id,
		label: altText ? `${originalFilename} - ${altText}` : originalFilename,
		originalFilename,
		altText,
		url: buildAppMediaFileUrl(storageRelPath),
		mimeType: readNullableString(value, "mimeType"),
		sizeBytes: readNumber(value, "sizeBytes"),
		width: readNumber(value, "width"),
		height: readNumber(value, "height"),
		categoryId: readNullableString(value, "categoryId"),
		subcategoryId: readNullableString(value, "subcategoryId"),
	};
}

function mapSeries(value: unknown): MemberContentCreateSeriesOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const slug = readString(value, "slug");
	const categoryId = readString(value, "categoryId");
	const subcategoryId = readString(value, "subcategoryId");

	if (!id || !title || !categoryId || !subcategoryId) {
		return null;
	}

	return {
		id,
		title,
		slug,
		description: readString(value, "description"),
		categoryId,
		subcategoryId,
		nextPartNo: Math.max(1, readNumber(value, "nextPartNo") ?? 1),
	};
}

function mapArray<T>(value: unknown, mapper: (item: unknown) => T | null): T[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => {
		const mapped = mapper(item);
		return mapped ? [mapped] : [];
	});
}

function mapCreateMeta(value: unknown): MemberContentCreateMeta | null {
	if (!isRecord(value)) {
		return null;
	}

	const collection = mapCollection(value.collection);
	if (!collection) {
		return null;
	}

	return {
		collection,
		templates: mapArray(value.templates, mapTemplate),
		fields: mapArray(value.fields, mapField),
		fieldOptions: mapArray(value.fieldOptions, mapFieldOption),
		media: mapArray(value.media, mapMedia),
		series: mapArray(value.series, mapSeries),
	};
}
function mapEditMeta(value: unknown): MemberContentEditMeta | null {
	const base = mapCreateMeta(value);
	if (!base || !isRecord(value)) {
		return null;
	}

	const doc = mapContentDetail(value.doc);
	if (!doc) {
		return null;
	}

	return {
		...base,
		doc,
	};
}


function mediaReferencePayload(
	mediaReferences: ReturnType<typeof extractContentMediaReferences>,
): ContentMediaReferenceDbInput[] {
	return mediaReferences.map((reference) => ({
		media_id: reference.mediaId,
		storage_rel_path: reference.storageRelPath,
		usage_code: reference.usageCode,
		display_order: reference.displayOrder,
		caption: reference.caption,
	}));
}

export async function listMemberContent(actorDiscordId: string): Promise<MemberContentItem[]> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_content_list($1) AS payload`,
		[actorDiscordId],
	);
	return mapRows(result.rows[0]?.payload);
}

export async function findMemberContentCollectionByPath(args: {
	actorDiscordId: string;
	categorySlug: string;
	subcategorySlug: string;
}): Promise<MemberContentCollectionResult | null> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_content_collection_by_path($1, $2, $3) AS payload`,
		[args.actorDiscordId, args.categorySlug, args.subcategorySlug],
	);
	return mapCollectionResult(result.rows[0]?.payload ?? null);
}

export async function findMemberContentCreateMetaByPath(args: {
	actorDiscordId: string;
	categorySlug: string;
	subcategorySlug: string;
}): Promise<MemberContentCreateMeta | null> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_content_create_meta($1, $2, $3) AS payload`,
		[args.actorDiscordId, args.categorySlug, args.subcategorySlug],
	);
	return mapCreateMeta(result.rows[0]?.payload ?? null);
}

export async function findMemberContentEditMeta(args: {
	actorDiscordId: string;
	contentId: string;
}): Promise<MemberContentEditMeta | null> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_content_edit_meta($1, $2::bigint) AS payload`,
		[args.actorDiscordId, args.contentId],
	);
	return mapEditMeta(result.rows[0]?.payload ?? null);
}

export async function createMemberContent(args: MemberContentCreateInput): Promise<string | null> {
	const fieldValues: ContentFieldValueDbInput[] = buildContentFieldValuePayload(
		args.templateFields,
		args.fieldValues,
	);
	const externalLinks: ContentExternalLinkDbInput[] = buildContentExternalLinkPayload(
		args.templateFields,
		args.fieldValues,
	);
	const mediaReferences = mediaReferencePayload(
		extractContentMediaReferences(args.templateFields, fieldValues),
	);

	const client = await pg.connect();

	try {
		await client.query("BEGIN");

		let seriesId = args.seriesId;
		if (args.newSeriesTitle !== null) {
			const seriesResult = await client.query<SeriesIdRow>(
				`SELECT * FROM web_api.web_member_series_create($1, $2, $3, $4::bigint, $5::bigint)`,
				[
					args.actorDiscordId,
					args.newSeriesTitle,
					args.newSeriesDescription ?? "",
					args.categoryId,
					args.subcategoryId,
				],
			);
			const value = seriesResult.rows[0]?.series_id;
			seriesId = typeof value === "string" || typeof value === "number" ? String(value) : null;
		}

		const result = await client.query<IdRow>(
			`
				SELECT content_id
				FROM web_api.web_member_content_create(
					$1,
					$2::bigint,
					$3,
					$4,
					$5,
					$6::bigint,
					$7::bigint,
					$8::bigint,
					$9::integer,
					$10,
					$11::jsonb,
					$12::jsonb,
					$13::jsonb
				)
			`,
			[
				args.actorDiscordId,
				args.templateId,
				args.title,
				args.slug,
				args.summary,
				args.categoryId,
				args.subcategoryId,
				seriesId,
				args.seriesPartNo,
				args.statusCode,
				JSON.stringify(fieldValues),
				JSON.stringify(externalLinks),
				JSON.stringify(mediaReferences),
			],
		);

		await client.query("COMMIT");

		const value = result.rows[0]?.content_id;
		return typeof value === "string" || typeof value === "number" ? String(value) : null;
	} catch (error: unknown) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
}

export async function updateMemberContent(args: MemberContentUpdateInput): Promise<string | null> {
	const fieldValues: ContentFieldValueDbInput[] = buildContentFieldValuePayload(
		args.templateFields,
		args.fieldValues,
	);
	const externalLinks: ContentExternalLinkDbInput[] = buildContentExternalLinkPayload(
		args.templateFields,
		args.fieldValues,
	);
	const mediaReferences = mediaReferencePayload(
		extractContentMediaReferences(args.templateFields, fieldValues),
	);

	const client = await pg.connect();

	try {
		await client.query("BEGIN");

		let seriesId = args.seriesId;
		if (args.newSeriesTitle !== null) {
			const editMeta = await client.query<JsonPayloadRow>(
				`SELECT web_api.web_member_content_edit_meta($1, $2::bigint) AS payload`,
				[args.actorDiscordId, args.contentId],
			);
			const mapped = mapEditMeta(editMeta.rows[0]?.payload ?? null);
			if (!mapped) {
				throw new Error("Content is not available for member editing.");
			}

			const seriesResult = await client.query<SeriesIdRow>(
				`SELECT * FROM web_api.web_member_series_create($1, $2, $3, $4::bigint, $5::bigint)`,
				[
					args.actorDiscordId,
					args.newSeriesTitle,
					args.newSeriesDescription ?? "",
					mapped.collection.categoryId,
					mapped.collection.subcategoryId,
				],
			);
			const value = seriesResult.rows[0]?.series_id;
			seriesId = typeof value === "string" || typeof value === "number" ? String(value) : null;
		}

		const result = await client.query<IdRow>(
			`
				SELECT content_id
				FROM web_api.web_member_content_update(
					$1,
					$2::bigint,
					$3,
					$4,
					$5,
					$6::bigint,
					$7::integer,
					$8,
					$9::jsonb,
					$10::jsonb,
					$11::jsonb
				)
			`,
			[
				args.actorDiscordId,
				args.contentId,
				args.title,
				args.slug,
				args.summary,
				seriesId,
				args.seriesPartNo,
				args.statusCode,
				JSON.stringify(fieldValues),
				JSON.stringify(externalLinks),
				JSON.stringify(mediaReferences),
			],
		);

		await client.query("COMMIT");

		const value = result.rows[0]?.content_id;
		return typeof value === "string" || typeof value === "number" ? String(value) : null;
	} catch (error: unknown) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
}

