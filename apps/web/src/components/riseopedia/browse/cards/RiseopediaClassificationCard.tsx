//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/browse/cards/RiseopediaClassificationCard.tsx                                ////
//// Language: TSX                                                                                            ////
//// Riseopedia-owned compact classification card for sections, classes, categories, and subcategories.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaClassificationCardProps = {
	card: RiseopediaHubDirectoryCardDoc;
	fallbackIcon: LucideIcon;
};

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
}

function nodeTypeLabel(card: RiseopediaHubDirectoryCardDoc): string {
	if (card.nodeTypeCode === "section") {
		return "Section";
	}

	if (card.nodeTypeCode === "class") {
		return "Class";
	}

	if (card.nodeTypeCode === "category") {
		return "Category";
	}

	return "Subcategory";
}

function entryLabel(card: RiseopediaHubDirectoryCardDoc): string {
	return card.itemCount === 1 ? "entry" : "entries";
}

function metaLabel(card: RiseopediaHubDirectoryCardDoc): string {
	return nodeTypeLabel(card);
}

function fallbackDescription(card: RiseopediaHubDirectoryCardDoc): string {
	if (card.itemCount > 0) {
		return `Contains ${formatNumber(card.itemCount)} ${entryLabel(card)}.`;
	}

	return "Open this classification to browse matching entries.";
}

function RiseopediaClassificationCardMedia({
	card,
	fallbackIcon: FallbackIcon,
}: RiseopediaClassificationCardProps): JSX.Element {
	if (card.media) {
		return (
			<img
				className="riseopedia-classification-card__image"
				src={card.media.url}
				alt=""
				width={card.media.width ?? undefined}
				height={card.media.height ?? undefined}
				loading="lazy"
			/>
		);
	}

	return (
		<FallbackIcon
			aria-hidden
			className="riseopedia-classification-card__fallback-icon"
			strokeWidth={1.8}
		/>
	);
}

function RiseopediaClassificationCardBody({
	card,
	fallbackIcon,
}: RiseopediaClassificationCardProps): JSX.Element {
	return (
		<>
			<span className="riseopedia-classification-card__icon" aria-hidden>
				<RiseopediaClassificationCardMedia
					card={card}
					fallbackIcon={fallbackIcon}
				/>
			</span>

			<span className="riseopedia-classification-card__body">
				<span className="riseopedia-classification-card__meta">
					{metaLabel(card)}
				</span>
				<span className="riseopedia-classification-card__title">{card.name}</span>
				<span className="riseopedia-classification-card__summary">
					{card.description ?? fallbackDescription(card)}
				</span>
			</span>

			<ArrowRight aria-hidden className="riseopedia-classification-card__arrow" />
		</>
	);
}

export default function RiseopediaClassificationCard({
	card,
	fallbackIcon,
}: RiseopediaClassificationCardProps): JSX.Element {
	if (!card.href) {
		return (
			<article className="riseopedia-classification-card">
				<RiseopediaClassificationCardBody card={card} fallbackIcon={fallbackIcon} />
			</article>
		);
	}

	return (
		<Link className="riseopedia-classification-card" href={card.href}>
			<RiseopediaClassificationCardBody card={card} fallbackIcon={fallbackIcon} />
		</Link>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
