//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/video/[category]/[subcategory]/[slug]/page.tsx                                      ////
//// Language: TSX                                                                                               ////
//// Official DB-first /video public content route for video content kinds.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import PublicContentRoutePage from "@/components/public/PublicContentRoutePage";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
		subcategory: string;
		slug: string;
	}>;
};

export default async function Page({ params }: PageProps) {
	return <PublicContentRoutePage params={params} publicRoutePrefix="video" />;
}
