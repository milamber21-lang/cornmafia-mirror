//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-hub.ts                                                            ////
//// Language: TS                                                                                             ////
//// Materialized hub data loader for public Mafiosopedia classification overview cards.                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildMafiosopediaInfoPath } from "@/lib/helpers/mafiosopedia-entity-links";
import { buildMafiosopediaMediaFileUrl } from "@/lib/helpers/mafiosopedia-media-files";

export type MafiosopediaHubMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type MafiosopediaHubCounts = {
	entityCount: number;
	assetCount: number;
	recipeCount: number;
	sectionCount: number;
	classCount: number;
	categoryCount: number;
};

export type MafiosopediaHubDirectoryCardDoc = {
	id: string;
	nodeTypeCode: "section" | "class" | "category" | "subcategory";
	code: string;
	slug: string;
	name: string;
	description: string | null;
	href: string | null;
	itemCount: number;
	assetCount: number;
	recipeCount: number;
	sectionCount: number;
	sortOrder: number;
	updatedAt: string | null;
	sampleEntityTypeCode: string | null;
	sampleEntityName: string | null;
	sampleEntitySlug: string | null;
	media: MafiosopediaHubMediaRef | null;
};

export type MafiosopediaHubData = {
	counts: MafiosopediaHubCounts;
	sections: MafiosopediaHubDirectoryCardDoc[];
	classes: MafiosopediaHubDirectoryCardDoc[];
	categories: MafiosopediaHubDirectoryCardDoc[];
};

type MafiosopediaHubCountsRow = {
	entity_count: string | number;
	asset_count: string | number;
	recipe_count: string | number;
	section_count: string | number;
	class_count: string | number;
	category_count: string | number;
};

type MafiosopediaHubDirectoryRow = {
	node_type_code: "section" | "class" | "category" | "subcategory";
	node_id: string | number;
	node_code: string;
	node_slug: string;
	node_name: string;
	description: string | null;
	href_path: string | null;
	item_count: string | number;
	asset_count: string | number;
	recipe_count: string | number;
	section_count: string | number;
	sort_order: string | number;
	updated_dt: Date | string | null;
	sample_entity_type_code: string | null;
	sample_entity_name: string | null;
	sample_entity_slug: string | null;
	sample_media_id: string | number | null;
	sample_media_width_px: number | null;
	sample_media_height_px: number | null;
	sample_media_mime_type: string | null;
};

function toNumber(value: string | number): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoString(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function mapMediaRef(args: {
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): MafiosopediaHubMediaRef | null {
	if (args.mediaId === null) {
		return null;
	}

	const mediaId = String(args.mediaId);

	return {
		mediaId,
		url: buildMafiosopediaMediaFileUrl(mediaId),
		width: args.width,
		height: args.height,
		mimeType: args.mimeType,
	};
}

function directoryHref(row: MafiosopediaHubDirectoryRow): string | null {
	if (row.node_type_code === "section") {
		return buildMafiosopediaInfoPath({ family: "sections", slug: row.node_slug });
	}

	if (row.node_type_code === "class") {
		return buildMafiosopediaInfoPath({ family: "classes", slug: row.node_slug });
	}

	if (row.node_type_code === "category") {
		return buildMafiosopediaInfoPath({ family: "categories", slug: row.node_slug });
	}

	if (row.node_type_code === "subcategory") {
		return buildMafiosopediaInfoPath({ family: "subcategories", slug: row.node_slug });
	}

	return null;
}

function mapHubDirectoryRow(row: MafiosopediaHubDirectoryRow): MafiosopediaHubDirectoryCardDoc {
	return {
		id: String(row.node_id),
		nodeTypeCode: row.node_type_code,
		code: row.node_code,
		slug: row.node_slug,
		name: row.node_name,
		description: row.description,
		href: directoryHref(row),
		itemCount: toNumber(row.item_count),
		assetCount: toNumber(row.asset_count),
		recipeCount: toNumber(row.recipe_count),
		sectionCount: toNumber(row.section_count),
		sortOrder: toNumber(row.sort_order),
		updatedAt: toIsoString(row.updated_dt),
		sampleEntityTypeCode: row.sample_entity_type_code,
		sampleEntityName: row.sample_entity_name,
		sampleEntitySlug: row.sample_entity_slug,
		media: mapMediaRef({
			mediaId: row.sample_media_id,
			width: row.sample_media_width_px,
			height: row.sample_media_height_px,
			mimeType: row.sample_media_mime_type,
		}),
	};
}

function emptyCounts(): MafiosopediaHubCounts {
	return {
		entityCount: 0,
		assetCount: 0,
		recipeCount: 0,
		sectionCount: 0,
		classCount: 0,
		categoryCount: 0,
	};
}

function mapCountsRow(row: MafiosopediaHubCountsRow | undefined): MafiosopediaHubCounts {
	if (!row) {
		return emptyCounts();
	}

	return {
		entityCount: toNumber(row.entity_count),
		assetCount: toNumber(row.asset_count),
		recipeCount: toNumber(row.recipe_count),
		sectionCount: toNumber(row.section_count),
		classCount: toNumber(row.class_count),
		categoryCount: toNumber(row.category_count),
	};
}

export async function getMafiosopediaHubData(): Promise<MafiosopediaHubData> {
	const [countResult, sectionResult, classResult, categoryResult] = await Promise.all([
		query<MafiosopediaHubCountsRow>(
			`SELECT entity_count,
					asset_count,
					recipe_count,
					section_count,
					class_count,
					category_count
			 FROM web_view.mafiosopedia_hub_counts
			 LIMIT 1`,
		),
		query<MafiosopediaHubDirectoryRow>(
			`SELECT node_type_code,
					node_id,
					node_code,
					node_slug,
					node_name,
					description,
					href_path,
					item_count,
					asset_count,
					recipe_count,
					section_count,
					sort_order,
					updated_dt,
					sample_entity_type_code,
					sample_entity_name,
					sample_entity_slug,
					sample_media_id,
					sample_media_width_px,
					sample_media_height_px,
					sample_media_mime_type
			 FROM web_view.mafiosopedia_hub_sections
			 ORDER BY sort_order,
				  node_name,
				  node_id`,
		),
		query<MafiosopediaHubDirectoryRow>(
			`SELECT node_type_code,
					node_id,
					node_code,
					node_slug,
					node_name,
					description,
					href_path,
					item_count,
					asset_count,
					recipe_count,
					section_count,
					sort_order,
					updated_dt,
					sample_entity_type_code,
					sample_entity_name,
					sample_entity_slug,
					sample_media_id,
					sample_media_width_px,
					sample_media_height_px,
					sample_media_mime_type
			 FROM web_view.mafiosopedia_hub_classes
			 ORDER BY sort_order,
				  node_name,
				  node_id`,
		),
		query<MafiosopediaHubDirectoryRow>(
			`SELECT node_type_code,
					node_id,
					node_code,
					node_slug,
					node_name,
					description,
					href_path,
					item_count,
					asset_count,
					recipe_count,
					section_count,
					sort_order,
					updated_dt,
					sample_entity_type_code,
					sample_entity_name,
					sample_entity_slug,
					sample_media_id,
					sample_media_width_px,
					sample_media_height_px,
					sample_media_mime_type
			 FROM web_view.mafiosopedia_hub_categories
			 ORDER BY sort_order,
				  node_name,
				  node_id`,
		),
	]);

	return {
		counts: mapCountsRow(countResult.rows[0]),
		sections: sectionResult.rows.map(mapHubDirectoryRow),
		classes: classResult.rows.map(mapHubDirectoryRow),
		categories: categoryResult.rows.map(mapHubDirectoryRow),
	};
}
