//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/richtext-link-picker-cache.ts                         ////
//// Language: TS                                                                                                ////
//// Session-scoped RichText link-picker metadata and stale-while-refresh row cache with idle prefetch.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { readRichTextPickerJson } from "@/lib/helpers/richtext-picker-response";

export type RichTextLinkPickerContext = "admin" | "member";

type CacheEntry = {
	payload: unknown;
	expiresAt: number;
};

export type CachedRichTextPickerPayload = {
	payload: unknown;
	fresh: boolean;
};

const META_TTL_MS = 10 * 60 * 1000;
const ROWS_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 120;

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function richTextLinkPickerBasePath(
	context: RichTextLinkPickerContext,
): string {
	return context === "admin"
		? "/api/admin/web/richtext-links"
		: "/api/me/richtext-links";
}

function ttlForUrl(url: string): number {
	return url.endsWith("/meta") ? META_TTL_MS : ROWS_TTL_MS;
}

function storeCachedPayload(url: string, payload: unknown): void {
	responseCache.delete(url);
	while (responseCache.size >= MAX_CACHE_ENTRIES) {
		const oldestKey = responseCache.keys().next().value;
		if (typeof oldestKey !== "string") {
			break;
		}
		responseCache.delete(oldestKey);
	}
	responseCache.set(url, {
		payload,
		expiresAt: Date.now() + ttlForUrl(url),
	});
}

export function readCachedRichTextPickerPayload(
	url: string,
): CachedRichTextPickerPayload | null {
	const entry = responseCache.get(url);
	if (!entry) {
		return null;
	}

	return {
		payload: entry.payload,
		fresh: entry.expiresAt > Date.now(),
	};
}

export async function loadRichTextPickerPayload(
	url: string,
	fallbackMessage: string,
): Promise<unknown> {
	const cached = readCachedRichTextPickerPayload(url);
	if (cached?.fresh) {
		return cached.payload;
	}

	const pending = pendingRequests.get(url);
	if (pending) {
		return pending;
	}

	const request = fetch(url, {
		cache: "no-store",
		credentials: "include",
		headers: { Accept: "application/json" },
	})
		.then((response) => readRichTextPickerJson(response, fallbackMessage))
		.then((payload) => {
			storeCachedPayload(url, payload);
			return payload;
		})
		.finally(() => {
			pendingRequests.delete(url);
		});

	pendingRequests.set(url, request);
	return request;
}

export function prefetchRichTextLinkPickerContext(
	context: RichTextLinkPickerContext,
): void {
	const basePath = richTextLinkPickerBasePath(context);

	void Promise.allSettled([
		loadRichTextPickerPayload(
			`${basePath}/meta`,
			"Failed to load link-picker metadata.",
		),
		loadRichTextPickerPayload(
			`${basePath}/internal`,
			"Failed to load internal page targets.",
		),
		loadRichTextPickerPayload(
			`${basePath}/riseopedia`,
			"Failed to load Riseopedia targets.",
		),
	]);
}

export function clearRichTextLinkPickerCache(): void {
	responseCache.clear();
	pendingRequests.clear();
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
