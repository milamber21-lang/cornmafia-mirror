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
};

export default function RiseopediaMediaFrame({
	media,
	alt,
	placeholderLabel,
	loading = "eager",
}: RiseopediaMediaFrameProps): JSX.Element {
	if (!media) {
		return (
			<div className="riseopedia-media-frame riseopedia-media-frame--empty">
				<span className="riseopedia-media-frame__placeholder">
					{placeholderLabel}
				</span>
			</div>
		);
	}

	return (
		<figure className="riseopedia-media-frame">
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
