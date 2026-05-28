//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaDetailLayout.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Fixed public Riseopedia detail layout with linked breadcrumbs, header media, and profile-driven regions.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";
import Link from "next/link";

import type { RiseopediaEntitySectionRef } from "@/lib/data/riseopedia-sections";

export type RiseopediaBreadcrumbItem = {
	label: string;
	href?: string;
};

export type RiseopediaDetailLayoutProps = {
	breadcrumb: RiseopediaBreadcrumbItem[];
	title: string;
	summary: string | null;
	brandName?: string | null;
	sections: RiseopediaEntitySectionRef[];
	media?: ReactNode;
	controls?: ReactNode;
	overview?: ReactNode;
	selectedRarityCode?: string | null;
	body: ReactNode;
	bottom: ReactNode;
};

function sectionLabel(section: RiseopediaEntitySectionRef): string {
	return section.name;
}

function RiseopediaBreadcrumb({
	items,
}: {
	items: RiseopediaBreadcrumbItem[];
}): JSX.Element | null {
	if (items.length === 0) {
		return null;
	}

	return (
		<nav
			className="riseopedia-detail-header__breadcrumb"
			aria-label="Riseopedia breadcrumb"
		>
			<ol className="riseopedia-detail-header__breadcrumb-list">
				{items.map((item, index) => {
					const current = index === items.length - 1;
					const key = `${item.label}-${index}`;

					return (
						<li className="riseopedia-detail-header__breadcrumb-item" key={key}>
							{item.href && !current ? (
								<Link
									className="riseopedia-detail-header__breadcrumb-link"
									href={item.href}
								>
									{item.label}
								</Link>
							) : (
								<span
									className="riseopedia-detail-header__breadcrumb-current"
									aria-current={current ? "page" : undefined}
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

function safeRarityCode(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : undefined;
}

function RiseopediaSectionChips({
	sections,
}: {
	sections: RiseopediaEntitySectionRef[];
}): JSX.Element | null {
	if (sections.length === 0) {
		return null;
	}

	return (
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
	);
}

export default function RiseopediaDetailLayout({
	breadcrumb,
	title,
	summary,
	brandName,
	sections,
	media,
	controls,
	overview,
	selectedRarityCode,
	body,
	bottom,
}: RiseopediaDetailLayoutProps): JSX.Element {
	const layoutClassName = overview
		? "riseopedia-detail-layout riseopedia-detail-layout--with-overview"
		: "riseopedia-detail-layout";
	const headerClassName = media
		? "riseopedia-detail-header riseopedia-detail-header--with-media"
		: "riseopedia-detail-header";

	return (
		<section className="riseopedia-detail-shell">
			<article className="card riseopedia-detail-page">
				<header className={headerClassName} data-rarity={safeRarityCode(selectedRarityCode)}>
					<div className="riseopedia-detail-header__copy">
						<RiseopediaBreadcrumb items={breadcrumb} />
						<h1 className="riseopedia-detail-header__title">{title}</h1>
						<p
							className={
								brandName
									? "riseopedia-detail-header__brand"
									: "riseopedia-detail-header__brand riseopedia-detail-header__brand--empty"
							}
							aria-hidden={brandName ? undefined : true}
						>
							<span className="riseopedia-detail-header__brand-label">Brand</span>
							<span className="riseopedia-detail-header__brand-value">
								{brandName ?? "Reserved"}
							</span>
						</p>
						{summary ? (
							<p className="riseopedia-detail-header__summary">{summary}</p>
						) : null}
						<RiseopediaSectionChips sections={sections} />
						{controls}
					</div>

					{media ? (
						<div className="riseopedia-detail-header__media">{media}</div>
					) : null}
				</header>

				<div className={layoutClassName}>
					<div className="riseopedia-detail-body">{body}</div>

					{overview ? (
						<aside
							className="riseopedia-detail-overview"
							aria-label="Riseopedia overview"
						>
							{overview}
						</aside>
					) : null}
				</div>

				{bottom}
			</article>
		</section>
	);
}
