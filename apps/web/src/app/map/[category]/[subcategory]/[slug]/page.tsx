//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/map/[category]/[subcategory]/[slug]/page.tsx                                    ////
//// Language: TSX                                                                                               ////
//// DB-first prefixed public content route for map content kinds                                           ////
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
	return <PublicContentRoutePage params={params} publicRoutePrefix="map" />;
}
