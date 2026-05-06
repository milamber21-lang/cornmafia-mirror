//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/ToolContentRenderer.tsx                                ////
//// Language: TSX                                                                                                ////
//// Tool content renderer shell for future tool-focused layouts.                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type ToolContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function ToolContentRenderer({
	model,
	debug = false,
}: ToolContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}
