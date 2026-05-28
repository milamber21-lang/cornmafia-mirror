//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaSectionCard.tsx                                        ////
//// Language: TSX                                                                                              ////
//// Shared Riseopedia section card using existing admin card styling and rectangular media previews.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";

import { IconWell } from "@/components/ui";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";

export type RiseopediaSectionCardProps = {
	section: RiseopediaSectionDoc;
	mediaSample: RiseopediaSectionMediaSample | null;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

export default function RiseopediaSectionCard({
	section,
	mediaSample,
}: RiseopediaSectionCardProps): JSX.Element {
	const sampleLabel = mediaSample
		? `${mediaSample.entityTypeCode === "recipe" ? "Recipe" : "Asset"}: ${mediaSample.entityName}`
		: null;

	return (
		<Link
			className="admin-control-card riseopedia-control-card riseopedia-section-card"
			href={`/riseopedia/sections/${section.slug}`}
		>
			<IconWell
				size="md"
				className="admin-control-card__icon riseopedia-card-media"
			>
				{mediaSample ? (
					<img
						className="riseopedia-card-media__image"
						src={mediaSample.media.url}
						alt=""
						width={mediaSample.media.width ?? undefined}
						height={mediaSample.media.height ?? undefined}
						loading="lazy"
					/>
				) : (
					<Database aria-hidden className="admin-control-icon" strokeWidth={1.8} />
				)}
			</IconWell>

			<span className="admin-control-card__body riseopedia-section-card__body">
				<span className="public-collection-card__meta">
					{formatNumber(section.itemCount)} items
				</span>
				<span className="admin-control-card__title riseopedia-section-card__title">
					{section.name}
				</span>
				{sampleLabel ? (
					<span className="public-collection-card__meta riseopedia-card-media__caption">
						{sampleLabel}
					</span>
				) : null}
				{section.description ? (
					<span className="admin-control-card__description riseopedia-section-card__description">
						{section.description}
					</span>
				) : null}
			</span>

			<ArrowRight aria-hidden className="admin-control-card__arrow" />
		</Link>
	);
}
