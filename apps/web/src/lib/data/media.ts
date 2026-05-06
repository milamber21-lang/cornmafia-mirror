//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/media.ts                                                                         ////
//// Language: TS                                                                                                  ////
//// DB-first admin media read helpers and taxonomy option loaders                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";

export type MediaCategoryOption = {
	id: string;
	label: string;
	slug: string;
};

export type MediaSubcategoryOption = {
	id: string;
	categoryId: string;
	label: string;
	slug: string;
	categorySlug: string;
};

export type MediaAdminItem = {
	id: string;
	categoryId: string | null;
	categoryName: string | null;
	categorySlug: string | null;
	subcategoryId: string | null;
	subcategoryName: string | null;
	subcategorySlug: string | null;
	userDiscordId: string | null;
	ownerUsername: string | null;
	ownerGlobalName: string | null;
	shared: boolean;
	filename: string;
	storedFilename: string;
	originalFilename: string;
	storageRelPath: string;
	url: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	alt: string;
	credit: string;
	createdAt: string;
	updatedAt: string;
};

export type SvgMediaOption = {
	id: string;
	filename: string;
	alt: string | null;
	url: string;
	mimeType: string;
	storageRelPath: string;
};

export type MediaSourceOption = {
	value: string;
	label: string;
};

export type MediaAdminSortBy =
	| "alt"
	| "originalFilename"
	| "category"
	| "subcategory"
	| "owner";

export type MediaAdminSortDir = "asc" | "desc";

type CategoryLookupRow = {
	category_id: string | number;
	title: string;
	slug: string;
};

type SubcategoryLookupRow = {
	subcategory_id: string | number;
	category_id: string | number;
	title: string;
	slug: string;
	category_slug: string;
};

type MediaAdminRow = {
	media_id: string | number;
	category_id: string | number | null;
	category_title: string | null;
	category_slug: string | null;
	subcategory_id: string | number | null;
	subcategory_title: string | null;
	subcategory_slug: string | null;
	owner_discord_id: string | null;
	owner_username: string | null;
	owner_global_name: string | null;
	is_shared: boolean;
	filename: string;
	original_filename: string;
	storage_rel_path: string;
	mime_type: string;
	size_bytes: string | number;
	width_px: number | null;
	height_px: number | null;
	alt_text: string | null;
	credit_text: string | null;
	created_dt: Date | string;
	updated_dt: Date | string;
};

export type MediaListParams = {
	page: number;
	pageSize: number;
	categoryId: string;
	subcategoryId: string;
	search: string;
	kind: string;
	source: string;
	sortBy?: MediaAdminSortBy;
	sortDir?: MediaAdminSortDir;
};

export type MediaListResult = {
	rows: MediaAdminItem[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
	sourceOptions: MediaSourceOption[];
};


function normalizeSortDir(sortDir: MediaAdminSortDir | undefined): MediaAdminSortDir {
	return sortDir === "desc" ? "desc" : "asc";
}

function buildMediaAdminOrderBy(
	sortBy: MediaAdminSortBy | undefined,
	sortDir: MediaAdminSortDir | undefined,
): string {
	const direction = normalizeSortDir(sortDir).toUpperCase();
	const nulls = direction === "ASC" ? "NULLS LAST" : "NULLS FIRST";

	switch (sortBy) {
		case "originalFilename":
			return `ORDER BY original_filename ${direction}, media_id ASC`;
		case "category":
			return `ORDER BY category_title ${direction} ${nulls}, original_filename ${direction}, media_id ASC`;
		case "subcategory":
			return `ORDER BY subcategory_title ${direction} ${nulls}, original_filename ${direction}, media_id ASC`;
		case "owner":
			return `ORDER BY CASE WHEN is_shared = TRUE THEN 'Shared' ELSE COALESCE(owner_global_name, owner_username, owner_discord_id, '') END ${direction}, original_filename ${direction}, media_id ASC`;
		case "alt":
		default:
			return `ORDER BY COALESCE(NULLIF(alt_text, ''), original_filename) ${direction}, media_id ASC`;
	}
}

function toIsoString(value: Date | string): string {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableString(value: string | number | null): string | null {
	if (value === null) {
		return null;
	}

	return String(value);
}

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function mapMediaAdminRow(row: MediaAdminRow): MediaAdminItem {
	return {
		id: String(row.media_id),
		categoryId: toNullableString(row.category_id),
		categoryName: row.category_title,
		categorySlug: row.category_slug,
		subcategoryId: toNullableString(row.subcategory_id),
		subcategoryName: row.subcategory_title,
		subcategorySlug: row.subcategory_slug,
		userDiscordId: row.owner_discord_id,
		ownerUsername: row.owner_username,
		ownerGlobalName: row.owner_global_name,
		shared: row.is_shared,
		filename: row.original_filename,
		storedFilename: row.filename,
		originalFilename: row.original_filename,
		storageRelPath: row.storage_rel_path,
		url: buildAdminMediaFileUrl(row.storage_rel_path),
		mimeType: row.mime_type,
		sizeBytes: toNumber(row.size_bytes),
		width: row.width_px,
		height: row.height_px,
		alt: row.alt_text ?? "",
		credit: row.credit_text ?? "",
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapSvgMediaOption(row: MediaAdminRow): SvgMediaOption {
	return {
		id: String(row.media_id),
		filename: row.original_filename,
		alt: row.alt_text,
		url: buildAdminMediaFileUrl(row.storage_rel_path),
		mimeType: row.mime_type,
		storageRelPath: row.storage_rel_path,
	};
}

export async function getMediaTaxonomyOptions(): Promise<{
	categories: MediaCategoryOption[];
	subcategories: MediaSubcategoryOption[];
}> {
	const [categoriesResult, subcategoriesResult] = await Promise.all([
		query<CategoryLookupRow>(
			`SELECT category_id, title, slug FROM web_view.web_categories_lookup ORDER BY title ASC`,
		),
		query<SubcategoryLookupRow>(
			`SELECT subcategory_id, category_id, title, slug, category_slug FROM web_view.web_subcategories_lookup ORDER BY title ASC`,
		),
	]);

	return {
		categories: categoriesResult.rows.map((row: CategoryLookupRow) => ({
			id: String(row.category_id),
			label: row.title,
			slug: row.slug,
		})),
		subcategories: subcategoriesResult.rows.map((row: SubcategoryLookupRow) => ({
			id: String(row.subcategory_id),
			categoryId: String(row.category_id),
			label: row.title,
			slug: row.slug,
			categorySlug: row.category_slug,
		})),
	};
}

export async function getMediaPlacementLookup(args: {
	categoryId: string | null;
	subcategoryId: string | null;
}): Promise<{
	categoryId: string | null;
	categorySlug: string | null;
	subcategoryId: string | null;
	subcategorySlug: string | null;
}> {
	let categorySlug: string | null = null;
	let subcategorySlug: string | null = null;

	if (args.categoryId) {
		const categoryResult = await query<CategoryLookupRow>(
			`SELECT category_id, title, slug FROM web_view.web_categories_lookup WHERE category_id = $1 LIMIT 1`,
			[args.categoryId],
		);
		const categoryRow = categoryResult.rows[0] ?? null;
		if (!categoryRow) {
			throw new Error(`Category ${args.categoryId} was not found.`);
		}

		categorySlug = categoryRow.slug;
	}

	if (args.subcategoryId) {
		const subcategoryResult = await query<SubcategoryLookupRow>(
			`SELECT subcategory_id, category_id, title, slug, category_slug FROM web_view.web_subcategories_lookup WHERE subcategory_id = $1 LIMIT 1`,
			[args.subcategoryId],
		);
		const subcategoryRow = subcategoryResult.rows[0] ?? null;
		if (!subcategoryRow) {
			throw new Error(`Subcategory ${args.subcategoryId} was not found.`);
		}

		if (args.categoryId && String(subcategoryRow.category_id) !== args.categoryId) {
			throw new Error(
				`Subcategory ${args.subcategoryId} does not belong to category ${args.categoryId}.`,
			);
		}

		subcategorySlug = subcategoryRow.slug;
		categorySlug = subcategoryRow.category_slug;
	}

	return {
		categoryId: args.categoryId,
		categorySlug,
		subcategoryId: args.subcategoryId,
		subcategorySlug,
	};
}

export async function findMediaAdminItemById(mediaId: string): Promise<MediaAdminItem | null> {
	const result = await query<MediaAdminRow>(
		[
			`SELECT`,
			`  media_id,`,
			`  category_id,`,
			`  category_title,`,
			`  category_slug,`,
			`  subcategory_id,`,
			`  subcategory_title,`,
			`  subcategory_slug,`,
			`  owner_discord_id,`,
			`  owner_username,`,
			`  owner_global_name,`,
			`  is_shared,`,
			`  filename,`,
			`  original_filename,`,
			`  storage_rel_path,`,
			`  mime_type,`,
			`  size_bytes,`,
			`  width_px,`,
			`  height_px,`,
			`  alt_text,`,
			`  credit_text,`,
			`  created_dt,`,
			`  updated_dt`,
			`FROM web_view.web_media_admin`,
			`WHERE media_id = $1`,
			`LIMIT 1`,
		].join("\n"),
		[mediaId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapMediaAdminRow(row) : null;
}

export async function listSvgMediaOptionsAdmin(): Promise<SvgMediaOption[]> {
	const result = await query<MediaAdminRow>(
		[
			`SELECT`,
			`  media_id,`,
			`  category_id,`,
			`  category_title,`,
			`  category_slug,`,
			`  subcategory_id,`,
			`  subcategory_title,`,
			`  subcategory_slug,`,
			`  owner_discord_id,`,
			`  owner_username,`,
			`  owner_global_name,`,
			`  is_shared,`,
			`  filename,`,
			`  original_filename,`,
			`  storage_rel_path,`,
			`  mime_type,`,
			`  size_bytes,`,
			`  width_px,`,
			`  height_px,`,
			`  alt_text,`,
			`  credit_text,`,
			`  created_dt,`,
			`  updated_dt`,
			`FROM web_view.web_media_admin`,
			`WHERE (mime_type IN ('image/svg+xml', 'image/svg', 'text/xml', 'application/xml') OR storage_rel_path ILIKE '%.svg')`,
			`ORDER BY COALESCE(NULLIF(alt_text, ''), original_filename) ASC, media_id ASC`,
		].join("\n"),
	);

	return result.rows.map(mapSvgMediaOption);
}

function addMediaPlacementFilters(args: {
	values: unknown[];
	whereParts: string[];
	categoryId: string;
	subcategoryId: string;
}): void {
	if (args.categoryId.trim().length > 0) {
		args.values.push(args.categoryId.trim());
		args.whereParts.push(`category_id = $${args.values.length}`);
	}

	if (args.subcategoryId.trim().length > 0) {
		args.values.push(args.subcategoryId.trim());
		args.whereParts.push(`subcategory_id = $${args.values.length}`);
	}
}

function addMediaKindFilter(args: {
	whereParts: string[];
	kind: string;
}): void {
	const kind = args.kind.trim().toLowerCase();

	if (kind === "image") {
		args.whereParts.push(
			`(mime_type ILIKE 'image/%' OR storage_rel_path ILIKE '%.apng' OR storage_rel_path ILIKE '%.avif' OR storage_rel_path ILIKE '%.gif' OR storage_rel_path ILIKE '%.jpg' OR storage_rel_path ILIKE '%.jpeg' OR storage_rel_path ILIKE '%.png' OR storage_rel_path ILIKE '%.svg' OR storage_rel_path ILIKE '%.webp')`,
		);
		return;
	}

	if (kind === "svg") {
		args.whereParts.push(
			`(mime_type IN ('image/svg+xml', 'image/svg', 'text/xml', 'application/xml') OR storage_rel_path ILIKE '%.svg')`,
		);
	}
}

function addMediaSourceFilter(args: {
	values: unknown[];
	whereParts: string[];
	source: string;
}): void {
	const source = args.source.trim();

	if (source === "shared") {
		args.whereParts.push(`is_shared = TRUE`);
		return;
	}

	if (source.startsWith("user:")) {
		const ownerUsername = source.slice("user:".length).trim();
		if (ownerUsername.length > 0) {
			args.values.push(ownerUsername);
			args.whereParts.push(`is_shared = FALSE AND owner_username = $${args.values.length}`);
		}
	}
}

async function listMediaSourceOptionsAdmin(params: {
	categoryId: string;
	subcategoryId: string;
	kind: string;
}): Promise<MediaSourceOption[]> {
	const values: unknown[] = [];
	const whereParts: string[] = [];

	addMediaPlacementFilters({
		values,
		whereParts,
		categoryId: params.categoryId,
		subcategoryId: params.subcategoryId,
	});

	addMediaKindFilter({
		whereParts,
		kind: params.kind,
	});

	const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

	const result = await query<{ source_value: string; source_label: string }>(
		[
			`SELECT source_value,`,
			`       source_label`,
			`FROM (SELECT CASE WHEN is_shared = TRUE THEN 'shared'`,
			`                  WHEN COALESCE(owner_username, '') <> '' THEN 'user:' || owner_username`,
			`                  ELSE NULL`,
			`                  END AS source_value,`,
			`             CASE WHEN is_shared = TRUE THEN 'Shared'`,
			`                  WHEN COALESCE(owner_username, '') <> '' THEN owner_username`,
			`                  ELSE NULL`,
			`                  END AS source_label`,
			`      FROM web_view.web_media_admin`,
			whereClause,
			`     ) src`,
			`WHERE src.source_value IS NOT NULL`,
			`GROUP BY src.source_value, src.source_label`,
			`ORDER BY CASE WHEN src.source_value = 'shared' THEN 0 ELSE 1 END ASC,`,
			`         src.source_label ASC`,
		]
			.filter(Boolean)
			.join("\n"),
		values,
	);

	return result.rows.map((row) => ({
		value: row.source_value,
		label: row.source_label,
	}));
}

export async function listMediaAdmin(params: MediaListParams): Promise<MediaListResult> {
	const requestedPage = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
	const pageSize = Number.isFinite(params.pageSize)
		? Math.min(Math.max(params.pageSize, 1), 100)
		: 20;
	const values: unknown[] = [];
	const whereParts: string[] = [];
	const sourceOptions = await listMediaSourceOptionsAdmin({
		categoryId: params.categoryId,
		subcategoryId: params.subcategoryId,
		kind: params.kind,
	});

	addMediaPlacementFilters({
		values,
		whereParts,
		categoryId: params.categoryId,
		subcategoryId: params.subcategoryId,
	});

	addMediaSourceFilter({
		values,
		whereParts,
		source: params.source,
	});

	if (params.search.trim().length > 0) {
		const searchValue = `%${params.search.trim()}%`;
		values.push(searchValue);
		whereParts.push(
			`(alt_text ILIKE $${values.length} OR original_filename ILIKE $${values.length} OR storage_rel_path ILIKE $${values.length} OR COALESCE(owner_username, '') ILIKE $${values.length} OR COALESCE(owner_global_name, '') ILIKE $${values.length})`,
		);
	}

	addMediaKindFilter({
		whereParts,
		kind: params.kind,
	});

	const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

	const totalResult = await query<{ total_docs: string | number }>(
		`SELECT COUNT(*) AS total_docs FROM web_view.web_media_admin ${whereClause}`,
		values,
	);
	const totalDocs = toNumber(totalResult.rows[0]?.total_docs ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 1;
	const page = totalDocs > 0 ? Math.min(requestedPage, totalPages) : 1;
	const offset = (page - 1) * pageSize;
	const orderBy = buildMediaAdminOrderBy(params.sortBy, params.sortDir);

	const rowsResult = await query<MediaAdminRow>(
		[
			`SELECT`,
			`  media_id,`,
			`  category_id,`,
			`  category_title,`,
			`  category_slug,`,
			`  subcategory_id,`,
			`  subcategory_title,`,
			`  subcategory_slug,`,
			`  owner_discord_id,`,
			`  owner_username,`,
			`  owner_global_name,`,
			`  is_shared,`,
			`  filename,`,
			`  original_filename,`,
			`  storage_rel_path,`,
			`  mime_type,`,
			`  size_bytes,`,
			`  width_px,`,
			`  height_px,`,
			`  alt_text,`,
			`  credit_text,`,
			`  created_dt,`,
			`  updated_dt`,
			`FROM web_view.web_media_admin`,
			whereClause,
			orderBy,
			`LIMIT $${values.length + 1}`,
			`OFFSET $${values.length + 2}`,
		]
			.filter(Boolean)
			.join("\n"),
		[...values, pageSize, offset],
	);

	return {
		rows: rowsResult.rows.map(mapMediaAdminRow),
		page,
		pageSize,
		totalDocs,
		totalPages,
		sourceOptions,
	};
}
