//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaBodyContent.tsx                                        ////
//// Language: TSX                                                                                            ////
//// Renders display-profile-selected public Riseopedia body and spec rows inside the fixed detail layout.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import type {
	RiseopediaDisplayLayout,
	RiseopediaDisplayProperty,
} from "@/lib/data/riseopedia-display";

export type RiseopediaBodyContentProps = {
	display: RiseopediaDisplayLayout;
};

function renderPropertyValue(row: RiseopediaDisplayProperty): string {
	return row.unitCode ? `${row.displayValue} ${row.unitCode}` : row.displayValue;
}

function RiseopediaPropertyStack({
	title,
	rows,
}: {
	title: string;
	rows: RiseopediaDisplayProperty[];
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section">
			<h2 className="riseopedia-section-title">{title}</h2>
			<div className="riseopedia-property-stack">
				{rows.map((row) => (
					<article
						className="riseopedia-property-card"
						key={row.displayProfilePropertyId}
					>
						<h3 className="riseopedia-property-card__label">{row.displayLabel}</h3>
						<p className="riseopedia-property-card__value">
							{renderPropertyValue(row)}
						</p>
						{row.description ? (
							<p className="riseopedia-property-card__description">
								{row.description}
							</p>
						) : null}
					</article>
				))}
			</div>
		</section>
	);
}

function RiseopediaSpecTable({
	title,
	rows,
}: {
	title: string;
	rows: RiseopediaDisplayProperty[];
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section">
			<h2 className="riseopedia-section-title">{title}</h2>
			<dl className="riseopedia-spec-table">
				{rows.map((row) => (
					<div
						className="riseopedia-spec-table__row"
						key={row.displayProfilePropertyId}
					>
						<dt className="riseopedia-spec-table__label">{row.displayLabel}</dt>
						<dd className="riseopedia-spec-table__value">
							{renderPropertyValue(row)}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

export default function RiseopediaBodyContent({
	display,
}: RiseopediaBodyContentProps): JSX.Element | null {
	const hasDisplayBody =
		display.bodyLead.length > 0 ||
		display.bodyMain.length > 0 ||
		display.bodyNotes.length > 0 ||
		display.specRows.length > 0 ||
		display.requirementRows.length > 0;

	if (!hasDisplayBody) {
		return null;
	}

	return (
		<div className="riseopedia-body-content">
			<RiseopediaPropertyStack title="Highlights" rows={display.bodyLead} />
			<RiseopediaPropertyStack title="Details" rows={display.bodyMain} />
			<RiseopediaSpecTable title="Specs" rows={display.specRows} />
			<RiseopediaSpecTable title="Requirements" rows={display.requirementRows} />
			<RiseopediaPropertyStack title="Notes" rows={display.bodyNotes} />
		</div>
	);
}
