//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentRenderShell.tsx                                       ////
//// Language: TSX                                                                                                ////
//// Shared destination-driven content shell with optional Hero, full-width modules, and independent sidebars.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import { SurfacePanel } from "@/components/ui";
import { cn } from "@/lib/cn";

import ContentDestinationPanel from "./ContentDestinationPanel";
import ContentFieldGroup from "./ContentFieldGroup";
import ContentPageHero from "./ContentPageHero";
import { hasRenderableFields } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import SeriesEpisodeNav from "./SeriesEpisodeNav";
import type { ContentRenderField, ContentRenderModel } from "./types";

type ContentRenderShellProps = {
	model: ContentRenderModel;
	debug?: boolean;
	featuredFields?: ContentRenderField[];
	mainFields?: ContentRenderField[];
};

export type ContentBodyLayoutCode =
	| "none"
	| "main"
	| "left"
	| "right"
	| "left-main"
	| "main-right"
	| "left-right"
	| "left-main-right";

export function getContentBodyLayoutCode(args: {
	hasLeft: boolean;
	hasMain: boolean;
	hasRight: boolean;
}): ContentBodyLayoutCode {
	if (args.hasLeft && args.hasMain && args.hasRight) {
		return "left-main-right";
	}
	if (args.hasLeft && args.hasMain) {
		return "left-main";
	}
	if (args.hasMain && args.hasRight) {
		return "main-right";
	}
	if (args.hasLeft && args.hasRight) {
		return "left-right";
	}
	if (args.hasMain) {
		return "main";
	}
	if (args.hasLeft) {
		return "left";
	}
	if (args.hasRight) {
		return "right";
	}
	return "none";
}

export default function ContentRenderShell({
	model,
	debug = false,
	featuredFields = [],
	mainFields,
}: ContentRenderShellProps): JSX.Element {
	const { fieldsByDestination } = model;
	const resolvedMainFields = mainFields ?? fieldsByDestination.main;
	const hasFeaturedFields = hasRenderableFields(featuredFields, model);
	const hasLeft = hasRenderableFields(fieldsByDestination.left, model);
	const hasMain = hasRenderableFields(resolvedMainFields, model);
	const hasRight = hasRenderableFields(fieldsByDestination.right, model);
	const bodyLayoutCode = getContentBodyLayoutCode({
		hasLeft,
		hasMain,
		hasRight,
	});

	return (
		<RenderDebugFrame
			enabled={debug}
			label="Renderer shell"
			description={`${model.doc.rendererCode} destination layout`}
			variant="shell"
			className="public-content-shell"
		>
			<article className="card public-content-article">
				<ContentPageHero model={model} debug={debug} />

				<ContentDestinationPanel
					destination="top"
					fields={fieldsByDestination.top}
					model={model}
					debug={debug}
				/>

				{hasFeaturedFields ? (
					<RenderDebugFrame
						enabled={debug}
						label="Featured content"
						description="Renderer-promoted full-width destination fields"
						variant="shell-main"
					>
						<SurfacePanel
							material="inset"
							density="comfortable"
							className="public-content-feature"
						>
							<ContentFieldGroup
								fields={featuredFields}
								model={model}
								className="content-field-group content-field-group--single"
								debug={debug}
								debugLabel="Featured fields"
								debugDescription="Full-width featured content"
								debugVariant="dest-main"
							/>
						</SurfacePanel>
					</RenderDebugFrame>
				) : null}

				{bodyLayoutCode !== "none" ? (
					<RenderDebugFrame
						enabled={debug}
						label="Body layout"
						description={bodyLayoutCode}
						variant="shell-main-layout"
					>
						<div
							className={cn(
								"public-content-layout",
								`public-content-layout--${bodyLayoutCode}`,
							)}
						>
							{hasMain ? (
								<div className="public-content-region public-content-region--main">
									<ContentDestinationPanel
										destination="main"
										fields={resolvedMainFields}
										model={model}
										debug={debug}
									/>
								</div>
							) : null}

							{hasLeft ? (
								<aside
									className="public-content-region public-content-region--left"
									aria-label="Supporting content"
								>
									<ContentDestinationPanel
										destination="left"
										fields={fieldsByDestination.left}
										model={model}
										debug={debug}
									/>
								</aside>
							) : null}

							{hasRight ? (
								<aside
									className="public-content-region public-content-region--right"
									aria-label="Related content"
								>
									<ContentDestinationPanel
										destination="right"
										fields={fieldsByDestination.right}
										model={model}
										debug={debug}
									/>
								</aside>
							) : null}
						</div>
					</RenderDebugFrame>
				) : null}

				<ContentDestinationPanel
					destination="bottom"
					fields={fieldsByDestination.bottom}
					model={model}
					debug={debug}
				/>

				{model.surfaceScope === "public" ? (
					<SeriesEpisodeNav series={model.doc.series} />
				) : null}
			</article>
		</RenderDebugFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
