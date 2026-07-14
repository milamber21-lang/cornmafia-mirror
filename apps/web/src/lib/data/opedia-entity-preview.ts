//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/opedia-entity-preview.ts                                                       ////
//// Language: TS                                                                                               ////
//// Channel-aware DB-first entity-link preview lookup using the configured full-card read models.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import {
	mapMafiosopediaCardProperties,
	normalizeMafiosopediaCardMode,
} from "@/lib/data/mafiosopedia-card-properties";
import {
	mafiosopediaReleaseFilterFlags,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";
import { query } from "@/lib/data/pg";
import {
	mapRiseopediaCardProperties,
	normalizeRiseopediaCardMode,
} from "@/lib/data/riseopedia-card-properties";
import type {
	RiseopediaEntityDoc,
	RiseopediaEntityMediaRef,
} from "@/lib/data/riseopedia-entities";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";
import { normalizeRiseopediaEntitySlug } from "@/lib/helpers/riseopedia-entity-links";
import { buildMafiosopediaMediaFileUrl } from "@/lib/helpers/mafiosopedia-media-files";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

const ENTITY_LINK_PREVIEW_PLACEMENT = "entity_link_preview";

type OpediaEntityPreviewRow = {
	entity_id: string | number;
	entity_type_code: string;
	entity_type_name: string | null;
	entity_code: string;
	entity_name: string;
	entity_slug: string;
	section_code: string | null;
	section_name: string | null;
	entity_class_code: string | null;
	entity_class_name: string | null;
	entity_category_code: string | null;
	entity_category_name: string | null;
	entity_category_slug: string | null;
	entity_subcategory_code: string | null;
	entity_subcategory_name: string | null;
	entity_subcategory_slug: string | null;
	category_subcategory_label: string | null;
	classification_path_label: string | null;
	release_state_code: string | null;
	release_state_name: string | null;
	media_id: string | number | null;
	media_width_px: number | null;
	media_height_px: number | null;
	media_mime_type: string | null;
	resolved_card_mode_code: string | null;
	card_properties: unknown;
};

type OpediaPreviewViews = {
	detail: string;
	releaseStatus: string | null;
	resolvedRules: string;
	detailMedia: string;
	mediaFiles: string;
	cardElements: string;
};

const PREVIEW_VIEWS: Record<OpediaWikiCode, OpediaPreviewViews> = {
	riseopedia: {
		detail: "web_view.riseopedia_entity_detail",
		releaseStatus: null,
		resolvedRules: "web_view.riseopedia_entity_overview_card_resolved_rules",
		detailMedia: "web_view.riseopedia_entity_detail_media",
		mediaFiles: "web_view.riseopedia_media_files_source_v",
		cardElements: "web_view.riseopedia_entity_overview_card_elements",
	},
	mafiosopedia: {
		detail: "web_view.mafiosopedia_entity_detail",
		releaseStatus: "web_view.mafiosopedia_entity_release_status",
		resolvedRules: "web_view.mafiosopedia_entity_overview_card_resolved_rules",
		detailMedia: "web_view.mafiosopedia_entity_detail_media",
		mediaFiles: "web_view.mafiosopedia_media_files_source_v",
		cardElements: "web_view.mafiosopedia_entity_overview_card_elements",
	},
};

function mapMedia(args: {
	wikiCode: OpediaWikiCode;
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): RiseopediaEntityMediaRef | null {
	if (args.mediaId === null) {
		return null;
	}

	const mediaId = String(args.mediaId);
	return {
		mediaId,
		url:
			args.wikiCode === "mafiosopedia"
				? buildMafiosopediaMediaFileUrl(mediaId)
				: buildRiseopediaMediaFileUrl(mediaId),
		width: args.width,
		height: args.height,
		mimeType: args.mimeType,
	};
}

function mapPreviewRow(
	wikiCode: OpediaWikiCode,
	row: OpediaEntityPreviewRow,
): RiseopediaEntityDoc {
	return {
		entityId: String(row.entity_id),
		entityTypeCode: row.entity_type_code,
		entityTypeName: row.entity_type_name,
		entityKey: row.entity_code,
		entityName: row.entity_name,
		entitySlug: row.entity_slug,
		sectionCode: row.section_code,
		sectionName: row.section_name,
		entityClassCode: row.entity_class_code,
		entityClassName: row.entity_class_name,
		categoryCode: row.entity_category_code,
		categoryName: row.entity_category_name,
		categorySlug: row.entity_category_slug,
		subcategoryCode: row.entity_subcategory_code,
		subcategoryName: row.entity_subcategory_name,
		subcategorySlug: row.entity_subcategory_slug,
		categorySubcategoryLabel: row.category_subcategory_label,
		classificationPathLabel: row.classification_path_label,
		releaseStateCode: row.release_state_code,
		releaseStateName: row.release_state_name,
		media: mapMedia({
			wikiCode,
			mediaId: row.media_id,
			width: row.media_width_px,
			height: row.media_height_px,
			mimeType: row.media_mime_type,
		}),
		cardMode:
			wikiCode === "mafiosopedia"
				? normalizeMafiosopediaCardMode(row.resolved_card_mode_code)
				: normalizeRiseopediaCardMode(row.resolved_card_mode_code),
		cardProperties:
			wikiCode === "mafiosopedia"
				? mapMafiosopediaCardProperties(row.card_properties)
				: mapRiseopediaCardProperties(row.card_properties),
	};
}

export async function findOpediaEntityLinkPreview(args: {
	wikiCode: OpediaWikiCode;
	entitySlug: string;
	releaseFilters?: readonly MafiosopediaReleaseFilterCode[];
}): Promise<RiseopediaEntityDoc | null> {
	const entitySlug = normalizeRiseopediaEntitySlug(args.entitySlug);
	if (!entitySlug) {
		return null;
	}

	const views = PREVIEW_VIEWS[args.wikiCode];
	const releaseFlags = mafiosopediaReleaseFilterFlags(args.releaseFilters ?? []);
	const releaseJoin = views.releaseStatus
		? `JOIN ${views.releaseStatus} release_status ON release_status.entity_id = detail.entity_id`
		: "";
	const visibilityWhere =
		args.wikiCode === "mafiosopedia"
			? `AND (($3::boolean AND release_status.public_match_flag)
				 OR ($4::boolean AND release_status.patch_rule_match_flag)
				 OR ($5::boolean AND release_status.evidence_rule_match_flag)
				 OR ($6::boolean AND release_status.manual_rule_match_flag))`
			: `AND detail.public_visible_flag = true
			   AND detail.detail_visible_flag = true`;
	const values: unknown[] =
		args.wikiCode === "mafiosopedia"
			? [
					entitySlug,
					ENTITY_LINK_PREVIEW_PLACEMENT,
					releaseFlags.public,
					releaseFlags.patch,
					releaseFlags.evidence,
					releaseFlags.manual,
				]
			: [entitySlug, ENTITY_LINK_PREVIEW_PLACEMENT];

	const result = await query<OpediaEntityPreviewRow>(
		`SELECT detail.entity_id,
			detail.entity_type_code,
			detail.entity_type_name,
			detail.entity_code,
			detail.entity_name,
			detail.entity_slug,
			detail.section_code,
			detail.section_name,
			detail.entity_class_code,
			detail.entity_class_name,
			detail.entity_category_code,
			detail.entity_category_name,
			detail.entity_category_slug,
			detail.entity_subcategory_code,
			detail.entity_subcategory_name,
			detail.entity_subcategory_slug,
			detail.category_subcategory_label,
			detail.classification_path_label,
			detail.release_state_code,
			detail.release_state_name,
			media.media_file_id AS media_id,
			media.width_px AS media_width_px,
			media.height_px AS media_height_px,
			media.mime_type AS media_mime_type,
			COALESCE(resolved.card_mode_code, 'compact') AS resolved_card_mode_code,
			COALESCE(card_elements.card_properties, '[]'::jsonb) AS card_properties
		 FROM ${views.detail} detail
		 ${releaseJoin}
		 LEFT JOIN ${views.resolvedRules} resolved
		   ON resolved.entity_id = detail.entity_id
		  AND resolved.placement_code = $2
		 LEFT JOIN LATERAL (SELECT COALESCE(card_media.media_file_id, media_row.media_file_id) AS media_file_id,
							  COALESCE(card_media.width_px, media_row.width_px) AS width_px,
							  COALESCE(card_media.height_px, media_row.height_px) AS height_px,
							  COALESCE(card_media.mime_type, media_row.mime_type) AS mime_type
					   FROM ${views.detailMedia} media_row
					   LEFT JOIN LATERAL (SELECT card_file.media_file_id,
										  card_file.width_px,
										  card_file.height_px,
										  card_file.mime_type
								   FROM ${views.mediaFiles} card_file
								   WHERE card_file.media_id = media_row.media_id
								   ORDER BY CASE
										WHEN lower(card_file.media_rel_path) LIKE '%icon_128/%' THEN 0
										WHEN card_file.width_px = 128 AND card_file.height_px = 128 THEN 1
										WHEN lower(card_file.media_rel_path) LIKE '%icon_64/%' THEN 2
										WHEN card_file.width_px = 64 AND card_file.height_px = 64 THEN 3
										ELSE 100
									END,
									card_file.media_file_id
								   LIMIT 1) card_media ON true
					   WHERE media_row.entity_id = detail.entity_id
					     AND media_row.public_display_flag = true
					     AND media_row.media_role_code IN ('icon', 'thumbnail', 'brand_logo')
					   ORDER BY CASE WHEN media_row.media_file_id = detail.primary_icon_media_file_id THEN 0 ELSE 1 END,
							media_row.selected_icon_rank,
							media_row.selected_header_rank,
							media_row.primary_flag DESC,
							media_row.sort_order,
							media_row.entity_media_id
					   LIMIT 1) media ON true
		 LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object(
								'placementCode', element.placement_code,
								'cardModeCode', element.card_mode_code,
								'displaySlotCode', element.display_slot_code,
								'displaySlotName', element.display_slot_name,
								'sourceTypeCode', element.source_type_code,
								'sourceCode', element.source_code,
								'displayLabel', element.display_label,
								'displayValue', element.display_value,
								'valueTypeCode', element.value_type_code,
								'sortOrder', element.sort_order
							 ) ORDER BY element.sort_order, element.overview_card_rule_element_id) AS card_properties
					   FROM ${views.cardElements} element
					   WHERE element.entity_id = detail.entity_id
					     AND element.placement_code = $2) card_elements ON true
		 WHERE detail.entity_slug = $1
		   ${visibilityWhere}
		 LIMIT 1`,
		values,
	);

	return result.rows[0] ? mapPreviewRow(args.wikiCode, result.rows[0]) : null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
