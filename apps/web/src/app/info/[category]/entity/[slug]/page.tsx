//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/entity/[slug]/page.tsx                                             ////
//// Language: TSX                                                                                             ////
//// DB-gated /info wiki entity detail route resolved through DB-owned entity slugs.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authz";

import RiseopediaEntityDetailClient from "@/components/riseopedia/detail/RiseopediaEntityDetailClient";
import {
	findOpediaEntityDetailByEntitySlug,
	getOpediaWikiConfig,
} from "@/lib/data/opedia-wiki";
import {
	findMafiosopediaEntityReleaseStatus,
	listRiseopediaReleaseOverrideReasonOptions,
} from "@/lib/data/mafiosopedia-release-status";
import { parseMafiosopediaReleaseFilters } from "@/lib/data/mafiosopedia-release";
import {
	firstSearchParam,
	type RiseopediaSearchParamValue,
} from "@/lib/helpers/riseopedia-page-params";
import { normalizeRiseopediaEntityVariantKey } from "@/lib/helpers/riseopedia-entity-links";
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
	searchParams: Promise<{
		release?: RiseopediaSearchParamValue;
		variant?: RiseopediaSearchParamValue;
	}>;
};

export default async function InfoEntityDetailPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const [resolvedParams, resolvedSearchParams] = await Promise.all([
		params,
		searchParams,
	]);
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

	const releaseFilters =
		wiki.code === "mafiosopedia"
			? parseMafiosopediaReleaseFilters(
					firstSearchParam(resolvedSearchParams.release),
				)
			: undefined;

	const detail = await findOpediaEntityDetailByEntitySlug(wiki, entitySlug);

	if (!detail) {
		notFound();
	}

	if (detail.doc.entitySlug !== entitySlug) {
		const redirectSearchParams = new URLSearchParams();
		const redirectRelease = firstSearchParam(resolvedSearchParams.release);
		const redirectVariant = firstSearchParam(resolvedSearchParams.variant);

		if (redirectRelease) {
			redirectSearchParams.set("release", redirectRelease);
		}

		if (redirectVariant) {
			redirectSearchParams.set("variant", redirectVariant);
		}

		const redirectQuery = redirectSearchParams.toString();
		redirect(
			`${wiki.basePath}/entity/${detail.doc.entitySlug}${redirectQuery ? `?${redirectQuery}` : ""}`,
		);
	}

	const requestedVariantKey = normalizeRiseopediaEntityVariantKey(
		firstSearchParam(resolvedSearchParams.variant),
	);
	const initialEntityVariantKey =
		requestedVariantKey &&
		detail.variants.some((variant) => variant.variantKey === requestedVariantKey)
			? requestedVariantKey
			: null;

	let releaseStatus = null;
	let canManageReleaseStatus = false;
	let releaseOverrideReasons: Awaited<
		ReturnType<typeof listRiseopediaReleaseOverrideReasonOptions>
	> = [];

	if (wiki.code === "mafiosopedia") {
		const [status, admin] = await Promise.all([
			findMafiosopediaEntityReleaseStatus({
				entityId: detail.doc.entityId,
				entityTypeCode: detail.doc.entityTypeCode,
			}),
			requireAdmin(),
		]);
		releaseStatus = status;
		canManageReleaseStatus = admin.allowed;

		if (admin.allowed) {
			releaseOverrideReasons = await listRiseopediaReleaseOverrideReasonOptions();
		}
	}

	return (
		<RiseopediaEntityDetailClient
			canManageReleaseStatus={canManageReleaseStatus}
			initialEntityVariantKey={initialEntityVariantKey}
			detail={detail}
			releaseOverrideReasons={releaseOverrideReasons}
			releaseStatus={releaseStatus}
			wikiCode={wiki.code}
			wikiName={wiki.title}
			releaseFilters={releaseFilters}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
