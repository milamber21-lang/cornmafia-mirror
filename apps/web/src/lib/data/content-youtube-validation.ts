//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/content-youtube-validation.ts                                                   ////
//// Language: TS                                                                                               ////
//// Validates embedded YouTube content fields against the DB-managed channel allowlist                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type {
	ContentFieldValueDbInput,
	ContentTemplateFieldDefinition,
} from "@/lib/helpers/content-field-values";
import { parseYoutubeVideoUrl } from "@/lib/helpers/youtube-url";
import { resolveYoutubeVideoMetadata } from "@/lib/server/youtube-video-metadata";

type YoutubeValidationReference = {
	templateFieldId: number;
	label: string;
	canonicalUrl: string;
	videoId: string;
};

type YoutubeValidationDbRow = {
	video_id: string;
	channel_external_id: string;
};

function isYoutubeField(field: ContentTemplateFieldDefinition): boolean {
	return (
		field.fieldTypeCode === "youtube_url" &&
		field.valueColumnName === "value_text"
	);
}

function getYoutubeValidationLabel(field: ContentTemplateFieldDefinition): string {
	return field.label || "YouTube video";
}

function readYoutubeValidationReferences(
	fields: ContentTemplateFieldDefinition[],
	fieldValues: ContentFieldValueDbInput[],
): YoutubeValidationReference[] {
	const youtubeFields = new Map<number, ContentTemplateFieldDefinition>();
	for (const field of fields) {
		if (isYoutubeField(field)) {
			youtubeFields.set(field.templateFieldId, field);
		}
	}

	const references: YoutubeValidationReference[] = [];
	for (const fieldValue of fieldValues) {
		const field = youtubeFields.get(fieldValue.template_field_id);
		if (!field || typeof fieldValue.value_text !== "string") {
			continue;
		}

		const parsed = parseYoutubeVideoUrl(fieldValue.value_text);
		if (!parsed) {
			throw new Error(`${field.label}: Enter a valid YouTube video URL.`);
		}

		references.push({
			templateFieldId: field.templateFieldId,
			label: getYoutubeValidationLabel(field),
			canonicalUrl: parsed.canonicalUrl,
			videoId: parsed.videoId,
		});
	}

	return references;
}

export async function assertContentYoutubeChannelsAllowed(args: {
	actorDiscordId: string;
	fields: ContentTemplateFieldDefinition[];
	fieldValues: ContentFieldValueDbInput[];
}): Promise<void> {
	const references = readYoutubeValidationReferences(args.fields, args.fieldValues);
	if (references.length === 0) {
		return;
	}

	const seenVideoIds = new Set<string>();
	for (const reference of references) {
		if (seenVideoIds.has(reference.videoId)) {
			continue;
		}
		seenVideoIds.add(reference.videoId);

		try {
			const metadata = await resolveYoutubeVideoMetadata(reference.canonicalUrl);

			await query<YoutubeValidationDbRow>(
				`
					SELECT video_id,
						   channel_external_id
					FROM web_api.web_youtube_video_assert_allowed_admin($1, $2, $3, $4, $5)
				`,
				[
					args.actorDiscordId,
					metadata.videoId,
					metadata.channelExternalId,
					metadata.videoTitle,
					metadata.channelTitle,
				],
			);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "YouTube channel validation failed.";
			throw new Error(`${reference.label}: ${message}`);
		}
	}
}
