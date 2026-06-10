//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityBodyContent.tsx                                  ////
//// Language: TSX                                                                                              ////
//// Renders entity-first Riseopedia body profile elements with optional canonical entity links.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Link from "next/link";

import type { RiseopediaDetailElement } from "@/lib/data/riseopedia-entity-detail";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityBodyContentProps = {
	rows: RiseopediaDetailElement[];
	wikiCode?: OpediaWikiCode;
};

const PROSE_SOURCE_CODES = new Set(["summary", "description"]);

function elementKey(row: RiseopediaDetailElement): string {
	return [
		row.displayProfileElementId ?? "fallback",
		row.entityPropertyValueId ?? "value",
		row.entityVariantId ?? "entity",
		row.sourceCode,
	].join(":");
}

function isProseRow(row: RiseopediaDetailElement): boolean {
	return PROSE_SOURCE_CODES.has(row.sourceCode);
}

function linkedValue(
	row: RiseopediaDetailElement,
	wikiCode: OpediaWikiCode | undefined,
): JSX.Element | string {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.linkedEntityTypeCode,
		entitySlug: row.linkedEntitySlug,
		wikiCode,
	});

	if (!href) {
		return row.displayValue;
	}

	return (
		<Link className="riseopedia-recipe-tree__asset-link" href={href}>
			{row.displayValue}
		</Link>
	);
}

function RiseopediaProseSection({
	title,
	rows,
	wikiCode,
}: {
	title: string;
	rows: RiseopediaDetailElement[];
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-prose-section">
			<h2 className="riseopedia-section-title">{title}</h2>
			<div className="riseopedia-prose-section__body">
				{rows.map((row) => (
					<p className="riseopedia-prose-section__text" key={elementKey(row)}>
						{linkedValue(row, wikiCode)}
					</p>
				))}
			</div>
		</section>
	);
}

function RiseopediaPropertyStack({
	title,
	rows,
	wikiCode,
}: {
	title: string;
	rows: RiseopediaDetailElement[];
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element | null {
	if (rows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section">
			<h2 className="riseopedia-section-title">{title}</h2>
			<div className="riseopedia-property-stack">
				{rows.map((row) => (
					<article className="riseopedia-property-card" key={elementKey(row)}>
						<h3 className="riseopedia-property-card__label">{row.displayLabel}</h3>
						<p className="riseopedia-property-card__value">{linkedValue(row, wikiCode)}</p>
					</article>
				))}
			</div>
		</section>
	);
}

export default function RiseopediaEntityBodyContent({
	rows,
	wikiCode,
}: RiseopediaEntityBodyContentProps): JSX.Element | null {
	const summaryRows = rows.filter((row) => row.sourceCode === "summary");
	const descriptionRows = rows.filter((row) => row.sourceCode === "description");
	const otherRows = rows.filter((row) => !isProseRow(row));

	if (
		summaryRows.length === 0 &&
		descriptionRows.length === 0 &&
		otherRows.length === 0
	) {
		return null;
	}

	return (
		<div className="riseopedia-body-content">
			<RiseopediaProseSection title="Summary" rows={summaryRows} wikiCode={wikiCode} />
			<RiseopediaProseSection title="Description" rows={descriptionRows} wikiCode={wikiCode} />
			<RiseopediaPropertyStack title="Details" rows={otherRows} wikiCode={wikiCode} />
		</div>
	);
}
