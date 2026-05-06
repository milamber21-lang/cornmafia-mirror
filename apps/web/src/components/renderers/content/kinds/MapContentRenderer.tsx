//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/MapContentRenderer.tsx                                 ////
//// Language: TSX                                                                                                ////
//// Map content renderer shell for future map-focused layouts.                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type MapContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function MapContentRenderer({
	model,
	debug = false,
}: MapContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}
