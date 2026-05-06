//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentRenderShell.tsx                                       ////
//// Language: TSX                                                                                                ////
//// Shared structural shell for full content renderers using template-controlled destination slots.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";

import ContentFieldGroup from "./ContentFieldGroup";
import { hasRenderableFields } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import SeriesEpisodeNav from "./SeriesEpisodeNav";
import type { ContentRenderModel } from "./types";

type ContentRenderShellProps = {
	model: ContentRenderModel;
	children?: ReactNode;
	debug?: boolean;
};

function getLayoutClassName(hasAsideFields: boolean): string {
	return hasAsideFields
		? "public-content-layout public-content-layout--with-aside"
		: "public-content-layout";
}

export default function ContentRenderShell({
	model,
	children,
	debug = false,
}: ContentRenderShellProps): JSX.Element {
	const { fieldsByDestination } = model;
	const hasMainFields =
		hasRenderableFields(fieldsByDestination.main) ||
		hasRenderableFields(fieldsByDestination.bottom);
	const hasAsideFields =
		hasRenderableFields(fieldsByDestination.right) ||
		hasRenderableFields(fieldsByDestination.left);
	const shouldRenderDefaultLayout = children === undefined && (hasMainFields || hasAsideFields || debug);

	return (
		<RenderDebugFrame
			enabled={debug}
			label="Renderer shell"
			description={`${model.doc.rendererCode} destination layout`}
			variant="shell"
			className="public-content-shell"
		>
			<article className="card public-content-article">
				<ContentFieldGroup
					fields={fieldsByDestination.hero}
					model={model}
					debug={debug}
					debugLabel="Destination / Hero"
					debugDescription="Hero fields"
					debugVariant="dest-hero"
				/>
				<ContentFieldGroup
					fields={fieldsByDestination.top}
					model={model}
					debug={debug}
					debugLabel="Destination / Top"
					debugDescription="Top content fields"
					debugVariant="dest-top"
				/>

				{children ?? null}

				{shouldRenderDefaultLayout ? (
					<RenderDebugFrame
						enabled={debug}
						label="Main layout"
						description={hasAsideFields ? "Main column and aside" : "Main column"}
						variant="shell-main-layout"
					>
						<div className={getLayoutClassName(hasAsideFields)}>
							{hasMainFields || debug ? (
								<RenderDebugFrame
									enabled={debug}
									label="Main column"
									description="Main and bottom destinations"
									variant="shell-main"
								>
									<div className="public-content-stack">
										<ContentFieldGroup
											fields={fieldsByDestination.main}
											model={model}
											debug={debug}
											debugLabel="Destination / Main"
											debugDescription="Primary body fields"
											debugVariant="dest-main"
										/>
										<ContentFieldGroup
											fields={fieldsByDestination.bottom}
											model={model}
											debug={debug}
											debugLabel="Destination / Bottom"
											debugDescription="Bottom section fields"
											debugVariant="dest-bottom"
										/>
									</div>
								</RenderDebugFrame>
							) : null}

							{hasAsideFields ? (
								<RenderDebugFrame
									enabled={debug}
									label="Aside column"
									description="Right and left destinations"
									variant="shell-aside"
								>
									<aside className="public-content-stack">
										<ContentFieldGroup
											fields={fieldsByDestination.right}
											model={model}
											debug={debug}
											debugLabel="Destination / Right"
											debugDescription="Right sidebar fields"
											debugVariant="dest-right"
										/>
										<ContentFieldGroup
											fields={fieldsByDestination.left}
											model={model}
											debug={debug}
											debugLabel="Destination / Left"
											debugDescription="Left sidebar fields"
											debugVariant="dest-left"
										/>
									</aside>
								</RenderDebugFrame>
							) : null}
						</div>
					</RenderDebugFrame>
				) : null}

				{model.surfaceScope === "public" ? (
					<SeriesEpisodeNav series={model.doc.series} />
				) : null}
			</article>
		</RenderDebugFrame>
	);
}
