//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/FilePreview.tsx                                              ////
//// Language: TSX                                                                                                ////
//// Shared admin media preview for local files and stored media URLs                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

type Props = {
	file?: File | null;
	src?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	sizeBytes?: number | null;
	alt?: string;
	kind?: "image" | "file";
	width?: number;
	rounded?: boolean;
	bordered?: boolean;
	showMeta?: boolean;
	href?: string | null;
	targetBlank?: boolean;
	className?: string;
};

type FilePreviewStyle = React.CSSProperties & {
	"--media-preview-width"?: string;
	"--media-preview-image-height"?: string;
};

function formatBytes(value?: number | null): string {
	if (!value || value <= 0) {
		return "";
	}

	const units = ["B", "KB", "MB", "GB"];
	let nextValue = value;
	let unitIndex = 0;

	while (nextValue >= 1024 && unitIndex < units.length - 1) {
		nextValue /= 1024;
		unitIndex += 1;
	}

	return `${nextValue.toFixed(1)} ${units[unitIndex]}`;
}

function extFromName(name?: string | null): string {
	if (!name) {
		return "";
	}

	const dotIndex = name.lastIndexOf(".");
	return dotIndex >= 0 ? name.slice(dotIndex + 1).toUpperCase() : "";
}

function isBlobUrl(value: string | null): boolean {
	return typeof value === "string" && value.startsWith("blob:");
}

function isSvgAsset(args: {
	mimeType: string;
	url: string | null;
	filename: string | null;
}): boolean {
	const normalizedMimeType = args.mimeType.toLowerCase();
	if (
		normalizedMimeType === "image/svg+xml" ||
		normalizedMimeType === "image/svg"
	) {
		return true;
	}

	const candidates = [args.url ?? "", args.filename ?? ""];
	return candidates.some((candidate) => /\.svg(?:$|[?#])/i.test(candidate));
}

function isImageAsset(args: {
	kind?: "image" | "file";
	mimeType: string;
	url: string | null;
	filename: string | null;
}): boolean {
	if (args.kind === "image") {
		return true;
	}

	if (args.kind === "file") {
		return false;
	}

	if (args.mimeType.length > 0) {
		return args.mimeType.startsWith("image/");
	}

	const candidates = [args.url ?? "", args.filename ?? ""];
	return candidates.some((candidate) =>
		/\.(png|jpe?g|gif|webp|bmp|svg)(?:$|[?#])/i.test(candidate),
	);
}

function buildPreviewStyle(width: number): FilePreviewStyle {
	const normalizedWidth = Number.isFinite(width) && width > 0 ? width : 320;
	const imageHeight = Math.round((normalizedWidth * 9) / 16) || 180;

	return {
		"--media-preview-width": `${normalizedWidth}px`,
		"--media-preview-image-height": `${imageHeight}px`,
	};
}

function buildTileClassName(args: {
	bordered: boolean;
	rounded: boolean;
	className?: string;
}): string {
	return cn(
		"media-file-preview__tile",
		args.bordered && "media-file-preview__tile--bordered",
		args.rounded && "media-file-preview__tile--rounded",
		args.className,
	);
}

function FileTile(args: {
	bordered: boolean;
	rounded: boolean;
	filename: string | null;
	mimeType: string;
}): React.JSX.Element {
	const badgeText =
		extFromName(args.filename) ||
		(args.mimeType
			? (args.mimeType.split("/")[1]?.toUpperCase() ?? "FILE")
			: "FILE");

	return (
		<div
			className={buildTileClassName({
				bordered: args.bordered,
				rounded: args.rounded,
				className: "media-file-preview__tile--file",
			})}
		>
			<div className="media-file-preview__fallback">
				<div className="media-file-preview__fallback-icon">
					<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M14 2v6h6"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div className="media-file-preview__fallback-label">{badgeText}</div>
			</div>
		</div>
	);
}

export default function FilePreview({
	file,
	src,
	filename,
	mimeType,
	sizeBytes,
	alt = "",
	kind,
	width = 320,
	rounded = true,
	bordered = true,
	showMeta = true,
	href,
	targetBlank,
	className,
}: Props): React.JSX.Element {
	const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
	const [isBroken, setIsBroken] = React.useState(false);

	React.useEffect(() => {
		if (!file) {
			setObjectUrl(null);
			return undefined;
		}

		const nextObjectUrl = URL.createObjectURL(file);
		setObjectUrl(nextObjectUrl);

		return () => {
			URL.revokeObjectURL(nextObjectUrl);
		};
	}, [file]);

	React.useEffect(() => {
		setIsBroken(false);
	}, [file, src, mimeType, filename]);

	const url = objectUrl ?? src ?? null;
	const normalizedMimeType = (file?.type ?? mimeType ?? "").trim();
	const resolvedFilename = filename ?? file?.name ?? null;
	const resolvedSizeBytes = sizeBytes ?? file?.size ?? null;
	const isImage = isImageAsset({
		kind,
		mimeType: normalizedMimeType,
		url,
		filename: resolvedFilename,
	});
	const isSvg = isSvgAsset({
		mimeType: normalizedMimeType,
		url,
		filename: resolvedFilename,
	});
	const previewStyle = buildPreviewStyle(width);
	const tileClassName = buildTileClassName({ bordered, rounded });

	let content: React.JSX.Element;

	if (isImage && url && !isBroken) {
		const imageAlt = alt || resolvedFilename || "preview";

		if (isSvg || isBlobUrl(url)) {
			content = (
				<div className={tileClassName}>
					<div className="media-file-preview__image-frame media-file-preview__image-frame--svg">
						<img
							src={url}
							alt={imageAlt}
							className="media-file-preview__image"
							onError={() => setIsBroken(true)}
						/>
					</div>
				</div>
			);
		} else {
			content = (
				<div className={tileClassName}>
					<div className="media-file-preview__image-frame media-file-preview__image-frame--raster">
						<Image
							src={url}
							alt={imageAlt}
							fill
							unoptimized
							sizes={`${width}px`}
							className="media-file-preview__image"
							onError={() => setIsBroken(true)}
						/>
					</div>
				</div>
			);
		}
	} else {
		content = (
			<FileTile
				bordered={bordered}
				rounded={rounded}
				filename={resolvedFilename}
				mimeType={normalizedMimeType}
			/>
		);
	}

	const body = href ? (
		<a
			href={href}
			target={targetBlank ? "_blank" : undefined}
			rel={targetBlank ? "noreferrer noopener" : undefined}
			className="media-file-preview__link"
		>
			{content}
		</a>
	) : (
		content
	);

	return (
		<div className={cn("media-file-preview", className)} style={previewStyle}>
			{body}
			{showMeta ? (
				<div className="media-file-preview__meta">
					{resolvedFilename ? (
						<div className="media-file-preview__meta-name" title={resolvedFilename}>
							{resolvedFilename}
						</div>
					) : null}
					<div className="media-file-preview__meta-detail">
						{[formatBytes(resolvedSizeBytes), normalizedMimeType]
							.filter(Boolean)
							.join(" - ")}
					</div>
				</div>
			) : null}
		</div>
	);
}
