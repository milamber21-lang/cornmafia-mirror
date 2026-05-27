//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-asset-classes.ts                                                  ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia asset class helpers for hub cards and filters.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type RiseopediaAssetClassDoc = {
	id: string;
	code: string;
	name: string;
	description: string | null;
	sortOrder: number;
	assetCount: number;
	updatedAt: string | null;
};

type RiseopediaAssetClassRow = {
	asset_class_id: string | number;
	asset_class_code: string;
	asset_class_name: string;
	description: string | null;
	sort_order: string | number;
	asset_count: string | number;
	updated_dt: Date | string | null;
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

function mapAssetClassRow(row: RiseopediaAssetClassRow): RiseopediaAssetClassDoc {
	return {
		id: String(row.asset_class_id),
		code: row.asset_class_code,
		name: row.asset_class_name,
		description: row.description,
		sortOrder: toNumber(row.sort_order),
		assetCount: toNumber(row.asset_count),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function listRiseopediaAssetClasses(): Promise<
	RiseopediaAssetClassDoc[]
> {
	const result = await query<RiseopediaAssetClassRow>(
		`SELECT asset_class_id,
				asset_class_code,
				asset_class_name,
				description,
				sort_order,
				asset_count,
				updated_dt
		 FROM web_view.riseopedia_asset_classes
		 ORDER BY sort_order,
				  asset_class_name,
				  asset_class_id`,
	);

	return result.rows.map(mapAssetClassRow);
}
