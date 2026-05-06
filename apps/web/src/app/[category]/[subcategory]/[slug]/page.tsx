//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/[category]/[subcategory]/[slug]/page.tsx                                             ////
//// Language: TSX                                                                                               ////
//// DB-first normal public content route with strict category, subcategory, and content path resolution          ////
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
	return <PublicContentRoutePage params={params} publicRoutePrefix={null} />;
}
