//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/privacy/page.tsx                                                                     ////
//// Language: TSX                                                                                               ////
//// Public privacy route rendered from DB-backed internal page content.                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { Metadata } from "next";

import PublicInternalContentPageRoute from "@/components/public/PublicInternalContentPageRoute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Privacy",
};

export default function PrivacyPage() {
	return <PublicInternalContentPageRoute pageSlug="privacy" />;
}
