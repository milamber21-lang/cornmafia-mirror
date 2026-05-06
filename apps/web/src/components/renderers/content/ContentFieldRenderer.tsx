//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentFieldRenderer.tsx                                     ////
//// Language: TSX                                                                                                ////
//// Dispatches a shared content render field to the correct field renderer.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import BooleanFieldRenderer from "./fields/BooleanFieldRenderer";
import ContentLinkFieldRenderer from "./fields/ContentLinkFieldRenderer";
import DateFieldRenderer from "./fields/DateFieldRenderer";
import MediaFieldRenderer from "./fields/MediaFieldRenderer";
import NumberFieldRenderer from "./fields/NumberFieldRenderer";
import OptionFieldRenderer from "./fields/OptionFieldRenderer";
import RichTextFieldRenderer from "./fields/RichTextFieldRenderer";
import TextFieldRenderer from "./fields/TextFieldRenderer";
import UrlFieldRenderer from "./fields/UrlFieldRenderer";
import YoutubeFieldRenderer from "./fields/YoutubeFieldRenderer";
import { isUrlLikeField } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import type { ContentRenderField, ContentRenderModel } from "./types";

type ContentFieldRendererProps = {
	field: ContentRenderField;
	model: ContentRenderModel;
	showLabel?: boolean;
	debug?: boolean;
};

export default async function ContentFieldRenderer({
	field,
	model,
	showLabel = true,
	debug = false,
}: ContentFieldRendererProps): Promise<JSX.Element | null> {
	let rendered: JSX.Element;

	if (field.fieldTypeCode === "rich_text") {
		rendered = <RichTextFieldRenderer field={field} model={model} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "youtube_url") {
		rendered = <YoutubeFieldRenderer field={field} model={model} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "media_id") {
		rendered = <MediaFieldRenderer field={field} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "content_id") {
		rendered = <ContentLinkFieldRenderer field={field} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "option") {
		rendered = <OptionFieldRenderer field={field} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "date" || field.fieldTypeCode === "timestamp") {
		rendered = <DateFieldRenderer field={field} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "integer" || field.fieldTypeCode === "numeric") {
		rendered = <NumberFieldRenderer field={field} showLabel={showLabel} />;
	} else if (field.fieldTypeCode === "boolean") {
		rendered = <BooleanFieldRenderer field={field} showLabel={showLabel} />;
	} else if (isUrlLikeField(field)) {
		rendered = <UrlFieldRenderer field={field} showLabel={showLabel} />;
	} else {
		rendered = <TextFieldRenderer field={field} showLabel={showLabel} />;
	}

	return (
		<RenderDebugFrame
			enabled={debug}
			label={`Field / ${field.label}`}
			description={`${field.fieldTypeCode} / ${field.renderDestinationCode}`}
			variant="field"
		>
			{rendered}
		</RenderDebugFrame>
	);
}
