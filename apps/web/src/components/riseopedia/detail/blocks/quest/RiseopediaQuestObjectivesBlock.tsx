//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/quest/RiseopediaQuestObjectivesBlock.tsx                              ////
//// Language: TSX                                                                                            ////
//// Renders DB-grouped Quest objective rows without interpreting objective source codes.                      ////
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
	RiseopediaQuestObjectiveRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaQuestObjectivesBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaQuestObjectiveRow[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type ObjectiveGroup = {
	key: string;
	label: string | null;
	rows: RiseopediaQuestObjectiveRow[];
};

function orderedRows(
	rows: RiseopediaQuestObjectiveRow[],
): RiseopediaQuestObjectiveRow[] {
	return [...rows].sort((left, right) => {
		if (left.objectiveActionGroupIndex !== right.objectiveActionGroupIndex) {
			return left.objectiveActionGroupIndex - right.objectiveActionGroupIndex;
		}

		if (left.displayOrdinal !== right.displayOrdinal) {
			return left.displayOrdinal - right.displayOrdinal;
		}

		const completionGroupCompare =
			(left.completionGroupIndex ?? Number.MAX_SAFE_INTEGER) -
			(right.completionGroupIndex ?? Number.MAX_SAFE_INTEGER);
		if (completionGroupCompare !== 0) {
			return completionGroupCompare;
		}

		const optionCompare =
			(left.optionIndex ?? Number.MAX_SAFE_INTEGER) -
			(right.optionIndex ?? Number.MAX_SAFE_INTEGER);
		if (optionCompare !== 0) {
			return optionCompare;
		}

		return (left.questObjectiveTargetId ?? "").localeCompare(
			right.questObjectiveTargetId ?? "",
		);
	});
}

function groupRows(rows: RiseopediaQuestObjectiveRow[]): ObjectiveGroup[] {
	const groups: ObjectiveGroup[] = [];

	for (const row of orderedRows(rows)) {
		const key = String(row.objectiveActionGroupIndex);
		const current = groups.at(-1);

		if (current && current.key === key) {
			current.rows.push(row);
			continue;
		}

		groups.push({
			key,
			label: row.objectiveActionLabel,
			rows: [row],
		});
	}

	return groups;
}

function fallbackIconKey(row: RiseopediaQuestObjectiveRow): {
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

function ObjectiveIcon({
	row,
	wikiCode,
}: {
	row: RiseopediaQuestObjectiveRow;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const iconHref = buildRiseopediaMediaHref(row.targetIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-quest-objectives__icon" aria-hidden="true">
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-quest-objectives__visual riseopedia-entity-visual--embedded"
					media={{ url: iconHref }}
					alt=""
					placeholderLabel="Quest objective"
					size="inline"
					decorative
				/>
			) : (
				<IconRender
					className="riseopedia-quest-objectives__icon-fallback"
					iconKey={fallbackIconKey(row)}
					fallback={{ lucideName: "CircleDot" }}
					size={18}
				/>
			)}
		</span>
	);
}

function ObjectiveRow({
	row,
	continuation,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaQuestObjectiveRow;
	continuation: boolean;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.targetEntityTypeCode,
		entitySlug: row.targetEntitySlug,
		targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
		wikiCode,
		releaseFilters,
	});

	return (
		<li
			className="riseopedia-quest-objectives__row"
			data-resolution-status={row.targetResolutionStatusCode ?? undefined}
		>
			<RiseopediaDetailNumberBadge
				className="riseopedia-quest-objectives__number"
				label={`Step ${row.displayOrdinal}`}
			>
				{continuation ? "–" : row.displayOrdinal}
			</RiseopediaDetailNumberBadge>
			<ObjectiveIcon row={row} wikiCode={wikiCode} />
			<div className="riseopedia-quest-objectives__target-copy">
				{href ? (
					<Link className="riseopedia-quest-objectives__target-link" href={href}>
						{row.targetDisplayText}
					</Link>
				) : (
					<span className="riseopedia-quest-objectives__target-name">
						{row.targetDisplayText}
					</span>
				)}
				{row.targetResolutionDisplayLabel ? (
					<span className="riseopedia-quest-objectives__target-status">
						{row.targetResolutionDisplayLabel}
					</span>
				) : null}
			</div>
			<span
				aria-hidden={row.quantityDisplayText ? undefined : true}
				className="riseopedia-quest-objectives__quantity"
				data-empty={row.quantityDisplayText ? undefined : "true"}
			>
				{row.quantityDisplayText ?? ""}
			</span>
			{row.objectiveActionLabel ? (
				<span className="riseopedia-quest-objectives__action">
					{row.objectiveActionLabel}
				</span>
			) : null}
		</li>
	);
}

export default function RiseopediaQuestObjectivesBlock({
	block,
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaQuestObjectivesBlockProps): JSX.Element | null {
	const groups = groupRows(rows);
	if (groups.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-quest-objectives">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaDetailTable variant="numbered_entity_rows">
				<div className="riseopedia-quest-objectives__groups">
					{groups.map((group) => (
						<section className="riseopedia-quest-objectives__group" key={group.key}>
							{group.label ? (
								<h3 className="riseopedia-quest-objectives__group-title">
									{group.label}
								</h3>
							) : null}
							<ul className="riseopedia-quest-objectives__list">
								{group.rows.map((row, index) => (
									<ObjectiveRow
										key={`${row.questObjectiveId}:${row.questObjectiveTargetId}`}
										row={row}
										continuation={
											index > 0 &&
											group.rows[index - 1]?.questObjectiveId === row.questObjectiveId
										}
										wikiCode={wikiCode}
										releaseFilters={releaseFilters}
									/>
								))}
							</ul>
						</section>
					))}
				</div>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
