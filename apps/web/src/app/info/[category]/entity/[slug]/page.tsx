//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/entity/[slug]/page.tsx                                             ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki entity detail route resolved through DB-owned entity slugs.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import { notFound } from "next/navigation";

import RiseopediaEntityDetailClient from "@/components/riseopedia/RiseopediaEntityDetailClient";
import {
	findOpediaEntityDetailByEntitySlug,
	getOpediaWikiConfig,
} from "@/lib/data/opedia-wiki";
import {
	findInfoSubcategoryRoute,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
		slug: string;
	}>;
};

export default async function InfoEntityDetailPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);
	const entitySlug = normalizeInfoRouteSegment(resolvedParams.slug);
	const wiki = categorySlug ? getOpediaWikiConfig(categorySlug) : null;

	if (!categorySlug || !entitySlug || !wiki) {
		notFound();
	}

	const routeContent = await findInfoSubcategoryRoute({
		categorySlug,
		subcategorySlug: "entity",
	});

	if (!routeContent) {
		notFound();
	}

	const detail = await findOpediaEntityDetailByEntitySlug(wiki, entitySlug);

	if (!detail) {
		notFound();
	}

	return (
		<RiseopediaEntityDetailClient
			detail={detail}
			wikiCode={wiki.code}
			wikiName={wiki.title}
		/>
	);
}
