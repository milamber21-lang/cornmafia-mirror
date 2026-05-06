//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/page.tsx                                                                             ////
//// Language: TSX                                                                                               ////
//// Homepage route rendered from DB-backed internal page content with a setup-safe fallback.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { Metadata } from "next";

import PublicInternalContentPageRoute from "@/components/public/PublicInternalContentPageRoute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Corn Mafia Guild",
};

export default function HomePage() {
	return <PublicInternalContentPageRoute pageSlug="home"/>;
}
