//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicContentRoutePage.tsx                                              ////
//// Language: TSX                                                                                               ////
//// Shared route component that resolves public DB content or falls through to the unavailable public page      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { notFound, redirect } from "next/navigation";

import PublicContentRenderer from "@/components/public/PublicContentRenderer";
import {
	findPublicContentAppHrefByPath,
	findPublicContentByPath,
	findPublicContentRedirectByPath,
	type PublicRoutePrefix,
} from "@/lib/data/public-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export type PublicContentRouteParams = {
	category: string;
	subcategory: string;
	slug: string;
};

type PublicContentRoutePageProps = {
	params: Promise<PublicContentRouteParams>;
	publicRoutePrefix: PublicRoutePrefix | null;
};

export default async function PublicContentRoutePage({
	params,
	publicRoutePrefix,
}: PublicContentRoutePageProps) {
	const resolvedParams = await params;
	const categorySlug = resolvedParams.category.trim();
	const subcategorySlug = resolvedParams.subcategory.trim();
	const contentSlug = resolvedParams.slug.trim();

	if (!categorySlug || !subcategorySlug || !contentSlug) {
		notFound();
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	const appHref = await findPublicContentAppHrefByPath({
		actorDiscordId,
		publicRoutePrefix,
		categorySlug,
		subcategorySlug,
		contentSlug,
	});

	if (appHref) {
		redirect(appHref);
	}

	const content = await findPublicContentByPath({
		actorDiscordId,
		publicRoutePrefix,
		categorySlug,
		subcategorySlug,
		contentSlug,
	});

	if (!content) {
		const redirectTarget = await findPublicContentRedirectByPath({
			actorDiscordId,
			publicRoutePrefix,
			categorySlug,
			subcategorySlug,
			contentSlug,
		});

		if (redirectTarget) {
			redirect(redirectTarget.redirectPath);
		}

		notFound();
	}

	return <PublicContentRenderer content={content} />;
}
