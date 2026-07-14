//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-media-references.ts                                                   ////
//// Language: TS                                                                                                ////
//// Extracts structured media references from admin content field payloads and rich text JSON                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { extractRichTextMediaReferences } from "@/lib/editors/richtext/rich-text-json";
import { extractStorageRelPathFromMediaUrl } from "@/lib/helpers/media-url";
import type {
	ContentFieldValueDbInput,
	ContentTemplateFieldDefinition,
} from "@/lib/helpers/content-field-values";

export type ExtractedContentMediaReference = {
	mediaId: number | null;
	storageRelPath: string | null;
	usageCode: string;
	displayOrder: number;
	caption: string | null;
};

type MutableContentMediaReference = ExtractedContentMediaReference & {
	key: string;
};

function fieldUsageCode(field: ContentTemplateFieldDefinition): string {
	return `field_${field.templateFieldId}`;
}

function richTextUsageCode(
	field: ContentTemplateFieldDefinition,
	imageIndex: number,
): string {
	return `rich_text_${field.templateFieldId}_${imageIndex}`;
}

export function extractContentMediaReferences(
	fields: ContentTemplateFieldDefinition[],
	fieldValues: ContentFieldValueDbInput[],
): ExtractedContentMediaReference[] {
	const fieldById = new Map(
		fields.map((field) => [field.templateFieldId, field]),
	);
	const references: MutableContentMediaReference[] = [];

	for (const payload of fieldValues) {
		const field = fieldById.get(payload.template_field_id);
		if (!field) {
			continue;
		}

		if (typeof payload.value_media_id === "number") {
			const usageCode = fieldUsageCode(field);
			references.push({
				key: `${usageCode}:${payload.value_media_id}`,
				mediaId: payload.value_media_id,
				storageRelPath: null,
				usageCode,
				displayOrder: payload.value_seq_no,
				caption: null,
			});
		}

		if (typeof payload.value_rich_text_json !== "undefined") {
			const richTextReferences = extractRichTextMediaReferences(
				payload.value_rich_text_json,
			);

			for (const reference of richTextReferences) {
				const usageCode = richTextUsageCode(field, reference.displayOrder);
				const storageRelPath = reference.source
					? extractStorageRelPathFromMediaUrl(reference.source)
					: null;

				if (reference.mediaId === null && storageRelPath === null) {
					continue;
				}

				references.push({
					key: `${usageCode}:${reference.mediaId ?? storageRelPath ?? ""}`,
					mediaId: reference.mediaId,
					storageRelPath,
					usageCode,
					displayOrder: reference.displayOrder,
					caption: reference.caption,
				});
			}
		}
	}

	const byKey = new Map<string, MutableContentMediaReference>();
	for (const reference of references) {
		byKey.set(reference.key, reference);
	}

	return Array.from(byKey.values()).map(
		({ key: _key, ...reference }) => reference,
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
