//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/riseopedia-entity-links.ts                                                 ////
//// Language: TS                                                                                             ////
//// Pure URL helpers for public Riseopedia and Mafiosopedia info routes, entity variants, and release context. ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	mafiosopediaReleaseSearchParam,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";

export type OpediaWikiCode = "riseopedia" | "mafiosopedia";

export const RISEOPEDIA_INFO_BASE_PATH = "/info/riseopedia";
export const MAFIOSOPEDIA_INFO_BASE_PATH = "/info/mafiosopedia";

const RISEOPEDIA_ENTITY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;
const RISEOPEDIA_ENTITY_VARIANT_KEY_PATTERN =
	/^[a-z0-9][a-z0-9_-]*(?:__[a-z0-9][a-z0-9_-]*)*$/;

export type RiseopediaInfoRouteFamily =
	| "browse"
	| "sections"
	| "classes"
	| "categories"
	| "subcategories"
	| "entity";

function normalizePathSegment(value: string | null): string | null {
	const trimmed = value?.trim();
	if (!trimmed || trimmed.length <= 0) {
		return null;
	}

	return trimmed.replace(/^\/+|\/+$/g, "");
}

function opediaBasePath(wikiCode: OpediaWikiCode | undefined): string {
	return wikiCode === "mafiosopedia"
		? MAFIOSOPEDIA_INFO_BASE_PATH
		: RISEOPEDIA_INFO_BASE_PATH;
}

function opediaMediaApiPath(wikiCode: OpediaWikiCode | undefined): string {
	return wikiCode === "mafiosopedia"
		? "/api/mafiosopedia/media"
		: "/api/riseopedia/media";
}

export function buildRiseopediaInfoPath(args: {
	family: RiseopediaInfoRouteFamily;
	slug?: string | null;
	wikiCode?: OpediaWikiCode;
}): string {
	const slug = normalizePathSegment(args.slug ?? null);
	const basePath = opediaBasePath(args.wikiCode);
	return slug
		? `${basePath}/${args.family}/${slug}`
		: `${basePath}/${args.family}`;
}

export function normalizeRiseopediaEntitySlug(
	entitySlug: string | null,
): string | null {
	const normalizedSlug = normalizePathSegment(entitySlug);
	if (!normalizedSlug || !RISEOPEDIA_ENTITY_SLUG_PATTERN.test(normalizedSlug)) {
		return null;
	}

	return normalizedSlug;
}

export function normalizeRiseopediaEntityVariantKey(
	entityVariantKey: string | null | undefined,
): string | null {
	const normalizedKey = entityVariantKey?.trim();
	return normalizedKey &&
		RISEOPEDIA_ENTITY_VARIANT_KEY_PATTERN.test(normalizedKey)
		? normalizedKey
		: null;
}

export function buildRiseopediaEntityHref(args: {
	entityTypeCode?: string | null;
	entitySlug: string | null;
	targetEntityVariantKey?: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: readonly MafiosopediaReleaseFilterCode[];
}): string | null {
	const entitySlug = normalizeRiseopediaEntitySlug(args.entitySlug);
	if (!entitySlug) {
		return null;
	}

	const targetEntityVariantKey = normalizeRiseopediaEntityVariantKey(
		args.targetEntityVariantKey,
	);
	const query = new URLSearchParams();

	if (targetEntityVariantKey) {
		query.set("variant", targetEntityVariantKey);
	}

	if (args.wikiCode === "mafiosopedia" && args.releaseFilters) {
		query.set("release", mafiosopediaReleaseSearchParam(args.releaseFilters));
	}

	const href = `${opediaBasePath(args.wikiCode)}/entity/${entitySlug}`;
	const queryText = query.toString();
	return queryText.length > 0 ? `${href}?${queryText}` : href;
}

export function buildRiseopediaMediaHref(
	mediaFileId: string | null,
	wikiCode?: OpediaWikiCode,
): string | null {
	if (!mediaFileId || !/^[1-9][0-9]{0,18}$/.test(mediaFileId)) {
		return null;
	}

	return `${opediaMediaApiPath(wikiCode)}/${encodeURIComponent(mediaFileId)}`;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
