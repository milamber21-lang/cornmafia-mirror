//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/MediaFieldRenderer.tsx                                ////
//// Language: TSX                                                                                                ////
//// Renders media id fields from admin or public metadata with image and file-safe fallbacks.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Image from "next/image";

import ContentFieldFrame from "../ContentFieldFrame";
import { hasRenderableValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type MediaFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

function isImageMedia(field: ContentRenderField): boolean {
	const mimeType = field.media?.mimeType?.trim().toLowerCase() ?? "";
	if (mimeType.startsWith("image/")) {
		return true;
	}

	const filename = field.media?.originalFilename.trim().toLowerCase() ?? "";
	return /\.(avif|gif|jpe?g|png|svg|webp)$/.test(filename);
}

function formatFileMeta(field: ContentRenderField): string | null {
	const parts = [field.media?.mimeType, field.media?.sizeBytes]
		.map((value) => {
			if (typeof value === "number" && Number.isFinite(value)) {
				return `${new Intl.NumberFormat("en").format(value)} bytes`;
			}

			return typeof value === "string" && value.trim().length > 0
				? value.trim()
				: null;
		})
		.filter((value): value is string => value !== null);

	return parts.length > 0 ? parts.join(" / ") : null;
}

export default function MediaFieldRenderer({
	field,
	showLabel = true,
}: MediaFieldRendererProps): JSX.Element | null {
	if (!hasRenderableValue(field.value)) {
		return null;
	}

	if (!field.media?.url) {
		return (
			<ContentFieldFrame
				field={field}
				showLabel={showLabel}
				valueTextClassName="content-field-value"
			>
				<p className="content-field-muted-message">
					Media id {String(field.value)} is not available for rendering yet.
				</p>
			</ContentFieldFrame>
		);
	}

	if (!isImageMedia(field)) {
		return (
			<ContentFieldFrame field={field} showLabel={showLabel} valueTextClassName="content-field-value">
				<a
					className="content-field-media-link"
					href={field.media.url}
				>
					<span className="content-field-media-link__title">
						{field.media.originalFilename}
					</span>
					{formatFileMeta(field) ? (
						<span className="content-field-media-link__meta">
							{formatFileMeta(field)}
						</span>
					) : null}
				</a>
			</ContentFieldFrame>
		);
	}

	return (
		<ContentFieldFrame field={field} showLabel={showLabel} valueTextClassName="content-field-value">
			<figure className="content-field-media-figure">
				<div className="content-field-media-frame">
					<Image
						src={field.media.url}
						alt={field.media.altText ?? field.media.originalFilename}
						width={field.media.width ?? 1280}
						height={field.media.height ?? 720}
						unoptimized
						className="content-field-media-image"
					/>
				</div>
				<figcaption className="content-field-media-caption">
					{field.media.originalFilename}
				</figcaption>
			</figure>
		</ContentFieldFrame>
	);
}
