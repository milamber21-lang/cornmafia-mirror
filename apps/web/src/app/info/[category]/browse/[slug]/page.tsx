//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/browse/[slug]/page.tsx                                            ////
//// Language: TSX                                                                                              ////
//// DB-gated /info browse shortcut route for fixed Riseopedia browse navigation aliases.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
	findInfoSubcategoryRoute,
	isRiseopediaInfoCategory,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia Browse Shortcut | Corn Mafia",
};

const BROWSE_SHORTCUT_TARGETS = {
	sections: "sections",
	classes: "classes",
	categories: "categories",
	subcategories: "subcategories",
} as const;

type BrowseShortcutSlug = keyof typeof BROWSE_SHORTCUT_TARGETS;

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
	searchParams: Promise<{
		release?: string | string[];
	}>;
};

function isBrowseShortcutSlug(value: string): value is BrowseShortcutSlug {
	return Object.prototype.hasOwnProperty.call(BROWSE_SHORTCUT_TARGETS, value);
}

export default async function InfoBrowseShortcutPage({
	params,
	searchParams,
}: PageProps): Promise<never> {
	const [resolvedParams, resolvedSearchParams] = await Promise.all([
		params,
		searchParams,
	]);
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const shortcutSlug = normalizeInfoRouteSegment(resolvedParams.slug);

	if (
		!categorySlug ||
		!isRiseopediaInfoCategory(categorySlug) ||
		!shortcutSlug
	) {
		notFound();
	}

	if (!isBrowseShortcutSlug(shortcutSlug)) {
		notFound();
	}

	const browseRouteContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "browse",
	});

	if (!browseRouteContent) {
		notFound();
	}

	const targetSubcategorySlug = BROWSE_SHORTCUT_TARGETS[shortcutSlug];
	const targetRouteContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: targetSubcategorySlug,
	});

	if (!targetRouteContent) {
		notFound();
	}

	const release = Array.isArray(resolvedSearchParams.release)
		? resolvedSearchParams.release[0]
		: resolvedSearchParams.release;
	const releaseQuery = release ? `?release=${encodeURIComponent(release)}` : "";

	redirect(`/info/${categorySlug}/${targetSubcategorySlug}${releaseQuery}`);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
