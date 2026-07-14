//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaEntityVisual.tsx                                     ////
//// Language: TSX                                                                                               ////
//// Channel-safe Riseopedia/Mafiosopedia WebP visual with primary, fallback, and empty display states.           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

export type RiseopediaEntityVisualMedia = {
	url: string;
	width?: number | null;
	height?: number | null;
	mimeType?: string | null;
};

export type RiseopediaEntityVisualSize = "inline" | "picker" | "card" | "hero";
export type RiseopediaEntityVisualFit = "contain" | "cover";

type RiseopediaEntityVisualState = "primary" | "fallback" | "empty";

export type RiseopediaEntityVisualProps = {
	media: RiseopediaEntityVisualMedia | null;
	fallbackMedia?: RiseopediaEntityVisualMedia | null;
	alt: string;
	placeholderLabel: string;
	size?: RiseopediaEntityVisualSize;
	fit?: RiseopediaEntityVisualFit;
	loading?: "eager" | "lazy";
	rarityCode?: string | null;
	decorative?: boolean;
	className?: string;
	as?: "span" | "figure";
};

function safeRarityCode(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : undefined;
}

function hasUsableMedia(
	media: RiseopediaEntityVisualMedia | null | undefined,
): boolean {
	return typeof media?.url === "string" && media.url.trim().length > 0;
}

function initialVisualState(args: {
	primaryMediaUrl: string | null;
	fallbackMediaUrl: string | null;
}): RiseopediaEntityVisualState {
	if (args.primaryMediaUrl) {
		return "primary";
	}

	if (args.fallbackMediaUrl) {
		return "fallback";
	}

	return "empty";
}

function imageSizes(size: RiseopediaEntityVisualSize): string {
	switch (size) {
		case "inline":
			return "32px";
		case "picker":
			return "64px";
		case "card":
			return "128px";
		case "hero":
			return "(min-width: 1280px) 352px, (min-width: 760px) 288px, 100vw";
	}
}

export default function RiseopediaEntityVisual({
	media,
	fallbackMedia = null,
	alt,
	placeholderLabel,
	size = "inline",
	fit = "contain",
	loading = "lazy",
	rarityCode,
	decorative = false,
	className,
	as = "span",
}: RiseopediaEntityVisualProps): JSX.Element {
	const primaryMedia = hasUsableMedia(media) ? media : null;
	const fallbackCandidate = hasUsableMedia(fallbackMedia) ? fallbackMedia : null;
	const resolvedFallbackMedia =
		primaryMedia?.url.trim() === fallbackCandidate?.url.trim()
			? null
			: fallbackCandidate;
	const primaryMediaUrl = primaryMedia?.url.trim() ?? null;
	const fallbackMediaUrl = resolvedFallbackMedia?.url.trim() ?? null;
	const [visualState, setVisualState] = useState<RiseopediaEntityVisualState>(
		() =>
			initialVisualState({
				primaryMediaUrl,
				fallbackMediaUrl,
			}),
	);

	useEffect(() => {
		setVisualState(
			initialVisualState({
				primaryMediaUrl,
				fallbackMediaUrl,
			}),
		);
	}, [fallbackMediaUrl, primaryMediaUrl]);

	const resolvedMedia =
		visualState === "primary"
			? primaryMedia
			: visualState === "fallback"
				? resolvedFallbackMedia
				: null;
	const Root = as;
	const imageAlt = decorative ? "" : alt;

	function handleImageError(): void {
		if (visualState === "primary" && resolvedFallbackMedia) {
			setVisualState("fallback");
			return;
		}

		setVisualState("empty");
	}

	return (
		<Root
			className={cn(
				"riseopedia-entity-visual",
				`riseopedia-entity-visual--${size}`,
				`riseopedia-entity-visual--${fit}`,
				visualState === "empty" && "riseopedia-entity-visual--empty",
				className,
			)}
			data-rarity={safeRarityCode(rarityCode)}
			data-source={visualState === "empty" ? undefined : visualState}
			aria-hidden={decorative ? true : undefined}
		>
			{resolvedMedia ? (
				<Image
					className="riseopedia-entity-visual__image"
					src={resolvedMedia.url}
					alt={imageAlt}
					fill
					sizes={imageSizes(size)}
					loading={loading}
					unoptimized
					onError={handleImageError}
				/>
			) : (
				<span
					className="riseopedia-entity-visual__placeholder"
					role={decorative ? undefined : "img"}
					aria-label={decorative ? undefined : alt}
				>
					{placeholderLabel}
				</span>
			)}
		</Root>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
