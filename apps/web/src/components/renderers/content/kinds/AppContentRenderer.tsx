//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/AppContentRenderer.tsx                                 ////
//// Language: TSX                                                                                                ////
//// App content renderer shell for future app-focused layouts.                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type AppContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function AppContentRenderer({
	model,
	debug = false,
}: AppContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}
