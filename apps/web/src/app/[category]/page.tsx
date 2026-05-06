//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/[category]/page.tsx                                                                  ////
//// Language: TSX                                                                                               ////
//// Public category routes intentionally stay unpublished while collection hubs live one level deeper             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryLandingPage(): Promise<never> {
	notFound();
}
