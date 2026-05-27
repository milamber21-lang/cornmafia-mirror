//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-sections.ts                                                       ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia section helpers for public hub and section filters.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type RiseopediaSectionDoc = {
	id: string;
	code: string;
	slug: string;
	name: string;
	description: string | null;
	modeCode: string;
	modeName: string;
	publicVisible: boolean;
	showWhenEmpty: boolean;
	sortOrder: number;
	itemCount: number;
	updatedAt: string | null;
};

export type RiseopediaEntitySectionRef = {
	id: string;
	code: string;
	slug: string;
	name: string;
	sortOrder: number;
	ruleSortOrder: number;
};

type RiseopediaSectionRow = {
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	description: string | null;
	section_mode_code: string;
	section_mode_name: string;
	public_visible_flag: boolean;
	show_when_empty_flag: boolean;
	sort_order: string | number;
	item_count: string | number;
	updated_dt: Date | string | null;
};

export type RiseopediaEntitySectionRefRow = {
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	section_sort_order: string | number;
	rule_sort_order: string | number;
};

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function toIsoString(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function mapSectionRow(row: RiseopediaSectionRow): RiseopediaSectionDoc {
	return {
		id: String(row.section_id),
		code: row.section_code,
		slug: row.section_slug,
		name: row.section_name,
		description: row.description,
		modeCode: row.section_mode_code,
		modeName: row.section_mode_name,
		publicVisible: row.public_visible_flag,
		showWhenEmpty: row.show_when_empty_flag,
		sortOrder: toNumber(row.sort_order),
		itemCount: toNumber(row.item_count),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export function mapEntitySectionRefRow(
	row: RiseopediaEntitySectionRefRow,
): RiseopediaEntitySectionRef {
	return {
		id: String(row.section_id),
		code: row.section_code,
		slug: row.section_slug,
		name: row.section_name,
		sortOrder: toNumber(row.section_sort_order),
		ruleSortOrder: toNumber(row.rule_sort_order),
	};
}

export async function listRiseopediaSections(): Promise<RiseopediaSectionDoc[]> {
	const result = await query<RiseopediaSectionRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				description,
				section_mode_code,
				section_mode_name,
				public_visible_flag,
				show_when_empty_flag,
				sort_order,
				item_count,
				updated_dt
		 FROM web_view.riseopedia_sections
		 ORDER BY sort_order,
				  section_name,
				  section_id`,
	);

	return result.rows.map(mapSectionRow);
}
