//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/quest/RiseopediaQuestRequirementsBlock.tsx                            ////
//// Language: TSX                                                                                            ////
//// Renders DB-described Quest gates as compact numbered reward-family rows.                                 ////
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
	RiseopediaQuestRequirementRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaQuestRequirementsBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaQuestRequirementRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function fallbackIconKey(row: RiseopediaQuestRequirementRow): {
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

function RequirementIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaQuestRequirementRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.targetIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-quest-requirements__icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-quest-requirements__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Quest requirement"
					size="inline"
					decorative
				/>
			) : (
				<IconRender
					className="riseopedia-quest-requirements__icon-fallback"
					iconKey={fallbackIconKey(row)}
					fallback={{ lucideName: "CircleDot" }}
					size={18}
				/>
			)}
		</span>
	);
}

export default function RiseopediaQuestRequirementsBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaQuestRequirementsBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const ordered = [...rows].sort((left, right) => {
		if (left.displayOrdinal !== right.displayOrdinal) {
			return left.displayOrdinal - right.displayOrdinal;
		}

		return left.questRequirementId.localeCompare(right.questRequirementId);
	});

	if (ordered.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-quest-requirements">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaDetailTable variant="numbered_entity_rows">
				<ol className="riseopedia-quest-requirements__list">
					{ordered.map((row) => {
						const href = buildRiseopediaEntityHref({
							entityTypeCode: row.targetEntityTypeCode,
							entitySlug: row.targetEntitySlug,
							targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
							wikiCode,
							releaseFilters,
						});

						const levelDisplayText =
							row.requirementTypeCode === "player_level" &&
							row.requiredLevelValue !== null
								? String(row.requiredLevelValue)
								: "";

						return (
							<li
								className="riseopedia-quest-requirements__row"
								data-resolution-status={row.resolutionStatusCode}
								key={row.questRequirementId}
							>
								<RiseopediaDetailNumberBadge
									className="riseopedia-quest-requirements__number"
									label={`Requirement ${row.displayOrdinal}`}
								>
									{row.displayOrdinal}
								</RiseopediaDetailNumberBadge>
								<RequirementIcon row={row} wikiCode={wikiCode} />
								<div className="riseopedia-quest-requirements__copy">
									{href ? (
										<Link className="riseopedia-quest-requirements__link" href={href}>
											{row.targetDisplayText}
										</Link>
									) : (
										<span className="riseopedia-quest-requirements__name">
											{row.targetDisplayText}
										</span>
									)}
								</div>
								<span
									aria-hidden={levelDisplayText.length > 0 ? undefined : true}
									className="riseopedia-quest-requirements__level"
									data-empty={levelDisplayText.length > 0 ? undefined : "true"}
								>
									{levelDisplayText}
								</span>
								<span className="riseopedia-quest-requirements__type">
									{row.requirementTypeLabel}
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
