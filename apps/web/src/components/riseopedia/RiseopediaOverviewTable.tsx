//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaOverviewTable.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Compact label/value overview table for public Riseopedia detail pages.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";

export type RiseopediaOverviewRow = {
	key: string;
	label: string;
	value: ReactNode;
};

export type RiseopediaOverviewTableProps = {
	title?: string;
	rows: RiseopediaOverviewRow[];
};

function hasRenderableValue(value: ReactNode): boolean {
	return (
		value !== null && value !== undefined && value !== "" && value !== false
	);
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
					<dd className="riseopedia-overview-table__value">{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

export default function RiseopediaOverviewTable({
	title = "Overview",
	rows,
}: RiseopediaOverviewTableProps): JSX.Element | null {
	const visibleRows = rows.filter((row) => hasRenderableValue(row.value));

	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<section
			className="riseopedia-overview-table"
			aria-labelledby="riseopedia-overview-heading"
		>
			<h2 className="riseopedia-section-title" id="riseopedia-overview-heading">
				{title}
			</h2>

			<RiseopediaOverviewRows rows={visibleRows} />
		</section>
	);
}
