//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/PageContentRenderer.tsx                                ////
//// Language: TSX                                                                                                ////
//// Default article-style content renderer shell.                                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type PageContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function PageContentRenderer({
	model,
	debug = false,
}: PageContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}
