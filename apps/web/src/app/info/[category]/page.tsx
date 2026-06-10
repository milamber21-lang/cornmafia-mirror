//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/[category]/page.tsx                                                          ////
//// Language: TSX                                                                                              ////
//// Info category root redirects supported wiki namespaces to their browse overview route.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { notFound, redirect } from "next/navigation";

import {
	isRiseopediaInfoCategory,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
	}>;
};

export default async function InfoCategoryPage({ params }: PageProps) {
	const resolvedParams = await params;
	const categorySlug = normalizeInfoRouteSegment(resolvedParams.category);

	if (!categorySlug || !isRiseopediaInfoCategory(categorySlug)) {
		notFound();
	}

	redirect(`/info/${categorySlug}/browse`);
}
