//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicContentRenderer.tsx                                               ////
//// Language: TSX                                                                                               ////
//// Public content rendering adapter that feeds DB-resolved content into the shared content renderer.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentRenderer from "@/components/renderers/content/ContentRenderer";
import { createPublicContentRenderModel } from "@/components/renderers/content/render-model";
import type { PublicContentResult } from "@/lib/data/public-content";

export default function PublicContentRenderer({
	content,
}: {
	content: PublicContentResult;
}): JSX.Element {
	return <ContentRenderer model={createPublicContentRenderModel(content)} />;
}
