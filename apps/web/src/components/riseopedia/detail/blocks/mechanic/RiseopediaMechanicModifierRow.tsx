//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/mechanic/RiseopediaMechanicModifierRow.tsx                                  ////
//// Language: TSX                                                                                                 ////
//// Renders one display-ready mechanics modifier summary and its relevant timing metrics.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

export type RiseopediaMechanicModifierDisplayRow = {
	operationDisplayLabel: string;
	effectValueDisplayText: string | null;
	effectTypeDisplayLabel: string;
	delayLabel: string | null;
	durationLabel: string | null;
	intervalLabel: string | null;
	burstLabel: string | null;
	delayDisplayText: string | null;
	durationDisplayText: string | null;
	intervalDisplayText: string | null;
	burstDisplayText: string | null;
};

type EffectTimingMetric = {
	label: string;
	value: string;
};

function timingMetrics(
	row: RiseopediaMechanicModifierDisplayRow,
): EffectTimingMetric[] {
	return [
		{ label: row.delayLabel ?? "", value: row.delayDisplayText ?? "" },
		{ label: row.durationLabel ?? "", value: row.durationDisplayText ?? "" },
		{ label: row.intervalLabel ?? "", value: row.intervalDisplayText ?? "" },
		{ label: row.burstLabel ?? "", value: row.burstDisplayText ?? "" },
	].filter((metric) => metric.label.length > 0 && metric.value.length > 0);
}

export default function RiseopediaMechanicModifierRow({
	row,
}: {
	row: RiseopediaMechanicModifierDisplayRow;
}): JSX.Element {
	const metrics = timingMetrics(row);

	return (
		<li className="riseopedia-effect-modifiers__modifier">
			<div className="riseopedia-effect-modifiers__modifier-summary">
				<span className="riseopedia-effect-modifiers__effect">
					{row.operationDisplayLabel} {row.effectValueDisplayText ?? "—"}
					<span className="riseopedia-effect-modifiers__effect-mode">
						{row.effectTypeDisplayLabel}
					</span>
				</span>
			</div>
			{metrics.length > 0 ? (
				<dl className="riseopedia-effect-modifiers__metrics">
					{metrics.map((metric) => (
						<div className="riseopedia-effect-modifiers__metric" key={metric.label}>
							<dt>{metric.label}</dt>
							<dd>{metric.value}</dd>
						</div>
					))}
				</dl>
			) : null}
		</li>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
