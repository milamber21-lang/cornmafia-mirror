//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/progression/RiseopediaExperienceLevelTableBlock.tsx                         ////
//// Language: TSX                                                                                            ////
//// Renders the DB-formatted canonical level-threshold table for one Experience mechanic.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import {
	RiseopediaDetailNumberBadge,
	RiseopediaDetailTable,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import type {
	RiseopediaBodyBlock,
	RiseopediaExperienceLevelRow,
} from "@/lib/data/riseopedia-entity-detail";

export type RiseopediaExperienceLevelTableBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaExperienceLevelRow[];
	selectedEntityVariantId: string | null;
};

function selectedRows(args: {
	rows: RiseopediaExperienceLevelRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaExperienceLevelRow[] {
	const exactRows = args.selectedEntityVariantId
		? args.rows.filter(
				(row) => row.entityVariantId === args.selectedEntityVariantId,
			)
		: args.rows.filter((row) => row.entityVariantId === null);

	const rows = exactRows.length > 0 ? exactRows : args.rows;

	return [...rows].sort((left, right) => {
		if (left.levelValue !== right.levelValue) {
			return left.levelValue - right.levelValue;
		}

		return left.experienceLevelThresholdId.localeCompare(
			right.experienceLevelThresholdId,
		);
	});
}

export default function RiseopediaExperienceLevelTableBlock({
	block,
	rows,
	selectedEntityVariantId,
}: RiseopediaExperienceLevelTableBlockProps): JSX.Element | null {
	const ordered = selectedRows({ rows, selectedEntityVariantId });
	const experienceUnitLabel = ordered.at(0)?.experienceUnitDisplayLabel ?? null;

	if (ordered.length === 0 || !experienceUnitLabel) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-experience-level-table">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaDetailTable variant="standard">
				<div className="riseopedia-experience-level-table__scroll">
					<table className="riseopedia-experience-level-table__table">
						<thead>
							<tr>
								<th scope="col">Level</th>
								<th scope="col">{experienceUnitLabel} to reach next level</th>
								<th scope="col">Total {experienceUnitLabel} to reach level</th>
							</tr>
						</thead>
						<tbody>
							{ordered.map((row) => (
								<tr
									data-level-role={
										row.levelValue === row.levelStartValue
											? "start"
											: row.levelValue === row.maxLevelValue
												? "maximum"
												: "standard"
									}
									key={row.experienceLevelThresholdId}
								>
									<th scope="row">
										<RiseopediaDetailNumberBadge
											className="riseopedia-experience-level-table__level-badge"
											label={`Level ${row.levelValue}`}
										>
											{row.levelValue}
										</RiseopediaDetailNumberBadge>
									</th>
									<td>{row.experiencePointsToNextLevelDisplayText}</td>
									<td>{row.experiencePointsTotalToReachLevelDisplayText}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
