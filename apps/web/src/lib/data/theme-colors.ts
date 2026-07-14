//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/theme-colors.ts                                                                   ////
//// Language: TS                                                                                                  ////
//// DB-first admin theme color read helpers                                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

type ThemeColorAdminDbRow = {
	theme_color_id: number | string;
	key: string;
	label: string;
	preview: string;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

export type ThemeColorAdminItem = {
	id: string;
	key: string;
	label: string;
	preview: string;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ThemeColorOption = {
	id: string;
	key: string;
	label: string;
	preview: string;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function mapThemeColorRow(row: ThemeColorAdminDbRow): ThemeColorAdminItem {
	return {
		id: String(row.theme_color_id),
		key: row.key,
		label: row.label,
		preview: row.preview,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function listThemeColorsAdmin(): Promise<ThemeColorAdminItem[]> {
	const result = await query<ThemeColorAdminDbRow>(
		`
      SELECT
        theme_color_id,
        key,
        label,
        preview,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_theme_colors
      ORDER BY key ASC, theme_color_id ASC
    `,
	);

	return result.rows.map(mapThemeColorRow);
}

export async function findThemeColorAdminById(
	themeColorId: number,
): Promise<ThemeColorAdminItem | null> {
	const result = await query<ThemeColorAdminDbRow>(
		`
      SELECT
        theme_color_id,
        key,
        label,
        preview,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_theme_colors
      WHERE theme_color_id = $1
      LIMIT 1
    `,
		[themeColorId],
	);

	const row = result.rows[0];
	return row ? mapThemeColorRow(row) : null;
}

export async function listEnabledThemeColorOptions(): Promise<
	ThemeColorOption[]
> {
	const result = await query<ThemeColorAdminDbRow>(
		`
      SELECT
        theme_color_id,
        key,
        label,
        preview,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_theme_colors
      WHERE is_enabled = true
      ORDER BY key ASC, theme_color_id ASC
    `,
	);

	return result.rows.map((row) => ({
		id: String(row.theme_color_id),
		key: row.key,
		label: row.label,
		preview: row.preview,
	}));
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
