//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaDetailLayout.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Fixed public Riseopedia detail layout with overview, body, and bottom block regions.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";

import type { RiseopediaEntitySectionRef } from "@/lib/data/riseopedia-sections";

export type RiseopediaDetailLayoutProps = {
	eyebrow: string;
	title: string;
	summary: string | null;
	sections: RiseopediaEntitySectionRef[];
	overview: ReactNode;
	body: ReactNode;
	bottom: ReactNode;
};

function sectionLabel(section: RiseopediaEntitySectionRef): string {
	return section.name;
}

export default function RiseopediaDetailLayout({
	eyebrow,
	title,
	summary,
	sections,
	overview,
	body,
	bottom,
}: RiseopediaDetailLayoutProps): JSX.Element {
	return (
		<section className="riseopedia-detail-shell">
			<article className="card riseopedia-detail-page">
				<header className="riseopedia-detail-header">
					<div className="riseopedia-detail-header__copy">
						<p className="riseopedia-detail-header__eyebrow">{eyebrow}</p>
						<h1 className="riseopedia-detail-header__title">{title}</h1>
						{summary ? (
							<p className="riseopedia-detail-header__summary">{summary}</p>
						) : null}
					</div>

					{sections.length > 0 ? (
						<ul
							className="riseopedia-section-chip-list"
							aria-label="Riseopedia sections"
						>
							{sections.map((section) => (
								<li className="riseopedia-section-chip" key={section.id}>
									{sectionLabel(section)}
								</li>
							))}
						</ul>
					) : null}
				</header>

				<div className="riseopedia-detail-layout">
					<aside
						className="riseopedia-detail-overview"
						aria-label="Riseopedia overview"
					>
						{overview}
					</aside>

					<div className="riseopedia-detail-body">{body}</div>
				</div>

				{bottom}
			</article>
		</section>
	);
}
