//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/mechanic/RiseopediaEffectModifiersBlock.tsx                               ////
//// Language: TSX                                                                                            ////
//// Renders DB-described Effect modifiers as compact linked-Need metric bands.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { CircleDot } from "lucide-react";

import RiseopediaMechanicModifierRow from "@/components/riseopedia/detail/blocks/mechanic/RiseopediaMechanicModifierRow";
import { RiseopediaDetailTable } from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type { RiseopediaEffectModifierRow } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEffectModifiersBlockProps = {
	rows: RiseopediaEffectModifierRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type EffectModifierGroup = {
	needEntityId: string;
	needEntitySlug: string;
	needEntityName: string;
	needEntityClassName: string | null;
	needIconMediaFileId: string | null;
	rows: RiseopediaEffectModifierRow[];
};

function groupedRows(
	rows: RiseopediaEffectModifierRow[],
): EffectModifierGroup[] {
	const groups = new Map<string, EffectModifierGroup>();

	for (const row of rows) {
		const existing = groups.get(row.targetNeedEntityId);
		if (existing) {
			existing.rows.push(row);
			continue;
		}

		groups.set(row.targetNeedEntityId, {
			needEntityId: row.targetNeedEntityId,
			needEntitySlug: row.targetNeedEntitySlug,
			needEntityName: row.targetNeedEntityName,
			needEntityClassName: row.targetNeedEntityClassName,
			needIconMediaFileId: row.targetNeedIconMediaFileId,
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
			const nameCompare = left.needEntityName.localeCompare(right.needEntityName);
			return nameCompare !== 0
				? nameCompare
				: left.needEntityId.localeCompare(right.needEntityId);
		});
}

function RiseopediaNeedIcon({
	mediaFileId,
	wikiCode,
}: {
	mediaFileId: string | null;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(mediaFileId, wikiCode);

	return (
		<span className="riseopedia-effect-modifiers__need-icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-effect-modifiers__need-visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Need"
					size="inline"
					decorative
				/>
			) : (
				<CircleDot className="riseopedia-effect-modifiers__need-icon-fallback" />
			)}
		</span>
	);
}

export default function RiseopediaEffectModifiersBlock({
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaEffectModifiersBlockProps): JSX.Element | null {
	const groups = groupedRows(rows);
	if (groups.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-effect-modifiers">
			<RiseopediaDetailTable variant="grouped_mechanics">
				<div className="riseopedia-effect-modifiers__groups">
					{groups.map((group) => {
						const needHref = buildRiseopediaEntityHref({
							entityTypeCode: "mechanic",
							entitySlug: group.needEntitySlug,
							wikiCode,
							releaseFilters,
						});
						const groupClassName =
							group.rows.length === 1
								? "riseopedia-effect-modifiers__group riseopedia-effect-modifiers__group--single"
								: "riseopedia-effect-modifiers__group";

						return (
							<section className={groupClassName} key={group.needEntityId}>
								<div className="riseopedia-effect-modifiers__need">
									<RiseopediaNeedIcon
										mediaFileId={group.needIconMediaFileId}
										wikiCode={wikiCode}
									/>
									<div className="riseopedia-effect-modifiers__need-copy">
										{needHref ? (
											<Link
												className="riseopedia-effect-modifiers__need-link"
												href={needHref}
											>
												{group.needEntityName}
											</Link>
										) : (
											<span className="riseopedia-effect-modifiers__need-name">
												{group.needEntityName}
											</span>
										)}
										{group.needEntityClassName ? (
											<span className="riseopedia-effect-modifiers__need-meta">
												{group.needEntityClassName}
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
