//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/mafiosopedia-entity-links.ts                                                 ////
//// Language: TS                                                                                             ////
//// Pure URL helpers for public Mafiosopedia info-route and DB-owned entity slugs.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const MAFIOSOPEDIA_INFO_BASE_PATH = "/info/mafiosopedia";

const MAFIOSOPEDIA_ENTITY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;

export type MafiosopediaInfoRouteFamily = "browse" | "sections" | "classes" | "categories" | "subcategories" | "entity";

function normalizePathSegment(value: string | null): string | null {
	const trimmed = value?.trim();
	if (!trimmed || trimmed.length <= 0) {
		return null;
	}

	return trimmed.replace(/^\/+|\/+$/g, "");
}

export function buildMafiosopediaInfoPath(args: {
	family: MafiosopediaInfoRouteFamily;
	slug?: string | null;
}): string {
	const slug = normalizePathSegment(args.slug ?? null);
	return slug
		? `${MAFIOSOPEDIA_INFO_BASE_PATH}/${args.family}/${slug}`
		: `${MAFIOSOPEDIA_INFO_BASE_PATH}/${args.family}`;
}

export function normalizeMafiosopediaEntitySlug(entitySlug: string | null): string | null {
	const normalizedSlug = normalizePathSegment(entitySlug);
	if (!normalizedSlug || !MAFIOSOPEDIA_ENTITY_SLUG_PATTERN.test(normalizedSlug)) {
		return null;
	}

	return normalizedSlug;
}

export function buildMafiosopediaEntityHref(args: {
	entityTypeCode?: string | null;
	entitySlug: string | null;
}): string | null {
	const entitySlug = normalizeMafiosopediaEntitySlug(args.entitySlug);
	return entitySlug ? `${MAFIOSOPEDIA_INFO_BASE_PATH}/entity/${entitySlug}` : null;
}

export function buildMafiosopediaMediaHref(mediaFileId: string | null): string | null {
	if (!mediaFileId || !/^[1-9][0-9]{0,18}$/.test(mediaFileId)) {
		return null;
	}

	return `/api/mafiosopedia/media/${encodeURIComponent(mediaFileId)}`;
}
