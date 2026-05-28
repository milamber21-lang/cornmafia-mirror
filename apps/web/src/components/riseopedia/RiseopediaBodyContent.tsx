//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaBodyContent.tsx                                        ////
//// Language: TSX                                                                                            ////
//// Renders display-profile-selected public Riseopedia prose, body, and spec rows inside the detail layout.   ////
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

const PROSE_PROPERTY_CODES = new Set(["summary", "description"]);

function renderPropertyValue(row: RiseopediaDisplayProperty): string {
	return row.unitCode ? `${row.displayValue} ${row.unitCode}` : row.displayValue;
}

function bodyRowsWithoutProse(
	rows: RiseopediaDisplayProperty[],
): RiseopediaDisplayProperty[] {
	return rows.filter((row) => !PROSE_PROPERTY_CODES.has(row.propertyCode));
}

function proseRows(
	display: RiseopediaDisplayLayout,
	propertyCode: "summary" | "description",
): RiseopediaDisplayProperty[] {
	return [
		...display.bodyLead,
		...display.bodyMain,
		...display.bodyNotes,
	].filter((row) => row.propertyCode === propertyCode);
}

function RiseopediaProseSection({
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
		<section className="riseopedia-prose-section">
			<h2 className="riseopedia-section-title">{title}</h2>
			<div className="riseopedia-prose-section__body">
				{rows.map((row) => (
					<p
						className="riseopedia-prose-section__text"
						key={row.displayProfilePropertyId}
					>
						{renderPropertyValue(row)}
					</p>
				))}
			</div>
		</section>
	);
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
	const summaryRows = proseRows(display, "summary");
	const descriptionRows = proseRows(display, "description");
	const bodyLeadRows = bodyRowsWithoutProse(display.bodyLead);
	const bodyMainRows = bodyRowsWithoutProse(display.bodyMain);
	const bodyNotesRows = bodyRowsWithoutProse(display.bodyNotes);
	const hasDisplayBody =
		summaryRows.length > 0 ||
		descriptionRows.length > 0 ||
		bodyLeadRows.length > 0 ||
		bodyMainRows.length > 0 ||
		bodyNotesRows.length > 0 ||
		display.specRows.length > 0 ||
		display.requirementRows.length > 0;

	if (!hasDisplayBody) {
		return null;
	}

	return (
		<div className="riseopedia-body-content">
			<RiseopediaProseSection title="Summary" rows={summaryRows} />
			<RiseopediaProseSection title="Description" rows={descriptionRows} />
			<RiseopediaPropertyStack title="Highlights" rows={bodyLeadRows} />
			<RiseopediaPropertyStack title="Details" rows={bodyMainRows} />
			<RiseopediaSpecTable title="Specs" rows={display.specRows} />
			<RiseopediaSpecTable title="Requirements" rows={display.requirementRows} />
			<RiseopediaPropertyStack title="Notes" rows={bodyNotesRows} />
		</div>
	);
}
