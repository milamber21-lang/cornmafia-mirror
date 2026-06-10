//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/riseopedia-entity-links.ts                                                 ////
//// Language: TS                                                                                             ////
//// Pure URL helpers for public Riseopedia and Mafiosopedia info-route and DB-owned entity slugs.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type OpediaWikiCode = "riseopedia" | "mafiosopedia";

export const RISEOPEDIA_INFO_BASE_PATH = "/info/riseopedia";
export const MAFIOSOPEDIA_INFO_BASE_PATH = "/info/mafiosopedia";

const RISEOPEDIA_ENTITY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

export type RiseopediaInfoRouteFamily = "browse" | "sections" | "classes" | "categories" | "subcategories" | "entity";

function normalizePathSegment(value: string | null): string | null {
	const trimmed = value?.trim();
	if (!trimmed || trimmed.length <= 0) {
		return null;
	}

	return trimmed.replace(/^\/+|\/+$/g, "");
}

function opediaBasePath(wikiCode: OpediaWikiCode | undefined): string {
	return wikiCode === "mafiosopedia" ? MAFIOSOPEDIA_INFO_BASE_PATH : RISEOPEDIA_INFO_BASE_PATH;
}

function opediaMediaApiPath(wikiCode: OpediaWikiCode | undefined): string {
	return wikiCode === "mafiosopedia" ? "/api/mafiosopedia/media" : "/api/riseopedia/media";
}

export function buildRiseopediaInfoPath(args: {
	family: RiseopediaInfoRouteFamily;
	slug?: string | null;
	wikiCode?: OpediaWikiCode;
}): string {
	const slug = normalizePathSegment(args.slug ?? null);
	const basePath = opediaBasePath(args.wikiCode);
	return slug ? `${basePath}/${args.family}/${slug}` : `${basePath}/${args.family}`;
}

export function normalizeRiseopediaEntitySlug(entitySlug: string | null): string | null {
	const normalizedSlug = normalizePathSegment(entitySlug);
	if (!normalizedSlug || !RISEOPEDIA_ENTITY_SLUG_PATTERN.test(normalizedSlug)) {
		return null;
	}

	return normalizedSlug;
}

export function buildRiseopediaEntityHref(args: {
	entityTypeCode?: string | null;
	entitySlug: string | null;
	wikiCode?: OpediaWikiCode;
}): string | null {
	const entitySlug = normalizeRiseopediaEntitySlug(args.entitySlug);
	return entitySlug ? `${opediaBasePath(args.wikiCode)}/entity/${entitySlug}` : null;
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
