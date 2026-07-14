//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/series.ts                                                                         ////
//// Language: TS                                                                                                  ////
//// DB-first admin series read helpers and lookup loaders                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";

export type SeriesAdminSortBy =
	| "icon"
	| "title"
	| "category"
	| "subcategory"
	| "read"
	| "write"
	| "author";

export type SeriesAdminSortDir = "asc" | "desc";

export type SeriesAdminDbRow = {
	series_id: number | string;
	title: string;
	slug: string;
	description: string | null;
	category_id: number | string;
	category_title: string;
	category_slug: string;
	subcategory_id: number | string | null;
	subcategory_title: string | null;
	subcategory_slug: string | null;
	author_discord_id: string | null;
	author_username: string | null;
	read_policy_code: "inherit" | "public" | "min_rank" | "equal_rank";
	read_rank: number | null;
	read_effective_policy_code: "public" | "min_rank" | "equal_rank";
	read_effective_rank: number | null;
	write_policy_code: "inherit" | "min_rank" | "equal_rank";
	write_rank: number | null;
	write_effective_policy_code: "min_rank" | "equal_rank";
	write_effective_rank: number;
	icon_key_id: number | string;
	icon_key_key: string;
	icon_key_label: string;
	icon_key_source_code: "lucide" | "media";
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
	icon_media_filename: string | null;
	icon_media_original_filename: string | null;
	icon_media_mime_type: string | null;
	icon_color_id: number | string;
	icon_color_key: string;
	icon_color_label: string;
	icon_color_preview: string;
	created_by_discord_id: string | null;
	created_dt: string | Date;
	updated_by_discord_id: string | null;
	updated_dt: string | Date;
};

export type SeriesAdminItem = {
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
	authorDiscordId: string | null;
	authorUsername: string | null;
	readPolicy: "inherit" | "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	readEffectivePolicy: "public" | "rank_at_least" | "rank_equal";
	readEffectiveMinRank: number | null;
	writePolicy: "inherit" | "rank_at_least" | "rank_equal";
	writeMinRank: number | null;
	writeEffectivePolicy: "rank_at_least" | "rank_equal";
	writeEffectiveMinRank: number;
	iconKey: {
		id: string;
		key: string;
		label: string;
		source: "lucide" | "media";
		lucideName: string | null;
		iconMedia: {
			id: string;
			url: string | null;
			filename: string | null;
			originalFilename: string | null;
			mimeType: string | null;
			storageRelPath: string | null;
		} | null;
	} | null;
	iconColor: {
		id: string;
		key: string;
		label: string;
		preview: string;
	} | null;
	createdByDiscordId: string | null;
	createdAt: string;
	updatedByDiscordId: string | null;
	updatedAt: string;
};

export type SeriesLookupItem = {
	id: string;
	title: string;
	slug: string;
	categoryId: string;
	subcategoryId: string | null;
	readEffectivePolicy: "public" | "rank_at_least" | "rank_equal";
	readEffectiveMinRank: number | null;
	iconKeyId: string;
	iconColorId: string;
};

type SeriesLookupDbRow = {
	series_id: number | string;
	title: string;
	slug: string;
	category_id: number | string;
	subcategory_id: number | string | null;
	read_effective_policy_code: "public" | "min_rank" | "equal_rank";
	read_effective_rank: number | null;
	icon_key_id: number | string;
	icon_color_id: number | string;
};

type CountRow = {
	total_count: number | string;
};

export type SeriesAdminListPage = {
	rows: SeriesAdminItem[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

const SERIES_ADMIN_SELECT = `
	SELECT series_id,
	       title,
	       slug,
	       description,
	       category_id,
	       category_title,
	       category_slug,
	       subcategory_id,
	       subcategory_title,
	       subcategory_slug,
	       author_discord_id,
	       author_username,
	       read_policy_code,
	       read_rank,
	       read_effective_policy_code,
	       read_effective_rank,
	       write_policy_code,
	       write_rank,
	       write_effective_policy_code,
	       write_effective_rank,
	       icon_key_id,
	       icon_key_key,
	       icon_key_label,
	       icon_key_source_code,
	       icon_key_lucide_name,
	       icon_media_id,
	       icon_media_storage_rel_path,
	       icon_media_filename,
	       icon_media_original_filename,
	       icon_media_mime_type,
	       icon_color_id,
	       icon_color_key,
	       icon_color_label,
	       icon_color_preview,
	       created_by_discord_id,
	       created_dt,
	       updated_by_discord_id,
	       updated_dt
	FROM web_view.web_series_admin
`;

const SERIES_ADMIN_FILTER_WHERE = `
	WHERE ($1 = '' OR title ILIKE '%' || $1 || '%' OR slug ILIKE '%' || $1 || '%')
	  AND ($2::bigint IS NULL OR category_id = $2::bigint)
	  AND ($3::bigint IS NULL OR subcategory_id = $3::bigint)
`;

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function normalizeSortDir(
	sortDir: SeriesAdminSortDir | undefined,
): SeriesAdminSortDir {
	return sortDir === "desc" ? "desc" : "asc";
}

function buildSeriesAdminOrderBy(
	sortBy: SeriesAdminSortBy | undefined,
	sortDir: SeriesAdminSortDir | undefined,
): string {
	const direction = normalizeSortDir(sortDir).toUpperCase();
	const nulls = direction === "ASC" ? "NULLS LAST" : "NULLS FIRST";

	switch (sortBy) {
		case "icon":
			return `ORDER BY icon_key_label ${direction}, icon_key_key ${direction}, series_id ASC`;
		case "category":
			return `ORDER BY category_title ${direction}, title ${direction}, series_id ASC`;
		case "subcategory":
			return `ORDER BY subcategory_title ${direction} ${nulls}, title ${direction}, series_id ASC`;
		case "read":
			return `ORDER BY read_effective_policy_code ${direction}, read_effective_rank ${direction} ${nulls}, title ${direction}, series_id ASC`;
		case "write":
			return `ORDER BY write_effective_policy_code ${direction}, write_effective_rank ${direction} ${nulls}, title ${direction}, series_id ASC`;
		case "author":
			return `ORDER BY author_username ${direction} ${nulls}, title ${direction}, series_id ASC`;
		case "title":
		default:
			return `ORDER BY title ${direction}, series_id ASC`;
	}
}

function mapExplicitReadPolicy(
	value: SeriesAdminDbRow["read_policy_code"],
): SeriesAdminItem["readPolicy"] {
	if (value === "inherit") {
		return "inherit";
	}

	if (value === "equal_rank") {
		return "rank_equal";
	}

	if (value === "min_rank") {
		return "rank_at_least";
	}

	return "public";
}

function mapEffectiveReadPolicy(
	value: SeriesAdminDbRow["read_effective_policy_code"],
): SeriesAdminItem["readEffectivePolicy"] {
	return value === "equal_rank"
		? "rank_equal"
		: value === "min_rank"
			? "rank_at_least"
			: "public";
}

function mapExplicitWritePolicy(
	value: SeriesAdminDbRow["write_policy_code"],
): SeriesAdminItem["writePolicy"] {
	if (value === "inherit") {
		return "inherit";
	}

	return value === "equal_rank" ? "rank_equal" : "rank_at_least";
}

function mapEffectiveWritePolicy(
	value: SeriesAdminDbRow["write_effective_policy_code"],
): SeriesAdminItem["writeEffectivePolicy"] {
	return value === "equal_rank" ? "rank_equal" : "rank_at_least";
}

function mapSeriesRow(row: SeriesAdminDbRow): SeriesAdminItem {
	const storageRelPath = row.icon_media_storage_rel_path ?? null;

	return {
		id: String(row.series_id),
		title: row.title,
		slug: row.slug,
		description: row.description,
		categoryId: String(row.category_id),
		categoryTitle: row.category_title,
		categorySlug: row.category_slug,
		subcategoryId: row.subcategory_id == null ? null : String(row.subcategory_id),
		subcategoryTitle: row.subcategory_title,
		subcategorySlug: row.subcategory_slug,
		authorDiscordId: row.author_discord_id,
		authorUsername: row.author_username,
		readPolicy: mapExplicitReadPolicy(row.read_policy_code),
		readMinRank: row.read_rank,
		readEffectivePolicy: mapEffectiveReadPolicy(row.read_effective_policy_code),
		readEffectiveMinRank: row.read_effective_rank,
		writePolicy: mapExplicitWritePolicy(row.write_policy_code),
		writeMinRank: row.write_rank,
		writeEffectivePolicy: mapEffectiveWritePolicy(
			row.write_effective_policy_code,
		),
		writeEffectiveMinRank: row.write_effective_rank,
		iconKey: {
			id: String(row.icon_key_id),
			key: row.icon_key_key,
			label: row.icon_key_label,
			source: row.icon_key_source_code,
			lucideName: row.icon_key_lucide_name,
			iconMedia:
				row.icon_media_id == null
					? null
					: {
							id: String(row.icon_media_id),
							url: storageRelPath ? buildAdminMediaFileUrl(storageRelPath) : null,
							filename: row.icon_media_filename,
							originalFilename: row.icon_media_original_filename,
							mimeType: row.icon_media_mime_type,
							storageRelPath,
						},
		},
		iconColor: {
			id: String(row.icon_color_id),
			key: row.icon_color_key,
			label: row.icon_color_label,
			preview: row.icon_color_preview,
		},
		createdByDiscordId: row.created_by_discord_id,
		createdAt: toIsoString(row.created_dt),
		updatedByDiscordId: row.updated_by_discord_id,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapSeriesLookupRow(row: SeriesLookupDbRow): SeriesLookupItem {
	return {
		id: String(row.series_id),
		title: row.title,
		slug: row.slug,
		categoryId: String(row.category_id),
		subcategoryId: row.subcategory_id == null ? null : String(row.subcategory_id),
		readEffectivePolicy:
			row.read_effective_policy_code === "equal_rank"
				? "rank_equal"
				: row.read_effective_policy_code === "min_rank"
					? "rank_at_least"
					: "public",
		readEffectiveMinRank: row.read_effective_rank,
		iconKeyId: String(row.icon_key_id),
		iconColorId: String(row.icon_color_id),
	};
}

export async function listSeriesAdminPage(args: {
	search?: string;
	page?: number;
	pageSize?: number;
	categoryId?: number | null;
	subcategoryId?: number | null;
	sortBy?: SeriesAdminSortBy;
	sortDir?: SeriesAdminSortDir;
}): Promise<SeriesAdminListPage> {
	const normalizedSearch = (args.search ?? "").trim();
	const page = Number.isFinite(args.page)
		? Math.max(1, Math.floor(args.page ?? 1))
		: 1;
	const pageSize = Number.isFinite(args.pageSize)
		? Math.min(Math.max(Math.floor(args.pageSize ?? 20), 1), 100)
		: 20;
	const offset = (page - 1) * pageSize;
	const categoryId = args.categoryId ?? null;
	const subcategoryId = args.subcategoryId ?? null;
	const orderBy = buildSeriesAdminOrderBy(args.sortBy, args.sortDir);

	const [countResult, rowsResult] = await Promise.all([
		query<CountRow>(
			`
				SELECT COUNT(*)::bigint AS total_count
				FROM web_view.web_series_admin
				${SERIES_ADMIN_FILTER_WHERE}
			`,
			[normalizedSearch, categoryId, subcategoryId],
		),
		query<SeriesAdminDbRow>(
			`
				${SERIES_ADMIN_SELECT}
				${SERIES_ADMIN_FILTER_WHERE}
				${orderBy}
				LIMIT $4 OFFSET $5
			`,
			[normalizedSearch, categoryId, subcategoryId, pageSize, offset],
		),
	]);

	const totalDocs = Number(countResult.rows[0]?.total_count ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 1;

	return {
		rows: rowsResult.rows.map(mapSeriesRow),
		page,
		pageSize,
		totalDocs,
		totalPages,
	};
}

export async function listSeriesAdmin(
	search: string = "",
): Promise<SeriesAdminItem[]> {
	const normalizedSearch = search.trim();
	const orderBy = buildSeriesAdminOrderBy("title", "asc");

	const result = await query<SeriesAdminDbRow>(
		`
			${SERIES_ADMIN_SELECT}
			${SERIES_ADMIN_FILTER_WHERE}
			${orderBy}
		`,
		[normalizedSearch, null, null],
	);

	return result.rows.map(mapSeriesRow);
}

export async function findSeriesAdminById(
	seriesId: number,
): Promise<SeriesAdminItem | null> {
	const result = await query<SeriesAdminDbRow>(
		`
			${SERIES_ADMIN_SELECT}
			WHERE series_id = $1
			LIMIT 1
		`,
		[seriesId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapSeriesRow(row) : null;
}

export async function listSeriesLookup(): Promise<SeriesLookupItem[]> {
	const result = await query<SeriesLookupDbRow>(
		`
			SELECT series_id,
			       title,
			       slug,
			       category_id,
			       subcategory_id,
			       read_effective_policy_code,
			       read_effective_rank,
			       icon_key_id,
			       icon_color_id
			FROM web_view.web_series_lookup
			ORDER BY title ASC, series_id ASC
		`,
	);

	return result.rows.map(mapSeriesLookupRow);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
