//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicInternalContentPageRoute.tsx                                      ////
//// Language: TSX                                                                                               ////
//// Public static-route adapter that renders DB content from the internal pages collection.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import PublicContentRenderer from "@/components/public/PublicContentRenderer";
import { findPublicContentByPath } from "@/lib/data/public-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export type PublicInternalPageSlug = "home" | "privacy" | "terms" | "unavailable";

type PublicInternalContentPageRouteProps = {
	pageSlug: PublicInternalPageSlug;
	fallback?: ReactNode;
};

export default async function PublicInternalContentPageRoute({
	pageSlug,
	fallback,
}: PublicInternalContentPageRouteProps) {
	const actorDiscordId = await getCurrentActorDiscordId();
	const content = await findPublicContentByPath({
		actorDiscordId,
		publicRoutePrefix: null,
		categorySlug: "internal",
		subcategorySlug: "pages",
		contentSlug: pageSlug,
	});

	if (!content) {
		if (fallback !== undefined) {
			return <>{fallback}</>;
		}

		notFound();
	}

	return <PublicContentRenderer content={content} />;
}
