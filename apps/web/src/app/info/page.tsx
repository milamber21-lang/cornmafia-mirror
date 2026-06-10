//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/info/page.tsx                                                                      ////
//// Language: TSX                                                                                              ////
//// Info route root intentionally stays unavailable until a category namespace is selected.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InfoRootPage() {
	notFound();
}
