//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/categories.ts                                                                     ////
//// Language: TS                                                                                                  ////
//// DB-first admin category read helpers                                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";

type CategoryAdminDbRow = {
	category_id: number | string;
	title: string;
	slug: string;
	nav_hidden: boolean;
	read_policy_code: "public" | "min_rank" | "equal_rank";
	read_rank: number | null;
	write_policy_code: "min_rank" | "equal_rank";
	write_rank: number;
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
	template_ids: Array<number | string> | null;
	created_dt: string | Date;
	updated_dt: string | Date;
};

export type CategoryAdminItem = {
	id: string;
	title: string;
	slug: string;
	navHidden: boolean;
	readPolicy: "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	writePolicy: "rank_at_least" | "rank_equal";
	writeMinRank: number;
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
	allowedTemplates: string[];
	createdAt: string;
	updatedAt: string;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function mapReadPolicy(
	value: CategoryAdminDbRow["read_policy_code"],
): CategoryAdminItem["readPolicy"] {
	if (value === "equal_rank") {
		return "rank_equal";
	}

	if (value === "min_rank") {
		return "rank_at_least";
	}

	return "public";
}

function mapWritePolicy(
	value: CategoryAdminDbRow["write_policy_code"],
): CategoryAdminItem["writePolicy"] {
	return value === "equal_rank" ? "rank_equal" : "rank_at_least";
}

function mapCategoryRow(row: CategoryAdminDbRow): CategoryAdminItem {
	return {
		id: String(row.category_id),
		title: row.title,
		slug: row.slug,
		navHidden: row.nav_hidden,
		readPolicy: mapReadPolicy(row.read_policy_code),
		readMinRank: row.read_rank,
		writePolicy: mapWritePolicy(row.write_policy_code),
		writeMinRank: row.write_rank,
		iconKey:
			row.icon_key_id == null
				? null
				: {
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
										url: row.icon_media_storage_rel_path
											? buildAdminMediaFileUrl(row.icon_media_storage_rel_path)
											: null,
										filename: row.icon_media_filename,
										originalFilename: row.icon_media_original_filename,
										mimeType: row.icon_media_mime_type,
										storageRelPath: row.icon_media_storage_rel_path,
									},
					},
		iconColor:
			row.icon_color_id == null
				? null
				: {
						id: String(row.icon_color_id),
						key: row.icon_color_key,
						label: row.icon_color_label,
						preview: row.icon_color_preview,
					},
		allowedTemplates: Array.isArray(row.template_ids)
			? row.template_ids.map((value) => String(value))
			: [],
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function listCategoriesAdmin(): Promise<CategoryAdminItem[]> {
	const result = await query<CategoryAdminDbRow>(
		`
      SELECT
        category_id,
        title,
        slug,
        nav_hidden,
        read_policy_code,
        read_rank,
        write_policy_code,
        write_rank,
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
        template_ids,
        created_dt,
        updated_dt
      FROM web_view.web_categories_admin
      ORDER BY title ASC, category_id ASC
    `,
	);

	return result.rows.map(mapCategoryRow);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
