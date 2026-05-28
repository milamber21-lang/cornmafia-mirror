//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaMediaFrame.tsx                                         ////
//// Language: TSX                                                                                            ////
//// Public Riseopedia compact media frame for asset imagery and recipe output previews.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";

import type { RiseopediaMediaRef } from "@/lib/data/riseopedia-assets";

export type RiseopediaMediaFrameProps = {
	media: RiseopediaMediaRef | null;
	alt: string;
	placeholderLabel: string;
	loading?: "eager" | "lazy";
	rarityCode?: string | null;
};

function safeRarityCode(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : undefined;
}

export default function RiseopediaMediaFrame({
	media,
	alt,
	placeholderLabel,
	loading = "eager",
	rarityCode,
}: RiseopediaMediaFrameProps): JSX.Element {
	if (!media) {
		return (
			<div
				className="riseopedia-media-frame riseopedia-media-frame--empty"
				data-rarity={safeRarityCode(rarityCode)}
			>
				<span className="riseopedia-media-frame__placeholder">
					{placeholderLabel}
				</span>
			</div>
		);
	}

	return (
		<figure className="riseopedia-media-frame" data-rarity={safeRarityCode(rarityCode)}>
			<img
				className="riseopedia-media-frame__image"
				src={media.url}
				alt={alt}
				width={media.width ?? undefined}
				height={media.height ?? undefined}
				loading={loading}
			/>
		</figure>
	);
}
