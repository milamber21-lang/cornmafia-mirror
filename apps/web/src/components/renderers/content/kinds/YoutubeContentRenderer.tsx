//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/YoutubeContentRenderer.tsx                             ////
//// Language: TSX                                                                                               ////
//// Renders video-focused content with the primary YouTube embed above supporting body fields.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentFieldGroup from "../ContentFieldGroup";
import ContentRenderShell from "../ContentRenderShell";
import { hasRenderableFields } from "../field-utils";
import RenderDebugFrame from "../RenderDebugFrame";
import type { ContentRenderField, ContentRenderModel } from "../types";

type YoutubeContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

function isYoutubeField(field: ContentRenderField): boolean {
	return field.fieldTypeCode === "youtube_url";
}

function getLayoutClassName(hasAsideFields: boolean): string {
	return hasAsideFields
		? "public-content-layout public-content-layout--with-aside"
		: "public-content-layout";
}

export default function YoutubeContentRenderer({
	model,
	debug = false,
}: YoutubeContentRendererProps): JSX.Element {
	const mainVideoFields = model.fieldsByDestination.main.filter(isYoutubeField);
	const mainBodyFields = model.fieldsByDestination.main.filter((field) => !isYoutubeField(field));
	const hasVideoFields = hasRenderableFields(mainVideoFields);
	const hasBodyFields =
		hasRenderableFields(mainBodyFields) ||
		hasRenderableFields(model.fieldsByDestination.bottom);
	const hasAsideFields =
		hasRenderableFields(model.fieldsByDestination.right) ||
		hasRenderableFields(model.fieldsByDestination.left);
	const shouldRenderBodyLayout = hasBodyFields || hasAsideFields || debug;

	return (
		<ContentRenderShell model={model} debug={debug}>
			<RenderDebugFrame
				enabled={debug}
				label="YouTube layout"
				description="Primary video, body fields, and supporting aside fields"
				variant="shell-main-layout"
			>
				<div className="public-content-stack">
					<header className="public-content-header">
						<p className="public-content-eyebrow">
							{model.doc.contentKindLabel}
						</p>
						<h1 className="public-content-title">
							{model.doc.title}
						</h1>
						{model.doc.summary ? (
							<p className="public-content-summary">
								{model.doc.summary}
							</p>
						) : null}
					</header>

					{hasVideoFields || debug ? (
						<ContentFieldGroup
							fields={mainVideoFields}
							model={model}
							className="content-field-group content-field-group--single"
							debug={debug}
							debugLabel="Destination / Main video"
							debugDescription="Primary YouTube video field"
							debugVariant="dest-main"
						/>
					) : null}

					{shouldRenderBodyLayout ? (
						<div className={getLayoutClassName(hasAsideFields)}>
							{hasBodyFields || debug ? (
								<RenderDebugFrame
									enabled={debug}
									label="Video body"
									description="Body and bottom destinations"
									variant="shell-main"
								>
									<div className="public-content-stack">
										<ContentFieldGroup
											fields={mainBodyFields}
											model={model}
											debug={debug}
											debugLabel="Destination / Main body"
											debugDescription="Main non-video body fields"
											debugVariant="dest-main"
										/>
										<ContentFieldGroup
											fields={model.fieldsByDestination.bottom}
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
									label="Video aside"
									description="Right and left destinations"
									variant="shell-aside"
								>
									<aside className="public-content-stack">
										<ContentFieldGroup
											fields={model.fieldsByDestination.right}
											model={model}
											debug={debug}
											debugLabel="Destination / Right"
											debugDescription="Right sidebar fields"
											debugVariant="dest-right"
										/>
										<ContentFieldGroup
											fields={model.fieldsByDestination.left}
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
					) : null}
				</div>
			</RenderDebugFrame>
		</ContentRenderShell>
	);
}
