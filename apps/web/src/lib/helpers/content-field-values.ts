//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-field-values.ts                                                       ////
//// Language: TS                                                                                                  ////
//// Shared conversion helpers for content field values and generic external-link payloads                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	extractRichTextLinkReferences,
	normalizeRichTextJson,
} from "@/lib/editors/richtext/rich-text-json";
import { normalizeGeneralLinkAuthorInput } from "@/lib/links/link-policy";
import { normalizeYoutubeAuthorUrl } from "@/lib/helpers/youtube-url";

export type ContentFieldRenderDestinationCode =
	| "seo"
	| "hero"
	| "top"
	| "left"
	| "main"
	| "right"
	| "bottom"
	| "hidden";

export type ContentFieldLayoutWidthCode = "full" | "half" | "third";

export type ContentFieldLayoutAlignCode =
	| "left"
	| "center"
	| "right"
	| "stretch";

export type ContentFieldLabelStyleCode = "title" | "label" | "text" | "muted";

export type ContentFieldLabelPositionCode = "above" | "inline";

export type ContentFieldLabelSeparatorCode = "none" | "colon" | "dash";

export type ContentTemplateFieldDefinition = {
	templateFieldId: number;
	label: string;
	fieldTypeCode: string;
	fieldListCode?: string;
	renderDestinationCode: ContentFieldRenderDestinationCode;
	layoutWidthCode: ContentFieldLayoutWidthCode;
	layoutAlignCode: ContentFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: ContentFieldLabelStyleCode;
	labelPositionCode: ContentFieldLabelPositionCode;
	labelSeparatorCode: ContentFieldLabelSeparatorCode;
	valueColumnName: string;
	isRequired: boolean;
	isEnabled?: boolean;
};

export type ContentFieldValueDbInput = {
	template_field_id: number;
	value_seq_no: number;
	value_text?: string;
	value_long_text?: string;
	value_integer?: number;
	value_numeric?: number;
	value_boolean?: boolean;
	value_date?: string;
	value_timestamp?: string;
	value_discord_id?: string;
	value_media_id?: number;
	value_content_id?: number;
	value_option_key?: string;
	value_rich_text_json?: unknown;
};

export type ContentExternalLinkDbInput = {
	template_field_id: number;
	value_seq_no: number;
	link_index_no: number;
	source_kind_code: "field" | "rich_text";
	raw_url: string;
	link_text?: string | null;
};

type Values = Record<string, unknown>;

function normalizeString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeInteger(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value)) {
		return value;
	}

	if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) ? parsed : null;
	}

	return null;
}

function normalizeBoolean(value: unknown): boolean | null {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true") {
			return true;
		}
		if (normalized === "false") {
			return false;
		}
	}

	return null;
}

function normalizePositiveInteger(value: unknown): number | null {
	const parsed = normalizeInteger(value);
	return parsed !== null && parsed > 0 ? parsed : null;
}

function setValueOnPayload(
	payload: ContentFieldValueDbInput,
	field: ContentTemplateFieldDefinition,
	value: unknown,
): boolean {
	const columnName = field.valueColumnName;

	if (columnName === "value_text") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;

		if (field.fieldTypeCode === "youtube_url") {
			const youtubeResult = normalizeYoutubeAuthorUrl(normalized);
			if (!youtubeResult.ok) {
				throw new Error(`${field.label}: ${youtubeResult.message}`);
			}

			payload.value_text = youtubeResult.canonicalUrl;
			return true;
		}

		payload.value_text = normalized;
		return true;
	}

	if (columnName === "value_long_text") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;
		payload.value_long_text = normalized;
		return true;
	}

	if (columnName === "value_integer") {
		const normalized = normalizeInteger(value);
		if (normalized === null) {
			if (value === null || typeof value === "undefined" || value === "") {
				return false;
			}

			throw new Error(`${field.label} must be an integer.`);
		}

		payload.value_integer = normalized;
		return true;
	}

	if (columnName === "value_numeric") {
		const normalized =
			typeof value === "number"
				? value
				: typeof value === "string" && value.trim().length > 0
					? Number(value.trim())
					: Number.NaN;

		if (!Number.isFinite(normalized)) {
			if (value === null || typeof value === "undefined" || value === "") {
				return false;
			}

			throw new Error(`${field.label} must be a number.`);
		}

		payload.value_numeric = normalized;
		return true;
	}

	if (columnName === "value_boolean") {
		const normalized = normalizeBoolean(value);
		if (normalized === null) {
			if (field.isRequired) {
				payload.value_boolean = false;
				return true;
			}

			return false;
		}

		payload.value_boolean = normalized;
		return true;
	}

	if (columnName === "value_date") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;
		payload.value_date = normalized;
		return true;
	}

	if (columnName === "value_timestamp") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;
		payload.value_timestamp = normalized;
		return true;
	}

	if (columnName === "value_discord_id") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;
		payload.value_discord_id = normalized;
		return true;
	}

	if (columnName === "value_media_id") {
		const normalized = normalizePositiveInteger(value);
		if (normalized === null) return false;
		payload.value_media_id = normalized;
		return true;
	}

	if (columnName === "value_content_id") {
		const normalized = normalizePositiveInteger(value);
		if (normalized === null) return false;
		payload.value_content_id = normalized;
		return true;
	}

	if (columnName === "value_option_key") {
		const normalized = normalizeString(value);
		if (normalized === null) return false;
		payload.value_option_key = normalized;
		return true;
	}

	if (columnName === "value_rich_text_json") {
		if (value === null || typeof value === "undefined") {
			return false;
		}

		const normalized = normalizeRichTextJson(value);
		if (normalized === null) {
			return false;
		}

		payload.value_rich_text_json = normalized;
		return true;
	}

	throw new Error(`${field.label} uses unsupported value column ${columnName}.`);
}

function isYoutubeContentField(field: ContentTemplateFieldDefinition): boolean {
	return (
		field.fieldTypeCode === "youtube_url" &&
		field.valueColumnName === "value_text"
	);
}

function isGenericExternalLinkField(
	field: ContentTemplateFieldDefinition,
): boolean {
	if (isYoutubeContentField(field)) {
		return false;
	}

	const fieldListCode = field.fieldListCode?.trim().toLowerCase() ?? "";
	return fieldListCode === "link_url" || fieldListCode === "hidden_link_url";
}

export function buildContentFieldValuePayload(
	fields: ContentTemplateFieldDefinition[],
	rawValues: Values,
): ContentFieldValueDbInput[] {
	const payloads: ContentFieldValueDbInput[] = [];

	for (const field of fields) {
		if (field.isEnabled === false) {
			continue;
		}

		const rawValue = rawValues[String(field.templateFieldId)];
		const payload: ContentFieldValueDbInput = {
			template_field_id: field.templateFieldId,
			value_seq_no: 1,
		};

		const populated = setValueOnPayload(payload, field, rawValue);

		if (!populated) {
			if (field.isRequired) {
				throw new Error(`${field.label} is required.`);
			}

			continue;
		}

		payloads.push(payload);
	}

	return payloads;
}

export function buildContentExternalLinkPayload(
	fields: ContentTemplateFieldDefinition[],
	rawValues: Values,
): ContentExternalLinkDbInput[] {
	const payloads: ContentExternalLinkDbInput[] = [];

	for (const field of fields) {
		if (field.isEnabled === false) {
			continue;
		}

		const rawValue = rawValues[String(field.templateFieldId)];

		if (isGenericExternalLinkField(field)) {
			const normalized = normalizeString(rawValue);
			if (normalized !== null) {
				const linkPolicyResult = normalizeGeneralLinkAuthorInput(normalized);
				if (!linkPolicyResult.ok) {
					throw new Error(`${field.label}: ${linkPolicyResult.message}`);
				}

				if (linkPolicyResult.kind === "external") {
					payloads.push({
						template_field_id: field.templateFieldId,
						value_seq_no: 1,
						link_index_no: 1,
						source_kind_code: "field",
						raw_url: linkPolicyResult.href,
						link_text: null,
					});
				}
			}

			continue;
		}

		if (field.valueColumnName !== "value_rich_text_json") {
			continue;
		}

		const normalizedRichText = normalizeRichTextJson(rawValue);
		if (normalizedRichText === null) {
			continue;
		}

		const linkReferences = extractRichTextLinkReferences(normalizedRichText);
		for (const linkReference of linkReferences) {
			const linkPolicyResult = normalizeGeneralLinkAuthorInput(
				linkReference.rawUrl,
			);
			if (!linkPolicyResult.ok || linkPolicyResult.kind !== "external") {
				continue;
			}

			payloads.push({
				template_field_id: field.templateFieldId,
				value_seq_no: 1,
				link_index_no: linkReference.displayOrder,
				source_kind_code: "rich_text",
				raw_url: linkPolicyResult.href,
				link_text: linkReference.linkText,
			});
		}
	}

	return payloads;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
