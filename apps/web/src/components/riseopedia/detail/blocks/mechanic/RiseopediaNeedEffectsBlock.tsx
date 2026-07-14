//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/mechanic/RiseopediaNeedEffectsBlock.tsx                                   ////
//// Language: TSX                                                                                            ////
//// Renders Effect groups that modify the current Need with DB-ready modifier metrics.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import RiseopediaMechanicModifierRow from "@/components/riseopedia/detail/blocks/mechanic/RiseopediaMechanicModifierRow";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import { RiseopediaDetailTable } from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaNeedEffectRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaNeedEffectsBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaNeedEffectRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type NeedEffectGroup = {
	groupKey: string;
	effectEntityId: string;
	effectEntitySlug: string;
	effectEntityVariantId: string | null;
	effectEntityName: string;
	effectEntityClassName: string | null;
	effectIconMediaFileId: string | null;
	rows: RiseopediaNeedEffectRow[];
};

function needEffectGroupKey(row: RiseopediaNeedEffectRow): string {
	return `${row.effectEntityId}:${row.effectEntityVariantId ?? "entity"}`;
}

function groupedRows(rows: RiseopediaNeedEffectRow[]): NeedEffectGroup[] {
	const groups = new Map<string, NeedEffectGroup>();

	for (const row of rows) {
		const groupKey = needEffectGroupKey(row);
		const existing = groups.get(groupKey);
		if (existing) {
			existing.rows.push(row);
			continue;
		}

		groups.set(groupKey, {
			groupKey,
			effectEntityId: row.effectEntityId,
			effectEntitySlug: row.effectEntitySlug,
			effectEntityVariantId: row.effectEntityVariantId,
			effectEntityName: row.effectEntityName,
			effectEntityClassName: row.effectEntityClassName,
			effectIconMediaFileId: row.effectIconMediaFileId,
			rows: [row],
		});
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			rows: [...group.rows].sort((left, right) => {
				if (left.modifierIndex !== right.modifierIndex) {
					return left.modifierIndex - right.modifierIndex;
				}

				return left.mechanicEffectModifierId.localeCompare(
					right.mechanicEffectModifierId,
				);
			}),
		}))
		.sort((left, right) => {
			const nameCompare = left.effectEntityName.localeCompare(
				right.effectEntityName,
			);
			if (nameCompare !== 0) {
				return nameCompare;
			}

			const entityCompare = left.effectEntityId.localeCompare(
				right.effectEntityId,
			);
			if (entityCompare !== 0) {
				return entityCompare;
			}

			return (left.effectEntityVariantId ?? "").localeCompare(
				right.effectEntityVariantId ?? "",
			);
		});
}

function RiseopediaEffectIcon({
	mediaFileId,
	wikiCode,
}: {
	mediaFileId: string | null;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(mediaFileId, wikiCode);

	return (
		<span className="riseopedia-need-effects__effect-icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-need-effects__effect-visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Effect"
					size="inline"
					decorative
				/>
			) : (
				<Sparkles className="riseopedia-need-effects__effect-icon-fallback" />
			)}
		</span>
	);
}

export default function RiseopediaNeedEffectsBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaNeedEffectsBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const groups = groupedRows(rows);
	if (groups.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-need-effects">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaDetailTable variant="grouped_mechanics">
				<div className="riseopedia-need-effects__groups">
					{groups.map((group) => {
						const effectHref = buildRiseopediaEntityHref({
							entityTypeCode: "mechanic",
							entitySlug: group.effectEntitySlug,
							targetEntityVariantKey: variantKeyFor(group.effectEntityVariantId),
							wikiCode,
							releaseFilters,
						});
						const groupClassName =
							group.rows.length === 1
								? "riseopedia-need-effects__group riseopedia-need-effects__group--single"
								: "riseopedia-need-effects__group";

						return (
							<section className={groupClassName} key={group.groupKey}>
								<div className="riseopedia-need-effects__identity">
									<RiseopediaEffectIcon
										mediaFileId={group.effectIconMediaFileId}
										wikiCode={wikiCode}
									/>
									<div className="riseopedia-need-effects__identity-copy">
										{effectHref ? (
											<Link className="riseopedia-need-effects__link" href={effectHref}>
												{group.effectEntityName}
											</Link>
										) : (
											<span className="riseopedia-need-effects__name">
												{group.effectEntityName}
											</span>
										)}
										{group.effectEntityClassName ? (
											<span className="riseopedia-need-effects__meta">
												{group.effectEntityClassName}
											</span>
										) : null}
									</div>
								</div>
								<ul className="riseopedia-effect-modifiers__list">
									{group.rows.map((row) => (
										<RiseopediaMechanicModifierRow
											key={row.mechanicEffectModifierId}
											row={row}
										/>
									))}
								</ul>
							</section>
						);
					})}
				</div>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
