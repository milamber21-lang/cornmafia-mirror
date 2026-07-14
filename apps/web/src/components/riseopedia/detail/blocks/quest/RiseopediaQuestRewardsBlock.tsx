//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/quest/RiseopediaQuestRewardsBlock.tsx                                 ////
//// Language: TSX                                                                                            ////
//// Renders DB-described Quest rewards as compact numbered name-and-amount rows.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";

import IconRender from "@/components/ui/IconRender";
import {
	RiseopediaDetailNumberBadge,
	RiseopediaDetailTable,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";

import type {
	RiseopediaBodyBlock,
	RiseopediaQuestRewardRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaQuestRewardsBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaQuestRewardRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function fallbackIconKey(row: RiseopediaQuestRewardRow): {
	key: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
} {
	return {
		key: row.fallbackIconKey,
		source: row.fallbackIconSourceCode === "media" ? "media" : "lucide",
		lucideName: row.fallbackIconLucideName,
	};
}

function RiseopediaQuestRewardIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaQuestRewardRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.targetIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-quest-rewards__icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-quest-rewards__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Quest reward"
					size="inline"
					decorative
				/>
			) : (
				<IconRender
					className="riseopedia-quest-rewards__icon-fallback"
					iconKey={fallbackIconKey(row)}
					fallback={{ lucideName: "CircleDot" }}
					size={18}
				/>
			)}
		</span>
	);
}

export default function RiseopediaQuestRewardsBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaQuestRewardsBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const ordered = [...rows].sort((left, right) => {
		if (left.rewardIndex !== right.rewardIndex) {
			return left.rewardIndex - right.rewardIndex;
		}

		return left.questRewardId.localeCompare(right.questRewardId);
	});

	if (ordered.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-quest-rewards">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaDetailTable variant="standard">
				<ol className="riseopedia-quest-rewards__list">
					{ordered.map((row) => {
						const href = buildRiseopediaEntityHref({
							entityTypeCode: row.targetEntityTypeCode,
							entitySlug: row.targetEntitySlug,
							targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
							wikiCode,
							releaseFilters,
						});

						return (
							<li
								className="riseopedia-quest-rewards__row"
								data-resolution-status={row.resolutionStatusCode}
								key={row.questRewardId}
							>
								<RiseopediaDetailNumberBadge
									className="riseopedia-quest-rewards__number"
									label={`Reward ${row.displayOrdinal}`}
								>
									{row.displayOrdinal}
								</RiseopediaDetailNumberBadge>
								<RiseopediaQuestRewardIcon row={row} wikiCode={wikiCode} />
								<div className="riseopedia-quest-rewards__target-copy">
									{href ? (
										<Link className="riseopedia-quest-rewards__link" href={href}>
											{row.targetDisplayText}
										</Link>
									) : (
										<span className="riseopedia-quest-rewards__name">
											{row.targetDisplayText}
										</span>
									)}
									{row.chooseGroupCode ? (
										<span className="riseopedia-quest-rewards__choose">Choose one</span>
									) : null}
								</div>
								<span
									aria-hidden={row.quantityDisplayText ? undefined : true}
									className="riseopedia-quest-rewards__quantity"
									data-empty={row.quantityDisplayText ? undefined : "true"}
								>
									{row.quantityDisplayText ?? ""}
								</span>
							</li>
						);
					})}
				</ol>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
