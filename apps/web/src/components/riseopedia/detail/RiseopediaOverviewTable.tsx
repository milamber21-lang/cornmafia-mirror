//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaOverviewTable.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Compact label/value overview table for public Riseopedia detail pages.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import {
	formatRiseopediaNumber,
	formatRiseopediaNumericText,
} from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaOverviewRow = {
	key: string;
	label: string;
	value: ReactNode;
};

export type RiseopediaOverviewTableProps = {
	title?: string;
	headingId?: string;
	rows: RiseopediaOverviewRow[];
	rarityCode?: string | null;
};

function safeRarityCode(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : undefined;
}

function hasRenderableValue(value: ReactNode): boolean {
	return (
		value !== null && value !== undefined && value !== "" && value !== false
	);
}

export function renderableRiseopediaOverviewRows(
	rows: RiseopediaOverviewRow[],
): RiseopediaOverviewRow[] {
	return rows.filter((row) => hasRenderableValue(row.value));
}

function formattedOverviewValue(value: ReactNode): ReactNode {
	if (typeof value === "number") {
		return formatRiseopediaNumber(value);
	}

	if (typeof value === "string") {
		return formatRiseopediaNumericText(value);
	}

	return value;
}

function RiseopediaOverviewRows({
	rows,
}: {
	rows: RiseopediaOverviewRow[];
}): JSX.Element {
	return (
		<dl className="riseopedia-overview-table__list">
			{rows.map((row) => (
				<div className="riseopedia-overview-table__row" key={row.key}>
					<dt className="riseopedia-overview-table__label">{row.label}</dt>
					<dd className="riseopedia-overview-table__value">
						{formattedOverviewValue(row.value)}
					</dd>
				</div>
			))}
		</dl>
	);
}

export default function RiseopediaOverviewTable({
	title = "Overview",
	headingId = "riseopedia-overview-heading",
	rows,
	rarityCode,
}: RiseopediaOverviewTableProps): JSX.Element | null {
	const visibleRows = renderableRiseopediaOverviewRows(rows);

	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<section
			className="riseopedia-overview-table"
			data-rarity={safeRarityCode(rarityCode)}
			aria-labelledby={headingId}
		>
			<h2 className="riseopedia-section-title" id={headingId}>
				{title}
			</h2>

			<RiseopediaOverviewRows rows={visibleRows} />
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
