//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/info-route.ts                                                              ////
//// Language: TS                                                                                             ////
//// Shared server helpers for DB-gated public /info route resolution.                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import {
	findPublicCollectionByPath,
	findPublicContentByPath,
	type PublicCollectionResult,
	type PublicContentResult,
} from "@/lib/data/public-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

const INFO_WIKI_CATEGORIES = ["riseopedia", "mafiosopedia"] as const;

export type InfoRouteFamilySlug =
	| "browse"
	| "sections"
	| "classes"
	| "categories"
	| "subcategories"
	| "entity";

export type InfoRouteContentArgs = {
	categorySlug: string;
	subcategorySlug: InfoRouteFamilySlug;
	contentSlug?: string | null;
};

export function normalizeInfoRouteSegment(value: string | null | undefined): string | null {
	const trimmed = value?.trim().toLowerCase();
	if (!trimmed || trimmed.length <= 0) {
		return null;
	}

	return trimmed.replace(/^\/+|\/+$/g, "");
}

export type InfoWikiCategorySlug = (typeof INFO_WIKI_CATEGORIES)[number];

export function isInfoWikiCategory(categorySlug: string): categorySlug is InfoWikiCategorySlug {
	return INFO_WIKI_CATEGORIES.some((slug) => slug === categorySlug);
}

export function isRiseopediaInfoCategory(categorySlug: string): boolean {
	return isInfoWikiCategory(categorySlug);
}

export async function findInfoSubcategoryRoute(args: {
	categorySlug: string;
	subcategorySlug: InfoRouteFamilySlug;
}): Promise<PublicCollectionResult | null> {
	const actorDiscordId = await getCurrentActorDiscordId();
	return findPublicCollectionByPath({
		actorDiscordId,
		categorySlug: args.categorySlug,
		subcategorySlug: args.subcategorySlug,
	});
}

export async function findInfoRouteContent(
	args: InfoRouteContentArgs,
): Promise<PublicContentResult | null> {
	if (!args.contentSlug) {
		return null;
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	return findPublicContentByPath({
		actorDiscordId,
		publicRoutePrefix: "info",
		categorySlug: args.categorySlug,
		subcategorySlug: args.subcategorySlug,
		contentSlug: args.contentSlug,
	});
}
