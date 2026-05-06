//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/youtube-video-metadata.ts                                                     ////
//// Language: TS                                                                                               ////
//// Resolves YouTube video metadata needed for DB-backed channel allowlist validation                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { parseYoutubeVideoUrl } from "@/lib/helpers/youtube-url";
import { getOptionalEnv } from "@/lib/server/env";

export type YoutubeResolvedVideoMetadata = {
	videoId: string;
	canonicalUrl: string;
	channelExternalId: string;
	channelTitle: string | null;
	videoTitle: string | null;
};

const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;

function getYoutubeDataApiKey(): string | null {
	const primary = getOptionalEnv("YOUTUBE_DATA_API_KEY");
	if (primary) {
		return primary;
	}

	return getOptionalEnv("GOOGLE_YOUTUBE_DATA_API_KEY");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function readFirstVideoSnippet(payload: unknown): Record<string, unknown> | null {
	if (!isRecord(payload) || !Array.isArray(payload.items)) {
		return null;
	}

	const firstItem = payload.items[0];
	if (!isRecord(firstItem) || !isRecord(firstItem.snippet)) {
		return null;
	}

	return firstItem.snippet;
}

async function readYoutubeErrorMessage(response: Response): Promise<string> {
	const text = await response.text().catch(() => "");
	const trimmed = text.trim();
	if (trimmed.length === 0) {
		return `YouTube metadata lookup failed with status ${response.status}.`;
	}

	return `YouTube metadata lookup failed with status ${response.status}: ${trimmed.slice(0, 300)}`;
}

export async function resolveYoutubeVideoMetadata(
	rawUrl: string,
): Promise<YoutubeResolvedVideoMetadata> {
	const parsed = parseYoutubeVideoUrl(rawUrl);
	if (!parsed) {
		throw new Error("Enter a valid YouTube video URL before channel validation.");
	}

	const apiKey = getYoutubeDataApiKey();
	if (!apiKey) {
		throw new Error(
			"YouTube channel validation requires YOUTUBE_DATA_API_KEY or GOOGLE_YOUTUBE_DATA_API_KEY.",
		);
	}

	const url = new URL("https://www.googleapis.com/youtube/v3/videos");
	url.searchParams.set("part", "snippet");
	url.searchParams.set("id", parsed.videoId);
	url.searchParams.set("key", apiKey);

	const response = await fetch(url, {
		cache: "no-store",
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(await readYoutubeErrorMessage(response));
	}

	const payload = (await response.json().catch(() => null)) as unknown;
	const snippet = readFirstVideoSnippet(payload);
	if (!snippet) {
		throw new Error(`YouTube video ${parsed.videoId} was not found.`);
	}

	const channelExternalId = readString(snippet.channelId);
	if (!channelExternalId || !CHANNEL_ID_PATTERN.test(channelExternalId)) {
		throw new Error(`YouTube video ${parsed.videoId} did not return a stable channel ID.`);
	}

	return {
		videoId: parsed.videoId,
		canonicalUrl: parsed.canonicalUrl,
		channelExternalId,
		channelTitle: readString(snippet.channelTitle),
		videoTitle: readString(snippet.title),
	};
}
