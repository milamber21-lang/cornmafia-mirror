//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/SvgInline.tsx                                                ////
//// Language: TSX                                                                                                 ////
//// Inline sanitized SVG renderer with stable media fallback and render caching                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import {
	getInlineSvgForUrl,
	isLikelySvgUrlish,
	type SanitizeOptions,
} from "@/lib/helpers/svg-sanitizer";

type Variant = "showcase" | "inline" | "panel";

type Props = {
	/** SVG URL (or data URI). Required. */
	src: string;
	/** Visual variant:
	 *  - "showcase": explicit size via props.
	 *  - "inline": scales with text; defaults to 1em.
	 *  - "panel": big preview for media/detail panels; defaults to 360px.
	 */
	variant?: Variant;
	/** Optional explicit width/height to set on the root <svg>. */
	width?: number | string;
	height?: number | string;
	/** Optional title attribute on the rendered <svg>. */
	title?: string;
	/** Extra CSS classes for the wrapper. */
	className?: string;
	/** Pass-through sanitizer options; defaults colorMode to 'currentColor'. */
	sanitizeOptions?: Omit<SanitizeOptions, "colorMode"> & {
		colorMode?: "keep" | "currentColor";
	};
	/** Preferred color (overrides colorVar). */
	color?: string;
	/** Default text color variable; icons inherit this via CSS currentColor. */
	colorVar?: string;
	/** Render a tiny fallback badge if sanitized output is empty and no fallback URL is usable. */
	debug?: boolean;
};

type SvgInlineStyle = React.CSSProperties & {
	"--media-svg-inline-width"?: string;
	"--media-svg-inline-height"?: string;
	"--media-svg-inline-color"?: string;
};

const RENDER_CACHE = new Map<string, string>();

function strDim(v?: number | string): string | undefined {
	if (typeof v === "number") {
		return String(v);
	}

	if (typeof v === "string") {
		return v;
	}

	return undefined;
}

/** Return default width/height based on variant when not provided by props. */
function getDefaultDims(variant: Variant): { w?: string; h?: string } {
	if (variant === "inline") {
		return { w: "1em", h: "1em" };
	}

	if (variant === "panel") {
		return { w: "360", h: "360" };
	}

	return {};
}

/** Patch root <svg> tag with width/height/title if provided. */
function patchRootAttributes(
	svg: string,
	width?: string,
	height?: string,
	title?: string,
): string {
	if (!svg) {
		return svg;
	}

	return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
		let a = attrs;

		if (width) {
			a = a.replace(
				/\bwidth\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i,
				`width="${width}"`,
			);
			if (!/\bwidth\s*=/.test(a)) {
				a += ` width="${width}"`;
			}
		}

		if (height) {
			a = a.replace(
				/\bheight\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i,
				`height="${height}"`,
			);
			if (!/\bheight\s*=/.test(a)) {
				a += ` height="${height}"`;
			}
		}

		if (title && !/\baria-label=/.test(a) && !/\baria-labelledby=/.test(a)) {
			a += ` aria-label="${title.replace(/"/g, "&quot;")}"`;
		}

		return `<svg${a ? " " + a.trim() : ""}>`;
	});
}

function getSanitizeColorMode(
	sanitizeOptions?: Props["sanitizeOptions"],
): "keep" | "currentColor" {
	return sanitizeOptions?.colorMode ?? "currentColor";
}

function buildRenderCacheKey(args: {
	src: string;
	width?: string;
	height?: string;
	title?: string;
	sanitizeOptions?: Props["sanitizeOptions"];
}): string {
	const opts = args.sanitizeOptions ?? {};

	return JSON.stringify({
		src: args.src,
		width: args.width ?? null,
		height: args.height ?? null,
		title: args.title ?? null,
		colorMode: getSanitizeColorMode(args.sanitizeOptions),
		maxBytes: opts.maxBytes ?? null,
		cacheTtlMs: opts.cacheTtlMs ?? null,
	});
}

function getImageDimension(value?: string): number | undefined {
	if (!value) {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildSvgInlineClassName(args: {
	variant: Variant;
	className?: string;
	failed: boolean;
}): string {
	return [
		"media-svg-inline",
		`media-svg-inline--${args.variant}`,
		args.failed ? "media-svg-inline--failed" : null,
		args.className,
	]
		.filter((part): part is string => typeof part === "string" && part.length > 0)
		.join(" ");
}

function buildSvgInlineStyle(args: {
	width?: string;
	height?: string;
	color: string;
}): SvgInlineStyle {
	return {
		"--media-svg-inline-width": args.width,
		"--media-svg-inline-height": args.height,
		"--media-svg-inline-color": args.color,
	};
}

export function SvgInline(props: Props): React.JSX.Element {
	const {
		src,
		variant = "showcase",
		width,
		height,
		title,
		className,
		colorVar = "var(--theme-text)",
		color,
		sanitizeOptions,
		debug = false,
	} = props;

	const styleColor =
		typeof color === "string" && color.trim() ? color : colorVar;
	const { w: defW, h: defH } = getDefaultDims(variant);
	const resolvedW = strDim(width) ?? defW;
	const resolvedH = strDim(height) ?? defH;
	const cacheKey = buildRenderCacheKey({
		src,
		width: resolvedW,
		height: resolvedH,
		title,
		sanitizeOptions,
	});
	const runtimeStyle = buildSvgInlineStyle({
		width: resolvedW,
		height: resolvedH,
		color: styleColor,
	});

	const [markup, setMarkup] = React.useState<string>(() => {
		return RENDER_CACHE.get(cacheKey) ?? "";
	});
	const [failed, setFailed] = React.useState<boolean>(false);
	const cancelRef = React.useRef<boolean>(false);

	React.useEffect(() => {
		cancelRef.current = false;

		const cached = RENDER_CACHE.get(cacheKey);
		if (typeof cached === "string") {
			setFailed(false);
			setMarkup(cached);

			return () => {
				cancelRef.current = true;
			};
		}

		(async () => {
			setFailed(false);

			try {
				const url = String(src || "");
				if (!url || !isLikelySvgUrlish(url)) {
					if (!cancelRef.current) {
						setMarkup("");
					}

					return;
				}

				const inline = await getInlineSvgForUrl(url, {
					...(sanitizeOptions ?? {}),
					colorMode: getSanitizeColorMode(sanitizeOptions),
				});

				if (cancelRef.current) {
					return;
				}

				const patched = patchRootAttributes(inline, resolvedW, resolvedH, title);

				RENDER_CACHE.set(cacheKey, patched);
				setMarkup(patched);
			} catch {
				if (cancelRef.current) {
					return;
				}

				setFailed(true);
				setMarkup("");
			}
		})();

		return () => {
			cancelRef.current = true;
		};
	}, [cacheKey, resolvedH, resolvedW, sanitizeOptions, src, title]);

	const rootClassName = buildSvgInlineClassName({
		variant,
		className,
		failed,
	});

	if (!markup) {
		const canShowImageFallback = src.trim().length > 0;

		return (
			<span
				className={rootClassName}
				style={runtimeStyle}
				title={failed ? "SVG load failed" : title}
			>
				{canShowImageFallback ? (
					<img
						src={src}
						alt=""
						aria-hidden="true"
						width={getImageDimension(resolvedW)}
						height={getImageDimension(resolvedH)}
						loading="eager"
						decoding="sync"
						className="media-svg-inline__fallback-image"
					/>
				) : debug ? (
					<span className="media-svg-inline__debug-badge">SVG?</span>
				) : null}
			</span>
		);
	}

	return (
		<span
			className={rootClassName}
			style={runtimeStyle}
			dangerouslySetInnerHTML={{ __html: markup }}
		/>
	);
}

export default SvgInline;
