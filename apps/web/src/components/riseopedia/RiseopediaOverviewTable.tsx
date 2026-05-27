//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaOverviewTable.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Compact label/value overview table for public Riseopedia detail pages with overflow protection.           ////
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
	maxInitialRows?: number;
};

const DEFAULT_MAX_INITIAL_ROWS = 8;

function hasRenderableValue(value: ReactNode): boolean {
	return (
		value !== null && value !== undefined && value !== "" && value !== false
	);
}

function visibleRowLimit(maxInitialRows: number | undefined): number {
	if (maxInitialRows === undefined) {
		return DEFAULT_MAX_INITIAL_ROWS;
	}

	if (!Number.isFinite(maxInitialRows) || maxInitialRows < 1) {
		return DEFAULT_MAX_INITIAL_ROWS;
	}

	return Math.floor(maxInitialRows);
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
	maxInitialRows,
}: RiseopediaOverviewTableProps): JSX.Element | null {
	const visibleRows = rows.filter((row) => hasRenderableValue(row.value));

	if (visibleRows.length === 0) {
		return null;
	}

	const rowLimit = visibleRowLimit(maxInitialRows);
	const primaryRows = visibleRows.slice(0, rowLimit);
	const overflowRows = visibleRows.slice(rowLimit);

	return (
		<section
			className="riseopedia-overview-table"
			aria-labelledby="riseopedia-overview-heading"
		>
			<h2 className="riseopedia-section-title" id="riseopedia-overview-heading">
				{title}
			</h2>

			<RiseopediaOverviewRows rows={primaryRows} />

			{overflowRows.length > 0 ? (
				<details className="riseopedia-overview-table__more">
					<summary className="riseopedia-overview-table__more-trigger">
						More facts ({overflowRows.length})
					</summary>
					<RiseopediaOverviewRows rows={overflowRows} />
				</details>
			) : null}
		</section>
	);
}
