//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/IconRender.tsx                                                               ////
//// Language: TSX                                                                                                 ////
//// Lightweight icon renderer for lucide or media-backed icon shapes                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import Image from "next/image";
import * as LucideIcons from "lucide-react";

import { cn } from "@/lib/cn";

import {
	buildIconMediaUrl,
	isLikelySvgMedia,
	mapIconToRenderInput,
	normalizeLucideName,
	type IconMediaRef,
	type IconShape,
} from "@/lib/helpers/icons";
import {
	cssColorFromThemePreview,
	isNoTintIconColor,
} from "@/lib/helpers/icon-color";
import {
	buildMediaIconUrl,
	extractStorageRelPathFromMediaUrl,
	type MediaRouteScope,
} from "@/lib/helpers/media-url";

type LucideComponentProps = React.SVGProps<SVGSVGElement> & {
	size?: number | string;
	absoluteStrokeWidth?: boolean;
};

type LucideComponent = React.ComponentType<LucideComponentProps>;

type IconRenderStyle = React.CSSProperties & {
	"--media-icon-color"?: string;
};

const lucideRegistry = LucideIcons as unknown as Record<string, unknown>;

function isLucideComponent(value: unknown): value is LucideComponent {
	return (
		typeof value === "function" ||
		(typeof value === "object" && value !== null && "render" in value)
	);
}

function getLucideComponent(name: string): LucideComponent | null {
	const normalizedName = normalizeLucideName(name);
	if (!normalizedName) {
		return null;
	}

	const component = lucideRegistry[normalizedName];
	return isLucideComponent(component) ? component : null;
}

function buildIconRenderStyle(colorCss: string): IconRenderStyle | undefined {
	return colorCss === "currentColor"
		? undefined
		: { "--media-icon-color": colorCss };
}

function LucideIcon(args: {
	name: string;
	size: number;
	className?: string;
	colorCss: string;
	title?: string;
}): React.JSX.Element {
	const Component = getLucideComponent(args.name);
	if (!Component) {
		return (
			<span
				className={cn("media-icon-render", args.className)}
				style={buildIconRenderStyle(args.colorCss)}
				title={args.title}
			>
				?
			</span>
		);
	}

	const accessibilityProps: React.SVGProps<SVGSVGElement> = args.title
		? { "aria-label": args.title, role: "img" }
		: { "aria-hidden": true };

	return (
		<Component
			size={args.size}
			className={cn("media-icon-render", args.className)}
			style={buildIconRenderStyle(args.colorCss)}
			{...accessibilityProps}
		/>
	);
}

type LooseIconMediaInput = string | Partial<IconMediaRef> | null | undefined;

type IconRenderIconInput = Omit<Partial<IconShape>, "source" | "iconMedia"> & {
	source?: IconShape["source"] | null;
	iconMedia?: LooseIconMediaInput;
};

export type IconRenderProps = {
	iconKey?: IconRenderIconInput | null;
	iconColor?: { preview?: string | null } | null;
	relationHint?: "pages" | "maps" | null;
	fallback?: "file" | "map" | { lucideName?: string | null } | null;
	size?: number;
	className?: string;
	title?: string;
	mediaRouteScope?: MediaRouteScope;
};

function pickFallbackLucideName(
	props: Pick<IconRenderProps, "fallback" | "relationHint">,
): string {
	if (props.fallback && typeof props.fallback === "object") {
		return props.fallback.lucideName?.trim() || "FileText";
	}

	if (props.fallback === "map" || props.relationHint === "maps") {
		return "Map";
	}

	return "FileText";
}

function normalizeIconMediaInput(
	iconMedia: LooseIconMediaInput,
): IconMediaRef | null {
	if (!iconMedia) {
		return null;
	}

	if (typeof iconMedia === "string") {
		const trimmed = iconMedia.trim();
		if (!trimmed) {
			return null;
		}

		return {
			id: trimmed,
			filename: trimmed,
			storageRelPath: trimmed,
			url: trimmed,
		};
	}

	return {
		id:
			typeof iconMedia.id === "string" && iconMedia.id.trim().length > 0
				? iconMedia.id
				: "",
		url: typeof iconMedia.url === "string" ? iconMedia.url : null,
		filename: typeof iconMedia.filename === "string" ? iconMedia.filename : null,
		originalFilename:
			typeof iconMedia.originalFilename === "string"
				? iconMedia.originalFilename
				: null,
		mimeType: typeof iconMedia.mimeType === "string" ? iconMedia.mimeType : null,
		storageRelPath:
			typeof iconMedia.storageRelPath === "string"
				? iconMedia.storageRelPath
				: null,
		thumbnailURL:
			typeof iconMedia.thumbnailURL === "string" ? iconMedia.thumbnailURL : null,
	};
}

function mediaInputUsesAdminRoute(media: IconMediaRef | null): boolean {
	const url = media?.url?.trim() ?? "";
	return url.includes("/api/admin/web/media/");
}

function resolveMediaRouteScope(args: {
	media: IconMediaRef | null;
	requestedScope: MediaRouteScope;
}): MediaRouteScope {
	if (args.requestedScope === "admin") {
		return "admin";
	}

	return mediaInputUsesAdminRoute(args.media) ? "admin" : "app";
}

function pickIconMediaStorageRelPath(args: {
	media: IconMediaRef | null;
	mediaUrl: string;
}): string | null {
	const directPath = args.media?.storageRelPath?.trim() ?? "";
	if (directPath.length > 0) {
		return directPath;
	}

	return extractStorageRelPathFromMediaUrl(args.mediaUrl);
}

function buildColorizedSvgIconUrl(args: {
	media: IconMediaRef | null;
	mediaUrl: string;
	mediaRouteScope: MediaRouteScope;
	iconColor?: { preview?: string | null } | null;
}): string | null {
	const storageRelPath = pickIconMediaStorageRelPath({
		media: args.media,
		mediaUrl: args.mediaUrl,
	});
	if (!storageRelPath) {
		return null;
	}

	return buildMediaIconUrl({
		storageRelPath,
		routeScope: args.mediaRouteScope,
		color: isNoTintIconColor(args.iconColor?.preview ?? null)
			? null
			: (args.iconColor?.preview ?? null),
	});
}

export default function IconRender({
	iconKey,
	iconColor,
	relationHint = null,
	fallback = null,
	size = 18,
	className,
	title,
	mediaRouteScope = "app",
}: IconRenderProps): React.JSX.Element {
	const normalizedIconKey: Partial<IconShape> | null = iconKey
		? {
				...iconKey,
				source: iconKey.source ?? undefined,
				iconMedia: normalizeIconMediaInput(iconKey.iconMedia),
			}
		: null;
	const icon = mapIconToRenderInput(normalizedIconKey);
	const colorCss =
		cssColorFromThemePreview(iconColor?.preview ?? null) || "currentColor";
	const fallbackLucide = pickFallbackLucideName({ fallback, relationHint });

	if (icon && icon.source === "media") {
		const resolvedRouteScope = resolveMediaRouteScope({
			media: icon.iconMedia,
			requestedScope: mediaRouteScope,
		});
		const mediaUrl = buildIconMediaUrl(icon.iconMedia, resolvedRouteScope);
		if (mediaUrl) {
			const label = title ?? icon.label ?? icon.key ?? "";

			if (isLikelySvgMedia({ media: icon.iconMedia, url: mediaUrl })) {
				const svgIconUrl = buildColorizedSvgIconUrl({
					media: icon.iconMedia,
					mediaUrl,
					mediaRouteScope: resolvedRouteScope,
					iconColor,
				});

				return (
					<img
						src={svgIconUrl ?? mediaUrl}
						alt={label}
						width={size}
						height={size}
						className={cn("media-icon-render", className)}
						title={label}
						loading="eager"
						decoding="sync"
					/>
				);
			}

			return (
				<Image
					src={mediaUrl}
					alt={label}
					width={size}
					height={size}
					unoptimized
					className={cn("media-icon-render", className)}
					title={label}
				/>
			);
		}
	}

	const lucideName =
		icon?.source === "lucide"
			? (icon.lucideName ?? icon.key ?? fallbackLucide)
			: fallbackLucide;
	return (
		<LucideIcon
			name={lucideName}
			size={size}
			className={className}
			colorCss={colorCss}
			title={title}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
