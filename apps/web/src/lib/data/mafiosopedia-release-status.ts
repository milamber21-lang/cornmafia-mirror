//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-release-status.ts                                                  ////
//// Language: TS                                                                                                 ////
//// Live Mafiosopedia release-status and manual override-reason read helpers.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

export type MafiosopediaReleaseStatusDoc = {
	entityId: string;
	entityTypeCode: string;
	publicPatchId: string | null;
	publicPatchCode: string | null;
	publicPatchLabel: string | null;
	manualOverrideId: string | null;
	manualOverrideStateCode: string | null;
	manualOverrideReasonCode: string | null;
	manualOverrideReasonName: string | null;
	manualOverrideNote: string | null;
	automaticReleaseStateCode: string | null;
	automaticReleaseConfidenceScore: number | null;
	automaticBlockerStateCode: string | null;
	automaticBlockerEvidenceCode: string | null;
	publicationScopeActionCode: string | null;
	publicationScopePatchId: string | null;
	effectivePublished: boolean;
	effectiveVisibilitySourceCode: "published" | "patch" | "evidence" | "manual";
	effectiveStatusLabel: string;
	effectiveStatusDetail: string | null;
};

export type RiseopediaReleaseOverrideReasonOption = {
	overrideReasonCode: string;
	overrideReasonName: string;
	description: string | null;
	hideAvailable: boolean;
	publishAvailable: boolean;
	noteRequired: boolean;
	sortOrder: number;
};

type MafiosopediaReleaseStatusRow = {
	entity_id: string | number;
	entity_type_code: string;
	public_patch_id: string | number | null;
	public_patch_code: string | null;
	public_patch_label: string | null;
	manual_override_id: string | number | null;
	manual_override_state_code: string | null;
	manual_override_reason_code: string | null;
	manual_override_reason_name: string | null;
	manual_override_note: string | null;
	automatic_release_state_code: string | null;
	automatic_release_confidence_score: string | number | null;
	automatic_blocker_state_code: string | null;
	automatic_blocker_evidence_code: string | null;
	publication_scope_action_code: string | null;
	publication_scope_patch_id: string | number | null;
	effective_published_flag: boolean;
	effective_visibility_source_code: string;
	effective_status_label: string;
	effective_status_detail: string | null;
};

type RiseopediaReleaseOverrideReasonOptionRow = {
	override_reason_code: string;
	override_reason_name: string;
	description: string | null;
	hide_available_flag: boolean;
	publish_available_flag: boolean;
	note_required_flag: boolean;
	sort_order: string | number;
};

function toNullableStringId(value: string | number | null): string | null {
	return value === null ? null : String(value);
}

function toNullableNumber(value: string | number | null): number | null {
	if (value === null) {
		return null;
	}

	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function toEffectiveVisibilitySourceCode(
	value: string,
): MafiosopediaReleaseStatusDoc["effectiveVisibilitySourceCode"] {
	return value === "patch" || value === "evidence" || value === "manual"
		? value
		: "published";
}

function mapMafiosopediaReleaseStatusRow(
	row: MafiosopediaReleaseStatusRow,
): MafiosopediaReleaseStatusDoc {
	return {
		entityId: String(row.entity_id),
		entityTypeCode: row.entity_type_code,
		publicPatchId: toNullableStringId(row.public_patch_id),
		publicPatchCode: row.public_patch_code,
		publicPatchLabel: row.public_patch_label,
		manualOverrideId: toNullableStringId(row.manual_override_id),
		manualOverrideStateCode: row.manual_override_state_code,
		manualOverrideReasonCode: row.manual_override_reason_code,
		manualOverrideReasonName: row.manual_override_reason_name,
		manualOverrideNote: row.manual_override_note,
		automaticReleaseStateCode: row.automatic_release_state_code,
		automaticReleaseConfidenceScore: toNullableNumber(
			row.automatic_release_confidence_score,
		),
		automaticBlockerStateCode: row.automatic_blocker_state_code,
		automaticBlockerEvidenceCode: row.automatic_blocker_evidence_code,
		publicationScopeActionCode: row.publication_scope_action_code,
		publicationScopePatchId: toNullableStringId(row.publication_scope_patch_id),
		effectivePublished: row.effective_published_flag,
		effectiveVisibilitySourceCode: toEffectiveVisibilitySourceCode(
			row.effective_visibility_source_code,
		),
		effectiveStatusLabel: row.effective_status_label,
		effectiveStatusDetail: row.effective_status_detail,
	};
}

export async function findMafiosopediaEntityReleaseStatus(args: {
	entityId: string;
	entityTypeCode: string;
}): Promise<MafiosopediaReleaseStatusDoc | null> {
	const result = await query<MafiosopediaReleaseStatusRow>(
		`SELECT entity_id,
				entity_type_code,
				public_patch_id,
				public_patch_code,
				public_patch_label,
				manual_override_id,
				manual_override_state_code,
				manual_override_reason_code,
				manual_override_reason_name,
				manual_override_note,
				automatic_release_state_code,
				automatic_release_confidence_score,
				automatic_blocker_state_code,
				automatic_blocker_evidence_code,
				publication_scope_action_code,
				publication_scope_patch_id,
				effective_published_flag,
				effective_visibility_source_code,
				effective_status_label,
				effective_status_detail
		 FROM web_view.mafiosopedia_entity_release_status
		 WHERE entity_id = $1
		   AND entity_type_code = $2
		 LIMIT 1`,
		[args.entityId, args.entityTypeCode],
	);

	const row = result.rows[0] ?? null;
	return row ? mapMafiosopediaReleaseStatusRow(row) : null;
}

export async function listRiseopediaReleaseOverrideReasonOptions(): Promise<
	RiseopediaReleaseOverrideReasonOption[]
> {
	const result = await query<RiseopediaReleaseOverrideReasonOptionRow>(
		`SELECT override_reason_code,
				override_reason_name,
				description,
				hide_available_flag,
				publish_available_flag,
				note_required_flag,
				sort_order
		 FROM web_view.riseopedia_release_override_reason_options
		 ORDER BY sort_order,
			  override_reason_name,
			  override_reason_code`,
	);

	return result.rows.map((row) => ({
		overrideReasonCode: row.override_reason_code,
		overrideReasonName: row.override_reason_name,
		description: row.description,
		hideAvailable: row.hide_available_flag,
		publishAvailable: row.publish_available_flag,
		noteRequired: row.note_required_flag,
		sortOrder: toNullableNumber(row.sort_order) ?? 0,
	}));
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
